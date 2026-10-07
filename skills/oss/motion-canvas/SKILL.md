---
name: motion-canvas
description: Plan, code, and render polished explanatory videos with Motion Canvas v3 (TypeScript generators rendered to MP4). Acts as a creative director to storyboard the video, then writes idiomatic scene TSX, typechecks, draft-renders a frame range headlessly, and delivers a 1080p MP4 path. Use for math explainers, animated charts, product walkthroughs, and data-driven stories when you want an MIT-licensed video-as-code pipeline (the OSS alternative to Remotion).
license: MIT
compatibility: Requires node 16+ and npm on PATH; Playwright + Chromium for headless renders (one-time setup in Phase 0); ffmpeg for MP4 encoding (or the bundled @motion-canvas/ffmpeg binary). See LICENSE.note for upstream license.
metadata:
  author: animation-skills
  version: "1.0.0"
---

# Motion Canvas

Produce clean, code-driven explanatory videos with Motion Canvas.
Act as a creative director and visual-storytelling expert first, and as a
Motion Canvas engineer second. Complexity must scale with the topic: a title
card needs one scene; a data story deserves multiple scenes with staggered
charts and recurring motifs.

All video projects are plain npm projects. Never edit anything inside a
project's `output/` by hand — regenerate via renders.

## Workflow at a glance

```
Phase 0 PREFLIGHT -> Phase 1 PLAN -> Phase 2 CODE -> Phase 3 DRAFT (range)
    -> Phase 4 FINAL (full) -> Phase 5 DELIVER
                                   ^
        revisions: edit -> build -> DRAFT again -> user approves -> FINAL
```

## Project layout contract

Every video lives in its own Motion Canvas project under the current working directory:

```
<cwd>/videos/<topic-slug>/
├── plan.md          # storyboard from Phase 1
├── package.json     # scaffolded (scripts: serve, build)
├── vite.config.ts   # scaffolded (motionCanvas() + ffmpeg() plugins)
├── src/
│   ├── project.ts   # makeProject({scenes}) — scenes imported with ?scene
│   └── scenes/*.tsx # one makeScene2D per file, from Phase 2
├── output/          # render frames — never hand-edited, gitignored
└── final.mp4        # delivered video (Phase 4)
```

`<topic-slug>` is short kebab-case (e.g. `npm-downloads-story`). Reuse the same
folder for every revision. `output/` and `final.mp4` stay out of git.

## Phase 0: Preflight

Run the bundled checker (stdlib only, no deps):

```bash
node <skill-dir>/scripts/preflight.mjs
```

It verifies node >= 16, npm, and ffmpeg availability. Then ensure the
headless-render toolchain exists **once per video project**
(Playwright library; the Chromium binary downloads once per machine and is shared):

```bash
npm i -D playwright --prefix <cwd>/videos/<slug>
npx playwright install chromium
```

`preflight.mjs` reports these too. If Chromium cannot be installed (no network,
no disk), set strategy now: the agent can still write + typecheck scenes, but
renders become user-assisted (user presses RENDER in the editor) — say so in
the final summary.

## Phase 1: Plan (no code yet)

Read [references/motion-canvas-api.md](references/motion-canvas-api.md) and classify
the topic into exactly one tier:

| Tier | Criteria | Approval gate |
|---|---|---|
| S Simple | 1 scene, one idea, no charts | Auto-proceed |
| M Moderate | 2-4 scenes, charts, multi-beat story | Auto-proceed |
| L Large | 5+ scenes, audio, multi-act story | Present plan, WAIT for explicit user approval |

For S/M: show the plan inline, then continue. For L: stop until approved.

Write the storyboard to `<cwd>/videos/<slug>/plan.md`: title, one-sentence
narrative arc, scene list (purpose, visual beats in order, primitives named
concretely — e.g. `sequence`, `Txt.opacity`, `Rect.width` with `easeOutCubic`),
palette, and recurring motifs. Content fidelity rules (violations are failed
plans): the on-screen title mirrors the user's topic; state the point before
visualizing it; methods shown step by step, never just the result.

## Phase 2: Code

Scaffold non-interactively (the `npm init` form eats flags — always use `npx`):

```bash
npx -y @motion-canvas/create@latest --name <slug> --path <cwd>/videos/<slug> --language ts --plugins ffmpeg
npm install --prefix <cwd>/videos/<slug>
```

Then write `src/scenes/*.tsx` and register each in `src/project.ts`:

```ts
import titleCard from './scenes/title-card?scene';  // ?scene suffix is mandatory
export default makeProject({scenes: [titleCard]});
```

Before writing nontrivial scenes, consult:

- [references/motion-canvas-api.md](references/motion-canvas-api.md) — capability catalog
- [references/troubleshooting.md](references/troubleshooting.md) — pitfalls that waste render cycles
- [examples/](examples/) — `title-card.tsx` (title discipline), `bar-chart.tsx` (staggered chart pattern). Copy their patterns.

Coding standards:

- v3 barrel imports only: `@motion-canvas/2d`, `@motion-canvas/core`. No deep `/lib/` paths.
- Every animation is yielded (`yield*`). Unyielded tweens never play; duration-less sets (`node().x(300)`) are instant jumps — always pass seconds in finals.
- End every scene with a clear-out (`opacity(0)` on stage mobjects) or a `waitFor` hold so the next scene starts clean.
- Design at final resolution from the start: bumping `resolution` later does NOT rescale elements (change `scale` instead).

Gate before rendering (catches type errors cheaply):

```bash
npm run build --prefix <cwd>/videos/<slug>
```

`build` = `tsc && vite build`. Fix all issues before continuing.

## Phase 3: Draft render (mandatory, never skip)

Render a frame range headlessly from anywhere (the driver starts/stops the editor itself):

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos/<slug> --range 0-2
```

- `--range 0-2` renders the first 2 seconds only (range is seconds in
  `src/project.meta`; the driver restores the original afterwards, so drafts
  never leak into finals). Catches ~all runtime errors in seconds.
- Omit `--range` for the full scene span.
- Frames land in `<slug>/output/project/` as zero-padded 6-digit PNGs.

Success criteria: exit 0, PNG count grows then stabilizes, `render complete: N frames`.
On failure: read output, cross-check troubleshooting.md, fix, re-render. Loop until clean.

**Visual frame review (mandatory, never skip):** open any 3 PNGs from `output/`
(start/middle/end) and check: text cut off at edges, text overlapping shapes,
stale leftovers from earlier beats, unreadable contrast.
Fix every finding, re-render the range, re-review. The driver wipes `output/`
on each run — never hand-delete frames to "fix" a render.

## Phase 4: Final render

Full headless render, then encode with the shared recipe:

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos/<slug>
ffmpeg -y -framerate 60 -i <slug>/output/project/%06d.png -c:v libx264 -pix_fmt yuv420p -crf 18 <slug>/final.mp4
```

- Frames land in `output/project/` as zero-padded 6-digit PNGs (verified). If `group by scene`
  is ever enabled, frames split into per-scene subfolders — list `output/` first and match the actual pattern.
- Only deviate from 1080p60 on explicit user request.
- Prefer the shared recipe in `shared/ffmpeg/README.md` over inventing flags.

## Phase 5: Deliver

Report back with this structure:

```
**Video ready**

Topic: <topic>
Plan recap:
- Scene 1: <one line>
- Scene 2: <one line>
...

File: <absolute path to final.mp4> (1080p60, ~M:SS estimated)
Source: <absolute path to videos/<slug>/src/scenes/*.tsx>

Want any changes? Revisions re-render fast at range quality; I will do the final
full render once you are satisfied.
```

Use absolute paths. If renders were user-assisted (no Chromium), say so here.

## Revision policy

1. Edit `src/scenes/*.tsx`. 2. `npm run build`. 3. Re-render ONLY the affected range for speed. 4. Iterate at range quality until satisfied. 5. Full render + redeliver `final.mp4`. Never ship a revision without a passing build + draft pass.

## Hard rules

- node 16+ / npm only for video projects; TypeScript only.
- Always preflight before planning; always plan before coding.
- Always `npm run build` before any render; always draft-render (`--range`) + frame review before any final render.
- Never hand-edit `output/`; regenerate via the driver.
- One video project per topic under `<cwd>/videos/<slug>/`.
- If any phase fails repeatedly (2+ fix attempts), report the blocker honestly instead of shipping a broken video.
