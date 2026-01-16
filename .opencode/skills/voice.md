---
name: voice
description: Record voice input and transcribe it to text using local speech-to-text models (Moonshine or Whisper)
---

# Voice Input Skill

Record audio from the microphone and transcribe it to text using local speech-to-text models.

## How to use

When the user wants to provide voice input, use the `voice_input` tool.

The tool will:
1. Start recording from the microphone
2. Automatically detect when the user stops speaking (silence detection)
3. Transcribe the audio using Moonshine or Whisper
4. Return the transcribed text

## Example

```
User: Let me speak my request
Assistant: I'll record your voice input now.
[Uses voice_input tool]
Assistant: I heard: "Please help me refactor the authentication module"
```

## Configuration

The following environment variables can be set to configure the STT backend:

- `STT_BACKEND`: moonshine (recommended), whisper, faster-whisper, or auto
- `STT_MODEL`: Model size (tiny, base, small, medium, large)
- `STT_LANGUAGE`: Language code (default: en)
- `STT_MAX_DURATION`: Maximum recording duration in seconds (default: 30)

## Requirements

1. Python 3.10+ with audio dependencies:
   ```bash
   uv pip install sounddevice soundfile numpy
   ```

2. One of the following STT backends:
   - **Moonshine** (recommended - fastest):
     ```bash
     uv pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx
     ```
   - **Whisper**:
     ```bash
     uv pip install openai-whisper
     ```
   - **Faster-Whisper**:
     ```bash
     uv pip install faster-whisper
     ```

3. Microphone access permissions for your terminal application

## Troubleshooting

If voice input fails:
1. Run `voice_check` to see available backends
2. Ensure microphone permissions are granted
3. Check that Python dependencies are installed
