---
name: wgpu-shaders
description: Plan, code, and render native GPU shader-art motion graphics with Rust wgpu (fullscreen WGSL + time uniform, headless offscreen frames encoded to MP4). Acts as a creative director to storyboard the piece, then writes a WGSL scene against a fixed scaffold, draft-renders seconds of frames, and delivers a 1080p60 MP4 path. Use for maximum-performance procedural visuals — plasma flows, SDF morphs, raymarched scenes — when the GPU should do the work. Raw wgpu is never hand-written; the AI edits WGSL only.
license: MIT/Apache-2.0
compatibility: Requires cargo + rustc (via rustup) and a real GPU (Vulkan/DX12/Metal); ffmpeg for MP4 encoding. No window, no browser, no editor — renders are headless by construction. See LICENSE.note for upstream licenses.
metadata:
  author: animation-skills
  version: "1.0.0"
---

# wgpu-shaders

Produce native-GPU procedural motion graphics with wgpu.
Act as a creative director first: shader-art rewards a tight concept (one flow
field, one morph family) over feature soup. Then act as a WGSL engineer:
every scene is a pure function of `(uv, time)` — same second, same pixels.

You never write wgpu boilerplate. Each video project is a copy of the skill's
scaffold (fixed Rust renderer); the AI edits **only** the `.wgsl` scene file
plus render parameters. If the scaffold can't express an idea, say so instead
of forking the renderer.

## Workflow at a glance

```
Phase 0 PREFLIGHT -> Phase 1 PLAN -> Phase 2 CODE -> Phase 3 DRAFT (2s)
    -> Phase 4 FINAL (full) -> Phase 5 DELIVER
                                   ^
        revisions: edit WGSL -> DRAFT again -> user approves -> FINAL
```

## Project layout contract

```
<cwd>/videos-gpu/<topic-slug>/
├── plan.md        # storyboard from Phase 1
├── Cargo.toml     # copied from skill template/ (pinned deps)
├── src/main.rs    # copied from skill template/ (DO NOT EDIT except via skill updates)
├── scene.wgsl     # THE animation — the only file Phase 2 writes
├── frames/        # rendered PNGs — never hand-edited, gitignored
└── final.mp4      # delivered video (Phase 4)
```

Copy `template/` (not `examples/`) for new videos. `examples/*.wgsl` are
drop-in `scene.wgsl` candidates. Reuse the folder per topic for revisions.

## The scene contract (non-negotiable)

```wgsl
struct Params { time: f32, width: f32, height: f32 };
@group(0) @binding(0) var<uniform> u: Params;

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut { /* fixed: fullscreen triangle */ }

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  // every pixel a pure function of (in.uv, u.time). No other inputs exist.
}
```

The scaffold owns `vs_main`, the uniform layout, and the readback path. Scene
files MUST define `fs_main` with this exact `Params` struct. WGSL validation
(naga) runs at render start — shader errors fail fast with line numbers.

## Phase 0: Preflight

```bash
python <skill-dir>/scripts/preflight.py
```

Verifies cargo, rustc, ffmpeg. The GPU adapter itself is probed at render time
(the renderer prints `adapter: <name> (<backend>)` on every run — confirm it
names real hardware, not a fallback, before finals).

First build compiles the world (minutes, once per machine — dependencies are
cached afterwards). Start it early if you can:

```bash
cargo build --release --manifest-path <cwd>/videos-gpu/<slug>/Cargo.toml
```

## Phase 1: Plan (no code yet)

Read [references/wgpu-api.md](references/wgpu-api.md) and classify into one tier:

| Tier | Criteria | Approval gate |
|---|---|---|
| S Simple | One flow field or gradient, fixed palette, <= 5s | Auto-proceed |
| M Moderate | SDF morphs / domain warping, palette motion, 5-10s | Auto-proceed |
| L Large | Raymarching, multi-pass illusion in one pass, 10s+ | Present plan, WAIT for approval |

Write `<cwd>/videos-gpu/<slug>/plan.md`: title, one-sentence arc, the visual
mechanism named concretely (e.g. `sin plasma + cosine palette + vignette`),
palette motion over time, and the loop point if the piece should loop
(prefer durations where `sin/cos` terms complete whole cycles).

## Phase 2: Code

Copy the scaffold, then write ONLY `scene.wgsl`:

```bash
cp -r <skill-dir>/template <cwd>/videos-gpu/<slug>
# write <cwd>/videos-gpu/<slug>/scene.wgsl
```

Before writing nontrivial shaders, consult:

- [references/wgpu-api.md](references/wgpu-api.md) — pattern catalog (plasma, SDF, palettes, vignette, loops)
- [references/troubleshooting.md](references/troubleshooting.md) — naga errors, adapter failures, perf traps
- [examples/](examples/) — `plasma.wgsl` (verified render), `sdf-shapes.wgsl`. Copy their patterns.

Coding standards:

- `fs_main` stays a pure function of `(uv, u.time)`. No frame counters, no RNG without a hash of deterministic inputs.
- Aspect-correct FIRST LINE: `uv.x *= u.width / u.height` (or circles become ellipses — the #1 shader-art bug).
- Keep per-pixel cost flat: 2-4 sine octaves, one SDF eval, no nested loops in drafts. SwiftShader-class fallback GPUs punish loops 10x.
- Design loops on whole cycles: scale time so dominant sines complete integer periods over the duration.

Gate before rendering (seconds — naga validates the shader during startup):

```bash
cargo run --release --manifest-path <cwd>/videos-gpu/<slug>/Cargo.toml -- --shader scene.wgsl --frames 5
```

Five frames either validate + render or print the naga error. Fix all issues first.

## Phase 3: Draft render (mandatory, never skip)

```bash
cargo run --release --manifest-path <cwd>/videos-gpu/<slug>/Cargo.toml -- --shader scene.wgsl --frames 120 --fps 60
```

- 120 frames = 2 seconds at 60fps. Catches motion bugs (too fast/slow, palette mud, morph pops).
- Frames land in `<slug>/frames/` as zero-padded 6-digit PNGs.

**Visual frame review (mandatory):** open 3 PNGs (first/middle/last). Check:
motion reads at the right speed, palette stays out of muddy gray, morph edges
stay crisp (no `smoothstep` shimmer), vignette doesn't crush the subject.
Fix, re-render the draft, re-review.

## Phase 4: Final render

```bash
cargo run --release --manifest-path <cwd>/videos-gpu/<slug>/Cargo.toml -- --shader scene.wgsl --frames <fps*duration>
ffmpeg -y -framerate 60 -i <slug>/frames/%06d.png -c:v libx264 -pix_fmt yuv420p -crf 18 <slug>/final.mp4
```

Prefer the shared recipe in `shared/ffmpeg/README.md`. Only deviate from
1080p60 on explicit request (`--width/--height/--fps` flags).

## Phase 5: Deliver

```
**Video ready**

Topic: <topic>
Plan recap:
- Mechanism: <one line>
- Palette story: <one line>

File: <absolute path to final.mp4> (1080p60, ~M:SS estimated)
Source: <absolute path to videos-gpu/<slug>/scene.wgsl> (+ adapter/backend used)

Want any changes? WGSL edits re-render fast at draft length; full render once satisfied.
```

Report the adapter/backend line from the render log. If it names a software
fallback (lavapipe/SwiftShader/llvmpipe), say so — timing claims don't transfer.

## Revision policy

1. Edit `scene.wgsl`. 2. 5-frame validation gate. 3. 2s draft. 4. Iterate.
5. Full render + encode + redeliver. Never touch `src/main.rs` to fix a visual.

## Hard rules

- WGSL scenes only. The scaffold is fixed; fork it never.
- Always preflight before planning; always 5-frame gate before drafts; always draft + frame review before finals.
- Pure `(uv, time)` functions. Aspect-correct first. Loop-safe durations.
- One video project per topic under `<cwd>/videos-gpu/<slug>/`.
- If any phase fails repeatedly (2+ fix attempts), report the blocker honestly.
