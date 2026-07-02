// SQLite 访问单例。本机最小化验证用本地文件 ./data/app.db（已在 .gitignore 忽略）。
import path from "node:path";
import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";
import { SCHEMA } from "./schema";

const DB_URL = process.env.DATABASE_URL ?? "file:./data/app.db";

// 本地文件库需要保证目录存在。
if (DB_URL.startsWith("file:")) {
  const filePath = DB_URL.slice("file:".length);
  const dir = path.dirname(filePath);
  if (dir && dir !== ".") mkdirSync(dir, { recursive: true });
}

let _client: Client | null = null;
let _initialized = false;

export function db(): Client {
  if (!_client) _client = createClient({ url: DB_URL });
  return _client;
}

// 首次访问时建表（幂等）。
export async function ensureSchema(): Promise<void> {
  if (_initialized) return;
  for (const stmt of SCHEMA) await db().execute(stmt);
  _initialized = true;
}
