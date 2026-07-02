import { getSession } from "@/lib/auth/session";
import { assertMember } from "@/lib/workspaces";
import { getFloorHolder } from "@/lib/floor";
import { addClient, removeClient } from "@/lib/sse/hub";

// SSE：空间内所有成员实时接收 eve stream 事件、floor 状态、turn 中断/失败。
export async function GET(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return new Response("未登录", { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return new Response("无权访问", { status: 403 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addClient(wid, controller);
      // 立即推送当前 floor 状态，让新加入的客户端同步禁言态。
      const init = new TextEncoder().encode(
        `event: floor\ndata: ${JSON.stringify({ holder: getFloorHolder(wid) })}\n\n`,
      );
      try {
        controller.enqueue(init);
      } catch {
        // ignore
      }
      request.signal.addEventListener("abort", () => {
        removeClient(wid, controller);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
