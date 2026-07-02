// 用户注册 / 登录业务。用户名 + 密码（argon2id 哈希）。
import { nanoid } from "nanoid";
import { db, ensureSchema } from "@/lib/db";
import { createWorkspace } from "@/lib/workspaces";
import { hashPassword, verifyPassword } from "./password";

export class AuthError extends Error {}

function validateCredentials(username: string, password: string): { username: string } {
  const u = username.trim();
  if (u.length < 2 || u.length > 32) throw new AuthError("用户名需 2–32 个字符");
  if (password.length < 6) throw new AuthError("密码至少 6 位");
  return { username: u };
}

// 注册：用户名唯一、密码哈希、自动建个人空间。
export async function register(
  username: string,
  password: string,
): Promise<{ userId: string; username: string }> {
  const { username: u } = validateCredentials(username, password);
  await ensureSchema();
  const existing = await db().execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: [u],
  });
  if (existing.rows.length > 0) throw new AuthError("用户名已被占用");

  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  await db().execute({
    sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    args: [userId, u, passwordHash, now],
  });
  await createWorkspace({ name: `${u} 的空间`, slug: u, ownerId: userId });
  return { userId, username: u };
}

// 登录：统一"用户名或密码错误"，防止用户名枚举。
export async function login(
  username: string,
  password: string,
): Promise<{ userId: string; username: string }> {
  const u = username.trim();
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT id, username, password_hash FROM users WHERE username = ?",
    args: [u],
  });
  if (res.rows.length === 0) throw new AuthError("用户名或密码错误");
  const row = res.rows[0];
  const ok = await verifyPassword(row.password_hash as string, password);
  if (!ok) throw new AuthError("用户名或密码错误");
  return { userId: row.id as string, username: row.username as string };
}
