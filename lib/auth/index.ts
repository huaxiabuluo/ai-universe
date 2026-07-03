// 用户注册 / 登录业务。用户名 + 密码（argon2id 哈希）。
import { nanoid } from "nanoid";
import { db, ensureSchema } from "@/lib/db";
import { slugify } from "@/lib/workspaces";
import { hashPassword, verifyPassword } from "./password";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$9bIAz7jTgptaRHNq7AZaSg$md7ONeUZzVu7gMLcfGStKyXXHaixgKjruXHtG3Qqbqo";

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
  const userId = nanoid();
  const workspaceId = nanoid();
  const workspaceName = `${u} 的空间`;
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  const tx = await db().transaction();
  try {
    await tx.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, u, passwordHash, now],
    });
    await tx.execute({
      sql: "INSERT INTO workspaces (id, name, slug, owner_id, eve_session_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
      args: [workspaceId, workspaceName, slugify(workspaceName), userId, now],
    });
    await tx.execute({
      sql: "INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
      args: [workspaceId, userId, "owner", now],
    });
    await tx.commit();
  } catch (error) {
    await rollbackQuietly(tx);
    if (isUniqueConstraintError(error, "users.username")) throw new AuthError("用户名已被占用");
    throw error;
  }
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
  if (res.rows.length === 0) {
    await verifyPassword(DUMMY_PASSWORD_HASH, password);
    throw new AuthError("用户名或密码错误");
  }
  const row = res.rows[0];
  const ok = await verifyPassword(row.password_hash as string, password);
  if (!ok) throw new AuthError("用户名或密码错误");
  return { userId: row.id as string, username: row.username as string };
}

async function rollbackQuietly(tx: { rollback: () => Promise<void> }): Promise<void> {
  try {
    await tx.rollback();
  } catch {
    // 保留原始写入错误，回滚失败交给数据库连接自行清理。
  }
}

function isUniqueConstraintError(error: unknown, column: string): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("unique constraint failed") && message.includes(column.toLowerCase());
}
