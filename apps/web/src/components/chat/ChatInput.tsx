"use client";

import { memo, useCallback, useEffect, useRef } from "react";

export interface ChatInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

function ChatInputImpl({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  loading,
  autoFocus,
  placeholder,
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const valueRef = useRef(value);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  const submit = useCallback(() => {
    const text = valueRef.current.trim();
    if (!text || disabled || loading) return;
    onSubmitRef.current();
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = "auto";
    });
  }, [disabled, loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !(e.nativeEvent as unknown as { isComposing?: boolean }).isComposing
    ) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled && !loading;
  const resolvePlaceholder =
    placeholder ??
    (disabled ? "请稍候…" : "输入你的问题，Enter 发送，Shift+Enter 换行");

  return (
    <div className="px-4 pb-5 pt-2 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border border-black/[.08] bg-white p-2 shadow-[0_8px_32px_rgba(15,23,42,0.06)] focus-within:ring-2 focus-within:ring-foreground/30 dark:border-white/[.1] dark:bg-black dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <textarea
            ref={ref}
            data-chat-input
            value={value}
            onChange={onChange}
            onKeyDown={handleKey}
            placeholder={resolvePlaceholder}
            disabled={disabled}
            rows={1}
            className="max-h-[220px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-foreground placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
          />
          {loading ? (
            <StopButton onClick={() => onStop?.()} />
          ) : (
            <SendButton disabled={!canSend} onClick={submit} />
          )}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
          内容由 AI 生成，请自行核查关键信息
        </p>
      </div>
    </div>
  );
}

function SendButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="发送"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4 20-7z" />
      </svg>
    </button>
  );
}

function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="停止"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[.08] bg-white text-foreground transition-colors hover:bg-zinc-100 dark:border-white/[.1] dark:bg-black dark:hover:bg-zinc-900"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <rect x="6" y="6" width="12" height="12" rx="1.5" />
      </svg>
    </button>
  );
}

export const ChatInput = memo(ChatInputImpl);
