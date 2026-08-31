/**
 * 基于浏览器原生 Web Speech API 的 TTS（语音合成）
 * - 零依赖，Safari / Chrome / Edge 原生支持
 * - Firefox 多数版本也已支持 speechSynthesis
 * - 不支持时所有方法静默 no-op，调用方无报错
 */

export interface TTSPlayOptions {
  /** 语音语言代码，默认中文 */
  lang?: string;
  /** 0-2，默认 1 */
  rate?: number;
  /** 0-1，默认 1 */
  pitch?: number;
  /** 0-1，默认 0.9 */
  volume?: number;
  /** 偏好的 voice 名称（可用 listVoices 查询） */
  preferredVoiceName?: string;
}

const isSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.speechSynthesis !== "undefined" &&
  typeof window.SpeechSynthesisUtterance !== "undefined";

export function isTTSSupported(): boolean {
  return isSupported();
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!isSupported()) return [];
  // speechSynthesis.getVoices() 在 Chrome 首次调用后需要等 voiceschanged 事件
  // 这里直接返回当前快照，调用方可忽略
  try {
    return window.speechSynthesis.getVoices() ?? [];
  } catch {
    return [];
  }
}

export function stopTTS(): void {
  if (!isSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export function isSpeaking(): boolean {
  if (!isSupported()) return false;
  try {
    return window.speechSynthesis.speaking;
  } catch {
    return false;
  }
}

/**
 * 朗读一段文本，返回可 cancel 的句柄
 */
export function speakText(
  text: string,
  opts: TTSPlayOptions = {},
): { cancel: () => void } {
  const noop = { cancel: () => {} };
  if (!isSupported() || !text) return noop;

  const {
    lang = "zh-CN",
    rate = 1,
    pitch = 1,
    volume = 0.9,
    preferredVoiceName,
  } = opts;

  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;

    const voices = listVoices();
    const preferred =
      (preferredVoiceName &&
        voices.find((v) => v.name.includes(preferredVoiceName))) ||
      voices.find((v) => v.lang?.toLowerCase()?.startsWith("zh")) ||
      voices.find((v) => v.default) ||
      voices[0];
    if (preferred) utter.voice = preferred;

    // 某些浏览器在队列里已有任务时不会立即开始，先 cancel 干净
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

    return {
      cancel: () => {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* noop */
        }
      },
    };
  } catch {
    return noop;
  }
}
