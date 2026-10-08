# WGSL pattern catalog (verified by rendered output)

All patterns assume the skill contract: `Params{time,width,height}` uniform at
`@group(0)@binding(0)`, `vs_main` fullscreen triangle, `fs_main(in: VsOut)`.

## Setup lines (every scene starts here)

```wgsl
let aspect = u.width / u.height;
var p = vec2f(in.uv.x * aspect, in.uv.y);  // aspect-corrected space. FIRST.
```

Skip this and circles render as ellipses on 16:9. Non-negotiable.

## Plasma flow (examples/plasma.wgsl — rendered)

Layered sines at incommensurate frequencies + time drift:

```wgsl
var v = sin(p.x * 3.0 + t * 2.0) + sin(p.y * 4.0 - t * 1.6);
v += sin((p.x + p.y) * 2.5 + t * 1.2) * 0.7;
v += sin(length(p - center) * 6.0 - t * 2.4) * 0.5;
```

Rule of thumb: 3-4 layers, amplitudes descending (1.0 / 0.7 / 0.5). More layers
= mud. Draft with 2, add the 3rd for finals.

## Cosine palette (all examples)

```wgsl
// teal -> blue -> magenta; shift phase with time for palette motion
var col = 0.5 + 0.5 * cos(6.2831 * (v * vec3f(0.9, 0.7, 1.0) + vec3f(0.55, 0.45, 0.6)));
```

Keep saturation high: gray palettes read as rendering bugs. Animate the phase
term (`+ u.time * speed`), never the frequency vector.

## SDF primitives (examples/sdf-shapes.wgsl — rendered)

```wgsl
fn sd_circle(p: vec2f, r: f32) -> f32 { return length(p) - r; }
fn sd_box(p: vec2f, b: vec2f) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}
// morph: mix(sd_circle(p, r), sd_box(p, b), smoothstep-loop k)
// shade: edge = smoothstep(0.012, 0.0, abs(d)); glow = smoothstep(0.25, 0.0, abs(d));
```

Edge widths are in uv units: `0.012` is crisp at 1080p, `0.25` a soft glow.
Thinner than `0.005` aliases and shimmers in motion.

## Domain transforms

- Tile: `cell = floor(g); p = fract(g) - 0.5;` then per-cell rotation/phase from `cell`.
- Rotate: `mat2x2f(c, -s, s, c) * p` with `a = time*speed + cellHash`.
- All rotation/phase MUST derive from `(cell, time)` — never from frame count.

## Vignette (every scene ends here)

```wgsl
// edge0 MUST be < edge1 (reversed smoothstep is undefined behavior —
// observed nuking frames to black on Vulkan). Write the 1.0-minus form:
col *= 1.0 - smoothstep(0.25, 0.85, distance(in.uv, vec2f(0.5)));
```

Hides edge falloff and focuses the eye. Tune `0.85` tighter (`0.7`) for dark pieces.

## Looping

Multiply every time coefficient so dominant terms complete integer periods over
the duration: e.g. duration 6s, `sin(u.time * 1.0472)` (2π/6) loops exactly.
Check the seam by diffing first/last frames, not by eye.

## Cost discipline (draft vs final)

Per-pixel cost is flat per frame: keep drafts to ≤4 sine layers OR one SDF +
glow. Raymarching (sphere tracing loops) is L-tier only and drafts at half
resolution (`--width 960 --height 540`), finals at full.
