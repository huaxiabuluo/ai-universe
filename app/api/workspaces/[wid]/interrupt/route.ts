import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertMember } from "@/lib/workspaces";
import { abortFloor } from "@/lib/floor";

// 中断当前 AI turn（任何成员都可触发；后端 abort 自己持有的 eve stream 订阅）。
export async function POST(_request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const ok = await abortFloor(wid);
  return NextResponse.json({ ok });
}
