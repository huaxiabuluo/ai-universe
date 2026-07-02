import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertMember } from "@/lib/workspaces";
import { listMessages } from "@/lib/messages";

// 历史消息（终态），用于刷新后还原。
export async function GET(_request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const messages = await listMessages(wid);
  return NextResponse.json({ messages });
}
