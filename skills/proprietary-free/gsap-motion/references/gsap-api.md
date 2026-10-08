# GSAP API catalog (v3.15.0, verified by stepped renders)

Pinned: `gsap@3.15.0` via npm (`/node_modules/gsap/dist/gsap.min.js` script tag;
no bundler needed). License: proprietary gratis — installs normally, USE is
restricted (Standard License, non-compete).

## Master timeline (the only structure)

```js
const tl = gsap.timeline({paused: true, defaults: {ease: "power3.out"}});
tl.from("#title", {y: 40, opacity: 0, duration: 1}, 0);       // position 0s
tl.from(".card", {y: 30, opacity: 0, duration: 0.6, stagger: 0.15}, 0.5);
tl.fromTo("#bar", {scaleX: 0}, {scaleX: 1, duration: 3, ease: "none"}, 0);
```

- Positions are absolute seconds — the timeline reads like a score.
- `defaults.ease` sets the house feel (`power3.out` for entrances, `none` for progress).
- `stagger: 0.15` (or `{each, from: "center"}`) for groups; `fromTo` for progress bars.
- Driver contract: `window.__tl = tl; window.__meta = {fps, duration, width, height}; tl.time(0);`

## Tweens worth knowing

`from` (entrances), `to` (exits/state changes), `fromTo` (progress, counters),
`set` (instant layout). `yoyo`/`repeat` only with whole-cycle durations (see looping).

## Counters (stat reveals)

```js
const obj = {v: 0};
tl.to(obj, {v: 1000, duration: 2, ease: "power2.out",
  onUpdate: () => el.textContent = Math.round(obj.v).toLocaleString()}, 1);
```

`onUpdate` runs on seek too — deterministic. Round inside; never format outside.

## Easing

House set: `power3.out` entrances, `power2.inOut` moves, `none` progress,
`back.out(1.4)` for playful pops (one per video max). Custom: `CustomEase` is
Club-tier — out of scope; bezier equivalents via `CustomEase` are NOT free.

## Looping

Only with whole-cycle tweens (`repeat: -1` + durations dividing the total).
Check seams by diffing first/last frames, not by eye. Most videos don't loop —
end on a hold (`tl.to({}, {duration: 0.8})` empty hold at the end).

## Explicitly out of the video path

- **ScrollTrigger**: scroll is input, not time. Web-only; never seekable.
- **Draggable / Inertia**: pointer physics, not deterministic.
- **CustomEase/CustomBounce**: Club GreenSock plugins — also proprietary-plus;
  the Standard License covers core GSAP only. Never assume them present.
