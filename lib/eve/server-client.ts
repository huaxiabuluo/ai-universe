// server-to-server 的 eve 客户端。按 host 缓存（dev 下同源，经 localDev() loopback 放行）。
import { Client } from "eve/client";

const clients = new Map<string, Client>();

export function eveClient(host: string): Client {
  let client = clients.get(host);
  if (!client) {
    client = new Client({
      host,
      // 跨 turn 保留 durable session 状态（含沙箱文件），否则每个 turn 后会话重置。
      preserveCompletedSessions: true,
      maxReconnectAttempts: 3,
    });
    clients.set(host, client);
  }
  return client;
}
