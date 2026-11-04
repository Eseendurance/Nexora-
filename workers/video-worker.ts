import { Worker } from "bullmq";
import { db } from "../lib/db";
import { renderVideo } from "../lib/video";

new Worker(
  "nexora-video",
  async (job) => {
    const { jobId, slides, audioUrl, brandColor } = job.data;

    await db.job.update({
      where: { id: jobId },
      data: { status: "RUNNING", progress: 10 },
    });

    const output = await renderVideo({
      slides,
      audioUrl,
      brandColor,
      onProgress: async (progress) => {
        await db.job.update({ where: { id: jobId }, data: { progress } });
      },
    });

    await db.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        output: JSON.stringify(output),
      },
    });

    return output;
  },
  {
    connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    concurrency: 2,
  }
);
