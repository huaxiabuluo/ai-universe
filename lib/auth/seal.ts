// 纯 iron-session 的加解密与 Request 读取，不依赖 next/headers。
// 这样 eve 的 channel auth（跑在 nitro runtime，非 Next）可以安全 import 本文件。
import { sealData, unsealData } from "iron-session";

export type SessionData = {
  userId: string;
  username: string;
};

export const SESSION_COOKIE = "ai-universe-session";
export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 天

export function sessionPassword(): string {
  const p = process.env.SESSION_SECRET;
  if (!p || p.length < 32) {
    throw new Error("SESSION_SECRET 未配置或不足 32 字符（请在 .env.local 设置）");
  }
  return p;
}

export function sealSession(data: SessionData): Promise<string> {
  return sealData(data, { password: sessionPassword(), ttl: SESSION_TTL });
}

export async function unsealSession(sealed: string): Promise<SessionData | null> {
  try {
    const data = await unsealData<SessionData>(sealed, { password: sessionPassword() });
    return isSessionData(data) ? data : null;
  } catch {
    return null;
  }
}

// eve AuthFn 用：从 Web Request 的 Cookie 头解密（不经 next/headers，任意 runtime 可用）。
export async function getSessionFromRequest(request: Request): Promise<SessionData | null> {
  const sealed = readCookieValue(request.headers.get("cookie") ?? "", SESSION_COOKIE);
  if (!sealed) return null;
  return unsealSession(sealed);
}

function readCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function isSessionData(data: unknown): data is SessionData {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<SessionData>;
  return typeof candidate.userId === "string" && typeof candidate.username === "string";
}
