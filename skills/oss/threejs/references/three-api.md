# Three.js API catalog (r0.186, verified by smoke render)

Pinned: `three@0.186.1`, `WebGLRenderer` (headless via Chromium/SwiftShader),
ES modules with an import map. WebGPU renderer exists (`three/webgpu`) but is
NOT the skill default — see troubleshooting.

## Deterministic scene contract (the skill's core invention)

Normal Three.js uses `requestAnimationFrame` + clock deltas: nondeterministic.
Every skill scene replaces the loop with an explicit time function:

```js
window.__renderAt = t => {   // t in seconds, set explicitly per frame
  knot.rotation.x = t * 0.6;
  renderer.render(scene, camera);
};
window.__meta = {fps: 60, duration: 4, width: 1280, height: 720};
window.__renderAt(0);
```

Verified: same `t` renders byte-identical PNGs across processes (SHA256 match).
The driver (`scripts/render.mjs`) steps `t = i/fps`, screenshots the canvas,
encodes with ffmpeg. No rAF in render mode, ever.

## Minimal scene (smoke-verified)

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(1280, 720);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(45, 1280 / 720, 0.1, 100);
camera.position.set(0, 0.6, 4.2);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 4, 5);
scene.add(key);
```

Served with an import map (no bundler needed for scenes):

```html
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script>
<script type="module" src="/scene.mjs"></script>
```

## Building blocks for beautiful motion

- **Geometry**: `TorusKnotGeometry`, `IcosahedronGeometry(detail)` for faceted gems,
  `PlaneGeometry(w,h,seg,seg)` for vertex waves, `InstancedMesh` for particles/grids
  (one draw call for thousands of objects).
- **Materials**: `MeshStandardMaterial` (`roughness`/`metalness`) for products;
  `MeshPhysicalMaterial` (`clearcoat`) for premium looks; `ShaderMaterial` (GLSL)
  for custom gradients — keep shaders small, they run per-pixel on SwiftShader.
- **Lights**: ambient base + key directional + colored rim/fill. Two-line setup,
  biggest beauty lever.
- **Camera motion**: interpolate `camera.position` + `lookAt` on `t` (e.g. slow
  dolly `z = 4.2 - t*0.15`). OrbitControls are for humans — never in scenes.
- **Easing**: implement manually on `t` (`smoothstep`, `easeInOut`) — there is no
  timeline engine; every property is a pure function of `t`.
- **Text/labels**: no text engine in scope for v1 — overlay titles in post
  (ffmpeg `drawtext`) or composite a Motion Canvas title card. Documented, not faked.

## Addons (import from three/addons/ — verify per use)

`OrbitControls` (human preview only), `RoomEnvironment` (free studio lighting via
PMREM — big quality win for metals), `GLTFLoader` (product models), `EffectComposer`
+ `UnrealBloomPass` (glow; costly headless — draft without, final with).
Addons need an import-map entry: `"three/addons/": "/node_modules/three/examples/jsm/"`.

## What stays manual in v1

Audio muxing (ffmpeg `-i audio.mp3 -shortest`), captions/title cards (composite),
WebGPU renderer + TSL shaders (advanced, needs Dawn flags headless — parked).
