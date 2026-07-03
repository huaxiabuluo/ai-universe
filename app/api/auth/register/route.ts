import { NextResponse } from "next/server";
import { AuthError, register } from "@/lib/auth";
import { parseAuthInput, rejectCrossOrigin, rejectIfRateLimited, validateAuthInput } from "@/lib/auth/request";
import { saveSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  const rateLimitError = rejectIfRateLimited(request, "register");
  if (rateLimitError) return rateLimitError;

  const body = (await request.json().catch(() => null)) as
    | { username?: unknown; password?: unknown }
    | null;
  const input = parseAuthInput(body);
  const inputError = validateAuthInput(input, "register");
  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: 400 });
  }
  try {
    const user = await register(input.username, input.password);
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
