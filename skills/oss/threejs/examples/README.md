# Examples — deterministic scenes for Three.js r186

Each example is a `scene.mjs` implementing the skill contract:

```js
window.__renderAt = t => { /* every animated value is a pure function of t */ };
window.__meta = {fps: 60, duration: 4, width: 1280, height: 720};
window.__renderAt(0);
```

Serve alongside `index.html` (import map below) and step with
`scripts/render.mjs`. Copy `index.html` once per video project.

```html
<script type="importmap">{"imports":{
  "three": "/node_modules/three/build/three.module.js",
  "three/addons/": "/node_modules/three/examples/jsm/"
}}</script>
<script type="module" src="/scene.mjs"></script>
```

- `product-spin.mjs` — studio product spin: torus knot, 3-point lighting, slow dolly. The default "beautiful object" opener.
- `wave-grid.mjs` — vertex-animated plane wave + fog. The "procedural motion" pattern (pure-function vertices, seeded).
