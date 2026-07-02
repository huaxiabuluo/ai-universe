import { NextResponse } from "next/server";
import { defaultMessageReducer, isCurrentTurnBoundaryEvent } from "eve/client";
import { getSession } from "@/lib/auth/session";
import { assertMember } from "@/lib/workspaces";
import { FloorBusy, acquireFloor, releaseFloor } from "@/lib/floor";
import { broadcast } from "@/lib/sse/hub";
import { eveClient } from "@/lib/eve/server-client";
import { getCursor, saveCursor } from "@/lib/eve/workspace-session";
import { recordMessages } from "@/lib/messages";

// 协作枢纽：成员校验 → 回合制（拿 floor，忙则 409）→ server-to-server 调 eve →
// 把每个 stream event 广播给空间内所有 SSE 客户端，同时用 reducer 聚合终态落库。
export async function POST(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "缺少消息" }, { status: 400 });

  let abortCtl: AbortController;
  try {
    abortCtl = await acquireFloor(wid);
  } catch {
    return NextResponse.json({ error: "floor_busy" }, { status: 409 });
  }

  broadcast(wid, "floor", { holder: "ai", by: session.userId });

  const reducer = defaultMessageReducer();
  let data = reducer.initial();
  let eveSessionId: string | undefined;
  let continuationToken: string | undefined;

  try {
    const cursor = await getCursor(wid);
    const eveSession = eveClient(new URL(request.url).origin).session(cursor);
    const response = await eveSession.send({ message, signal: abortCtl.signal });
    eveSessionId = response.sessionId;
    continuationToken = response.continuationToken;
    await saveCursor(wid, {
      sessionId: response.sessionId,
      continuationToken: response.continuationToken,
      streamIndex: cursor.streamIndex,
    });

    for await (const event of response) {
      broadcast(wid, "eve", event);
      data = reducer.reduce(data, event);
      if (isCurrentTurnBoundaryEvent(event)) break;
    }
    await recordMessages(wid, data.messages, { eveSessionId, continuationToken });
  } catch (error) {
    if (abortCtl.signal.aborted) {
      broadcast(wid, "turn.aborted", { by: session.userId });
    } else {
      broadcast(wid, "turn.failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    await releaseFloor(wid);
    broadcast(wid, "floor", { holder: null });
  }
  return NextResponse.json({ ok: true });
}
