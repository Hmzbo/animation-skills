# Examples

Runnable Manim scenes that demonstrate the patterns this skill relies on.
Each scene exists because a real render hit that exact problem. Read the
comments inside - the WRONG approach is shown next to the RIGHT one.

Frame facts (defaults - keep them unless the user asks for another aspect ratio):

- width = 14.22 (X bounds: center ± 7.11), height = 8.0 (Y bounds: center ± 4)
- **16:9 is enforced**: width and height are linked (`height = width * 9/16`),
  so changing one moves the other. Do not override either unless asked.
- All camera arithmetic uses the frame's **runtime dimensions**
  (`frame.width`, `frame.height`) - exact under any config.

Render any of them:

```bash
uv run --with manim manim -ql examples/camera_basics.py PanToBlankRegion
```

## Camera math (`camera_basics.py`)

The camera frame is a mobject. Its **center** defines what is on screen.
Visible bounds at any moment: `center.x +/- width/2`, `center.y +/- height/2`.

| Scene | Lesson |
|---|---|
| `PanToBlankRegion` | Pan to a *guaranteed blank* region by shifting the center exactly one frame dimension: `shift(frame.width * RIGHT)`, `shift(frame.height * UP)`, ... A shorter shift leaves the old scene peeking in (real bug from the derivative test) |
| `ZoomToSeeBothRegions` | `scale(2)` doubles BOTH dimensions. Two regions one frame-width apart: `scale(2)` then `shift((frame.width/2) * LEFT)`. `move_to(midpoint)` is the robust one-step alternative |
| `ZoomIntoDetail` | Zoom in with `move_to(detail).set(width=5)`; `save_state()` early, `Restore()` to go home |

## Canvas math (`canvas_math.py`)

Treat the frame as a mathematical XY canvas. Before placing anything, know
every object's `get_center()`, `width`, `height`, and bounding-box corners
(`get_critical_point(UL/UR/DL/DR)`). Place new objects by arithmetic from
known geometry - never by eyeballing.

| Scene | Lesson |
|---|---|
| `KnowYourObject` | Read a mobject's geometry and anchor other objects to it; verify the 0.4-unit edge margin |
| `RiseRunOnLine` | Derive construction points parametrically from the object (`pa = start + t*(end-start)`). Eyeballed coords made the rise/run legs float off the line (real bug, derivative test) |
| `PanOverlapBugThenFix` | The 7-unit pan that left half the old view on screen, and the full-width pan fix - with the bounds-check arithmetic in comments |
