"use client";

import { memo, useEffect, useRef } from "react";
import type { Message } from "ai";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate?: () => void;
  onStop?: () => void;
}

function MessageListImpl({
  messages,
  isLoading,
  onRegenerate,
  onStop,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = dist < 80;
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isLoading]);

  const empty = messages.length === 0;
  const lastIdx = messages.length - 1;
  const lastMsg = messages[lastIdx];
  const lastIsAssistant = lastMsg?.role === "assistant";
  const lastIsUser = lastMsg?.role === "user";
  const showTyping = isLoading && messages.length > 0 && lastIsUser;

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
      style={{ contentVisibility: "auto" }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {empty
          ? <EmptyState />
          : messages.map((m, idx) => {
            const isLast = idx === lastIdx;
            const streaming = isLoading && isLast && m.role === "assistant";
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isStreaming={streaming}
                showRegenerate={isLast && lastIsAssistant && !isLoading}
                onRegenerate={onRegenerate}
                showStop={streaming}
                onStop={onStop}
              />
            );
          })}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <IconBot />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-900">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s] dark:bg-zinc-500" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s] dark:bg-zinc-500" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  // TODO: 可在此补充产品介绍 / 能力卡片（需求 2：不需要 mock 示例）
  return (
    <div className="mt-12 flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <IconBot size={28} />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          开始与 Agent 对话
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          输入你的问题，Enter 发送；AI 回复支持复制、停止生成、重新生成。
        </p>
      </div>
    </div>
  );
}

function IconBot({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 2v4" />
      <circle cx="9" cy="14" r="0.5" fill="currentColor" />
      <circle cx="15" cy="14" r="0.5" fill="currentColor" />
      <path d="M8 18h8" />
    </svg>
  );
}

export const MessageList = memo(MessageListImpl);
export { TypingIndicator };
