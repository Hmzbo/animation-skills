---
name: threejs
description: Plan, code, and render GPU 3D motion graphics with Three.js (deterministic time-driven scenes captured headlessly to MP4). Acts as a creative director to storyboard the video, then writes a pure-function-of-time scene module, draft-renders frames, and delivers an MP4 path. Use for product spins, studio object showcases, particle fields, procedural landscapes, and cinematic 3D intros when you want maximum beauty per line of MIT-licensed code.
license: MIT
compatibility: Requires node 16+ and npm on PATH; per video project `three` + `playwright` with Chromium for headless stepping; ffmpeg for MP4 encoding. WebGL only in v1 (no WebGPU renderer). See LICENSE.note for upstream license.
metadata:
  author: animation-skills
  version: "1.0.0"
---

# Three.js

Produce beautiful GPU motion graphics with Three.js.
Act as a creative director and visual-storytelling expert first, and as a
Three.js engineer second. One hero object, lit well and moved slowly, beats
ten objects moving fast: restraint reads as premium.

All rendering is deterministic: scenes expose time explicitly, so the same
second always renders the same pixels (verified byte-identical across runs).
Never use wall-clock animation in scenes — see Hard rules.

## Workflow at a glance

```
Phase 0 PREFLIGHT -> Phase 1 PLAN -> Phase 2 CODE -> Phase 3 DRAFT (60 frames)
    -> Phase 4 FINAL (full) -> Phase 5 DELIVER
                                   ^
        revisions: edit -> check -> DRAFT again -> user approves -> FINAL
```

## Project layout contract

Every video is a hand-laid npm project under the current working directory:

```
<cwd>/videos3d/<topic-slug>/
├── plan.md       # storyboard from Phase 1
├── package.json  # {three, playwright}
├── index.html    # import map (three, three/addons/) + <script src="/scene.mjs">
├── scene.mjs     # the whole animation (single-scene default)
├── scenes/       # extra scenes only for multi-act videos (optional)
├── frames/       # stepped PNGs — never hand-edited, gitignored
└── final.mp4     # delivered video (Phase 4)
```

`<topic-slug>` is short kebab-case. Reuse the same folder for revisions.
`frames/` and `final.mp4` stay out of git.

## The deterministic scene contract (non-negotiable)

```js
window.__renderAt = t => {   // t in seconds — EVERY animated value derives from t
  knot.rotation.y = t * 0.9;
  renderer.render(scene, camera);
};
window.__meta = {fps: 60, duration: 4, width: 1280, height: 720};
window.__renderAt(0);
```

The driver steps `t = i/fps` and screenshots the canvas per frame. Same `t`
=> same pixels, across machines and runs.

## Phase 0: Preflight

```bash
node <skill-dir>/scripts/preflight.mjs
```

Then per video project (library once per project, Chromium binary once per machine):

```bash
npm i three playwright --prefix <cwd>/videos3d/<slug>
npx playwright install chromium
```

If Chromium cannot be installed, set strategy now: the agent can still write +
syntax-check scenes, but stepping becomes user-assisted — say so in delivery.

## Phase 1: Plan (no code yet)

Read [references/three-api.md](references/three-api.md) and classify into one tier:

| Tier | Criteria | Approval gate |
|---|---|---|
| S Simple | One hero object, fixed camera, <= 4s | Auto-proceed |
| M Moderate | Multi-object / particles, camera dolly, 4-8s | Auto-proceed |
| L Large | Multi-act, scene changes, post passes, 8s+ | Present plan, WAIT for approval |

Write `<cwd>/videos3d/<slug>/plan.md`: title, one-sentence arc, beat list with
concrete techniques (`TorusKnotGeometry`, `smoothstep` dolly, `InstancedMesh`
swarm), palette + lighting rig (ambient/key/rim colors), camera path.

## Phase 2: Code

Lay out the project by hand (no scaffolder exists for this skill):

- `package.json`: `{three, playwright}` (pin the three version you smoke-tested).
- `index.html`: copy [examples/index.html](examples/index.html) (import map for
  `three` and `three/addons/`).
- `scene.mjs`: implement the `__renderAt`/`__meta` contract.

Before writing nontrivial scenes, consult:

- [references/three-api.md](references/three-api.md) — blocks, materials, lights, addons
- [references/troubleshooting.md](references/troubleshooting.md) — determinism traps, headless pitfalls
- [examples/](examples/) — `product-spin.mjs` (verified byte-identical), `wave-grid.mjs` (vertex pattern). Copy their patterns.

Coding standards:

- Every animated value is a pure function of `t`. No `requestAnimationFrame`, `Clock`, `Date.now()`, unseeded `Math.random()`.
- Async assets (textures, GLTF) must resolve before the first `__renderAt(0)` (gate behind `window.__ready` the driver awaits — driver waits for `__renderAt` to exist; keep loads synchronous where possible).
- Camera: interpolate position + `lookAt` on `t`. Never OrbitControls in scenes.
- Design at final `__meta` size: screenshots capture CSS pixels 1:1.

Gate before stepping (instant):

```bash
node --check <cwd>/videos3d/<slug>/scene.mjs
```

## Phase 3: Draft render (mandatory, never skip)

Step 60 frames headlessly (driver serves, steps, screenshots, shuts down):

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos3d/<slug> --frames 60
```

- Default (no `--frames`) steps the full `fps * duration` span.
- Frames land in `<slug>/frames/` as zero-padded 6-digit PNGs.

**Visual frame review (mandatory):** open 3 PNGs (first/middle/last). Check:
object fully in frame, lighting reads on all sides, no clipping through
near/far planes, background intentional (not default black unless planned).
Fix, re-step the draft, re-review.

## Phase 4: Final render

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos3d/<slug>
ffmpeg -y -framerate <fps> -i <slug>/frames/%06d.png -c:v libx264 -pix_fmt yuv420p -crf 18 <slug>/final.mp4
```

Take `<fps>` from the scene's `__meta`. Prefer the shared recipe in
`shared/ffmpeg/README.md` over inventing flags. Post passes (bloom via
EffectComposer) go on for finals only — drafts render plain.

## Phase 5: Deliver

```
**Video ready**

Topic: <topic>
Plan recap:
- Beat 1: <one line>
...

File: <absolute path to final.mp4> (<WxH>@<fps>, ~M:SS estimated)
Source: <absolute path to videos3d/<slug>/scene.mjs>

Want any changes? Revisions re-step fast at 60 frames; full render once satisfied.
```

## Revision policy

1. Edit `scene.mjs`. 2. `node --check`. 3. Draft-step 60 frames. 4. Iterate
until satisfied. 5. Full step + encode + redeliver. Never ship without a draft pass.

## Hard rules

- Time-driven scenes only: no rAF, Clock, Date.now, unseeded random.
- Always preflight before planning; always `node --check` before stepping; always draft-step + frame review before finals.
- Never hand-edit `frames/`; regenerate via the driver.
- One video project per topic under `<cwd>/videos3d/<slug>/`.
- WebGL only in v1. WebGPU/TSL is parked (needs Dawn flags headless).
- If any phase fails repeatedly (2+ fix attempts), report the blocker honestly.
