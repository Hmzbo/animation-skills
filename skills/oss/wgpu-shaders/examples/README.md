# Examples — drop-in `scene.wgsl` files (wgpu 30, skill contract)

Copy one into a video project as `scene.wgsl` and render:

```bash
cargo run --release -- --shader scene.wgsl --frames 120 --fps 60
```

(run from the video project dir; the skill's Phase 2/3 documents the full commands)

- `plasma.wgsl` — layered-sine flow + cosine palette + vignette. Render-verified.
  The default "beautiful motion" opener.
- `sdf-shapes.wgsl` — morphing SDF tile grid (circle↔box), per-cell rotation,
  palette cycling. Render-verified. The "geometric motion" pattern.

Both define `fs_main` against the fixed `Params` uniform and `vs_main`
fullscreen triangle from `template/`. Copy their setup lines (aspect correction
first, vignette last) into every new scene.
