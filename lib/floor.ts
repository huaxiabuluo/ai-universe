// 回合制发言权状态机：同一 workspace 同一时刻只有一个活跃 turn（AI 占用）。
// 配合 eve「单会话单活跃 continuation」的限制——并发发送会被 eve 拒绝，所以由应用层串行化。
// dev 单进程内存即可；多实例生产需换共享存储（如 Redis）。

type Holder = "ai" | string | null; // 'ai' 或持有发言的用户 id

type FloorState = {
  holder: Holder;
  abortCtl: AbortController | null;
};

const floors = new Map<string, FloorState>();
const mutexes = new Map<string, Promise<void>>();

function ensure(workspaceId: string): FloorState {
  let f = floors.get(workspaceId);
  if (!f) {
    f = { holder: null, abortCtl: null };
    floors.set(workspaceId, f);
  }
  return f;
}

// 串行化对同一 workspace 的 floor 操作，避免并发竞争。
async function locked<T>(workspaceId: string, fn: () => Promise<T>): Promise<T> {
  const prev = mutexes.get(workspaceId) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  mutexes.set(workspaceId, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export class FloorBusy extends Error {}

// 请求发言权：holder 必须为空。成功后 holder 置 'ai'，返回本 turn 的 AbortController。
export async function acquireFloor(workspaceId: string): Promise<AbortController> {
  return locked(workspaceId, async () => {
    const f = ensure(workspaceId);
    if (f.holder !== null) throw new FloorBusy();
    const abortCtl = new AbortController();
    f.holder = "ai";
    f.abortCtl = abortCtl;
    return abortCtl;
  });
}

export function getFloorHolder(workspaceId: string): Holder {
  return ensure(workspaceId).holder;
}

export async function releaseFloor(workspaceId: string): Promise<void> {
  return locked(workspaceId, async () => {
    const f = ensure(workspaceId);
    f.holder = null;
    f.abortCtl = null;
  });
}

// 中断当前 AI turn。仅 holder==='ai' 时有效。
export async function abortFloor(workspaceId: string): Promise<boolean> {
  return locked(workspaceId, async () => {
    const f = ensure(workspaceId);
    if (f.holder !== "ai" || !f.abortCtl) return false;
    f.abortCtl.abort();
    return true;
  });
}
