// 聊天消息持久化。终态 EveMessage 以 JSON 存库，刷新时还原历史。
// 流式增量不落库（前端从 SSE 实时拿）；这里只存每条 message 的终态。
import { db, ensureSchema } from "@/lib/db";
import type { EveMessage } from "eve/client";

export async function recordMessages(
  workspaceId: string,
  messages: readonly EveMessage[],
  meta?: { eveSessionId?: string | null; continuationToken?: string | null },
): Promise<void> {
  await ensureSchema();
  const now = Date.now();
  for (const message of messages) {
    await db().execute({
      sql: `INSERT OR IGNORE INTO messages
            (id, workspace_id, role, author_user_id, content_json, eve_session_id, eve_continuation_token, created_at)
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
      args: [
        message.id,
        workspaceId,
        message.role,
        JSON.stringify(message),
        meta?.eveSessionId ?? null,
        meta?.continuationToken ?? null,
        now,
      ],
    });
  }
}

export async function listMessages(workspaceId: string): Promise<EveMessage[]> {
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT content_json FROM messages WHERE workspace_id = ? ORDER BY created_at ASC, rowid ASC",
    args: [workspaceId],
  });
  return res.rows.map((row) => JSON.parse(row.content_json as string) as EveMessage);
}
