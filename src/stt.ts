import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { SpeechToTextConfig, SttResult } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Get the path to the bundled stt.py script.
 */
function getScriptPath(): string {
  // In bundled mode, script is in scripts/ relative to package root
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // Go up from dist/ to package root, then into scripts/
  return join(currentDir, "..", "scripts", "stt.py");
}

/**
 * Execute speech-to-text transcription.
 * 
 * @param config - Configuration options
 * @returns Promise resolving to transcription result
 */
export async function transcribe(config: SpeechToTextConfig = {}): Promise<SttResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const scriptPath = mergedConfig.scriptPath || getScriptPath();

  const args = [
    scriptPath,
    "--backend", mergedConfig.backend,
    "--model", mergedConfig.model,
    "--language", mergedConfig.language,
    "--duration", mergedConfig.maxDuration.toString(),
  ];

  return new Promise((resolve, reject) => {
    const process = spawn(mergedConfig.pythonPath, args, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0 && !stdout) {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
        });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch {
        resolve({
          success: false,
          error: `Failed to parse output: ${stdout}`,
        });
      }
    });

    process.on("error", (err) => {
      resolve({
        success: false,
        error: `Failed to start STT process: ${err.message}`,
      });
    });
  });
}

/**
 * Check which STT backends are available.
 */
export async function listBackends(pythonPath: string = "python3"): Promise<string[]> {
  const scriptPath = getScriptPath();
  
  return new Promise((resolve) => {
    const process = spawn(pythonPath, [scriptPath, "--list-backends"], {
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.on("close", () => {
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result.available_backends || []);
      } catch {
        resolve([]);
      }
    });

    process.on("error", () => {
      resolve([]);
    });
  });
}

export * from "./types";
