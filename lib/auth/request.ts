// 认证接口的通用请求防护：同源校验与轻量内存限速。
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rejectCrossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return NextResponse.json({ error: "请求来源无效" }, { status: 403 });

  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const expected = `${protocol}://${host}`;
  return origin === expected ? null : NextResponse.json({ error: "请求来源无效" }, { status: 403 });
}

export function rejectIfRateLimited(request: Request, scope: string): NextResponse | null {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= MAX_ATTEMPTS) return null;
  return NextResponse.json({ error: "请求过于频繁，请稍后重试" }, { status: 429 });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
