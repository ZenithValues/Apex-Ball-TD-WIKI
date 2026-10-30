import * as THREE from 'three';

// An intentionally simple, non-intersecting product scene: one faceted solid
// floating above a separate pedestal. Scroll moves the camera, not the content.
export function createWorldScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1); // bounded GPU cost, including Firefox and software renderers
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x08090c, 8, 18);
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 30);
  scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x20232b, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(-3, 5, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x7b93ab, 1.7); fill.position.set(4, 1, -3); scene.add(fill);

  const crystalGeometry = new THREE.IcosahedronGeometry(0.84, 0);
  const crystalMaterial = new THREE.MeshStandardMaterial({ color: 0xc9d1da, metalness: 0.63, roughness: 0.3, flatShading: true });
  const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
  crystal.position.y = 1.43;
  scene.add(crystal);

  const baseGeometry = new THREE.CylinderGeometry(1.04, 1.16, 0.22, 8);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x343d47, metalness: 0.72, roughness: 0.38 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial); base.position.y = 0.08; scene.add(base);
  const footGeometry = new THREE.CylinderGeometry(1.23, 1.23, 0.08, 8);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111820, metalness: 0.45, roughness: 0.5 });
  const foot = new THREE.Mesh(footGeometry, footMaterial); foot.position.y = -0.07; scene.add(foot);
  const grid = new THREE.GridHelper(8, 16, 0x4c5969, 0x303943);
  grid.position.y = -0.12; grid.material.transparent = true; grid.material.opacity = 0.2; scene.add(grid);

  let visible = true;
  let destroyed = false;
  let frame = 0;
  let current = 0.45;
  let target = current;
  function measure() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  function scrollTarget() {
    const rect = host.getBoundingClientRect();
    target = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    requestRender();
  }
  function requestRender() { if (!frame && visible && !destroyed) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0;
    if (!visible || destroyed) return;
    current += (target - current) * 0.13;
    const angle = (current - 0.5) * 0.62;
    camera.position.set(Math.sin(angle) * 4.8, 2.35 - current * 0.45, Math.cos(angle) * 4.8);
    camera.lookAt(0, 0.75, 0);
    crystal.rotation.y = 0.18 + current * 0.5;
    renderer.render(scene, camera);
    if (Math.abs(current - target) > 0.001) requestRender();
  }
  function onTheme(event) {
    const color = event.detail?.colors?.accent;
    if (color) { try { crystalMaterial.color.set(color); } catch { /* leave neutral */ } }
    requestRender();
  }
  const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  if (themeColor) { try { crystalMaterial.color.set(themeColor); } catch { /* leave neutral */ } }
  const resize = new ResizeObserver(measure); resize.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) scrollTarget(); }, { rootMargin: '80px' });
  intersection.observe(host);
  window.addEventListener('scroll', scrollTarget, { passive: true });
  window.addEventListener('apex-theme-updated', onTheme);
  measure(); scrollTarget();

  return () => {
    destroyed = true;
    if (frame) cancelAnimationFrame(frame);
    resize.disconnect(); intersection.disconnect();
    window.removeEventListener('scroll', scrollTarget);
    window.removeEventListener('apex-theme-updated', onTheme);
    [crystalGeometry, baseGeometry, footGeometry].forEach((g) => g.dispose());
    [crystalMaterial, baseMaterial, footMaterial, grid.material].forEach((m) => m.dispose());
    grid.geometry.dispose(); renderer.dispose(); renderer.domElement.remove();
  };
}
