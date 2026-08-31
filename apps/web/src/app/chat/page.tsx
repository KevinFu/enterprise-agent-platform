import { ChatDialog } from "@/components/chat/ChatDialog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "与 Agent 对话",
  description: "Enterprise Agent 聊天界面：文本输入、Vercel AI SDK 流式渲染、可复制",
};

export default function ChatPage() {
  return <ChatDialog />;
}
