# Remotion troubleshooting (v1 — extended by render verification)

## Scaffold / install

- `create-video` is interactive by default. Agents scaffold with
  `npx -y create-video@<pinned> --yes --blank <slug>` and pin the version in
  the plan — CLI flags move between majors.
- First render provisions Chromium + bundles (minutes, once). Start it early;
  everything after is incremental.

## Code

- **Wall-clock leaks**: CSS `animation`/`transition`, `Date.now()`,
  `Math.random()`, `useState` counters all break frame determinism. Every
  visual must derive from `frame`. When output flickers between identical
  renders, grep for these first.
- **Unclamped interpolate**: without `extrapolateLeft/Right: "clamp"`,
  pre/post-range frames extrapolate wildly — titles flying in from infinity
  in stills outside the designed range.
- **Windows `--props`**: inline JSON loses its quotes in CMD/PowerShell.
  Always `--props=./props.json`.
- **Fonts**: render machines differ from dev machines. System stacks for
  drafts; self-hosted webfonts wired before finals, then still-review every
  weight used.

## Render

- `out/` is disposable — never hand-edit, never commit. Stills go to `out/`
  too; copy only `final.mp4` up one level for delivery.
- OOM on long 4K renders: `--disallow-parallel-encoding` trades speed for
  memory. Halve `--scale` before touching codecs.
- Font/glyph tofu in stills: missing typeface on the render side — fix fonts,
  not frames.
