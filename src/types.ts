/**
 * Configuration types for the speech-to-text plugin.
 */

export type SttBackend = "moonshine" | "whisper" | "faster-whisper" | "auto";

export type MoonshineModel = "tiny" | "base";
export type WhisperModel = "tiny" | "base" | "small" | "medium" | "large";

export interface SpeechToTextConfig {
  /**
   * STT backend to use.
   * - moonshine: Fast, edge-optimized (recommended)
   * - whisper: OpenAI's original Whisper
   * - faster-whisper: Optimized Whisper implementation
   * - auto: Auto-detect available backend
   * @default "auto"
   */
  backend?: SttBackend;

  /**
   * Model size to use.
   * - For moonshine: "tiny" (27M) or "base" (62M)
   * - For whisper: "tiny", "base", "small", "medium", "large"
   * @default "tiny"
   */
  model?: string;

  /**
   * Language code for transcription.
   * @default "en"
   */
  language?: string;

  /**
   * Maximum recording duration in seconds.
   * @default 30
   */
  maxDuration?: number;

  /**
   * Path to Python executable.
   * @default "python3"
   */
  pythonPath?: string;

  /**
   * Custom path to stt.py script.
   * If not provided, uses the bundled script.
   */
  scriptPath?: string;
}

export interface SttResult {
  success: boolean;
  text?: string;
  error?: string;
  backend?: string;
  model?: string;
}

export const DEFAULT_CONFIG: Required<SpeechToTextConfig> = {
  backend: "auto",
  model: "tiny",
  language: "en",
  maxDuration: 30,
  pythonPath: "python3",
  scriptPath: "",
};
