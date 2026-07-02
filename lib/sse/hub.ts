// 进程内 SSE 广播：按 workspace 分组的客户端集合。
// 仅适用于 dev 单进程；多实例需换 Redis pub/sub。

const clients = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

function encode(eventName: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function addClient(
  workspaceId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  let set = clients.get(workspaceId);
  if (!set) {
    set = new Set();
    clients.set(workspaceId, set);
  }
  set.add(controller);
}

export function removeClient(
  workspaceId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  const set = clients.get(workspaceId);
  if (!set) return;
  set.delete(controller);
  if (set.size === 0) clients.delete(workspaceId);
}

export function broadcast(workspaceId: string, eventName: string, data: unknown): void {
  const set = clients.get(workspaceId);
  if (!set || set.size === 0) return;
  const payload = encode(eventName, data);
  for (const controller of set) {
    try {
      controller.enqueue(payload);
    } catch {
      // 客户端已断开，忽略；由 addClient 注册的 abort 回调清理。
    }
  }
}
