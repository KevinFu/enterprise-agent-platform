"use client";

import { memo, useMemo, useState } from "react";
import type { Message } from "ai";
import { renderMarkdown } from "@/lib/chat/markdown";

interface MessageBubbleProps {
  message: Message;
  /** Vercel AI SDK 的 Message 没有 streaming 字段，由父组件按 isLoading + 下标判断传入 */
  isStreaming?: boolean;
  onCopy?: (id: string, text: string) => void;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  showStop?: boolean;
  onStop?: () => void;
}

function MessageBubbleImpl({
  message,
  isStreaming,
  onCopy,
  showRegenerate,
  onRegenerate,
  showStop,
  onStop,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const contentHtml = useMemo(
    () => (isUser ? null : renderMarkdown(message.content)),
    [isUser, message.content],
  );

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      onCopy?.(message.id, message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 不支持时忽略 */
    }
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={`group max-w-[85%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={[
            "whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm",
            isUser
              ? "rounded-tr-sm bg-foreground text-background"
              : "rounded-tl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
          ].join(" ")}
        >
          {isUser
            ? <span>{message.content}</span>
            : (
              <div
                // Markdown 经 marked + DOMPurify 转义后注入，XSS 安全
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: contentHtml ?? "" }}
              />
            )}
          {isStreaming && (
            <span
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current"
              aria-hidden
            />
          )}
        </div>

        {!isUser && message.content && (
          <div
            className={`mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 ${isStreaming ? "opacity-100" : ""}`}
          >
            <MetaTime time={message.createdAt} />
            <IconBtn label={copied ? "已复制" : "复制"} onClick={handleCopy}>
              {copied ? <IconCheck /> : <IconCopy />}
            </IconBtn>
            {showStop && (
              <IconBtn label="停止生成" onClick={onStop} variant="danger">
                <IconStop />
              </IconBtn>
            )}
            {showRegenerate && !isStreaming && (
              <IconBtn label="重新生成" onClick={onRegenerate}>
                <IconRefresh />
              </IconBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: Message["role"] }) {
  const isUser = role === "user";
  return (
    <div
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        isUser
          ? "bg-gradient-to-br from-indigo-500 to-sky-500 text-white"
          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
      ].join(" ")}
      aria-hidden
    >
      {isUser ? <IconUser /> : <IconBot />}
    </div>
  );
}

function MetaTime({ time }: { time?: Date | null }) {
  if (!time) return null;
  const d = time instanceof Date ? time : new Date(time);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return (
    <span className="px-1">
      {hh}:{mm}
    </span>
  );
}

function IconBtn({
  onClick,
  children,
  label,
  variant,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  label: string;
  variant?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-6 items-center gap-1 rounded-md px-1.5 transition-colors hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-foreground/40 dark:hover:bg-white/10",
        variant === "danger"
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
          : "",
      ].join(" ")}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconCopy() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBot() {
  return (
    <svg
      width="16"
      height="16"
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

export const MessageBubble = memo(MessageBubbleImpl);
