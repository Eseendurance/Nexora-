"use client";

import { useEffect, useRef } from "react";

export function LocalAvatar({ audioUrl }: { audioUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const audio = new Audio(audioUrl);
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    let tick = 0;

    function draw() {
      analyser.getByteFrequencyData(data);
      const low = data.slice(0, 12).reduce((a, b) => a + b, 0) / (12 * 255);
      const mid = data.slice(12, 48).reduce((a, b) => a + b, 0) / (36 * 255);

      tick += 1;
      const blink = tick % 180 < 6 ? 1 : 0;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.save();
      ctx!.translate(canvas!.width / 2, canvas!.height / 2 + Math.sin(Date.now() / 900) * mid * 6);

      ctx!.fillStyle = "#121225";
      ctx!.beginPath();
      ctx!.arc(0, -20, 78, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = "#8B7BFF";
      ctx!.beginPath();
      ctx!.arc(-27, -34, 8 + blink * 6, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(27, -34, 8 + blink * 6, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = "#0c0c18";
      ctx!.beginPath();
      ctx!.ellipse(0, 18, 22, 6 + low * 22, 0, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      audio.pause();
      audioCtx.close();
    };
  }, [audioUrl]);

  return (
    <div className="glass p-5">
      <canvas ref={canvasRef} width={320} height={320} className="mx-auto rounded-2xl" />
      <button
        onClick={() => new Audio(audioUrl).play()}
        className="mt-4 w-full rounded-full bg-[var(--accent)] px-5 py-3 font-semibold"
      >
        Play Avatar Presentation
      </button>
    </div>
  );
}
