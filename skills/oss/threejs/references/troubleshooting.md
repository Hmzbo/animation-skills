# Three.js troubleshooting (v1 — all entries observed in smoke runs)

## Toolchain

- Playwright launches **Chrome Headless Shell** by default and errors
  `Executable doesn't exist at .../ms-playwright/chromium_headless_shell-XXXX`
  when only full Chromium was downloaded (or vice versa). Fix:
  `npx -y playwright@latest install chromium` in the video project — installs
  exactly what its Playwright version expects.
- `npm init`-style scaffolding is NOT used here. Video projects are hand-laid:
  `package.json` (`three` + `playwright`), `index.html` (import map), `scene.mjs`,
  `server` provided by the driver. No `npm init @scope` step exists for three.

## Determinism (the non-negotiables)

- **No `requestAnimationFrame`, no `Clock`, no `Date.now()` in scenes.** Any
  wall-clock read breaks byte-identical renders. Every animated value must be
  a pure function of the `t` argument to `__renderAt`.
- **No `Math.random()` without a seeded PRNG.** Use a mulberry32-style seeded
  function with a fixed seed for particle layouts.
- Async texture/model loads must resolve BEFORE the first `__renderAt(0)` call
  (gate with a `window.__ready` promise the driver awaits). Unloaded textures
  render black for early frames.

## Headless rendering

- Screenshots capture the composited page, so `preserveDrawingBuffer` is NOT
  needed. If frames come out black anyway: the scene threw before first render
  (check `pageerror` output), or WebGL context failed — confirm SwiftShader
  fallback by rendering the bundled `product-spin` example first.
- `canvas.screenshot()` captures at CSS pixel size — set the viewport to the
  exact scene size (driver does this from `__meta`) or frames letterbox/scale.
- `EffectComposer`/bloom passes multiply per-frame cost ~3-5x on SwiftShader.
  Draft with plain `renderer.render`, enable composer only for finals.
- WebGPU (`three/webgpu`) needs Dawn + `--enable-unsafe-webgpu` headless and is
  unverified in this skill — v1 renders WebGL only. Do not mix renderers.

## Gate order (cheap -> expensive)

`node --check scene.mjs` (syntax, instant) -> 60-frame draft step -> frame review
-> full step -> ffmpeg encode. Never debug animation logic in full renders.
