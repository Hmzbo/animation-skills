from manim import *

# Frame facts (defaults - keep them unless the user asks for another ratio):
#   width  = 14.22... -> X bounds: center.x +/- 7.11
#   height = 8.0      -> Y bounds: center.y +/- 4
# 16:9 is ENFORCED: width and height are linked (height = width * 9/16), so
# changing one moves the other. All camera arithmetic below uses the frame's
# RUNTIME dimensions (frame.width / frame.height) - exact under any config.
config.background_color = "#1C1C1C"


class PanToBlankRegion(MovingCameraScene):
    """Pan to a GUARANTEED blank region: shift the frame center by exactly
    one frame dimension (frame.width horizontally, frame.height vertically).
    A shorter shift leaves old content on screen."""

    def construct(self):
        frame = self.camera.frame
        w, h = frame.width, frame.height          # 14.0 x 7.87 here

        a = Text("Region A", font_size=36)
        a_dot = Dot(ORIGIN, radius=0.2, color=BLUE)
        self.play(FadeIn(a), FadeIn(a_dot))

        # one FULL frame width right -> new view covers x in [7, 21]:
        # Region A (near x=0) cannot be in it.
        self.play(frame.animate.shift(w * RIGHT), run_time=2)

        b = Text("Region B", font_size=36).move_to(w * RIGHT)
        b_dot = Dot(w * RIGHT, radius=0.2, color=GREEN)
        self.play(FadeIn(b), FadeIn(b_dot))
        self.wait(0.4)

        # one FULL frame height up -> view covers y in [h/2, 3h/2]
        self.play(frame.animate.shift(h * UP), run_time=2)
        c = Text("Region C (above B)", font_size=36)\
            .move_to(w * RIGHT + h * UP)
        self.play(FadeIn(c))
        self.wait(0.6)
        self.play(*[FadeOut(m) for m in self.mobjects])


class ZoomToSeeBothRegions(MovingCameraScene):
    """scale(k) changes BOTH width and height. Two regions one frame-width
    apart: scale(2) then shift back (w/2). move_to(midpoint) is the robust
    one-step alternative for any layout."""

    def construct(self):
        frame = self.camera.frame
        w, h = frame.width, frame.height

        a = Text("A", font_size=72)
        self.play(FadeIn(a))

        self.play(frame.animate.shift(w * RIGHT), run_time=1.5)
        b = Text("B", font_size=72).move_to(w * RIGHT)
        self.play(FadeIn(b))
        self.wait(0.3)

        # A is at 0, B at w, frame center at w. scale(2) doubles the view,
        # but the center is still at w, so A sits on the left edge.
        self.play(frame.animate.scale(2), run_time=2)
        # Recenter on the midpoint (w/2 = 7 here):
        self.play(frame.animate.shift((w / 2) * LEFT), run_time=2)
        self.wait(0.5)

        # Robust alternative for any layout: move the center straight to
        # the midpoint of everything that must be visible.
        c = Text("C", font_size=72).move_to(w * RIGHT + h * UP)
        self.play(frame.animate.scale(1.5)
                  .move_to((w / 2) * RIGHT + (h / 2) * UP), run_time=2)
        self.play(FadeIn(c))
        self.wait(0.6)
        self.play(*[FadeOut(m) for m in self.mobjects])


class ZoomIntoDetail(MovingCameraScene):
    """Zoom IN with move_to + set(width=...); save_state/Restore to go home."""

    def construct(self):
        frame = self.camera.frame
        frame.save_state()

        axes = Axes(x_range=[-3.5, 3.5, 1], y_range=[-1.5, 3.5, 1],
                    x_length=10, y_length=5,
                    axis_config={"include_tip": True, "stroke_width": 2})
        curve = axes.plot(lambda x: x ** 2 / 4, color=BLUE)
        self.play(Create(axes), Create(curve), run_time=1.5)

        detail = axes.c2p(2.5, 1.8)
        self.play(frame.animate.move_to(detail).set(width=5), run_time=2)
        self.wait(0.4)
        self.play(Restore(frame), run_time=2)
        self.wait(0.4)
