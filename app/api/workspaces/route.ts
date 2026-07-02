import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createWorkspace, listMine, slugify } from "@/lib/workspaces";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const workspaces = await listMine(session.userId);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "缺少空间名称" }, { status: 400 });
  const workspace = await createWorkspace({
    name,
    slug: slugify(name),
    ownerId: session.userId,
  });
  return NextResponse.json({ workspace });
}
