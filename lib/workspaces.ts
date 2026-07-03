// 工作空间数据访问与成员/邀请逻辑。隔离主键是 workspace_id。
import { nanoid } from "nanoid";
import { db, ensureSchema } from "@/lib/db";

export type WorkspaceRole = "owner" | "member";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  eveSessionId: string | null;
};

export type WorkspaceMember = {
  userId: string;
  username: string;
  role: WorkspaceRole;
};

export class WorkspaceForbidden extends Error {}
export class WorkspaceNotFound extends Error {}

function rowToWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    ownerId: row.owner_id as string,
    eveSessionId: (row.eve_session_id as string | null) ?? null,
  };
}

export function slugify(name: string): string {
  const base =
    name
      .normalize("NFKD")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "space";
  return `${base}-${nanoid(6)}`;
}

export async function createWorkspace(input: {
  name: string;
  slug: string;
  ownerId: string;
}): Promise<Workspace> {
  await ensureSchema();
  const id = nanoid();
  const now = Date.now();
  await db().execute({
    sql: "INSERT INTO workspaces (id, name, slug, owner_id, eve_session_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
    args: [id, input.name, input.slug, input.ownerId, now],
  });
  await db().execute({
    sql: "INSERT INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)",
    args: [id, input.ownerId, now],
  });
  return { id, name: input.name, slug: input.slug, ownerId: input.ownerId, eveSessionId: null };
}

export async function getWorkspace(id: string): Promise<Workspace> {
  await ensureSchema();
  const res = await db().execute({ sql: "SELECT * FROM workspaces WHERE id = ?", args: [id] });
  if (res.rows.length === 0) throw new WorkspaceNotFound();
  return rowToWorkspace(res.rows[0] as Record<string, unknown>);
}

// route auth 不 enforce ownership（见 eve docs），成员校验必须在此显式做。
export async function assertMember(workspaceId: string, userId: string): Promise<WorkspaceRole> {
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
    args: [workspaceId, userId],
  });
  if (res.rows.length === 0) throw new WorkspaceForbidden();
  return res.rows[0].role as WorkspaceRole;
}

export async function listMine(userId: string): Promise<Workspace[]> {
  await ensureSchema();
  const res = await db().execute({
    sql: `SELECT w.* FROM workspaces w
          JOIN workspace_members m ON m.workspace_id = w.id
          WHERE m.user_id = ? ORDER BY w.created_at ASC`,
    args: [userId],
  });
  return res.rows.map((r) => rowToWorkspace(r as Record<string, unknown>));
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  await ensureSchema();
  const res = await db().execute({
    sql: `SELECT m.user_id, u.username, m.role FROM workspace_members m
          JOIN users u ON u.id = m.user_id
          WHERE m.workspace_id = ? ORDER BY m.joined_at ASC`,
    args: [workspaceId],
  });
  return res.rows.map((r) => ({
    userId: r.user_id as string,
    username: r.username as string,
    role: r.role as WorkspaceRole,
  }));
}

// 幂等加成员。本期邀请即直接加入（不做 pending 流程）。
export async function addMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole = "member",
): Promise<void> {
  await ensureSchema();
  const now = Date.now();
  await db().execute({
    sql: "INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)",
    args: [workspaceId, userId, role, now],
  });
}

export async function findUserIdByUsername(username: string): Promise<string | null> {
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: [username],
  });
  return res.rows.length > 0 ? (res.rows[0].id as string) : null;
}
