import { NextResponse } from "next/server";
import { AuthError, register } from "@/lib/auth";
import { rejectCrossOrigin, rejectIfRateLimited } from "@/lib/auth/request";
import { saveSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const rateLimitError = rejectIfRateLimited(request, "register");
  if (rateLimitError) return rateLimitError;

  const body = (await request.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 });
  }
  if (username.length > 64 || password.length > 1024) {
    return NextResponse.json({ error: "用户名或密码格式不正确" }, { status: 400 });
  }
  try {
    const user = await register(username, password);
    await saveSession(user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "用户名已被占用" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
