---
name: gsap-motion
description: Plan, code, and render web motion graphics with GSAP (paused master timelines seeked deterministically per frame, captured headlessly to MP4). Acts as a creative director to storyboard the piece, then writes timeline-driven scenes, draft-steps frames, and delivers a 1080p MP4 path (plus the live web page itself). Use for animated explainers, product intros, stat reveals, and UI stories when motion should ship both as video and as a web page. PROPRIETARY gratis license — check terms before use.
license: GSAP Standard No-Charge License (proprietary gratis)
compatibility: Requires node 16+ and npm; per video project `gsap` + `playwright` with Chromium; ffmpeg for MP4 encoding. Timeline-seeked video path only — ScrollTrigger is web-interactive, not renderable. Review https://gsap.com/community/standard-license/ (non-compete clause) before use.
metadata:
  author: animation-skills
  version: "1.0.0"
---

# GSAP Motion

Produce web motion graphics with GSAP that also render to video.
Act as a creative director first: timelines reward choreography (staggered
entrances over simultaneous pops). Then act as a GSAP engineer: one paused
master timeline, seeked explicitly per frame — same second, same pixels.

Scroll-driven animation (ScrollTrigger) is NOT in the video path: scroll is
input, not time, and cannot be stepped deterministically. Timelines, tweens,
and staggers are. Scroll stories stay web-only and are out of scope for renders.

## Workflow at a glance

```
Phase 0 PREFLIGHT -> Phase 1 PLAN -> Phase 2 CODE -> Phase 3 DRAFT (60 frames)
    -> Phase 4 FINAL (full) -> Phase 5 DELIVER
                                   ^
        revisions: edit -> check -> DRAFT again -> user approves -> FINAL
```

## Project layout contract

```
<cwd>/videos-web/<topic-slug>/
├── plan.md       # storyboard from Phase 1
├── package.json  # {gsap, playwright}
├── index.html    # stage markup + <script src gsap> + <script src scene.js>
├── scene.js      # THE animation: one paused master timeline (Phase 2 writes this)
├── frames/       # stepped PNGs — never hand-edited, gitignored
└── final.mp4     # delivered video (Phase 4; the page itself stays live too)
```

Reuse the folder per topic for revisions.

## The deterministic timeline contract (non-negotiable)

```js
const tl = gsap.timeline({paused: true, defaults: {ease: "power3.out"}});
tl.from("#title", {y: 40, opacity: 0, duration: 1}, 0)
  .from(".card", {y: 30, opacity: 0, duration: 0.6, stagger: 0.15}, 0.5);

window.__tl = tl;
window.__meta = {fps: 60, duration: 3, width: 1280, height: 720};
tl.time(0);
```

The driver seeks `tl.time(t)` per frame and screenshots. Two laws:

1. The master timeline is `paused: true` and nothing else advances it.
2. `page.evaluate` callbacks use block bodies — NEVER return the timeline
   (returning it makes the driver serialize GSAP's circular object graph and
   hang forever with zero output).

## Phase 0: Preflight

```bash
node <skill-dir>/scripts/preflight.mjs
```

Then per video project (GSAP library + headless stepper; Chromium binary once
per machine):

```bash
npm i gsap playwright --prefix <cwd>/videos-web/<slug>
npx playwright install chromium
```

GSAP installs from npm normally; the license restriction is on USE (review the
Standard License, non-compete clause), not on download.

## Phase 1: Plan (no code yet)

Read [references/gsap-api.md](references/gsap-api.md) and classify into one tier:

| Tier | Criteria | Approval gate |
|---|---|---|
| S Simple | One hero + 1 beat (title, badge, bar), <= 3s | Auto-proceed |
| M Moderate | Staggered groups, counters, multi-beat, <= 8s | Auto-proceed |
| L Large | Multi-scene page flow, synced beats, 8s+ | Present plan, WAIT for approval |

Write `<cwd>/videos-web/<slug>/plan.md`: title, arc, beat list with concrete
tweens (`from y:40 opacity:0`, `stagger 0.15`, `scaleX progress`), easings,
palette. Fidelity rules: title mirrors the topic; state the point before
animating it.

## Phase 2: Code

Hand-laid project (no scaffolder): `package.json`, `index.html` (stage markup,
fixed viewport size, gsap via `/node_modules/gsap/dist/gsap.min.js`), `scene.js`
(master timeline + contract).

Consult [references/gsap-api.md](references/gsap-api.md),
[references/troubleshooting.md](references/troubleshooting.md), and
[examples/](examples/) (`hero-intro` pair verified render; `stat-counters` pair).
Copy their patterns.

Coding standards:

- One master timeline, `paused: true`, all beats positioned absolutely
  (`tl.from(..., position)`). No `delay:`-chained mysteries — positions read top to bottom.
- `transform-origin` on the element being scaled, never its parent (a
  center-origin progress bar reads as broken).
- Fixed viewport stage (`1280x720`, `overflow: hidden`): screenshots capture CSS pixels 1:1.
- System font stacks for drafts; webfonts wired + still-reviewed before finals.

Gate before stepping (instant):

```bash
node --check <cwd>/videos-web/<slug>/scene.js
```

## Phase 3: Draft render (mandatory, never skip)

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos-web/<slug> --frames 60
```

Default (no `--frames`) steps the full `fps * duration` span. Frames land in
`<slug>/frames/` as zero-padded 6-digit PNGs.

**Visual frame review (mandatory):** open 3 PNGs (first/middle/last). Check:
entrances complete (no half-faded rests), stagger rhythm even, origins correct
(bars grow from the edge, not the middle), no overflow past the stage.
Fix, re-step, re-review.

## Phase 4: Final render

```bash
node <skill-dir>/scripts/render.mjs --project <cwd>/videos-web/<slug>
ffmpeg -y -framerate <fps> -i <slug>/frames/%06d.png -c:v libx264 -pix_fmt yuv420p -crf 18 <slug>/final.mp4
```

Take `<fps>` from `__meta`. Prefer `shared/ffmpeg/README.md` over inventing flags.

## Phase 5: Deliver

```
**Video ready**

Topic: <topic>
Plan recap:
- Beat 1: <one line>
...

File: <absolute path to final.mp4> (<WxH>@<fps>, ~M:SS estimated)
Source: <absolute path to videos-web/<slug>/scene.js (+ index.html live page)>

License note: GSAP is gratis but proprietary (Standard License, non-compete).
Confirm https://gsap.com/community/standard-license/ covers your use.

Want any changes? Timeline edits re-step fast at 60 frames; full render once satisfied.
```

## Revision policy

1. Edit `scene.js`. 2. `node --check`. 3. Draft-step 60. 4. Iterate.
5. Full step + encode + redeliver.

## Hard rules

- Paused master timeline only; ScrollTrigger never in the render path.
- Block-body evaluates (never return GSAP objects to the driver).
- Always preflight before planning; always check before stepping; always draft + frame review before finals.
- Never hand-edit `frames/`; regenerate via the driver.
- One video project per topic under `<cwd>/videos-web/<slug>/`.
- If any phase fails repeatedly (2+ fix attempts), report the blocker honestly.
