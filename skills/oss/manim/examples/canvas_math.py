from manim import *

config.background_color = "#1C1C1C"
# Frame: width 14.22 (X: +/-7.11), height 8 (Y: +/-4). 16:9 enforced.


class KnowYourObject(Scene):
    """Always know an object's center, width, height and bbox corners.
    Anchor new objects to that geometry by arithmetic - never eyeball."""

    def construct(self):
        sq = Square(side_length=2).shift(3 * RIGHT + UP)

        # geometry you can read from any mobject:
        #   sq.get_center()            -> np.array([3, 1, 0])
        #   sq.width, sq.height        -> 2.0, 2.0
        #   sq.get_critical_point(UR)  -> top-right bbox corner, etc.
        lbl = Text("2x2 square", font_size=30)
        lbl.move_to(sq.get_critical_point(UP) + UP * 0.4)

        # margin law: nothing closer than 0.4 units to the frame edge
        # frame bounds: x in [-7.11, 7.11], y in [-4, 4]
        right_gap = 7.11 - sq.get_critical_point(UR)[0]
        info = MathTex(rf"\text{{right gap}} = {right_gap:.1f}",
                       font_size=34).move_to(DOWN * 2.5)

        self.play(Create(sq), FadeIn(lbl), FadeIn(info))
        self.wait(0.8)


class RiseRunOnLine(Scene):
    """REAL BUG (derivative test): rise/run legs were placed with eyeballed
    coordinates and floated off the line. Fix: derive every point from the
    line's parametric definition."""

    def construct(self):
        start = np.array([-4.0, -1.5, 0.0])
        end = start + np.array([8.0, 4.0, 0.0])      # slope 0.5
        line = Line(start, end, color=BLUE, stroke_width=5)

        # points ON the line, by fraction of its length:
        t1, t2 = 0.3, 0.75
        pa = start + t1 * (end - start)
        pb = start + t2 * (end - start)
        corner = np.array([pb[0], pa[1], 0.0])       # right-angle corner

        run_leg = DashedLine(pa, corner, color=GREEN, stroke_width=4)
        rise_leg = DashedLine(corner, pb, color=GREEN, stroke_width=4)
        run_lbl = MathTex(r"\mathrm{run}", font_size=30, color=GREEN)\
            .next_to(run_leg, DOWN, buff=0.15)
        rise_lbl = MathTex(r"\mathrm{rise}", font_size=30, color=GREEN)\
            .next_to(rise_leg, RIGHT, buff=0.15)

        self.play(Create(line), run_time=1.2)
        self.play(Create(run_leg), Create(rise_leg),
                  FadeIn(run_lbl), FadeIn(rise_lbl), run_time=1.5)
        self.wait(0.8)


class PanOverlapBugThenFix(MovingCameraScene):
    """REAL BUG (derivative test): a 7-unit pan left half the old view on
    screen, and new text was then written over the leftover curve."""

    def construct(self):
        frame = self.camera.frame
        axes = Axes(x_range=[-3.5, 3.5, 1], y_range=[-1.5, 3.5, 1],
                    x_length=10, y_length=5,
                    axis_config={"include_tip": True, "stroke_width": 2})
        curve = axes.plot(lambda x: x ** 2 / 4, color=BLUE)
        self.play(Create(axes), Create(curve), run_time=1.5)

        # bounds check BEFORE panning, using the frame's runtime width.
        # A 7-unit pan (half the frame) keeps the curve visible - don't.
        # A full frame.width pan puts the view at x in [7, 21] - clean.
        content_right = axes.c2p(3.5, 0)[0] + 0.4          # + tip allowance
        dest_center = frame.get_center()[0] + frame.width
        clean = dest_center - frame.width / 2 > content_right
        self.play(frame.animate.shift(frame.width * RIGHT), run_time=2)

        verdict = Text(f"clean workspace: {clean}",
                       font_size=30, color=GREEN).move_to(frame.width * RIGHT)
        self.play(FadeIn(verdict))
        self.wait(0.8)
