// 会话层（Next 专用入口）：基于 next/headers 的 cookies()。
// 纯 iron-session 逻辑见 ./seal。
import { cookies } from "next/headers";
import { db, ensureSchema } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL, sealSession, unsealSession, type SessionData } from "./seal";

export type { SessionData };
export { SESSION_COOKIE } from "./seal";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL,
};

export async function getSession(): Promise<SessionData | null> {
  const sealed = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sealed) return null;
  const session = await unsealSession(sealed);
  if (!session) return null;

  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT username FROM users WHERE id = ?",
    args: [session.userId],
  });
  const row = res.rows[0];
  if (!row || row.username !== session.username) return null;
  return session;
}

export async function saveSession(data: SessionData): Promise<void> {
  const sealed = await sealSession(data);
  (await cookies()).set(SESSION_COOKIE, sealed, cookieOptions);
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
