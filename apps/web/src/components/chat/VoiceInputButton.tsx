"use client";

import { memo, useEffect, useRef, useState, startTransition } from "react";

export interface VoiceResultCallback {
  /**
   * @param text   转写文本（单次事件的增量内容）
   * @param isFinal true 表示该句已结束，false 为实时中间结果
   */
  (text: string, isFinal: boolean): void;
}

interface VoiceInputButtonProps {
  disabled?: boolean;
  onResult: VoiceResultCallback;
  /** 默认中文，可覆盖 */
  lang?: string;
  /** 不支持时的点击提示 */
  onUnsupported?: () => void;
}

// Chrome: webkitSpeechRecognition, Safari/Firefox 可能不同或不存在
type SRConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error?: string; message?: string }) => void) | null;
  onresult:
    | ((ev: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string; confidence?: number }> & {
            isFinal: boolean;
          }
        >;
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSR(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSR() !== null;
}

function VoiceInputButtonImpl({
  disabled,
  onResult,
  lang = "zh-CN",
  onUnsupported,
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  // SSR hydration 安全：初始值固定为 false，避免服务器(Node)和客户端(浏览器)判断不一致。
  // 客户端 hydration 完成后通过 isHydrated() 更新真实的支持状态（startTransition 避免 cascading renders 警告）
  const [supported, setSupported] = useState<boolean>(false);
  const recognitionRef = useRef<InstanceType<SRConstructor> | null>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    const next = isSpeechRecognitionSupported();
    startTransition(() => {
      setSupported((prev) => (prev === next ? prev : next));
    });
  }, []);

  const ensureInstance = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = getSR();
    if (!Ctor) return null;
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (ev) => {
      let interim = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alt = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += alt;
        else interim += alt;
      }
      if (finalText) onResult(finalText, true);
      else if (interim) onResult(interim, false);
    };
    r.onerror = (ev) => {
      // no-speech / audio-capture 被视为正常中断
      if (ev.error && !["no-speech", "aborted"].includes(ev.error)) {
        // 降级为不提示（可选：通过 callback 抛给上层）
        // eslint-disable-next-line no-console
        console.warn("[voice] recognition error:", ev.error, ev.message ?? "");
      }
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      // 用户没主动点停但会话结束了，如果浏览器支持可自动重启 continuous 模式，这里简单停止
    };
    recognitionRef.current = r;
    return r;
  };

  const toggle = () => {
    if (!supported) {
      onUnsupported?.();
      return;
    }
    const r = ensureInstance();
    if (!r) {
      onUnsupported?.();
      return;
    }
    if (listening) {
      manualStopRef.current = true;
      r.stop();
      setListening(false);
      return;
    }
    try {
      manualStopRef.current = false;
      r.start();
      setListening(true);
    } catch {
      // 连续 start 会抛 InvalidState，忽略
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "停止录音" : "语音输入"}
      title={
        supported
          ? listening
            ? "停止录音"
            : "点击开始语音输入（Web Speech API）"
          : "当前浏览器不支持语音识别，建议使用 Chrome / Safari / Edge"
      }
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
        listening
          ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
          : supported
            ? "border border-black/[.08] text-zinc-600 hover:bg-zinc-50 dark:border-white/[.1] dark:text-zinc-300 dark:hover:bg-zinc-900"
            : "border border-black/[.08] text-zinc-400 cursor-help dark:border-white/[.1]",
        "disabled:cursor-not-allowed disabled:opacity-40",
      ].join(" ")}
    >
      <MicIcon />
    </button>
  );
}

function MicIcon() {
  return (
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
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  );
}

export const VoiceInputButton = memo(VoiceInputButtonImpl);
