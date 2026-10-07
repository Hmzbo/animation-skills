---
name: wgpu-shaders
description: Native GPU shader-art motion graphics with Rust wgpu (fullscreen WGSL shader with time uniform, frames captured to disk, encoded via ffmpeg). Use for maximum-performance procedural 2D/3D visuals. STUB - content lands in Phase 2.
license: MIT/Apache-2.0
compatibility: Requires cargo and a GPU (Vulkan/DX12/Metal) plus ffmpeg on PATH. Raw wgpu is NOT taught directly; the skill provides an opinionated scaffold. See LICENSE.note for upstream license.
metadata:
  author: animation-skills
  version: "0.1.0"
  status: stub
---

# wgpu-shaders (stub)

Planned skill: opinionated cargo scaffold (fullscreen triangle + `time` uniform + frame dump), AI edits WGSL only, `cargo run -- --frames N`, encode with `shared/ffmpeg`.

Phase 2 will add the scaffold, the WGSL pattern catalog, and the render workflow. nannou/Bevy stay out of v1.
