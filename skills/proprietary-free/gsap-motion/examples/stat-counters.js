// Counting stats: onUpdate rounding keeps every frame deterministic.
// Targets count up staggered, then hold.
const counters = [
  {el: "#n1", to: 242},
  {el: "#n2", to: 6},
  {el: "#n3", to: 17},
];

const tl = gsap.timeline({paused: true, defaults: {ease: "power2.out"}});
tl.from(".stat", {y: 30, opacity: 0, duration: 0.6, stagger: 0.2}, 0);
counters.forEach((c, i) => {
  const obj = {v: 0};
  const el = document.querySelector(c.el);
  tl.to(
    obj,
    {
      v: c.to,
      duration: 1.8,
      onUpdate: () => {
        el.textContent = Math.round(obj.v).toLocaleString("en-US");
      },
    },
    0.4 + i * 0.25,
  );
});
tl.to({}, {duration: 0.8}); // end hold

window.__tl = tl;
window.__meta = {fps: 60, duration: 3.4, width: 1280, height: 720};
tl.time(0);
