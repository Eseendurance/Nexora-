import { Queue } from "bullmq";

export const videoQueue = new Queue("nexora-video", {
  connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
});
