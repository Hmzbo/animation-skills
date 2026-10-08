---
name: remotion
description: Plan, code, and render data-driven videos with Remotion 4 (React/TypeScript frame model rendered headlessly to MP4). Acts as a creative director to storyboard the video, then writes interpolate/spring compositions, draft-renders a frame range, reviews stills, and delivers an MP4 path. Use for marketing videos, UI walkthroughs, branded explainers, and captioned narrations when you want full programmatic control. SOURCE-AVAILABLE, not OSI open-source — check commercial terms before use.
license: Remotion License (source-available)
compatibility: Requires node 18+ and npm; Chromium (auto-provisioned by Remotion on first render); ffmpeg on PATH for encoding. Review https://www.remotion.dev/docs/license before commercial use.
metadata:
  author: animation-skills
  version: "1.0.0"
---

# Remotion

Produce data-driven videos with Remotion: React components as video.
Act as a creative director first — Remotion rewards systems thinking (one
caption component reused 20 times beats 20 bespoke scenes). Then act as a
Remotion engineer: everything is a pure function of the current frame.

The frame model is absolute law: components receive `frame` (integer) and must
render deterministically from it. No `useState` counters, no `Date.now()`, no
randomness without seeds. Same frame => same pixels, or renders drift.

## Workflow at a glance

```
Phase 0 PREFLIGHT -> Phase 1 PLAN -> Phase 2 CODE -> Phase 3 DRAFT (range)
    -> Phase 4 FINAL (full) -> Phase 5 DELIVER
                                   ^
        revisions: edit -> DRAFT again -> user approves -> FINAL
```

## Project layout contract

Scaffolded projects live under the current working directory:

```
<cwd>/videos-react/<topic-slug>/
├── plan.md          # storyboard from Phase 1
├── package.json     # create-video template (remotion 4 pinned)
├── remotion.config.ts
├── src/
│   ├── index.ts     # entry (registerRoot)
│   ├── Root.tsx     # <Composition> registry — Phase 2 edits this
│   └── scenes/*.tsx # one component per scene/beat
├── out/             # renders — never hand-edited, gitignored
└── final.mp4        # delivered video (copied from out/, Phase 4)
```

`<topic-slug>` is short kebab-case. Reuse the folder for revisions.

## Phase 0: Preflight

```bash
node <skill-dir>/scripts/preflight.mjs
```

Verifies node 18+, npm, ffmpeg. The Chromium binary is provisioned by Remotion
itself on first render (network needed once) — or point at an existing one
with `--browser-executable`. If no browser can be provisioned, set strategy
now: code + typecheck only, renders user-assisted — say so at delivery.

## Phase 1: Plan (no code yet)

Read [references/remotion-api.md](references/remotion-api.md) and classify into one tier:

| Tier | Criteria | Approval gate |
|---|---|---|
| S Simple | 1 composition, title + 1-2 callouts, <= 5s | Auto-proceed |
| M Moderate | Multi-sequence story, captions, charts, audio, <= 30s | Auto-proceed |
| L Large | Multi-act, voiceover sync, 30s+ | Present plan, WAIT for approval |

Write `<cwd>/videos-react/<slug>/plan.md`: title, arc, composition list (id,
duration, fps, size), per-sequence beats with primitives named concretely
(`interpolate` slide, `spring` pop, `<Sequence from>`), caption script if any,
audio assets. Fidelity rules: title mirrors the topic; state the point before
visualizing; methods step by step.

## Phase 2: Code

Scaffold non-interactively, then install:

```bash
npx -y create-video@<pinned> --yes --blank <cwd>/videos-react/<slug>
npm install --prefix <cwd>/videos-react/<slug>
```

(Pin the create-video version the skill was verified against; record it in the
plan. Never float major versions — the CLI surface moves.)

Write `src/scenes/*.tsx`, register one `<Composition>` per deliverable in
`src/Root.tsx`:

```tsx
<Composition id="Launch" component={Launch} durationInFrames={900}
  fps={30} width={1920} height={1080} />
```

Consult [references/remotion-api.md](references/remotion-api.md),
[references/troubleshooting.md](references/troubleshooting.md), and
[examples/](examples/) (title-slide, spring pop, captioned sequence patterns).

Coding standards:

- Pure functions of `frame` (via `useCurrentFrame()`). Easing via
  `Easing.bezier` or `spring()` — never CSS animations (they run on wall time).
- Sequences compose with `<Sequence from={n} durationInFrames={m}>`; nest, don't overlap implicitly.
- Fonts: system stacks in drafts; bundle webfonts before finals (render machines may lack them).
- Props flow top-down; validate with zod schemas when a composition takes inputs.

Gate before rendering (typecheck, seconds):

```bash
npx tsc --noEmit --prefix <cwd>/videos-react/<slug>
```

## Phase 3: Draft render (mandatory, never skip)

```bash
npx remotion render <CompId> <slug>/out/draft.mp4 --frames=0-89 --codec=h264 --crf 23
```

- `--frames=0-89` renders the first 3s at 30fps (ranges are inclusive).
- Remotion encodes MP4 itself — no separate ffmpeg step.
- Windows shells: pass `--props` as a FILE, never inline JSON (shell strips quotes).

**Visual frame review (mandatory):** stills, not scrubbing:

```bash
npx remotion still <CompId> <slug>/out/still_<frame>.png --frame=<n>
```

Pull start/middle/end stills (plus every entrance beat). Check: text inside
safe area, no overlap, captions legible at target size, brand colors exact.
Fix, re-render the range, re-review.

## Phase 4: Final render

```bash
npx remotion render <CompId> <slug>/out/final.mp4 --codec=h264 --crf 18
cp <slug>/out/final.mp4 <slug>/final.mp4
```

Default deliverable 1080p30; 60fps or 4K only on explicit request (set on the
`<Composition>`, not via flags — `--width/--height/--fps` overrides exist but
composition-source-of-truth wins for reproducibility). Verify with ffprobe.

## Phase 5: Deliver

```
**Video ready**

Topic: <topic>
Plan recap:
- Sequence 1: <one line>
...

File: <absolute path to final.mp4> (<WxH>@<fps>, ~M:SS estimated)
Source: <absolute path to videos-react/<slug>/src/>

License note: Remotion is source-available, not OSI open-source. Confirm
https://www.remotion.dev/docs/license covers your use.

Want any changes? Range re-renders are fast; full render once satisfied.
```

## Revision policy

1. Edit `src/`. 2. `tsc --noEmit`. 3. Range re-render. 4. Iterate. 5. Full
render + redeliver. Never ship without a draft pass.

## Hard rules

- Frame-pure components only: no wall-clock, no unseeded random, no CSS animations.
- Always preflight before planning; always typecheck before rendering; always draft-range + stills review before finals.
- Never hand-edit `out/`; regenerate via the CLI.
- One video project per topic under `<cwd>/videos-react/<slug>/`.
- If any phase fails repeatedly (2+ fix attempts), report the blocker honestly.
