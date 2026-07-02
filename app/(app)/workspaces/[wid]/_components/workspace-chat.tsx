"use client";

import type { ChatStatus } from "ai";
import { defaultMessageReducer } from "eve/client";
import type { EveMessageData, HandleMessageStreamEvent } from "eve/client";
import { useEffect, useRef, useState } from "react";
import { AgentMessage } from "@/app/_components/agent-message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

type Floor = { holder: "ai" | string | null; by?: string };

// 空间内协作聊天：SSE 订阅 eve stream 事件 + 用 eve defaultMessageReducer 聚合成消息，
// 复用现有 AgentMessage 渲染。发送走后端 turn 代理（回合制），中断走 /interrupt。
export function WorkspaceChat({ workspaceId }: { readonly workspaceId: string }) {
  const reducerRef = useRef(defaultMessageReducer());
  const [data, setData] = useState<EveMessageData>(() => reducerRef.current.initial());
  const [floor, setFloor] = useState<Floor>({ holder: null });
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 刷新后还原历史。
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workspaces/${workspaceId}/messages`)
      .then((r) => r.json())
      .then((d: { messages: EveMessageData["messages"] }) => {
        if (!cancelled) {
          setData({ messages: d.messages });
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // 实时事件。
  useEffect(() => {
    const es = new EventSource(`/api/workspaces/${workspaceId}/events`);
    es.addEventListener("eve", (e) => {
      const event = JSON.parse((e as MessageEvent).data) as HandleMessageStreamEvent;
      setData((prev) => reducerRef.current.reduce(prev, event));
    });
    es.addEventListener("floor", (e) => setFloor(JSON.parse((e as MessageEvent).data) as Floor));
    es.addEventListener("turn.failed", (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { error?: string };
      setError(d.error ?? "turn 失败");
    });
    es.addEventListener("turn.aborted", () => setError(null));
    return () => es.close();
  }, [workspaceId]);

  const busy = floor.holder !== null;
  const status: ChatStatus = busy ? "streaming" : "ready";

  async function send(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || busy) return;
    setError(null);
    // optimistic 用户消息；message.received 到达后 reducer 会替换为权威版本。
    setData((prev) =>
      reducerRef.current.reduce(prev, {
        type: "client.message.submitted",
        data: { message: text, submissionId: crypto.randomUUID(), createdAt: Date.now() },
      }),
    );
    const res = await fetch(`/api/workspaces/${workspaceId}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (res.status === 409) setError("AI 正在回复，请稍候或点停止中断");
    else if (!res.ok) setError("发送失败");
  }

  async function interrupt() {
    await fetch(`/api/workspaces/${workspaceId}/interrupt`, { method: "POST" });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {!loaded ? null : data.messages.length === 0 ? (
            <p className="text-steel text-sm">发送一条消息开始协作。</p>
          ) : (
            data.messages.map((message) => (
              <AgentMessage
                canRespond={!busy}
                isStreaming={false}
                key={message.id}
                message={message}
                onInputResponses={() => {}}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <PromptInput onSubmit={send}>
        <PromptInputTextarea
          disabled={busy}
          placeholder={busy ? "等待 AI 回复（点停止可中断）…" : "发送消息…"}
        />
        <PromptInputSubmit onStop={interrupt} status={status} />
      </PromptInput>
    </div>
  );
}
