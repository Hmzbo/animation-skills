# Creative Direction Guide

How to think about planning a Manim explainer video. Read this before writing any plan.

## Mission

Produce a video that is clean, clear, and compelling: one idea at a time, visuals that
carry the argument, motion that has meaning. Every animation must answer "what does this
help the viewer understand?" If an animation is decoration only, cut it or replace it with
a deliberate pause so the viewer can absorb.

## Complexity calibration

Match ambition to the topic. Under-animating a rich topic wastes it; over-animating a
simple topic buries it.

### T1 - Simple (1-2 short scenes)

Single concept, single visual thread, default camera.

- Solving `x + 10 = 1`: equation centered, each algebraic step via `TransformMatchingTex`,
  the moving term recolored, solution circled at the end.
- Definition slides: term + formula + one illustrative figure.
- Target length: 20-60 seconds.

### T2 - Moderate (3-5 scenes)

A small arc: setup -> core mechanism -> payoff.

- Derivative as slope: secant line sliding into tangent (`ValueTracker` + updater).
- Pythagoras: triangle plus squares on sides, area comparison, formula reveal.
- Riemann sums intro: curve draws, coarse rectangles appear, refine twice, converge.
- Target length: 1-3 minutes.

### T3 - Advanced (6+ scenes and/or 3D / camera choreography)

Multi-act story with escalating insight. Requires user approval of the plan before coding.

- Integral as area, full act structure: naive sum -> finer partitions -> limit ->
  antiderivative connection -> real-world framing.
- Fourier series: rotating circles building a wave term by term.
- Linear transformations epic: grid transforming under matrices, determinant as area.
- Target length: 3+ minutes.

## Architecture selection

Choose the scene architecture during planning - it shapes the entire codebase.
Multi-scene is NOT the automatic default. Ask: **do later beats reuse or extend
the same core visual?**

| Situation | Architecture |
|---|---|
| One compact topic on one visual object (Pythagoras: everything happens on one triangle) | ONE plain `Scene`, continuous build, no scene transitions |
| Later beats revisit or extend the same core visual (derivative: hook on the curve, tangent limit on the SAME curve, then f' overlaid on it) | ONE `MovingCameraScene`: build once, pan/zoom between regions, fade stale mobjects, keep working |
| Genuinely independent tableaus, acts needing different scene types (2D vs `ThreeDScene`), or very long videos | Multiple `Scene` classes + stitch |

MovingCameraScene discipline - this is where videos get cluttered, so plan hard:

- Pan in whole-frame steps (`frame.animate.shift(frame.width * RIGHT)` etc.;
  defaults 14.22 x 8.0, 16:9 enforced) so regions are genuinely disjoint, and
  compute the destination bounds (`center +/- width/2, height/2`) BEFORE
  placing anything there - leftover content from the previous region is the
  classic collision source.
- Divide the frame into explicit regions BEFORE coding: main plot center,
  derivation zone to one side, summary zone elsewhere. The plan names them.
- Pan with intent: `self.camera.frame.animate.move_to(region).set(width=...)`;
  `save_state()` early and `Restore(self.camera.frame)` to return home.
- Captions and labels must make sense in the CURRENT view; reposition them
  after each pan, or anchor them to the region they describe.
- Declutter continuously: FadeOut whatever the current beat no longer needs
  instead of letting it pile up.
- When a view gets full, zoom OUT (`frame.animate.set(width=...)`) or remove
  things - never cram more objects into a fixed view.

## Narrative arc

Even a 40-second clip benefits from a micro-arc:

1. **Hook** (5-10%): pose the question visually. A paradox, a shape, an unfinished equation.
2. **Statement** (10-20%): the problem itself, in words + notation, explained.
   The hook teases the question; the statement defines it. Never draw
   conclusions from a problem the viewer has not been shown.
3. **Build** (35-50%): the mechanism, step by step. One transformation per beat.
   If the topic is a method, the method's own steps belong here (form the
   Lagrangian, set grad L = 0, solve) - showing only the final equations is a
   failed plan.
4. **Payoff** (15-20%): the result lands; highlight what changed in understanding.
5. **Recap** (5-10%, optional): compress the journey into one summary frame.

**Title fidelity:** the on-screen title uses the user's requested topic
wording, not a shorter technique name. "Solving a convex optimization problem
with an equality constraint" - not just "Lagrange multipliers".

## Scene beats

Plan every scene as ordered beats; a beat is one `self.play(...)` plus its pause.

Rules of thumb:

- 4-10 beats per scene for T2/T3; 3-6 for T1.
- One visual idea per beat; never move more than ~5 mobjects simultaneously.
- Hold each new state with `self.wait(0.5)` to `self.wait(1)`.
- Vary entry animations across scenes: rotate through Write / Create / FadeIn /
  GrowFromCenter / LaggedStart instead of reusing one everywhere.

## Aesthetic guardrails

These separate professional output from generic output:

1. **Palette discipline.** Pick ONE palette per video from the table below, declare it in
   plan.md and in scene.py constants, then never use an off-palette color except
   `WHITE`/`BLACK` neutrals.
2. **Density limit.** Max ~5 visible mobjects on screen at once. Fade out finished ones.
3. **Typography hierarchy.** Titles `font_size=44-52`, body/labels `24-36`, never below 18.
   Use `Text` for words, `MathTex` for math only.
4. **Motion economy.** Default durations: entrances 1-2s, transforms 1-2s, emphasis 0.75s.
   Long slides or spins read as padding.
5. **Camera restraint.** Static frame is fine for most content. Reach for
   `MovingCameraScene` when zooming into detail genuinely helps; reach for
   `ThreeDScene` only when dimensionality is the point.
6. **Highlight language.** Choose consistent semantics: YELLOW = focus, RED = wrong/
   subtracted, GREEN = result/positive. Keep these meanings stable all video.
7. **Layout zones.** Fixed bands, never violated: title along the top (~0.7
   units), captions along the bottom (~0.7 units), content in the middle, side
   panels in their own half. Text never sits on top of the plot. Keep >= 0.4
   units margin from every frame edge and verify each text's bounding box.
   Out of space? Reposition -> scale down -> zoom the camera out. In that order.

### Palettes (dark background default)

| Name | Background | Primary | Secondary | Accent |
|---|---|---|---|---|
| Classic | `#1C1C1C` | BLUE `#58C4DD` | GREEN `#83C167` | YELLOW `#FFFF00` |
| Warm academic | `#2D2B55` | `#FF6B6B` | `#FFD93D` | `#6BCB77` |
| Neon tech | `#0A0A0A` | `#00F5FF` | `#FF00FF` | `#39FF14` |
| Monochrome | `#16161E` | WHITE | GREY_B | GOLD |

Set background via `config.background_color = "#..."` at top of scene.py.

## Technique matrix

Map topic type to the Manim toolkit (snippets in manim-api.md):

| Topic type | Key classes/animations |
|---|---|
| Equation solving / algebra steps | `MathTex`, `TransformMatchingTex`, isolate parts with `{{ }}`, recolor terms |
| Functions & graphs | `Axes`, `.plot()`, `Create`, `get_area`, tangent via `TangentLine` + tracker |
| Integrals / area | `axes.get_riemann_rectangles(dx=...)` refinement loop, `get_area`, limit notation |
| Geometry / proofs | `Polygon`, `Angle`, `RightAngle`, `Brace`, `DrawBorderThenFill`, labels |
| Linear algebra | `NumberPlane`, `ApplyMatrix`, `LinearTransformationScene`, determinant shading |
| Probability / data | `BarChart`, `SampleSpace`, `DecimalTable` |
| Algorithms / graphs | `Graph`, vertex recoloring, arrows, step captions |
| Vector fields / ODEs | `ArrowVectorField`, `StreamLines`, `MoveAlongPath` particles |
| 3D geometry / surfaces | `ThreeDScene`, `ThreeDAxes`, `Surface`, `begin_ambient_camera_rotation` |
| Numbers changing live | `ValueTracker` + `always_redraw` + `DecimalNumber` updaters |

## plan.md template

```markdown
# <Video Title - mirrors the user's requested topic>

## Overview
- Topic: <core concept>
- Tier: T1 | T2 | T3
- Architecture: single Scene | single MovingCameraScene | multi-class
- Hook: <opening question/mystery>
- Problem statement: <the formal statement, in words + notation, shown early>
- Narrative arc: <2-3 sentences>
- Estimated length: <N seconds/minutes>
- Palette: <name> - bg <hex>, primary <hex>, secondary <hex>, accent <hex>
- Layout zones: <e.g. title top band; plot center; derivation panel left; captions bottom>

## Act 1: <Act name>            [class Act1]
Purpose: <what this act accomplishes>
Beats:
1. <beat description>          [technique: Write/Create/..., ~Ns]
2. ...
Transition out: <how / camera move>

## Act 2: ...                   [class Act2 or camera region 2]
...

## Shared elements
<recurring motifs, e.g. axes persist between acts; yellow = focus everywhere>
```

