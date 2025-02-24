// src/components/futuristicSceneLogic.js
import * as THREE from 'three';

export function initFuturisticScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000033, 0);
  container.appendChild(renderer.domElement);

  // Create main workflow ring
  const ringGeometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x6366f1,
    emissiveIntensity: 0.5
  });
  const mainRing = new THREE.Mesh(ringGeometry, ringMaterial);
  scene.add(mainRing);

  // Create inner processing ring with orange color
  const innerRingGeometry = new THREE.TorusGeometry(1.2, 0.08, 16, 80);
  const innerRingMaterial = new THREE.MeshStandardMaterial({
    color: 0xff641e,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0xff641e,
    emissiveIntensity: 0.5
  });
  const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
  innerRing.rotation.x = Math.PI / 2;
  scene.add(innerRing);

  // Create particles to represent data flow
  const particleCount = 100;
  const particles = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8
  });

  // Initialize particles in a circular pattern
  for (let i = 0; i < particleCount * 3; i += 3) {
    const angle = (i / 3) * (Math.PI * 2 / particleCount);
    const radius = 2 + (Math.random() - 0.5) * 0.2;
    particlePositions[i] = Math.cos(angle) * radius;
    particlePositions[i + 1] = Math.sin(angle) * radius;
    particlePositions[i + 2] = (Math.random() - 0.5) * 0.5;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xffffff, 3);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 3);
  pointLight2.position.set(-5, -5, 5);
  scene.add(pointLight2);

  camera.position.z = 5;

  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Rotate rings
    mainRing.rotation.x = time * 0.5;
    mainRing.rotation.y = time * 0.3;
    
    innerRing.rotation.x = time * 0.7;
    innerRing.rotation.z = time * 0.4;

    // Animate particles
    const positions = particles.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const angle = time + (i / 3) * (Math.PI * 2 / particleCount);
      const radius = 2 + Math.sin(time * 2 + i) * 0.1;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = Math.sin(angle) * radius;
      positions[i + 2] = Math.sin(time * 2 + i) * 0.2;
    }
    particles.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Handle window resize
  function handleResize() {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  window.addEventListener('resize', handleResize);

  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
    ringGeometry.dispose();
    ringMaterial.dispose();
    innerRingGeometry.dispose();
    innerRingMaterial.dispose();
    particles.dispose();
    particleMaterial.dispose();
    renderer.dispose();
  };
}
