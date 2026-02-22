import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = new THREE.Color(0x93e85f);
const WHITE = new THREE.Color(0xcccccc);
const GRAY_LIGHT = new THREE.Color(0x999999);
const GRAY_MID = new THREE.Color(0x555555);
const GRAY_DARK = new THREE.Color(0x333333);

const PARTICLE_COLORS = [WHITE, GRAY_LIGHT, GRAY_MID, GRAY_DARK];

const DESKTOP_COUNT = 190;
const MOBILE_COUNT = 95;
const ENTRANCE_DURATION = 2.8; // seconds
const FRAME_INTERVAL = 1 / 30; // target 30 fps

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animFrameId: number | null = null;
let instancedMesh: THREE.InstancedMesh | null = null;
let clock: THREE.Clock | null = null;
let container: HTMLElement | null = null;
let isVisible = true;
let observer: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let accentColorDirty = false;
let lastFrameTime = 0;

// Per-particle data
let particleCount = 0;
let orbitRadius: Float32Array;
let orbitSpeed: Float32Array;
let orbitPhase: Float32Array;
let verticalOffset: Float32Array;
let verticalSpeed: Float32Array;
let particleScale: Float32Array;
let wobblePhase: Float32Array;
let wobbleAmp: Float32Array;
let spawnPositions: Float32Array; // x,y,z for entrance scatter
let isAccent: Uint8Array;

// Reusable objects
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMobile(): boolean {
  return window.innerWidth < 768;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ---------------------------------------------------------------------------
// Scene setup
// ---------------------------------------------------------------------------

function createScene(el: HTMLElement) {
  container = el;
  // Fallback to window dimensions if container hasn't been laid out yet (mobile first load)
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  // Renderer — pixel ratio capped at 1; this is a background element behind text
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  el.appendChild(renderer.domElement);

  // Scene & fog
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.06);

  // Camera
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  // Clock
  clock = new THREE.Clock();
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------

function createParticles() {
  if (!scene) return;

  particleCount = isMobile() ? MOBILE_COUNT : DESKTOP_COUNT;

  // Allocate per-particle arrays
  orbitRadius = new Float32Array(particleCount);
  orbitSpeed = new Float32Array(particleCount);
  orbitPhase = new Float32Array(particleCount);
  verticalOffset = new Float32Array(particleCount);
  verticalSpeed = new Float32Array(particleCount);
  particleScale = new Float32Array(particleCount);
  wobblePhase = new Float32Array(particleCount);
  wobbleAmp = new Float32Array(particleCount);
  spawnPositions = new Float32Array(particleCount * 3);
  isAccent = new Uint8Array(particleCount);

  // Message card geometry — thin rounded rectangle
  const geo = new THREE.BoxGeometry(0.18, 0.12, 0.015);

  // Material — slightly emissive for glow pickup
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.15,
    emissive: ACCENT,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.92,
  });

  instancedMesh = new THREE.InstancedMesh(geo, mat, particleCount);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Initialise per-instance data
  for (let i = 0; i < particleCount; i++) {
    // Orbit
    orbitRadius[i] = rand(1.0, 5.5);
    orbitSpeed[i] = rand(0.08, 0.25) * (Math.random() > 0.5 ? 1 : -1);
    orbitPhase[i] = rand(0, Math.PI * 2);

    // Vertical
    verticalOffset[i] = rand(-2.5, 2.5);
    verticalSpeed[i] = rand(0.1, 0.4);

    // Scale variation
    particleScale[i] = rand(0.6, 1.6);

    // Wobble
    wobblePhase[i] = rand(0, Math.PI * 2);
    wobbleAmp[i] = rand(0.2, 0.8);

    // Accent flag (~20%)
    isAccent[i] = Math.random() < 0.2 ? 1 : 0;

    // Scattered spawn positions (for entrance anim)
    spawnPositions[i * 3 + 0] = rand(-18, 18);
    spawnPositions[i * 3 + 1] = rand(-12, 12);
    spawnPositions[i * 3 + 2] = rand(-12, 6);

    // Set colour
    if (isAccent[i]) {
      tempColor.copy(ACCENT);
    } else {
      tempColor.copy(PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]);
    }
    instancedMesh.setColorAt(i, tempColor);
  }

  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }

  scene.add(instancedMesh);

  // Subtle ambient + point lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0x93e85f, 4, 20);
  pointLight.position.set(0, 0, 2);
  scene.add(pointLight);

  const rimLight = new THREE.PointLight(0xff8855, 2, 25);
  rimLight.position.set(-5, 3, -3);
  scene.add(rimLight);

}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------

function animate(now: DOMHighResTimeStamp) {
  animFrameId = requestAnimationFrame(animate);

  if (!isVisible) return;

  const delta = (now - lastFrameTime) / 1000;
  if (delta < FRAME_INTERVAL) return;
  lastFrameTime = now - (delta % FRAME_INTERVAL) * 1000;

  if (!clock || !instancedMesh || !camera || !renderer || !scene) return;

  const elapsed = clock.getElapsedTime();
  const entranceT = Math.min(elapsed / ENTRANCE_DURATION, 1);
  const easedEntrance = easeOutCubic(entranceT);

  // Update particles
  for (let i = 0; i < particleCount; i++) {
    const angle = orbitPhase[i] + elapsed * orbitSpeed[i];
    const r = orbitRadius[i];
    const s = particleScale[i];

    // Target orbit position
    const tx = Math.cos(angle) * r;
    const tz = Math.sin(angle) * r * 0.4; // compressed depth for cinematic feel
    const ty =
      verticalOffset[i] +
      Math.sin(elapsed * verticalSpeed[i] + wobblePhase[i]) * wobbleAmp[i];

    // Entrance interpolation: spawn → orbit
    const sx = spawnPositions[i * 3 + 0];
    const sy = spawnPositions[i * 3 + 1];
    const sz = spawnPositions[i * 3 + 2];

    const px = lerp(sx, tx, easedEntrance);
    const py = lerp(sy, ty, easedEntrance);
    const pz = lerp(sz, tz, easedEntrance);

    dummy.position.set(px, py, pz);

    // Rotation — tumble gently
    dummy.rotation.set(
      elapsed * 0.3 + i * 0.1,
      elapsed * 0.2 + i * 0.15,
      elapsed * 0.1 + i * 0.05
    );

    // Scale — entrance grows from 0
    const currentScale = s * easedEntrance;
    dummy.scale.setScalar(currentScale);

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);

    // Dynamic emissive for accent particles — pulse
    if (isAccent[i]) {
      const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(elapsed * 2 + i));
      tempColor.copy(ACCENT).multiplyScalar(pulse);
      instancedMesh.setColorAt(i, tempColor);
      accentColorDirty = true;
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (accentColorDirty && instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
    accentColorDirty = false;
  }


  // Gentle camera sway
  camera.position.x = Math.sin(elapsed * 0.15) * 0.3;
  camera.position.y = Math.cos(elapsed * 0.12) * 0.2;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function onResize() {
  if (!container || !camera || !renderer) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initHeroScene(el: HTMLElement) {
  createScene(el);
  createParticles();

  window.addEventListener('resize', onResize);

  // ResizeObserver corrects canvas size once container has real dimensions (mobile first load)
  resizeObserver = new ResizeObserver(() => onResize());
  resizeObserver.observe(el);

  // Pause rendering when the hero is scrolled out of view
  observer = new IntersectionObserver(
    ([entry]) => { isVisible = entry.isIntersecting; },
    { threshold: 0 }
  );
  observer.observe(el);

  animate(performance.now());
}

export function destroyHeroScene() {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  window.removeEventListener('resize', onResize);

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  if (renderer && container) {
    container.removeChild(renderer.domElement);
  }

  // Dispose Three.js resources
  if (instancedMesh) {
    instancedMesh.geometry.dispose();
    (instancedMesh.material as THREE.Material).dispose();
    instancedMesh = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;
  clock = null;
  container = null;
}
