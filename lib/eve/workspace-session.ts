// 每个 workspace 绑定一条 eve session（cursor 持久化在 SQLite）。
// 不同 workspace → 不同 sessionId → 自动得到独立的沙箱 /workspace 与聊天历史。
import type { SessionState } from "eve/client";
import { db, ensureSchema } from "@/lib/db";

export async function getCursor(workspaceId: string): Promise<SessionState> {
  await ensureSchema();
  const res = await db().execute({
    sql: "SELECT session_id, continuation_token, stream_index FROM workspace_eve_cursors WHERE workspace_id = ?",
    args: [workspaceId],
  });
  if (res.rows.length === 0) return { streamIndex: 0 };
  const row = res.rows[0];
  return {
    sessionId: (row.session_id as string | null) ?? undefined,
    continuationToken: (row.continuation_token as string | null) ?? undefined,
    streamIndex: (row.stream_index as number) ?? 0,
  };
}

export async function saveCursor(workspaceId: string, cursor: SessionState): Promise<void> {
  await ensureSchema();
  const sessionId = cursor.sessionId ?? null;
  const continuationToken = cursor.continuationToken ?? null;
  const streamIndex = cursor.streamIndex ?? 0;
  await db().execute({
    sql: `INSERT INTO workspace_eve_cursors (workspace_id, session_id, continuation_token, stream_index)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(workspace_id) DO UPDATE SET
            session_id = excluded.session_id,
            continuation_token = excluded.continuation_token,
            stream_index = excluded.stream_index`,
    args: [workspaceId, sessionId, continuationToken, streamIndex],
  });
  await db().execute({
    sql: "UPDATE workspaces SET eve_session_id = ? WHERE id = ?",
    args: [sessionId, workspaceId],
  });
}
