"use client";

import { useChat } from "ai/react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Toolbar } from "./Toolbar";

export function ChatDialog() {
  // Vercel AI SDK v4：默认 POST /api/chat，body 为 { messages, id }
  // BFF 返回 StreamingTextResponse（ai 标准 data-stream 协议）
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages,
    error,
  } = useChat();

  return (
    <section className="flex h-full min-h-screen w-full flex-col bg-zinc-50 dark:bg-black">
      <Toolbar
        onClear={() => setMessages([])}
        messageCount={messages.length}
        loading={isLoading}
      />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onRegenerate={() => reload()}
        onStop={() => stop()}
      />
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={() => void handleSubmit()}
        onStop={() => stop()}
        disabled={!!error}
        loading={isLoading}
        autoFocus
      />
      {error && (
        <div role="alert" className="px-4 pb-3 sm:px-8">
          <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            请求失败：{error.message || String(error)}。
          </div>
        </div>
      )}
    </section>
  );
}
