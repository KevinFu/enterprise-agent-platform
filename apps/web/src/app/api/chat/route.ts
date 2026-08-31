import { createDataStreamResponse, formatDataStreamPart } from "ai";
import type { Message } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface AIChatRequest {
  messages: Message[];
  id?: string;
  requestId?: string;
}

/**
 * BFF /api/chat — 适配 Vercel AI SDK v4
 * 前端默认 POST body：{ messages, id }
 * 返回：StreamingTextResponse（AI SDK 专用 data-stream 协议）
 *
 * ==== TODO 接入真实 LLM provider（任选其一，然后替换下方 TODO 占位）====
 *
 *   1) OpenAI：
 *        pnpm add @ai-sdk/openai -F @enterprise/web
 *        import { openai } from "@ai-sdk/openai";
 *        import { streamText } from "ai";
 *        const result = await streamText({
 *          model: openai("gpt-4o-mini"),
 *          messages: payload.messages,
 *        });
 *        return result.toDataStreamResponse();
 *
 *   2) 阿里云百炼 / 通义 / Anthropic / 自建：
 *        安装对应 @ai-sdk/* provider 包，上面的 openai() 换成对应 provider.model()
 *
 * 现在先用一个最小的 TODO 流式占位返回，保证前端 ai/react useChat 端到端跑通
 * （不是 mock 示例，仅作为接入真实 provider 前的骨架占位）
 */
export async function POST(req: Request) {
  let payload: AIChatRequest;
  try {
    payload = (await req.json()) as AIChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(payload?.messages)) {
    return Response.json(
      { error: '"messages" (Message[]) is required for Vercel AI SDK' },
      { status: 400 },
    );
  }

  // TODO: 把下面占位块替换成真实 streamText({ model, messages }).toDataStreamResponse()
  return todoPlaceholderStream(payload.messages);
}

/* ========== TODO 占位：最小文本流，保证 UI 流式渲染链路可跑 ========== */

function todoPlaceholderStream(messages: Message[]): Response {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const preview =
    (lastUser?.content ?? "").slice(0, 80).replace(/\n/g, " ") || "（空输入）";

  const text =
    "[TODO] BFF /api/chat 尚未接入真实 LLM provider。\n\n" +
    "在 apps/web/src/app/api/chat/route.ts 顶部安装 @ai-sdk/*，用 streamText() 替换 todoPlaceholderStream 即可。\n\n" +
    `你刚才的最后一条输入：${preview}`;

  let i = 0;

  // createDataStreamResponse.execute 结束 resolve 即代表流自然结束
  // 写文本用 formatDataStreamPart("text", chunk) → 输出 `0:<chunk>\n` 的 AI SDK data-stream 标准帧
  return createDataStreamResponse({
    execute: async (dataStream) => {
      while (i < text.length) {
        const ch = text[i] ?? "";
        if (ch) dataStream.write(formatDataStreamPart("text", ch));
        i++;
        await new Promise<void>((r) => setTimeout(r, 35));
      }
    },
  });
}
