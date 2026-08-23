/* =========================================================
   js/effects.js
   Dynamic visual enhancements across CampusQueue:
   - Dynamic ambient floating background blobs
   - Mouse cursor spotlight tracking & 3D tilt effects
   - Scroll reading progress bar
   - IntersectionObserver scroll reveal animations
   - Topbar elevation on scroll
   - Smooth "Back to Top" floating trigger
   ========================================================= */

(function () {
  'use strict';

  // Apply saved theme early across all pages
  syncSavedTheme();

  // Ensure DOM is ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffects);
  } else {
    initEffects();
  }

  function syncSavedTheme() {
    const savedTheme = localStorage.getItem('cq_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.body.setAttribute('data-theme', savedTheme);
      const themeLabel = document.getElementById('themeLabel');
      if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
  }

  function initEffects() {
    syncSavedTheme();
    setupDynamicBackground();
    setup3DBackgroundAnimation();
    setupScrollProgress();
    setupBackToTop();
    setupScrollReveal();
    setupCursorSpotlightAndTilt();
    setupTopbarScroll();
  }

  /* ---------------------------------------------------------
     1. Dynamic Background Blobs & DOM Injection
     --------------------------------------------------------- */
  function setupDynamicBackground() {
    if (!document.querySelector('.dynamic-bg-glow')) {
      const bg = document.createElement('div');
      bg.className = 'dynamic-bg-glow';
      bg.setAttribute('aria-hidden', 'true');
      bg.innerHTML = `
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="cursor-spotlight" id="cursorSpotlight"></div>
      `;
      document.body.prepend(bg);
    }
  }

  /* ---------------------------------------------------------
     2. Scroll Reading Progress Bar
     --------------------------------------------------------- */
  function setupScrollProgress() {
    let progressBar = document.getElementById('scrollProgress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'scrollProgress';
      progressBar.className = 'scroll-progress';
      document.body.appendChild(progressBar);
    }

    function updateProgress() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progressPercentage = (window.scrollY / totalHeight) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, progressPercentage)) + '%';
      } else {
        progressBar.style.width = '0%';
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------------------------------------------------------
     3. Back to Top Button
     --------------------------------------------------------- */
  function setupBackToTop() {
    let backBtn = document.getElementById('backToTop');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'backToTop';
      backBtn.className = 'back-to-top';
      backBtn.setAttribute('aria-label', 'Scroll to top');
      backBtn.innerHTML = '<span>↑</span>';
      document.body.appendChild(backBtn);
    }

    function toggleBackToTop() {
      if (window.scrollY > 250) {
        backBtn.classList.add('visible');
      } else {
        backBtn.classList.remove('visible');
      }
    }

    backBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();
  }

  /* ---------------------------------------------------------
     4. Scroll Reveal Animations (IntersectionObserver)
     --------------------------------------------------------- */
  function setupScrollReveal() {
    const targets = document.querySelectorAll(
      '.card, .auth-card, .class-card, .subject-card, .deadline-item, .task-item, .resource-card, .stat-card'
    );

    targets.forEach((el, idx) => {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
        // Stagger initial items slightly for a smooth entrance cascade
        el.style.transitionDelay = `${(idx % 4) * 0.08}s`;
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              // Unobserve once revealed
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px'
        }
      );

      document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    } else {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ---------------------------------------------------------
     5. Cursor Spotlight & Interactive 3D Card Tilt
     --------------------------------------------------------- */
  function setupCursorSpotlightAndTilt() {
    const spotlight = document.getElementById('cursorSpotlight');
    let ticking = false;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);

          if (spotlight) {
            spotlight.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    });

    // 3D Card Tilt effect on hover
    const tiltCards = document.querySelectorAll('.card, .auth-card, .class-card');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left;
        const cardY = e.clientY - rect.top;

        card.style.setProperty('--card-mouse-x', `${cardX}px`);
        card.style.setProperty('--card-mouse-y', `${cardY}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((cardY - centerY) / centerY) * -4; // Max 4 deg
        const rotateY = ((cardX - centerX) / centerX) * 4;   // Max 4 deg

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        card.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }

  /* ---------------------------------------------------------
     6. Topbar Elevation on Scroll
     --------------------------------------------------------- */
  function setupTopbarScroll() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    function handleTopbarScroll() {
      if (window.scrollY > 15) {
        topbar.classList.add('scrolled');
      } else {
        topbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleTopbarScroll, { passive: true });
    handleTopbarScroll();
  }

  /* ---------------------------------------------------------
     7. Interactive 3D WebGL Background Animation (Three.js)
     --------------------------------------------------------- */
  function setup3DBackgroundAnimation() {
    if (!document.getElementById('bg3dCanvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'bg3dCanvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    const canvas = document.getElementById('bg3dCanvas');
    if (!canvas) return;

    loadThreeJs(() => {
      initThreeScene(canvas);
    });
  }

  function loadThreeJs(callback) {
    if (window.THREE) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => callback();
    script.onerror = () => {
      console.warn('Three.js CDN could not be loaded. Falling back gracefully.');
    };
    document.head.appendChild(script);
  }

  function initThreeScene(canvas) {
    const THREE = window.THREE;
    if (!THREE) return;

    let scene, camera, renderer, sceneGroup;
    let icosaMesh, torusKnotMesh, octaMesh, cubesGroup, particleSystem;
    let ambientLight, dirLight1, dirLight2;
    let targetMouseX = 0, targetMouseY = 0;
    let currentMouseX = 0, currentMouseY = 0;

    // Theme color presets for Dark and Light modes
    const themePalettes = {
      dark: {
        ambient: 0x11162b,
        dir1: 0x4d6bfe,
        dir2: 0x2fd4a5,
        icosa: 0x4d6bfe,
        torus: 0x2fd4a5,
        octa: 0x9b51e0,
        cubes: 0x3b82f6,
        particles: 0x60a5fa,
        wireOpacity: 0.65,
        particleOpacity: 0.75,
        particleSize: 0.22
      },
      light: {
        ambient: 0xf1f5f9,
        dir1: 0x2563eb,
        dir2: 0x0d9488,
        icosa: 0x3b82f6,
        torus: 0x0d9488,
        octa: 0x7c3aed,
        cubes: 0x0284c7,
        particles: 0x3b82f6,
        wireOpacity: 0.4,
        particleOpacity: 0.5,
        particleSize: 0.2
      }
    };

    function getTheme() {
      return document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    let activeTheme = getTheme();
    let palette = themePalettes[activeTheme];

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 28;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    // Lights
    ambientLight = new THREE.AmbientLight(palette.ambient, 1.2);
    scene.add(ambientLight);

    dirLight1 = new THREE.DirectionalLight(palette.dir1, 1.5);
    dirLight1.position.set(20, 20, 20);
    scene.add(dirLight1);

    dirLight2 = new THREE.DirectionalLight(palette.dir2, 1.2);
    dirLight2.position.set(-20, -20, -10);
    scene.add(dirLight2);

    // 1. Icosahedron (Top-left floating background)
    const icosaGeo = new THREE.IcosahedronGeometry(5, 1);
    const icosaMat = new THREE.MeshStandardMaterial({
      color: palette.icosa,
      wireframe: true,
      transparent: true,
      opacity: palette.wireOpacity,
      roughness: 0.2,
      metalness: 0.8
    });
    icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
    icosaMesh.position.set(-16, 8, -6);
    sceneGroup.add(icosaMesh);

    // 2. Torus Knot (Bottom-right floating background)
    const torusGeo = new THREE.TorusKnotGeometry(4.5, 1.2, 100, 16);
    const torusMat = new THREE.MeshStandardMaterial({
      color: palette.torus,
      wireframe: true,
      transparent: true,
      opacity: palette.wireOpacity,
      roughness: 0.3
    });
    torusKnotMesh = new THREE.Mesh(torusGeo, torusMat);
    torusKnotMesh.position.set(16, -10, -5);
    sceneGroup.add(torusKnotMesh);

    // 3. Octahedron (Center-right floating background)
    const octaGeo = new THREE.OctahedronGeometry(3.5, 0);
    const octaMat = new THREE.MeshStandardMaterial({
      color: palette.octa,
      wireframe: true,
      transparent: true,
      opacity: palette.wireOpacity,
      roughness: 0.4
    });
    octaMesh = new THREE.Mesh(octaGeo, octaMat);
    octaMesh.position.set(12, 12, -10);
    sceneGroup.add(octaMesh);

    // 4. Floating Cubes Matrix
    cubesGroup = new THREE.Group();
    const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: palette.cubes,
      wireframe: true,
      transparent: true,
      opacity: palette.wireOpacity * 0.8,
      roughness: 0.5
    });

    const cubeCount = 10;
    const cubeData = [];
    for (let i = 0; i < cubeCount; i++) {
      const mesh = new THREE.Mesh(cubeGeo, cubeMat.clone());
      const x = (Math.random() - 0.5) * 45;
      const y = (Math.random() - 0.5) * 35;
      const z = (Math.random() - 0.5) * 20 - 5;
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      cubesGroup.add(mesh);
      cubeData.push({
        mesh: mesh,
        baseY: y,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.015,
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.8 + Math.random() * 0.6
      });
    }
    sceneGroup.add(cubesGroup);

    // 5. 3D Particle Constellation
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: palette.particles,
      size: palette.particleSize,
      transparent: true,
      opacity: palette.particleOpacity
    });
    particleSystem = new THREE.Points(particleGeo, particleMat);
    sceneGroup.add(particleSystem);

    // Mouse tilt tracking
    document.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Smooth Theme Update Function
    function updateThemeColors(newTheme) {
      activeTheme = (newTheme === 'light' || newTheme === 'dark') ? newTheme : getTheme();
      const p = themePalettes[activeTheme] || themePalettes.dark;

      if (ambientLight) ambientLight.color.setHex(p.ambient);
      if (dirLight1) dirLight1.color.setHex(p.dir1);
      if (dirLight2) dirLight2.color.setHex(p.dir2);

      if (icosaMat) {
        icosaMat.color.setHex(p.icosa);
        icosaMat.opacity = p.wireOpacity;
      }
      if (torusMat) {
        torusMat.color.setHex(p.torus);
        torusMat.opacity = p.wireOpacity;
      }
      if (octaMat) {
        octaMat.color.setHex(p.octa);
        octaMat.opacity = p.wireOpacity;
      }
      if (particleMat) {
        particleMat.color.setHex(p.particles);
        particleMat.opacity = p.particleOpacity;
        particleMat.size = p.particleSize;
      }

      if (cubeData) {
        cubeData.forEach(item => {
          if (item.mesh && item.mesh.material) {
            item.mesh.material.color.setHex(p.cubes);
            item.mesh.material.opacity = p.wireOpacity * 0.8;
          }
        });
      }
    }

    // Ensure theme colors match the current mode on initialization
    updateThemeColors(getTheme());

    // Hook into global theme toggle callback
    window.onThemeChange = function (newTheme) {
      updateThemeColors(newTheme);
    };

    // Listen to custom themechange event
    window.addEventListener('themechange', (e) => {
      const t = (e.detail && e.detail.theme) ? e.detail.theme : getTheme();
      updateThemeColors(t);
    });

    // Observe body data-theme attribute
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') {
          updateThemeColors(getTheme());
        }
      });
    });
    observer.observe(document.body, { attributes: true });

    // Window Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    // Animation Loop
    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Parallax rotation & translation
      sceneGroup.rotation.y = currentMouseX * 0.25;
      sceneGroup.rotation.x = -currentMouseY * 0.18;
      sceneGroup.position.y = (window.scrollY * 0.008);

      // Rotate primary geometries
      if (icosaMesh) {
        icosaMesh.rotation.x = elapsedTime * 0.15;
        icosaMesh.rotation.y = elapsedTime * 0.2;
        icosaMesh.position.y = 8 + Math.sin(elapsedTime * 0.8) * 0.6;
      }
      if (torusKnotMesh) {
        torusKnotMesh.rotation.x = elapsedTime * -0.12;
        torusKnotMesh.rotation.y = elapsedTime * 0.18;
        torusKnotMesh.position.y = -10 + Math.cos(elapsedTime * 0.7) * 0.7;
      }
      if (octaMesh) {
        octaMesh.rotation.x = elapsedTime * 0.25;
        octaMesh.rotation.z = elapsedTime * 0.15;
        octaMesh.position.y = 12 + Math.sin(elapsedTime * 1.1) * 0.5;
      }

      // Animate floating cubes
      cubeData.forEach((item) => {
        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.position.y = item.baseY + Math.sin(elapsedTime * item.floatSpeed + item.floatPhase) * 0.8;
      });

      // Slowly rotate particle field
      if (particleSystem) {
        particleSystem.rotation.y = elapsedTime * 0.03;
        particleSystem.rotation.x = elapsedTime * 0.015;
      }

      renderer.render(scene, camera);
    }

    animate();
  }
})();

