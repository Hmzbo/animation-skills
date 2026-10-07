# Manim API Catalog (ManimCE v0.21+)

Curated, battle-tested patterns. Import everything with `from manim import *`.
Verify unfamiliar details against https://docs.manim.community/en/stable/reference.html

## Scene skeleton

```python
from manim import *

config.background_color = "#1C1C1C"   # palette background

PRIMARY, SECONDARY, ACCENT = BLUE, GREEN, YELLOW

class Act1(Scene):
    def construct(self):
        self.next_section("hook")
        title = Text("The Integral", font_size=48)
        self.play(Write(title), run_time=1.5)
        self.wait(1)
        # every act ends clean:
        self.play(*[FadeOut(m) for m in self.mobjects])
```

`self.next_section("name")` between beats creates chapter markers in the output mp4.
Keep one class per act; 3-10 `self.play` calls per act.

## Text and math

```python
Text("plain words", font_size=36)                    # UI language
MathTex(r"\int_a^b f(x)\,dx")                        # math (needs LaTeX)
Tex(r"\text{mixed } x^2")                            # LaTeX with text mode
MarkupText('bold <b>word</b>', font_size=30)         # Pango markup
Title("Chapter One", include_underline=False)

# color parts of math: pass pieces as separate args or isolate with {{ }}
eq = MathTex(r"{{x}} + 10 = {{1}}")
eq[0][0].set_color(YELLOW)                            # first isolated piece

# live-updating number
tracker = ValueTracker(1.0)
num = DecimalNumber(1.0, num_decimal_places=2)
num.add_updater(lambda m: m.set_value(tracker.get_value()))
self.add(num)
self.play(tracker.animate.set_value(9.0), run_time=2)  # digits roll
```

Escaping rules for MathTex strings: always raw strings `r"..."; literal brace in LaTeX is
`\\{`. Unicode symbols inside MathTex fail - use LaTeX commands (`\\to`, `\\pi`, `\\leq`).

## Geometry essentials

```python
Circle(radius=1.5, color=BLUE, stroke_width=4).set_fill(BLUE, opacity=0.3)
Square(side_length=2), Rectangle(width=4, height=2), RoundedRectangle(...)
Polygon([x,y,0], ...), RegularPolygon(n=6), Triangle(), Star(n=5)
Line(LEFT*3, RIGHT*3), DashedLine(...), Arrow(A, B, buff=0.2), DoubleArrow(...)
Dot(point), Ellipse(width=3, height=1.5), Arc(radius=1, start_angle=0, angle=PI/2)
Brace(mobj, DOWN).shift(DOWN*0.2)          # .get_tex("a") / .get_text("area")
SurroundingRectangle(eq, color=YELLOW, buff=0.15)
Cross(bad), Underline(word)
VGroup(circle, square)                      # group + arrange(DOWN, buff=0.5)
```

Boolean ops need skia-pathops (bundled): `Union(a, b)`, `Intersection(a, b)`,
`Difference(a, b)`, `Exclusion(a, b)`.

## Positioning toolkit

```python
m.next_to(other, RIGHT, buff=0.4); m.to_edge(UP, buff=0.3)
m.move_to(ORIGIN + UP); m.align_to(other, LEFT)
m.shift(RIGHT*2 + UP*0.5); m.scale(0.8); m.rotate(PI/4)
m.scale_to_fit_width(10)                     # cure overflow; frame width ~14.22
m.set_z_index(5)                             # draw order control
frame = config.frame_width                   # ≈ 14.222 units wide, height 8
```

## Coordinate systems and plotting

```python
axes = Axes(x_range=[-3, 3, 1], y_range=[-2, 2, 1],
            x_length=10, y_length=6,
            axis_config={"include_tip": True, "font_size": 24})
curve = axes.plot(lambda x: x**2 / 2 - 1, color=BLUE)
label = axes.get_graph_label(curve, MathTex("f(x)"), x_val=2)

pt = axes.c2p(1, 2)                          # coords -> scene point
y = axes.p2c(curve.get_end())                # point -> coords

area = axes.get_area(curve, x_range=[0, 2], color=BLUE, opacity=0.4)

rects = axes.get_riemann_rectangles(curve, x_range=[0, 2], dx=0.5,
                                    input_sample_type="left",
                                    stroke_width=0.5, stroke_color=WHITE)

NumberPlane(background_line_style={"stroke_opacity": 0.5})
NumberLine(including_numbers=True), UnitInterval()
PolarPlane(), ComplexPlane()
ImplicitFunction(lambda x, y: x**2 + y**2 - 4, x_range=[-2.5, 2.5])
ParametricFunction(lambda t: np.array([np.cos(t), np.sin(t), 0]), t_range=[0, TAU])

# Riemann refinement loop (the integral classic):
rects = axes.get_riemann_rectangles(curve, x_range=[0, 2], dx=1.0)
for dx in [0.5, 0.25]:
    finer = axes.get_riemann_rectangles(curve, x_range=[0, 2], dx=dx,
                                        input_sample_type="left")
    self.play(Transform(rects, finer)); self.wait(0.8)
```

## Live values, updaters, dynamic redraws

```python
t = ValueTracker(0)

always_redraw(lambda: TangentLine(curve, alpha=t.get_value(), length=3, color=YELLOW))
dot = always_redraw(lambda: Dot(axes.c2p(t.get_value(),
                       curve.underlying_function(t.get_value()))))
path = TracedPath(dot.get_center, stroke_color=GREEN, stroke_width=3)

secant = Line().add_updater(lambda l: l.put_start_and_end_on(
    axes.c2p(t.get_value(), curve.underlying_function(t.get_value())),
    axes.c2p(t.get_value() + 1, curve.underlying_function(t.get_value() + 1))))

self.play(t.animate.set_value(2), run_time=3)
secant.clear_updaters(); dot.clear_updaters()   # detach before transforming them
```

## Animation vocabulary (choose deliberately)

Creation: `Create` (geometry/curves), `Write` (text/math), `DrawBorderThenFill`,
`FadeIn(shift=UP*0.5)`, `GrowFromCenter`, `GrowFromEdge(DOWN)`, `SpiralIn`,
`ShowIncreasingSubsets`, `Uncreate`/`FadeOut` for exits.

Emphasis: `Indicate(m, color=YELLOW)`, `Circumscribe(m)`, `FocusOn(point)`,
`Flash(point, line_length=0.4)`, `Wiggle(m)`, `ApplyWave(m)`, `Broadcast(m)`,
`ShowPassingFlash(curve.copy().set_stroke(WHITE, 6), time_width=0.3)`.

Transforms:
- `.animate` sugar: `self.play(sq.animate.scale(2).set_color(RED))`
- `Transform(a, b)` morphs a into b's look; a stays in scene.
- `ReplacementTransform(a, b)` removes a, adds b - use when objects are semantically new.
- `TransformMatchingTex(eq1, eq2)` aligns LaTeX parts; pass `key_map={...}` if matching is off.
- `TransformMatchingShapes(t1, t2)` for Text-to-Text morphs.
- `MoveToTarget`: set `m.generate_target(); m.target.shift(...)` then play.
- `Restore` after `m.save_state()`.
- `FadeTransform(a, b)` crossfades between different structures.

Composition & timing:

```python
self.play(LaggedStart(*[GrowFromEdge(r, DOWN) for r in rects], lag_ratio=0.1))
self.play(AnimationGroup(FadeIn(a), Create(b), lag_ratio=0.5))
self.play(Succession(Indicate(x), Circumscribe(y)))
self.play(Create(curve), run_time=3, rate_func=linear)
self.wait(0.7)
```

Movement & numbers: `MoveAlongPath(dot, path)`, `Rotate(sq, angle=PI/2)`,
`Rotating(cube, axis=UP)`, `ChangeDecimalToValue(num, 42)`, `ChangingDecimal`.

Rate functions worth knowing: `smooth` (default), `linear`, `rush_into`, `rush_from`,
`there_and_back`, `there_and_back_with_pause`, `double_smooth`, custom via
`squish_rate_func(smooth, 0.3, 0.8)`.

## Scene types and camera

```python
class Lesson(MovingCameraScene):
    def construct(self):
        frame = self.camera.frame
        frame.save_state()

        # build the core visual ONCE - it stays for the whole video
        axes = Axes(...)
        curve = axes.plot(lambda x: x**2 / 4, color=BLUE)
        self.play(Create(axes), Create(curve))

        # region A: main plot
        self.play(frame.animate.move_to(axes.c2p(0, 1)).set(width=12))
        ...beats on the curve...

        # region B: pan aside to a derivation zone, work, clean up
        work = MathTex("m = \\frac{dy}{dx}").move_to(axes.c2p(6, 1))
        self.play(frame.animate.move_to(work).set(width=9))
        self.play(Write(work))
        self.play(FadeOut(work))

        # back home - curve still there, no rebuild
        self.play(Restore(frame))
        ...continue on the same objects, e.g. overlay f'...
```

MovingCameraScene rules - the frame is a mobject; its CENTER defines the view:

- Frame facts (defaults): width 14.22 (X: center +/- 7.11), height 8.0
  (Y: center +/- 4). 16:9 is ENFORCED - width and height are linked
  (`height = width * 9/16`), so changing one moves the other. Keep the defaults
  unless the user asks for a different aspect ratio, and always compute with
  the runtime `frame.width` / `frame.height`.
- Visible bounds at any moment: `center.x +/- width/2`, `center.y +/- height/2`.
- Pan to a blank region by shifting the center exactly one frame dimension:
  `frame.animate.shift(frame.width * RIGHT)` (or `* LEFT`, `frame.height * UP/DOWN`).
  A shorter shift leaves old content visible - compute destination bounds
  (`center +/- width/2, height/2`) before placing anything there.
- `scale(k)` scales BOTH dimensions. Two regions one frame-width apart:
  `frame.animate.scale(2)` then `shift((frame.width / 2) * LEFT)`;
  `move_to(midpoint)` is the robust general form.
- Zoom to detail: `move_to(point).set(width=5)`; `save_state()` early,
  `Restore(self.camera.frame)` to return home.
- Declutter continuously: FadeOut whatever the current region no longer needs.
- Runnable versions of every pattern: `examples/camera_basics.py`.

- `MovingCameraScene` - region panning, zoom-to-detail, zoom-out-to-fit; ideal
  when multiple beats share one core visual.
- `ZoomedScene` - picture-in-picture magnifier inset.
- `ThreeDScene` - see below.
- `VectorScene` / `LinearTransformationScene(apply_method_config=...)` - linear algebra epics;
  call `self.setup()` first, use `self.add_vector(...)`, `self.apply_matrix(matrix)`.
- Plain `Scene` covers everything else.

## 3D

```python
class Act3D(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=75 * DEGREES, theta=-45 * DEGREES)
        axes = ThreeDAxes()
        surface = Surface(
            lambda u, v: axes.c2p(u, v, np.sin(u) * np.cos(v)),
            u_range=[-3, 3], v_range=[-3, 3],
            fill_opacity=0.7, checkerboard_colors=[BLUE_D, BLUE_E])
        self.begin_ambient_camera_rotation(rate=0.12)
        self.play(Create(axes), run_time=1)
        self.play(Create(surface), run_time=2)
        self.stop_ambient_camera_rotation()
        self.move_camera(phi=60 * DEGREES, theta=30 * DEGREES)
```

Also: `Cube`, `Sphere`, `Cylinder`, `Cone`, `Torus`, `Dot3D`, `Arrow3D`, `Line3D`,
`Polyhedron`. Keep 3D acts short; renders are much slower than 2D.

Fixed-in-frame text (equations/captions in 3D scenes):

```python
eq = MathTex(r"\nabla f = \lambda \nabla g")
self.add_fixed_in_frame_mobjects(eq)   # screen-aligned, ignores camera
eq.to_edge(DOWN, buff=0.4)
```

- ANY mobject that appears as a TRANSFORM TARGET (`ReplacementTransform`,
  `TransformMatchingTex`, `Transform(...)` second argument) must ALSO be
  registered fixed-in-frame, or it renders tilted in world space.
- Safest pattern for 3D text changes: `FadeOut(old)` -> register new -> `FadeIn(new)`.
  Avoid transforming fixed-in-frame mobjects when a fade would do.

## Graphs, tables, data

```python
g = Graph(["A", "B", "C"], [("A", "B"), ("B", "C")], layout="spring", labels=True)
g["A"].set_color(YELLOW)                          # recolor vertex in place

chart = BarChart(values=[3, 7, 4], bar_names=["a", "b", "c"], y_range=[0, 8, 2])
table = MathTable([["x", "x^2"], ["1", "1"], ["2", "4"]], include_outer_lines=True)

field = ArrowVectorField(lambda p: np.array([-p[1], p[0], 0]), x_range=[-3, 3], y_range=[-3, 3])
streams = StreamLines(lambda p: np.array([-p[1], p[0], 0]), x_range=[-3, 3])
stream_anim = field  # use Create(field) or self.play(Create(streams), run_time=3)
```

Code display: `Code(code="print('hi')", language="python", background="window")`
(v0.19+ interface).

## Sections API recap

```python
def construct(self):
    self.next_section("hook")          # chapter marker; name shows in players
    ...beats...
    self.next_section("build")
    ...beats...
```

One rendered class = one mp4 with chapters = the deliverable. This is why the default
architecture avoids stitching entirely.

