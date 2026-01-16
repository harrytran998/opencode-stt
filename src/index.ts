import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { transcribe, listBackends } from "./stt";
import type { SpeechToTextConfig, SttBackend } from "./types";

/**
 * Speech-to-Text Plugin for OpenCode.
 * 
 * Provides voice input capability using Moonshine or Whisper models.
 * 
 * Features:
 * - `voice_input` tool for AI-triggered voice recording
 * - Automatic silence detection
 * - Support for Moonshine (fast, edge-optimized) and Whisper models
 * 
 * Usage:
 * 1. Install the plugin: Add "opencode-speech-to-text" to your opencode.json plugins
 * 2. Install Python dependencies: pip install sounddevice soundfile numpy
 * 3. Install STT backend: 
 *    - Moonshine: pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx
 *    - OR Whisper: pip install openai-whisper
 *    - OR Faster-Whisper: pip install faster-whisper
 */
export const SpeechToTextPlugin: Plugin = async (ctx) => {
  // Load configuration from environment or defaults
  const config: SpeechToTextConfig = {
    backend: (process.env.STT_BACKEND as SttBackend) || "auto",
    model: process.env.STT_MODEL || "tiny",
    language: process.env.STT_LANGUAGE || "en",
    maxDuration: parseInt(process.env.STT_MAX_DURATION || "30", 10),
    pythonPath: process.env.STT_PYTHON_PATH || "python3",
  };

  // Log available backends on startup
  const backends = await listBackends(config.pythonPath);
  if (backends.length > 0) {
    await ctx.client.app.log({
      service: "speech-to-text",
      level: "info",
      message: `Available STT backends: ${backends.join(", ")}`,
    });
  }

  return {
    tool: {
      /**
       * Voice input tool - records audio from microphone and transcribes it.
       * Use this when the user wants to provide input via voice.
       */
      voice_input: tool({
        description: `Record voice input from the microphone and transcribe it to text.
        
Uses local speech-to-text models (Moonshine or Whisper) for privacy-preserving transcription.
The recording automatically stops when silence is detected.

Returns the transcribed text that can be used as user input or for any other purpose.

Available backends: ${backends.length > 0 ? backends.join(", ") : "none detected - user needs to install dependencies"}`,
        args: {
          max_duration: tool.schema.number().optional().describe(
            "Maximum recording duration in seconds (default: 30)"
          ),
          backend: tool.schema.string().optional().describe(
            "STT backend to use: moonshine, whisper, faster-whisper, or auto"
          ),
          model: tool.schema.string().optional().describe(
            "Model size: tiny (fast), base, small, medium, large"
          ),
          language: tool.schema.string().optional().describe(
            "Language code for transcription (default: en)"
          ),
        },
        async execute(args) {
          const result = await transcribe({
            ...config,
            maxDuration: args.max_duration ?? config.maxDuration,
            backend: (args.backend as SttBackend) ?? config.backend,
            model: args.model ?? config.model,
            language: args.language ?? config.language,
          });

          if (!result.success) {
            return `Voice input failed: ${result.error}

To fix this, ensure:
1. Python dependencies are installed: pip install sounddevice soundfile numpy
2. An STT backend is installed:
   - Moonshine (recommended): pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx
   - Whisper: pip install openai-whisper
   - Faster-Whisper: pip install faster-whisper
3. Microphone permissions are granted to the terminal`;
          }

          return `Voice input transcribed (${result.backend}/${result.model}):

${result.text}`;
        },
      }),

      /**
       * Check available STT backends.
       */
      voice_check: tool({
        description: "Check which speech-to-text backends are available on this system.",
        args: {},
        async execute() {
          const available = await listBackends(config.pythonPath);
          
          if (available.length === 0) {
            return `No STT backends detected.

Please install one of the following:
- Moonshine (recommended, fastest): 
  pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx
  
- Whisper (OpenAI's original):
  pip install openai-whisper
  
- Faster-Whisper (optimized):
  pip install faster-whisper

Also ensure base dependencies are installed:
  pip install sounddevice soundfile numpy`;
          }

          return `Available STT backends: ${available.join(", ")}

Current configuration:
- Backend: ${config.backend}
- Model: ${config.model}
- Language: ${config.language}
- Max duration: ${config.maxDuration}s`;
        },
      }),
    },
  };
};

export default SpeechToTextPlugin;

// Re-export types and utilities
export * from "./types";
export { transcribe, listBackends } from "./stt";
