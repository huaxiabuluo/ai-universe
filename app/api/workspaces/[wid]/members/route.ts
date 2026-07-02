import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addMember, assertMember, findUserIdByUsername, listMembers } from "@/lib/workspaces";

export async function GET(_request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const members = await listMembers(wid);
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: { params: Promise<{ wid: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { wid } = await params;
  try {
    await assertMember(wid, session.userId);
  } catch {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { username?: unknown };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) return NextResponse.json({ error: "缺少用户名" }, { status: 400 });

  const inviteeId = await findUserIdByUsername(username);
  if (!inviteeId) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  await addMember(wid, inviteeId, "member");
  return NextResponse.json({ ok: true });
}
