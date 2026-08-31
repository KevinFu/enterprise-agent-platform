"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendChat, sendChatStream } from "./api";
import type { ChatMessage, SendStatus } from "./types";

const STORAGE_KEY = "enterprise-agent:chat:v1";
const DEFAULT_CONVERSATION_ID = "default";

interface PersistedState {
  version: 1;
  conversations: Record<string, ChatMessage[]>;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * 负责管理：消息列表、发送（流/非流）、停止、清空、持久化
 */
export function useChat(opts?: { stream?: boolean; endpoint?: string }) {
  const useStream = opts?.stream ?? true;
  const endpoint = opts?.endpoint;
  const [conversationId, setConversationId] = useState<string>(DEFAULT_CONVERSATION_ID);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse<PersistedState | null>(raw, null);
    return parsed?.conversations?.[DEFAULT_CONVERSATION_ID] ?? [];
  });
  const [status, setStatus] = useState<SendStatus>({ loading: false, streamingMessageId: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  // 持久化：写入 localStorage
  useEffect(() => {
    try {
      const prev = safeParse<PersistedState>(window.localStorage.getItem(STORAGE_KEY), {
        version: 1,
        conversations: {},
      });
      const next: PersistedState = {
        version: 1,
        conversations: {
          ...prev.conversations,
          [conversationId]: messages,
        },
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 存储失败不影响主流程 */
    }
  }, [messages, conversationId]);

  /** 往某条消息追加流式内容 */
  const appendStreaming = useCallback((id: string, chunk: string) => {
    if (!chunk) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    );
  }, []);

  /** 停止正在进行的请求 */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages((prev) => prev.map((m) => ({ ...m, streaming: false })));
    setStatus((s) => ({ ...s, loading: false, streamingMessageId: null }));
  }, []);

  /** 发送用户消息 */
  const send = useCallback(
    async (input: string, sendOpts?: { systemPrompt?: string }) => {
      const text = input.trim();
      if (!text || status.loading) return;

      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };

      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: useStream,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setStatus({
        loading: true,
        streamingMessageId: useStream ? assistantId : null,
        error: null,
      });

      try {
        if (useStream) {
          await sendChatStream(
            {
              message: text,
              history: [...messages, userMsg],
              conversationId,
            },
            {
              signal: controller.signal,
              endpoint,
              onDelta: (chunk) => appendStreaming(assistantId, chunk),
            },
          );
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
          );
        } else {
          const reply = await sendChat(
            {
              message: text,
              history: [...messages, userMsg],
              conversationId,
            },
            { signal: controller.signal, endpoint },
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    id: reply.id || m.id,
                    content: reply.content,
                    createdAt: reply.createdAt || m.createdAt,
                    streaming: false,
                  }
                : m,
            ),
          );
        }
        setStatus({ loading: false, streamingMessageId: null, error: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? {
              ...m,
              content: m.content || (msg.includes("abort") ? "（已取消）" : ""),
              streaming: false,
              error: !msg.includes("abort"),
            } : m,
          ),
        );
        setStatus({
          loading: false,
          streamingMessageId: null,
          error: msg.includes("abort") ? null : msg,
        });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [status.loading, useStream, messages, conversationId, endpoint, appendStreaming],
  );

  /** 清空当前会话 */
  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  /** 重新生成（把最后一条 user 重发） */
  const regenerateLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || status.loading) return;
    // 去掉最后一条 assistant + user，重新调用 send
    setMessages((prev) => {
      const idx = prev.lastIndexOf(lastUser);
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    // 下一个事件循环再发送，确保 messages 已更新
    setTimeout(() => send(lastUser.content), 0);
  }, [messages, status.loading, send]);

  return useMemo(
    () => ({
      messages,
      status,
      conversationId,
      setConversationId,
      send,
      stop,
      clear,
      regenerateLast,
    }),
    [messages, status, conversationId, send, stop, clear, regenerateLast],
  );
}
