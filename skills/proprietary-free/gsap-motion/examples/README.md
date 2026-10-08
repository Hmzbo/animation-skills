# Examples — GSAP scene pairs (v3, verified patterns)

Each example is an `index.html` + `scene.js` pair: copy both into a video
project as `index.html` + `scene.js` (markup IDs must match the timeline
targets), serve, and step with `scripts/render.mjs`. GSAP loads from local
`/node_modules/gsap/dist/gsap.min.js` — no CDN, reproducible offline.

- `hero-intro.html` + `hero-intro.js` — title entrance, staggered cards,
  progress bar. Render-verified (60f draft + full + MP4).
- `stat-counters.html` + `stat-counters.js` — counting stats with `onUpdate`
  rounding. The data-reveal pattern.
