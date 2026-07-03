// 认证接口的通用请求防护：同源校验、轻量内存限速与输入上限。
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;
const MAX_USERNAME_LENGTH = 32;
const MAX_PASSWORD_LENGTH = 1024;
const buckets = new Map<string, { count: number; resetAt: number }>();

type HeaderSource = Pick<Headers, "get">;

export type AuthInput = {
  username: string;
  password: string;
};

export function rejectCrossOrigin(request: Request): NextResponse | null {
  const error = crossOriginError(request.headers, request.url);
  return error ? NextResponse.json({ error }, { status: 403 }) : null;
}

export function crossOriginError(headers: HeaderSource, requestUrl?: string): string | null {
  const origin = headers.get("origin");
  if (!origin) return null;

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return "请求来源无效";

  const protocol =
    headers.get("x-forwarded-proto") ??
    (requestUrl ? new URL(requestUrl).protocol.replace(":", "") : new URL(origin).protocol.replace(":", ""));
  const expected = `${protocol}://${host}`;
  return origin === expected ? null : "请求来源无效";
}

export function rejectIfRateLimited(request: Request, scope: string): NextResponse | null {
  return isRateLimited(request.headers, scope)
    ? NextResponse.json({ error: "请求过于频繁，请稍后重试" }, { status: 429 })
    : null;
}

export function isRateLimited(headers: HeaderSource, scope: string): boolean {
  const key = `${scope}:${clientIp(headers)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}

export function parseAuthInput(body: { username?: unknown; password?: unknown } | null): AuthInput {
  return {
    username: typeof body?.username === "string" ? body.username.trim() : "",
    password: typeof body?.password === "string" ? body.password : "",
  };
}

export function validateAuthInput(input: AuthInput, mode: "login" | "register"): string | null {
  if (!input.username || !input.password) return "缺少用户名或密码";
  if (input.username.length > MAX_USERNAME_LENGTH || input.password.length > MAX_PASSWORD_LENGTH) {
    return mode === "login" ? "用户名或密码错误" : "用户名或密码格式不正确";
  }
  return null;
}

function clientIp(headers: HeaderSource): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
