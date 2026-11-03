import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

type Slide = {
  headline: string;
  subheadline?: string;
  narration: string;
  visualDirection?: string;
  durationSeconds: number;
};

export async function renderVideo({
  slides,
  audioUrl,
  brandColor,
  onProgress,
}: {
  slides: Slide[];
  audioUrl: string;
  brandColor: string;
  onProgress?: (progress: number) => Promise<void> | void;
}) {
  const entry = path.join(process.cwd(), "remotion/index.ts");
  const serveUrl = await bundle({ entryPoint: entry });

  const fps = 30;
  const durationInFrames = Math.ceil(
    slides.reduce((total, slide) => total + slide.durationSeconds, 0) * fps
  );

  const composition = await selectComposition({
    serveUrl,
    id: "NexoraVideo",
    inputProps: { slides, audioUrl, brandColor },
  });

  const output = path.join(
    process.env.MEDIA_OUTPUT_DIR ?? "./public/generated",
    `nexora-${Date.now()}.mp4`
  );

  await renderMedia({
    composition: { ...composition, durationInFrames, fps },
    serveUrl,
    codec: "h264",
    outputLocation: output,
    inputProps: { slides, audioUrl, brandColor },
    onProgress: ({ progress }) => {
      if (onProgress) void onProgress(Math.round(progress * 90) + 10);
    },
  });

  return {
    videoUrl: output.replace("./public", ""),
    format: "mp4",
    durationSeconds: Math.round(durationInFrames / fps),
  };
}
