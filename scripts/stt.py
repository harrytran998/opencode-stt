#!/usr/bin/env python3
"""
Speech-to-Text backend for OpenCode plugin.
Supports Moonshine (recommended) and Whisper models.

Usage:
    python stt.py [--backend moonshine|whisper|faster-whisper] [--model tiny|base] [--duration 10] [--language en]

Output:
    JSON with transcription result to stdout
"""

import argparse
import json
import sys
import os
import tempfile
from pathlib import Path

# Suppress warnings for cleaner output
import warnings
warnings.filterwarnings("ignore")

# Audio recording settings
SAMPLE_RATE = 16000  # 16kHz for speech recognition


def get_available_backend():
    """Detect which STT backend is available."""
    backends = []
    
    try:
        import moonshine_onnx
        backends.append("moonshine")
    except ImportError:
        pass
    
    try:
        import whisper
        backends.append("whisper")
    except ImportError:
        pass
    
    try:
        from faster_whisper import WhisperModel
        backends.append("faster-whisper")
    except ImportError:
        pass
    
    return backends


def record_audio(duration: float, silence_threshold: float = 0.01, silence_duration: float = 1.5) -> str:
    """
    Record audio from microphone with silence detection.
    
    Args:
        duration: Maximum recording duration in seconds
        silence_threshold: RMS threshold below which is considered silence
        silence_duration: How long silence must persist to stop recording
    
    Returns:
        Path to temporary WAV file
    """
    import sounddevice as sd
    import soundfile as sf
    import numpy as np
    
    print("Recording... (speak now, will stop after silence)", file=sys.stderr)
    
    # Record in chunks for silence detection
    chunk_duration = 0.1  # 100ms chunks
    chunk_samples = int(SAMPLE_RATE * chunk_duration)
    max_chunks = int(duration / chunk_duration)
    
    audio_chunks = []
    silent_chunks = 0
    silence_chunks_threshold = int(silence_duration / chunk_duration)
    
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype='float32') as stream:
        for _ in range(max_chunks):
            chunk, _ = stream.read(chunk_samples)
            audio_chunks.append(chunk)
            
            # Calculate RMS for silence detection
            rms = np.sqrt(np.mean(chunk ** 2))
            
            if rms < silence_threshold:
                silent_chunks += 1
            else:
                silent_chunks = 0
            
            # Stop if silence persists and we have some audio
            if silent_chunks >= silence_chunks_threshold and len(audio_chunks) > silence_chunks_threshold * 2:
                break
    
    print("Recording stopped.", file=sys.stderr)
    
    # Concatenate and save
    audio = np.concatenate(audio_chunks)
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    sf.write(temp_file.name, audio, SAMPLE_RATE)
    
    return temp_file.name


def transcribe_moonshine(audio_path: str, model: str = "tiny") -> str:
    """Transcribe using Moonshine ONNX."""
    import moonshine_onnx
    
    model_name = f"moonshine/{model}"
    result = moonshine_onnx.transcribe(audio_path, model_name)
    
    if isinstance(result, list):
        return " ".join(result)
    return str(result)


def transcribe_whisper(audio_path: str, model: str = "tiny", language: str = "en") -> str:
    """Transcribe using OpenAI Whisper."""
    import whisper
    
    model_obj = whisper.load_model(model)
    result = model_obj.transcribe(audio_path, language=language)
    
    return result["text"].strip()


def transcribe_faster_whisper(audio_path: str, model: str = "tiny", language: str = "en") -> str:
    """Transcribe using Faster-Whisper."""
    from faster_whisper import WhisperModel
    
    model_obj = WhisperModel(model, device="auto", compute_type="auto")
    segments, _ = model_obj.transcribe(audio_path, language=language)
    
    return " ".join([segment.text for segment in segments]).strip()


def main():
    parser = argparse.ArgumentParser(description="Speech-to-Text for OpenCode")
    parser.add_argument(
        "--backend",
        choices=["moonshine", "whisper", "faster-whisper", "auto"],
        default="auto",
        help="STT backend to use (default: auto-detect)"
    )
    parser.add_argument(
        "--model",
        default="tiny",
        help="Model size: tiny, base, small, medium, large (default: tiny)"
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=30.0,
        help="Maximum recording duration in seconds (default: 30)"
    )
    parser.add_argument(
        "--language",
        default="en",
        help="Language code for transcription (default: en)"
    )
    parser.add_argument(
        "--audio-file",
        help="Path to audio file (skips recording if provided)"
    )
    parser.add_argument(
        "--list-backends",
        action="store_true",
        help="List available backends and exit"
    )
    
    args = parser.parse_args()
    
    # List backends if requested
    if args.list_backends:
        backends = get_available_backend()
        print(json.dumps({"available_backends": backends}))
        return
    
    # Auto-detect backend
    available = get_available_backend()
    
    if not available:
        print(json.dumps({
            "success": False,
            "error": "No STT backend available. Install moonshine-onnx, whisper, or faster-whisper.",
            "available_backends": []
        }))
        sys.exit(1)
    
    backend = args.backend
    if backend == "auto":
        # Prefer moonshine, then faster-whisper, then whisper
        if "moonshine" in available:
            backend = "moonshine"
        elif "faster-whisper" in available:
            backend = "faster-whisper"
        else:
            backend = "whisper"
    
    if backend not in available:
        print(json.dumps({
            "success": False,
            "error": f"Backend '{backend}' not available. Available: {available}",
            "available_backends": available
        }))
        sys.exit(1)
    
    try:
        # Get audio file
        if args.audio_file:
            audio_path = args.audio_file
            temp_file = False
        else:
            audio_path = record_audio(args.duration)
            temp_file = True
        
        # Transcribe
        if backend == "moonshine":
            text = transcribe_moonshine(audio_path, args.model)
        elif backend == "faster-whisper":
            text = transcribe_faster_whisper(audio_path, args.model, args.language)
        else:
            text = transcribe_whisper(audio_path, args.model, args.language)
        
        # Cleanup temp file
        if temp_file:
            os.unlink(audio_path)
        
        print(json.dumps({
            "success": True,
            "text": text,
            "backend": backend,
            "model": args.model
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "backend": backend
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
