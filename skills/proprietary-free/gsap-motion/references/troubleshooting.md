# GSAP troubleshooting (v1 — every entry observed in smoke runs)

## Stepping / driver

- **Silent hang, zero output**: `page.evaluate(t => tl.time(t)...)` RETURNS the
  timeline and Playwright chokes serializing its circular graph — forever, with
  no error. ALWAYS use block bodies: `t => { tl.time(t).pause(); }`. This was
  a 10-minute silent hang in verification; the contract section exists because
  of it.
- **No timeout on waits**: `waitForFunction` without a timeout hangs forever on
  a broken scene. The driver sets explicit timeouts and surfaces `pageerror`
  text — a scene that throws on load fails in seconds, not never.
- Screenshots capture CSS pixels — viewport must equal `__meta` size exactly
  (driver sets it). Mismatched viewports letterbox or crop silently.

## Scenes

- **`transform-origin` on the wrong element**: a progress fill with default
  center origin grows from the middle and reads broken. Origin goes on the
  SCALED element (`#barfill`), never its track. Caught in frame review.
- **Unpaused master**: anything not `paused: true` advances on wall time and
  the first stepped frame already differs from `t=0`. One master, paused, period.
- **ScrollTrigger in a render**: seek does nothing (it listens to scroll).
  Frames come out identical = "frozen" video. Keep scroll stories web-only.
- **Font shifts**: webfonts loading mid-step change later frames. System stack
  for drafts; `document.fonts.ready` gate before `__tl` exposure for finals.

## Gate order

`node --check scene.js` -> 60-frame draft -> frame review -> full step -> encode.
