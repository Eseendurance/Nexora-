import { registerRoot, Composition } from "remotion";
import { NexoraVideo } from "./NexoraVideo";

registerRoot(() => (
  <Composition
    id="NexoraVideo"
    component={NexoraVideo}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ slides: [], audioUrl: "", brandColor: "#6D5EF8" }}
  />
));
