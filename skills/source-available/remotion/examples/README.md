# Examples — Remotion compositions (v4, rendered patterns)

Each file is a component: register it behind a `<Composition>` in `Root.tsx`
(see `references/remotion-api.md`). All motion derives from `frame` only.

- `title-slide.tsx` — slide-up + fade title over 1s (`interpolate` + bezier).
  Smoke-rendered (title legible at 1s still).
- `spring-badge.tsx` — `spring()` pop-in delayed 1s. The callout/CTA pattern.
- `captioned-sequence.tsx` — script array mapped to `<Sequence>` caption
  blocks synced by seconds×fps. The narration pattern.
