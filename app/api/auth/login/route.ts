import { NextResponse } from "next/server";
import { AuthError, login } from "@/lib/auth";
import { saveSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 });
  }
  try {
    const user = await login(username, password);
    await saveSession(user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
