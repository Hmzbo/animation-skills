# Motion Canvas troubleshooting (v1 — doc-grounded, extended by render runs)

## Scaffold / install

- `npm init @motion-canvas@latest` is interactive. The skill always scaffolds non-interactively:
  `npm init @motion-canvas@latest -- --name <slug> --path <dir> --language ts --plugins ffmpeg`
  then `npm install` inside the project dir. Target dir must not exist or must be empty.
- Pin TypeScript (`--language ts`). The skill's examples are TS-only; JS template drifts in imports.
- Always select the FFmpeg exporter (`--plugins ffmpeg`) so MP4 output needs no extra setup.

## Code

- **Missing `?scene` suffix**: `import x from './scenes/foo'` (no suffix) silently breaks scene registration. Always `./scenes/foo?scene`.
- **Deep lib imports** (`@motion-canvas/2d/lib/...`) are v2 style. v3 uses barrels: `@motion-canvas/2d`, `@motion-canvas/core`.
- **Forgot `yield*`**: calling `node().x(300, 1)` without yielding runs nothing — the tween object is created and dropped. Every animation must be yielded.
- **Instant-set accidents**: `node().x(300)` with no duration sets immediately. In finals this reads as a jump cut — always pass seconds.
- **Resolution vs scale**: bumping `resolution` for a sharper final does NOT rescale elements — text stays tiny in a big frame. Change `scale` instead, or design at final size from the start.
- **Fonts**: `Txt` uses browser fonts. Verify math symbols / non-Latin glyphs render in the preview before final render; missing glyphs show as tofu and waste a render cycle.
- **WebP on Safari**: file-type WebP may not render on Safari/old browsers. PNG sequence + ffmpeg is the safe path.

## Render

- RENDER writes to `output/` in the project dir — gitignore it in every video project.
## Render driver (`scripts/render.mjs`)

- Video Settings persist to `src/project.meta` (plain JSON: `shared.range` in
  **seconds**, `shared.size`, `rendering.fps`, exporter options). The driver
  edits this file for drafts and restores it afterwards — never hand-edit it
  mid-render, and never commit a draft `range` (the driver makes this
  impossible by construction, but a manual editor session can still save one:
  reset range to full before finals).
- `shared.size` persists too: an accidental resolution change in the editor
  (observed: width 30px) silently carries into later renders. If frames come
  out tiny, check `shared.size` first.
- Frames land in `output/project/` as `%06d.png` (not `frame_%04d`). If `group
  by scene` is ever enabled, expect per-scene subfolders instead.
- Long black frames at start usually mean the generator ends before the playhead range does: extend the scene with `yield* waitFor(...)` or shrink the render `range`.
- If the preview is black after camera moves: you panned past the content (same class of bug as manim camera work). Reset view, re-add content at origin first.
- WSL2: file watching may not pick up scene edits — restart `npm run serve` instead of trusting hot reload.

## Gate order (cheap -> expensive)

`npm run build` (tsc + vite build, seconds) -> preview in editor -> draft range render -> full render. Never debug animation logic in full renders.
