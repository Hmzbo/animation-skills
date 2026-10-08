import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Cue = {text: string; fromSeconds: number; durationSeconds: number};

// Script array -> synced caption blocks. Times in seconds, converted by fps.
export const CaptionedSequence: React.FC<{cues: Cue[]}> = ({cues}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#0b0e14"}}>
      {cues.map(cue => (
        <Sequence
          key={cue.text}
          from={Math.round(cue.fromSeconds * fps)}
          durationInFrames={Math.round(cue.durationSeconds * fps)}
        >
          <Caption text={cue.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{justifyContent: "flex-end", alignItems: "center", paddingBottom: 120}}
    >
      <p
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: 44,
          fontWeight: 700,
          color: "#ffffff",
          opacity,
          margin: 0,
        }}
      >
        {text}
      </p>
    </AbsoluteFill>
  );
};
