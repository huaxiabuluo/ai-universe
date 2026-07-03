import { NextResponse } from "next/server";
import { AuthError, login } from "@/lib/auth";
import { parseAuthInput, rejectCrossOrigin, rejectIfRateLimited, validateAuthInput } from "@/lib/auth/request";
import { saveSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const rateLimitError = rejectIfRateLimited(request, "login");
  if (rateLimitError) return rateLimitError;

  const body = (await request.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;
  const input = parseAuthInput(body);
  const inputError = validateAuthInput(input, "login");
  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: inputError === "缺少用户名或密码" ? 400 : 401 });
  }
  try {
    const user = await login(input.username, input.password);
    await saveSession(user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
