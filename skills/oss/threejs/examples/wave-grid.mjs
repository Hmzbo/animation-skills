import * as THREE from 'three';

// Procedural wave grid: plane vertices as a pure function of (x, y, t),
// teal physical material, exponential fog for depth. No randomness at all.
const W = 1280;
const H = 720;
const FPS = 60;
const DURATION = 5;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
scene.fog = new THREE.FogExp2(0x05070c, 0.055);

const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
camera.position.set(0, 4.2, 9.5);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0x88aaff, 0.5));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(4, 6, 3);
scene.add(key);

const SEG = 90;
const geo = new THREE.PlaneGeometry(16, 16, SEG, SEG);
geo.rotateX(-Math.PI / 2);
const base = geo.attributes.position.array.slice(); // rest pose, never mutated
const mesh = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({
    color: 0x0ea5a5, roughness: 0.4, metalness: 0.3,
    flatShading: true, side: THREE.DoubleSide,
  }),
);
scene.add(mesh);

const pos = geo.attributes.position;
window.__renderAt = t => {
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    pos.array[i * 3 + 1] =
      Math.sin(x * 0.7 + t * 1.6) * 0.55 + Math.cos(z * 0.9 + t * 1.1) * 0.45;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  camera.position.y = 4.2 - Math.min(t / DURATION, 1) * 1.2; // slow descend
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
};
window.__meta = {fps: FPS, duration: DURATION, width: W, height: H};
window.__renderAt(0);
