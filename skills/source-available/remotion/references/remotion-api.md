# Remotion API catalog (v4.0.534, verified by rendered output)

Pinned: `remotion@4.0.534`, `create-video@4.0.534`, React 19. Scaffold:
`npx -y create-video@<v> --yes --blank <dir>` (directory is a POSITIONAL arg —
there is no `--path`; passing one silently breaks the scaffold),
`npm install`. Scripts: `dev` (studio), `build` (bundle), `lint` (`eslint src && tsc`).

## Frame model (the law)

```tsx
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

const frame = useCurrentFrame();          // integer, 0-based
const {fps, durationInFrames} = useVideoConfig();
```

- `interpolate(frame, [0, fps], [0, 1], {easing, extrapolateLeft: "clamp", extrapolateRight: "clamp"})`.
  Always clamp both sides unless overshoot is intentional.
- `spring({frame: frame - delay, fps, config: {mass, stiffness, damping}})` —
  delay springs by subtracting frames; negative inputs return pre-rest values, fine.
- Canonical ease: `Easing.bezier(0.16, 1, 0.3, 1)`.

## Composition

```tsx
<Composition id="Launch" component={Launch} durationInFrames={900}
  fps={30} width={1920} height={1080} calculateMetadata={...} />
```

Registered in `Root.tsx`, rendered by id. `calculateMetadata` computes
duration/props dynamically (verified present in template; use for data-driven lengths).

## Sequencing

```tsx
import {Sequence} from "remotion";
<Sequence from={2 * fps} durationInFrames={3 * fps}><Callout /></Sequence>
```

`from`/`durationInFrames` are absolute frame numbers. Nest freely. For
captions: map a script array to `<Sequence>` blocks (see examples).

## Layout / assets

- `<AbsoluteFill style={{justifyContent, alignItems}}>` centers content; style with inline CSS only.
- `staticFile("voiceover.mp3")` + `<Audio src={...}>` for narration; `useVideoConfig` math for caption sync.
- Props: pass via CLI `--props` as a FILE on Windows (shells strip inline quotes).

## Render CLI (verified)

```bash
npx remotion render MyComp out.mp4 --overwrite            # full, direct MP4
npx remotion render MyComp draft.mp4 --frames=0-89 --codec=h264 --crf 23
npx remotion still MyComp still_30.png --frame=30          # frame review
```

`--frames` accepts lists/ranges (`0,30-59,90-`), ranges inclusive; with
`--sequence` it emits images instead. `--codec h264|h265|av1|vp8|vp9|png|prores`,
`--crf` quality, `--scale` upscales vectors cleanly. Browser auto-provisions on
first render; `--browser-executable` overrides. `--overwrite` is default-on.
