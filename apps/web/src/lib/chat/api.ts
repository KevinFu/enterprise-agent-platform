import type { ChatMessage } from "./types";

/**
 * 前端 -> BFF (/api/chat) -> NestJS 后端
 * 这里统一封装：支持 stream（SSE/ndjson 两种）与非 stream
 * BFF 目前是一个可替换的薄代理层
 */

export interface ChatAPIRequest {
  message: string;
  history?: ChatMessage[];
  conversationId?: string;
  stream?: boolean;
}

export interface ChatAPIResponse {
  id: string;
  role: "assistant";
  content: string;
  createdAt: number;
}

const DEFAULT_ENDPOINT = "/api/chat";

/**
 * fetch 包装：处理非 2xx、解析 JSON、补默认字段
 */
async function request(
  endpoint: string,
  body: ChatAPIRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg = `${msg}: ${j.message}`;
      else if (j?.error) msg = `${msg}: ${j.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res;
}

/**
 * 非流式请求，返回完整 assistant 回复
 */
export async function sendChat(
  body: Omit<ChatAPIRequest, "stream">,
  opts?: { signal?: AbortSignal; endpoint?: string },
): Promise<ChatAPIResponse> {
  const endpoint = opts?.endpoint ?? DEFAULT_ENDPOINT;
  const res = await request(endpoint, { ...body, stream: false }, opts?.signal);
  const json = (await res.json()) as Partial<ChatAPIResponse>;
  return {
    id: json.id ?? crypto.randomUUID(),
    role: "assistant",
    content: json.content ?? "",
    createdAt: json.createdAt ?? Date.now(),
  };
}

/**
 * 流式请求：约定后端/代理返回 text/event-stream，event: delta 或普通 data: 内容
 * 每回调一次给 onDelta
 */
export async function sendChatStream(
  body: Omit<ChatAPIRequest, "stream">,
  opts: {
    onDelta: (chunk: string) => void;
    signal?: AbortSignal;
    endpoint?: string;
  },
): Promise<ChatAPIResponse> {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const res = await request(endpoint, { ...body, stream: true }, opts.signal);

  const contentType = res.headers.get("content-type") ?? "";
  // 浏览器原生没有 ReadableStream 类型在 SSR，保证安全
  const isSSE = contentType.includes("text/event-stream");
  const isNdjson = contentType.includes("application/x-ndjson");

  let fullText = "";

  if (!res.body) {
    // 兜底：非流式
    const text = await res.text();
    fullText = text;
    opts.onDelta(text);
  } else if (isSSE) {
    await parseSSE(res.body, (chunk) => {
      fullText += chunk;
      opts.onDelta(chunk);
    });
  } else if (isNdjson) {
    await parseNdjson(res.body, (chunk) => {
      fullText += chunk;
      opts.onDelta(chunk);
    });
  } else {
    // 纯文本流：按字节吐
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value ?? new Uint8Array(), { stream: true });
      fullText += chunk;
      opts.onDelta(chunk);
    }
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: fullText,
    createdAt: Date.now(),
  };
}

async function parseSSE(
  body: ReadableStream<Uint8Array>,
  onData: (chunk: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: true });
    // SSE 以 \n\n 分事件
    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).replace(/^ /, ""));
        }
      }
      const payload = dataLines.join("\n");
      if (!payload || payload === "[DONE]") continue;
      // 支持 {content:"..."} JSON 或纯文本
      if (payload.startsWith("{") && payload.endsWith("}")) {
        try {
          const obj = JSON.parse(payload);
          if (typeof obj.content === "string") onData(obj.content);
          else if (typeof obj.delta === "string") onData(obj.delta);
          else onData(payload);
        } catch {
          onData(payload);
        }
      } else {
        onData(payload);
      }
    }
  }
  if (buffer.trim()) onData(buffer.trim());
}

async function parseNdjson(
  body: ReadableStream<Uint8Array>,
  onData: (chunk: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: true });
    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, sepIndex).trim();
      buffer = buffer.slice(sepIndex + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        if (typeof obj.content === "string") onData(obj.content);
        else if (typeof obj.delta === "string") onData(obj.delta);
      } catch {
        onData(line);
      }
    }
  }
}
