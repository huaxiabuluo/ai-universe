// 工作空间数据访问。本期 Task 3 只需 createWorkspace（注册时自动建个人空间）；
// listMine / assertMember / 邀请等在 Task 4 补充。
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
