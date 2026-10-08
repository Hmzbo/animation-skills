// Deterministic GSAP scene: one paused timeline, seeked per frame.
// Same t => same pixels. No ScrollTrigger in the video path (scroll is input,
// not time) — see troubleshooting.
const tl = gsap.timeline({paused: true, defaults: {ease: "power3.out"}});
tl.from("#title", {y: 40, opacity: 0, duration: 1}, 0)
  .from(".card", {y: 30, opacity: 0, duration: 0.6, stagger: 0.15}, 0.5)
  .fromTo("#barfill", {scaleX: 0}, {scaleX: 1, duration: 3, ease: "none"}, 0);

window.__tl = tl;
window.__meta = {fps: 60, duration: 3, width: 1280, height: 720};
tl.time(0);
