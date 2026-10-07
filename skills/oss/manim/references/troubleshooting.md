# Troubleshooting and Pitfalls

Read when a render fails or before writing tricky scenes. Ordered by frequency.

## LaTeX / MathTex failures

| Symptom | Cause | Fix |
|---|---|---|
| `latex ... returned non-zero exit` on render | Missing LaTeX install OR bad TeX string | Check preflight output; if no LaTeX, switch visuals to `Text()`/geometry and inform user |
| Compile error with `{` `}` in string | Braces are TeX grouping | Escape literal braces as `\{ \}`; raw-string it: `MathTex(r"\{x\}")` |
| Unicode char error (`→`, `π`, `≤`) | MathTex is pure LaTeX | Use commands: `\to`, `\pi`, `\leq`; or use `Text()` for that fragment |
| Wrong colors via `t2c` on transformed eq | substring indices shift after transform | Isolate pieces with `{{ }}` syntax instead; re-isolate per equation version |

Raw strings always: `r"\frac{a}{b}"`, never plain strings with backslashes.

## Tex vs Text constructor arguments

| Symptom | Fix |
|---|---|
| `Mobject.__init__() got an unexpected keyword argument 'slant'` (or `weight`) | `slant`/`weight`/`gradient` are Pango `Text`-only. `Tex`/`MathTex` reject them. Use `Text(..., slant=ITALIC)` or LaTeX italics `r"\textit{...}"` |

## Layout problems

| Symptom | Fix |
|---|---|
| Mobjects cut off at edges | Frame is ~14.22 x 8 units. `.scale_to_fit_width(12)` groups; reduce `font_size`; shrink axes `x_length/y_length` |
| Text overlapping the plot or other text | Use fixed zones: title band top, caption band bottom, side panels for derivations. Text NEVER floats over content. After positioning, check the bounding box: `m.get_critical_point(DR)[1] > -config.frame_height/2 + 0.4` |
| Scene too full at the payoff (accumulated labels, equations) | Fade out finished mobjects when their beat ends; zoom out via `self.camera.frame.animate.set(width=...)` (MovingCameraScene); or scale the group down |
| Overlaps | `.arrange(DOWN, buff=0.4)` VGroups; `.next_to(..., buff=0.3)`; verify visually in the draft pass |
| Label far from its object | Chain positioning off the object: `label.next_to(curve, UP)`, not absolute coords |
| New mobject invisible | Forgot `self.add(m)` / never played an entrance animation |

**Mandatory frame inspection** (part of the Phase 3 draft review, not optional):
after a clean draft render, extract frames at start/middle/end of each scene plus
every beat where text or objects enter:

```bash
ffmpeg -y -ss <seconds> -i media/videos/<qual>/<Scene>.mp4 -frames:v 1 frame.png
```

Then LOOK at each frame: edge cut-offs, overlaps, stale leftovers, contrast.
Fix at `-ql` and re-render before any `-qh` render. Delete review frames before
delivery.

## ThreeDScene: fixed-in-frame text

| Symptom | Fix |
|---|---|
| Equation/caption appears tilted or floating in 3D space | It was never registered: call `self.add_fixed_in_frame_mobjects(m)` at creation |
| Transform target renders in world space / ghost duplicates appear | Transform TARGETS must also be registered fixed-in-frame. Prefer `FadeOut(old)` + register + `FadeIn(new)` over transforming fixed-in-frame mobjects |

## Camera and placement math

| Symptom | Fix |
|---|---|
| Old scene content still visible after a camera pan; new text collides with it | The pan was shorter than one frame dimension. Shift by `frame.width` / `frame.height` (defaults: 14.22 x 8.0, 16:9 enforced - the two are linked), or compute destination bounds (`center +/- width/2, height/2`) and fade leftovers before placing anything |
| Dashed legs / braces / construction floats off the object it annotates | Points were eyeballed. Derive them parametrically from the object: `pa = start + t*(end-start)`, `corner = [pb[0], pa[1], 0]` - see `examples/canvas_math.py::RiseRunOnLine` |
| Zoomed view cuts off previously placed text | `scale(k)` enlarges the view but the center stayed put; recenter with `move_to(midpoint)` or `shift((frame.width/2) * -direction)` after a full-width pan + `scale(2)` |

## Animation logic

| Symptom | Fix |
|---|---|
| `.animate` change not visible | Mobject was not added to scene first, or an updater overwrites it every frame - call `clear_updaters()` |
| Updater keeps mutating during later plays | Detach: `m.clear_updaters()`. For `always_redraw`, swap to a frozen copy before transforming it |
| `Transform` leaves stale ghost / weird morph | Structurally different objects: use `ReplacementTransform`, or `TransformMatchingShapes` for text |
| Equation transform scrambles terms | Hint matches: `TransformMatchingTex(old, new, key_map={"x": "y"})`; isolate with `{{ }}` |
| Scene ends mid-motion | End every act settled: finish plays, add closing `self.wait(0.5)` before the final FadeOut |

## Rendering and environment (uv-based)

| Symptom | Fix |
|---|---|
| First render hangs minutes | Normal: uv is downloading manim + managed Python into cache. Use generous timeouts; subsequent runs are fast |
| `uv: command not found` | Install uv, do NOT fall back to pip. Windows: `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"`; POSIX: `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Render slow at `-qh` on 3D acts | Expected. Draft everything at `-ql`; keep 3D surfaces coarse (`resolution_factor`), shorten ambient rotations |
| Output path confusion | Always run manim from the project dir; output lands in `./media/videos/<script>/<quality>/<Class>.mp4` |
| PowerShell quoting | Wrap paths with spaces in double quotes; prefer single-line commands over backtick continuations |
| Wrong scene rendered | Class name typo, or stale `media` from an older edit - delete `media/videos/<quality>/` for that class and re-render |

## Stitching failures

| Symptom | Fix |
|---|---|
| ffmpeg missing | stitch.py auto-falls back to pyav via `uv run --with av`; ensure invocation includes `--with av` |
| Dimension mismatch error while stitching | Clips were rendered at different qualities - re-render ALL clips with the same flag before stitching |
| Concatenated video glitches at cuts | Re-run stitch.py letting pyav re-encode instead of stream-copy |

## Debugging workflow

1. Reproduce at `-ql` with only the failing class name.
2. Read the LAST traceback line first; map to tables above.
3. If a visual looks wrong but renders fine, extract a frame to inspect:
   `uv run --with av python -c "import av;c=av.open('clip.mp4');f=next(c.decode(video=0)) if False else None"` -
   or simply re-render the single suspicious beat as its own mini scene.
4. After 2 failed fix attempts, stop and report the blocker to the user honestly.

