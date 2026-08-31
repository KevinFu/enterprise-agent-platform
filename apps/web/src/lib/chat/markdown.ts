/**
 * 轻量、安全的 Markdown 渲染器（零依赖）
 * - 支持：标题、粗体、斜体、行内代码、代码块、无序列表、有序列表、链接、换行
 * - 输出字符串为 innerHTML，内容已做文本转义后再插入标签，避免 XSS
 */

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(text: string): string {
  // 代码块先行处理：把内容保护起来，不被 inline 规则影响
  const codeSnippets: string[] = [];
  let t = text.replace(/`([^`]+?)`/g, (_, code) => {
    const i = codeSnippets.length;
    codeSnippets.push(`<code class="rounded bg-black/5 px-1 py-0.5 text-[0.9em] dark:bg-white/10 font-mono">${escapeHtml(code)}</code>`);
    return `\u0000CODE${i}\u0000`;
  });

  // 链接 [text](href)
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, label, href) =>
      `<a class="underline text-foreground hover:opacity-80" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
  );

  // 粗体 **text** 或 __text__
  t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  t = t.replace(/__([^_]+?)__/g, '<strong class="font-semibold">$1</strong>');

  // 斜体 *text* 或 _text_ (单词边界)
  t = t.replace(/(^|\W)\*([^*\n]+?)\*(?=\W|$)/g, '$1<em>$2</em>');
  t = t.replace(/(^|\W)_([^_\n]+?)_(?=\W|$)/g, '$1<em>$2</em>');

  // 还原代码片段占位
  t = t.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codeSnippets[Number(i)] ?? "");

  return t;
}

interface Block {
  type: "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "code" | "hr";
  content: string; // 纯文本（段落内的行）或列表项数组字符串
  lang?: string;
}

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const raw = input.replace(/\r\n?/g, "\n");
  const lines = raw.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 空行跳过
    if (!line.trim()) {
      i++;
      continue;
    }

    // 代码块 ```
    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // 跳过闭合 ```
      blocks.push({ type: "code", content: buf.join("\n"), lang });
      continue;
    }

    // 分隔线 --- / ***
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // 标题 #/##/###
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length as 1 | 2 | 3;
      blocks.push({
        type: `h${level}` as "h1" | "h2" | "h3",
        content: h[2],
      });
      i++;
      continue;
    }

    // 无序列表 - / *
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", content: items.join("\u0001") });
      continue;
    }

    // 有序列表 1. 2.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", content: items.join("\u0001") });
      continue;
    }

    // 普通段落：合并连续非空行
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*(---+|\*\*\*+)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: buf.join(" ") });
  }

  return blocks
    .map((b) => {
      switch (b.type) {
        case "h1":
          return `<h1 class="text-2xl font-bold tracking-tight mt-4 mb-2">${renderInline(escapeHtml(b.content))}</h1>`;
        case "h2":
          return `<h2 class="text-xl font-semibold tracking-tight mt-3 mb-2">${renderInline(escapeHtml(b.content))}</h2>`;
        case "h3":
          return `<h3 class="text-lg font-semibold mt-2 mb-1">${renderInline(escapeHtml(b.content))}</h3>`;
        case "hr":
          return `<hr class="my-4 border-black/10 dark:border-white/10" />`;
        case "code": {
          const langCls = b.lang ? `language-${b.lang}` : "";
          return `<pre class="my-2 overflow-x-auto rounded-lg bg-black/[.04] p-3 text-sm dark:bg-white/[.06] ${langCls}"><code class="font-mono">${escapeHtml(b.content)}</code></pre>`;
        }
        case "ul": {
          const lis = b.content
            .split("\u0001")
            .map((x) => `<li class="list-disc ml-5">${renderInline(escapeHtml(x))}</li>`)
            .join("");
          return `<ul class="my-2 space-y-1">${lis}</ul>`;
        }
        case "ol": {
          const lis = b.content
            .split("\u0001")
            .map((x) => `<li class="list-decimal ml-5">${renderInline(escapeHtml(x))}</li>`)
            .join("");
          return `<ol class="my-2 space-y-1">${lis}</ol>`;
        }
        case "p":
        default:
          return `<p class="my-1.5 leading-relaxed whitespace-pre-wrap break-words">${renderInline(escapeHtml(b.content))}</p>`;
      }
    })
    .join("\n");
}
