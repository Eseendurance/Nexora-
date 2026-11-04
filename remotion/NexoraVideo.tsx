import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Slide = {
  headline: string;
  subheadline?: string;
  durationSeconds: number;
};

export const NexoraVideo: React.FC<{
  slides: Slide[];
  audioUrl: string;
  brandColor: string;
}> = ({ slides, audioUrl, brandColor }) => {
  const { fps } = useVideoConfig();
  let cursor = 0;

  return (
    <AbsoluteFill style={{ background: "#06060d", fontFamily: "Inter, sans-serif" }}>
      {audioUrl && <Audio src={audioUrl} />}

      {slides.map((slide, index) => {
        const from = Math.round(cursor * fps);
        cursor += slide.durationSeconds;

        return (
          <Sequence
            key={index}
            from={from}
            durationInFrames={Math.round(slide.durationSeconds * fps)}
          >
            <Slide slide={slide} brandColor={brandColor} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Slide: React.FC<{ slide: Slide; brandColor: string }> = ({ slide, brandColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = spring({ frame, fps, config: { damping: 18 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #070713, ${brandColor}22)`,
        color: "white",
        justifyContent: "center",
        padding: 110,
      }}
    >
      <div style={{ maxWidth: "70%", transform: `translateY(${(1 - y) * 45}px)`, opacity }}>
        <h1 style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.05 }}>{slide.headline}</h1>
        {slide.subheadline && (
          <p style={{ fontSize: 32, marginTop: 28, color: "rgba(255,255,255,0.75)" }}>
            {slide.subheadline}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
