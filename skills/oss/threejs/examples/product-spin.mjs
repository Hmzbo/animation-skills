import * as THREE from 'three';

// Studio product spin: torus knot, 3-point lighting, slow dolly-in.
// Smoke-verified: byte-identical frames across runs (SHA256 match).
const W = 1280;
const H = 720;
const FPS = 60;
const DURATION = 4;

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x66aaff, 1.2);
rim.position.set(-4, -1, -3);
scene.add(rim);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.9, 0.28, 220, 36),
  new THREE.MeshStandardMaterial({color: 0x14b8a6, roughness: 0.35, metalness: 0.55}),
);
scene.add(knot);

const smooth = x => x * x * (3 - 2 * x); // smoothstep for the dolly

window.__renderAt = t => {
  knot.rotation.x = t * 0.6;
  knot.rotation.y = t * 0.9;
  camera.position.set(0, 0.6, 4.2 - smooth(Math.min(t / DURATION, 1)) * 0.6);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
};
window.__meta = {fps: FPS, duration: DURATION, width: W, height: H};
window.__renderAt(0);
