import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const exec = promisify(execFile);

export async function generateNarration({
  text,
  fileName,
}: {
  text: string;
  fileName: string;
}) {
  const outputDir = process.env.MEDIA_OUTPUT_DIR ?? "./public/generated";
  await fs.mkdir(outputDir, { recursive: true });

  const wavPath = path.join(outputDir, `${fileName}.wav`);
  const mp3Path = path.join(outputDir, `${fileName}.mp3`);
  const voice = process.env.PIPER_VOICE_PATH ?? "./voices/en_US-amy-medium.onnx";

  await exec("piper", ["--model", voice, "--output_file", wavPath], {
    input: text,
  });

  await exec("ffmpeg", [
    "-y", "-i", wavPath, "-codec:a", "libmp3lame", mp3Path,
  ]);

  await fs.unlink(wavPath);

  return {
    audioUrl: `/generated/${fileName}.mp3`,
    estimatedSeconds: Math.ceil(text.split(/\s+/).length / 2.6),
  };
}
