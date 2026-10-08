# wgpu-shaders troubleshooting (v1 — extended by build/run verification)

## Toolchain

- No `cargo`: install via https://rustup.rs (stable, minimal profile is enough).
  The skill never uses system package managers for Rust itself.
- First `cargo build --release` compiles wgpu + deps from scratch (minutes,
  once per machine). Start it in Phase 0 background while planning. Later
  builds are incremental (seconds).
- Deps are exact-pinned (`=30.0.1` etc.) in the template. Never float wgpu —
  its API breaks across minors and naga validation messages move.

## Shader (naga validation)

- The 5-frame gate exists because WGSL errors fail at pipeline creation with
  file:line diagnostics — read them literally, they point at the offending
  expression. Common: type mismatches (`f32` vs `u32` in array index — cast
  with `u32(...)`), missing semicolons, `@location` mismatches between
  `VsOut` and `fs_main` input.
- Black output + clean validation = logic bug, not API bug: check aspect
  correction first, then palette range (values >1.0 clip to white, <0.0 to
  black — a `cos` palette without `0.5+0.5*` clips half the signal).

## Adapter / hardware

- The renderer prints `adapter: <name> (<backend>)` every run. Confirm real
  hardware (DirectX/Metal/Vulkan) before finals. Software fallbacks
  (lavapipe, llvmpipe, SwiftShader) render correctly but 10-50x slower —
  halve draft resolution on them (`--width 960 --height 540`).
- `no usable GPU adapter`: no GPU / no driver / headless CI without swiftshader.
  Fix the environment, not the code. There is no CPU path in this skill.

## Frames / encode

- Frames are `frames/%06d.png` (RGBA8). Encode with the shared recipe; take
  `--fps` from the render invocation so audio-length math stays exact.
- Stale frames from a previous render linger if a new run fails partway —
  the renderer does NOT wipe `frames/` (unlike the motion-canvas driver).
  Delete or re-render fully before encoding finals.
- All-black output with clean naga validation is a pipeline bug, not a shader
  bug: first suspect `queue.submit` actually submitting `encoder.finish()`
  (an empty submit renders the clear color forever, with zero diagnostics
  unless an error scope is active). The template keeps a validation error
  scope around every run for exactly this reason — read its output first.
- Reversed `smoothstep(high, low, x)` is **undefined behavior** in WGSL and
  evaluates to 0 on some drivers (observed: vignette nuked the whole frame
  to black on Vulkan/RTX). Always write `1.0 - smoothstep(low, high, x)`.
