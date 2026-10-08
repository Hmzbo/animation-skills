import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from "remotion";

// Spring pop-in badge, delayed by `delaySeconds`. The callout/CTA pattern.
export const SpringBadge: React.FC<{label: string; delaySeconds?: number}> = ({
  label,
  delaySeconds = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({
    frame: frame - Math.round(delaySeconds * fps),
    fps,
    config: {mass: 0.6, stiffness: 180, damping: 14},
  });

  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center"}}>
      <div
        style={{
          padding: "10px 28px",
          borderRadius: 999,
          background: "#14b8a6",
          color: "#04211d",
          fontFamily: "Arial, sans-serif",
          fontSize: 30,
          fontWeight: 700,
          transform: `scale(${scale})`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
