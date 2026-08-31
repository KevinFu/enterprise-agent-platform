export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** true 表示该消息还在流式生成中 */
  streaming?: boolean;
  /** 预留：错误消息标记 */
  error?: boolean;
}

export interface SendStatus {
  /** 是否正在等待响应（流式中也算 true） */
  loading: boolean;
  /** 当前流式生成的 id，用于前端定位要 append 的消息 */
  streamingMessageId?: string | null;
  error?: string | null;
}

export interface ChatSendOptions {
  /** 会话 id，未来支持多会话，当前默认单一会话 */
  conversationId?: string;
  /** 历史上下文（已经在 hook 里维护，这里兜底） */
  history?: ChatMessage[];
}
