import { execFile, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const exec = promisify(execFile);

function runPiper(text: string, model: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("piper", ["--model", model, "--output_file", outputPath], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let stderr = "";
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (chunk: string) => { stderr += chunk; });
    process.on("error", reject);
    process.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Piper exited with code ${code}: ${stderr.slice(-1000)}`));
    });
    process.stdin.end(text);
  });
}

export async function generateNarration({
  text,
  fileName,
}: {
  text: string;
  fileName: string;
}) {
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(fileName)) {
    throw new Error("Narration file name is invalid.");
  }

  const resolvedDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(resolvedDir, { recursive: true });

  const wavPath = path.join(resolvedDir, `${fileName}.wav`);
  const mp3Path = path.join(resolvedDir, `${fileName}.mp3`);
  const voice = process.env.PIPER_VOICE_PATH ?? "./voices/en_US-amy-medium.onnx";

  await runPiper(text, voice, wavPath);
  try {
    await exec("ffmpeg", [
      "-y", "-i", wavPath, "-codec:a", "libmp3lame", mp3Path,
    ]);
  } finally {
    await fs.unlink(wavPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  return {
    audioUrl: `/generated/${path.basename(mp3Path)}`,
    estimatedSeconds: Math.ceil(text.split(/\s+/).length / 2.6),
  };
}
