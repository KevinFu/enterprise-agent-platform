"use client";

import { memo } from "react";

interface ToolbarProps {
  onClear: () => void;
  messageCount: number;
  loading: boolean;
}

function ToolbarImpl({ onClear, messageCount, loading }: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[.06] bg-background/80 px-4 py-3 backdrop-blur sm:px-8 dark:border-white/[.07]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
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
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            Enterprise Agent
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {messageCount > 0 ? `${messageCount} 条消息` : "新的会话"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton
          onClick={onClear}
          title="清空会话"
          disabled={loading || messageCount === 0}
          label="清空"
        >
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
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/[.05] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-foreground/30 dark:text-zinc-300 dark:hover:bg-white/[.08]"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export const Toolbar = memo(ToolbarImpl);
