'use strict';

// ── Navbar scroll effect ──────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Mobile menu ───────────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── Scroll reveal (Intersection Observer) ────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => observer.observe(el));

// ── Animated counters ─────────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

// ── Form submit ───────────────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const success = document.getElementById('form-success');
  form.querySelectorAll('input, textarea').forEach(i => i.value = '');
  success.style.display = 'block';
  setTimeout(() => { success.style.display = 'none'; }, 4000);
}
window.handleSubmit = handleSubmit;

// ── THREE.JS Helpers ──────────────────────────────────────────────────────────
if (typeof THREE === 'undefined') {
  console.warn('Three.js not loaded — 3D scenes skipped.');
} else {

  // ── HERO 3D scene ──────────────────────────────────────────────────────────
  (function initHero() {
    const canvas = document.getElementById('hero-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight, 0.1, 200);
    camera.position.set(0, 0, 8);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xf97316, 1.5);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);
    const ptLight = new THREE.PointLight(0xea580c, 0.8);
    ptLight.position.set(-10, -10, -5);
    scene.add(ptLight);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(3000 * 3);
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 160;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Particles
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(2000 * 3);
    for (let i = 0; i < partPos.length; i++) partPos[i] = (Math.random() - 0.5) * 40;
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMesh = new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0xf97316, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.6 }));
    scene.add(partMesh);

    // Network lines
    const nodeCount = 40;
    const nodePts = [];
    for (let i = 0; i < nodeCount; i++) {
      nodePts.push(new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20));
    }
    const linePos = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodePts[i].distanceTo(nodePts[j]) < 5) {
          linePos.push(nodePts[i].x, nodePts[i].y, nodePts[i].z, nodePts[j].x, nodePts[j].y, nodePts[j].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
    const lineMesh = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.3 }));
    scene.add(lineMesh);

    // Floating orbs
    function makeOrb(color, pos, scale) {
      const geo = new THREE.SphereGeometry(scale, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 120 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      return mesh;
    }
    const orbs = [
      { mesh: makeOrb(0xf97316, [-4, 1, -3], 1.2), speed: 0.8 },
      { mesh: makeOrb(0xea580c, [4, -1, -4], 0.8), speed: 1.2 },
      { mesh: makeOrb(0xf59e0b, [0, 2, -6], 0.6), speed: 1.5 },
    ];

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.01;
      partMesh.rotation.y = t * 0.03;
      lineMesh.rotation.y = t * 0.05;
      lineMesh.rotation.x = Math.sin(t * 0.02) * 0.1;
      orbs.forEach(({ mesh, speed }) => {
        mesh.rotation.x = Math.sin(t * speed * 0.3) * 0.2;
        mesh.rotation.y = t * speed * 0.2;
        mesh.position.y += Math.sin(t * speed * 0.5) * 0.002;
      });
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      const w = canvas.parentElement.offsetWidth;
      const h = canvas.parentElement.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  })();

  // ── ABOUT 3D scene ─────────────────────────────────────────────────────────
  (function initAbout() {
    const wrap = document.querySelector('.about-canvas-wrap');
    const canvas = document.getElementById('about-canvas');
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.offsetWidth, wrap.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, wrap.offsetWidth / wrap.offsetHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.PointLight(0xf97316, 1);
    l1.position.set(10, 10, 10);
    scene.add(l1);
    const l2 = new THREE.PointLight(0xea580c, 0.5);
    l2.position.set(-10, -10, -10);
    scene.add(l2);

    // Stars
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(2000 * 3);
    for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 100;
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.6 })));

    function makeOrb2(color, pos, scale) {
      const geo = new THREE.SphereGeometry(scale, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 120 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      return mesh;
    }
    const orbs = [
      { mesh: makeOrb2(0xf97316, [0, 0, 0], 2), speed: 0.5 },
      { mesh: makeOrb2(0xf59e0b, [2, 1, -2], 0.4), speed: 2 },
      { mesh: makeOrb2(0xfbbf24, [-2, -1, -1], 0.3), speed: 1.5 },
    ];

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.01;
      orbs.forEach(({ mesh, speed }) => {
        mesh.rotation.x = Math.sin(t * speed * 0.3) * 0.2;
        mesh.rotation.y = t * speed * 0.2;
      });
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(wrap.offsetWidth, wrap.offsetHeight);
      camera.aspect = wrap.offsetWidth / wrap.offsetHeight;
      camera.updateProjectionMatrix();
    });
  })();

  // ── CTA 3D scene ───────────────────────────────────────────────────────────
  (function initCta() {
    const section = document.getElementById('contact');
    const canvas = document.getElementById('cta-canvas');
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(section.offsetWidth, section.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, section.offsetWidth / section.offsetHeight, 0.1, 200);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(1500 * 3);
    for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 120;
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.5 })));

    function makeOrb3(color, pos, scale) {
      const geo = new THREE.SphereGeometry(scale, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 120 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      scene.add(mesh);
      return mesh;
    }
    const orbs = [
      { mesh: makeOrb3(0xf97316, [5, -2, -4], 2), speed: 0.3 },
      { mesh: makeOrb3(0xea580c, [-5, 2, -5], 1.5), speed: 0.4 },
    ];

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.01;
      orbs.forEach(({ mesh, speed }) => {
        mesh.rotation.x = Math.sin(t * speed * 0.3) * 0.2;
        mesh.rotation.y = t * speed * 0.2;
      });
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(section.offsetWidth, section.offsetHeight);
      camera.aspect = section.offsetWidth / section.offsetHeight;
      camera.updateProjectionMatrix();
    });
  })();

} // end THREE check
