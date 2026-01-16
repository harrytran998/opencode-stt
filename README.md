# OpenCode Speech-to-Text Plugin

Speech-to-text plugin for [OpenCode](https://opencode.ai) with support for **Moonshine** (fast, edge-optimized) and **Whisper** (OpenAI's model) backends.

## Features

- **Voice Input Tool** - Record audio from microphone and transcribe to text
- **Automatic Silence Detection** - Recording stops when you stop speaking
- **Multiple Backends** - Moonshine (recommended), Whisper, or Faster-Whisper
- **Privacy-First** - All processing is done locally, no cloud APIs
- **Configurable** - Choose model size, language, and recording duration

## Quick Start

### 1. Install the Plugin

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-speech-to-text"]
}
```

### 2. Install Python Dependencies

```bash
# Base dependencies (required)
pip install sounddevice soundfile numpy

# Choose ONE backend:

# Option A: Moonshine (Recommended - fastest, smallest)
pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx

# Option B: Whisper (OpenAI's original)
pip install openai-whisper

# Option C: Faster-Whisper (Optimized Whisper)
pip install faster-whisper
```

### 3. Grant Microphone Permissions

Ensure your terminal application has microphone access in your system settings.

## Usage

### Using the Tool

OpenCode will automatically have access to the `voice_input` tool:

```
You: Record my voice input
Assistant: I'll record your voice now. Please speak...
[Recording starts, stops on silence]
Assistant: I heard: "Please help me refactor the authentication module"
```

### Using the Skill

Type `/voice` to get guidance on using voice input.

### Checking Setup

Use the `voice_check` tool to verify your setup:

```
You: Check my voice setup
Assistant: [Uses voice_check tool]
Available STT backends: moonshine
Current configuration:
- Backend: auto
- Model: tiny
- Language: en
- Max duration: 30s
```

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `STT_BACKEND` | Backend: `moonshine`, `whisper`, `faster-whisper`, `auto` | `auto` |
| `STT_MODEL` | Model size: `tiny`, `base`, `small`, `medium`, `large` | `tiny` |
| `STT_LANGUAGE` | Language code | `en` |
| `STT_MAX_DURATION` | Max recording seconds | `30` |
| `STT_PYTHON_PATH` | Path to Python | `python3` |

### Model Comparison

| Backend | Model | Size | Speed | Quality |
|---------|-------|------|-------|---------|
| **Moonshine** | tiny | 27M (190MB) | Fastest | Good |
| **Moonshine** | base | 62M (400MB) | Very Fast | Better |
| Whisper | tiny | 39M | Slow | Good |
| Whisper | base | 74M | Slower | Better |
| Whisper | small | 244M | Much Slower | Great |

**Recommendation**: Use Moonshine `tiny` for best balance of speed and accuracy.

## Supported Languages

### Moonshine
- Arabic (ar), Chinese (zh), English (en), Japanese (ja), Korean (ko), Spanish (es), Ukrainian (uk), Vietnamese (vi)

### Whisper
- 99+ languages (see [OpenAI Whisper](https://github.com/openai/whisper))

## System Requirements

### macOS
```bash
brew install portaudio ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt install -y portaudio19-dev python3-dev ffmpeg
```

### Fedora
```bash
sudo dnf install portaudio-devel python3-devel ffmpeg
```

## Troubleshooting

### "No STT backend available"
Install one of the supported backends:
```bash
pip install useful-moonshine-onnx@git+https://github.com/moonshine-ai/moonshine.git#subdirectory=moonshine-onnx
```

### "No microphone found"
1. Check system permissions for your terminal
2. Verify microphone is connected: `python -c "import sounddevice; print(sounddevice.query_devices())"`

### Slow transcription
1. Use Moonshine instead of Whisper
2. Use `tiny` model instead of larger variants
3. Ensure you have a capable CPU/GPU

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck
```

## License

MIT

## Credits

- [Moonshine](https://github.com/moonshine-ai/moonshine) - Fast ASR for edge devices
- [OpenAI Whisper](https://github.com/openai/whisper) - Robust speech recognition
- [VoiceMode MCP](https://github.com/mbailey/voicemode) - Inspiration for the voice interface
