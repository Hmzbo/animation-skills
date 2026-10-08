import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Slide-up + fade title over the first second. Smoke-rendered.
export const TitleSlide: React.FC<{title: string}> = ({title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = Easing.bezier(0.16, 1, 0.3, 1);

  const opacity = interpolate(frame, [0, fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });
  const y = interpolate(frame, [0, fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

  return (
    <AbsoluteFill
      style={{background: "#0b0e14", justifyContent: "center", alignItems: "center"}}
    >
      <h1
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: 84,
          fontWeight: 800,
          color: "#ffffff",
          opacity,
          transform: `translateY(${y}px)`,
          margin: 0,
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};
