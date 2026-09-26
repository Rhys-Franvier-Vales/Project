/**
 * =========================================================================
 * ⚙️ MASTER PARALLAX CONFIGURATION
 * You can easily tweak any parameter below to adjust the exact look & feel!
 * =========================================================================
 */
const PARALLAX_CONFIG = {
  // Scene 3D Rotation (Degrees)
  maxTiltX: 3.5, // Vertical card tilt (subtle & elegant)
  maxTiltY: 5.0, // Horizontal card tilt

  // Responsiveness & Physics
  lerpSpeed: 0.06, // Damping factor (0.02 = ultra-smooth/slow, 0.15 = quick)
  mouseIntensity: 0.5, // Multiplier for mouse translation depth (0 = static, 1.0 = normal)
  scrollIntensity: 40, // Max vertical movement range on scroll (px)

  // Dynamic Ambient Floating
  enableIdleFloat: true, // Gentle continuous motion when mouse is still
  idleAmplitude: 0.04, // Float size

  // Lighting & Highlights
  enableGlare: true, // Cursor-following glare overlay
  glareOpacity: 0.45, // Maximum glare intensity

  // Individual Multi-Plane Layers [depth, scrollSpeed, 3D Z distance, scale]
  layers: {
    sky: { depth: 8, scrollSpeed: 0.08, z: 0, baseScale: 1.25 },
    title: { depth: 16, scrollSpeed: 0.16, z: 20, baseScale: 1.0 },
    buildingBack: { depth: 25, scrollSpeed: 0.24, z: 35, baseScale: 1.1 },
  },
};

(function () {
  const section = document.getElementById("parallaxSection");
  const card = document.getElementById("parallaxCard");
  const glare = document.getElementById("parallaxGlare");
  const title = document.getElementById("parallaxTitle");
  const sky = document.getElementById("layerSky");
  const buildingBack = document.getElementById("layerBuildingBack");

  const layerElements = [
    { el: sky, conf: PARALLAX_CONFIG.layers.sky },
    { el: title, conf: PARALLAX_CONFIG.layers.title },
    { el: buildingBack, conf: PARALLAX_CONFIG.layers.buildingBack },
  ];

  // Target vs Current coordinates for smooth lerping
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let tilt = { rotX: 0, rotY: 0, targetRotX: 0, targetRotY: 0 };
  let isHovering = false;
  let scrollProgress = 0;

  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Mouse move handler
  function onMouseMove(e) {
    const rect = section.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    mouse.targetX = Math.max(-1.5, Math.min(1.5, x));
    mouse.targetY = Math.max(-1.5, Math.min(1.5, y));

    tilt.targetRotY = mouse.targetX * PARALLAX_CONFIG.maxTiltY;
    tilt.targetRotX = -mouse.targetY * PARALLAX_CONFIG.maxTiltX;

    if (PARALLAX_CONFIG.enableGlare && glare) {
      const glareX = ((e.clientX - rect.left) / rect.width) * 100;
      const glareY = ((e.clientY - rect.top) / rect.height) * 100;
      section.style.setProperty("--mouse-x", `${glareX}%`);
      section.style.setProperty("--mouse-y", `${glareY}%`);
    }
  }

  section.addEventListener("mouseenter", () => {
    isHovering = true;
    if (glare && PARALLAX_CONFIG.enableGlare)
      glare.style.opacity = PARALLAX_CONFIG.glareOpacity;
  });

  section.addEventListener("mouseleave", () => {
    isHovering = false;
    mouse.targetX = 0;
    mouse.targetY = 0;
    tilt.targetRotX = 0;
    tilt.targetRotY = 0;
    if (glare) glare.style.opacity = "0";
  });

  window.addEventListener("mousemove", (e) => {
    if (isHovering) {
      onMouseMove(e);
    } else {
      const cx = (e.clientX / window.innerWidth) * 2 - 1;
      const cy = (e.clientY / window.innerHeight) * 2 - 1;
      mouse.targetX = cx * 0.2;
      mouse.targetY = cy * 0.2;
      tilt.targetRotY = cx * (PARALLAX_CONFIG.maxTiltY * 0.4);
      tilt.targetRotX = -cy * (PARALLAX_CONFIG.maxTiltX * 0.4);
    }
  });

  // Mobile Gyroscope support
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null && e.beta !== null) {
      const gamma = Math.max(-30, Math.min(30, e.gamma));
      const beta = Math.max(-30, Math.min(30, e.beta - 45));

      mouse.targetX = gamma / 30;
      mouse.targetY = beta / 30;
      tilt.targetRotY = (gamma / 30) * PARALLAX_CONFIG.maxTiltY;
      tilt.targetRotX = -(beta / 30) * PARALLAX_CONFIG.maxTiltX;
    }
  });

  // Scroll calculation
  function onScroll() {
    const rect = section.getBoundingClientRect();
    const viewportH = window.innerHeight;
    scrollProgress =
      (rect.top - viewportH / 2) / (viewportH / 2 + rect.height / 2);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Main RAF Animation Loop
  function animate(now) {
    const elapsed = now * 0.0015;
    const idleFloatX =
      !isHovering && PARALLAX_CONFIG.enableIdleFloat
        ? Math.sin(elapsed) * PARALLAX_CONFIG.idleAmplitude
        : 0;
    const idleFloatY =
      !isHovering && PARALLAX_CONFIG.enableIdleFloat
        ? Math.cos(elapsed * 0.8) * PARALLAX_CONFIG.idleAmplitude
        : 0;

    tilt.rotX = lerp(
      tilt.rotX,
      tilt.targetRotX + idleFloatY * 3,
      PARALLAX_CONFIG.lerpSpeed,
    );
    tilt.rotY = lerp(
      tilt.rotY,
      tilt.targetRotY + idleFloatX * 3,
      PARALLAX_CONFIG.lerpSpeed,
    );

    mouse.x = lerp(
      mouse.x,
      mouse.targetX + idleFloatX,
      PARALLAX_CONFIG.lerpSpeed,
    );
    mouse.y = lerp(
      mouse.y,
      mouse.targetY + idleFloatY,
      PARALLAX_CONFIG.lerpSpeed,
    );

    card.style.transform = `rotateX(${tilt.rotX.toFixed(2)}deg) rotateY(${tilt.rotY.toFixed(2)}deg)`;

    layerElements.forEach(({ el, conf }) => {
      if (!el) return;
      const moveX = (
        mouse.x *
        conf.depth *
        PARALLAX_CONFIG.mouseIntensity
      ).toFixed(2);
      const moveY = (
        mouse.y *
        conf.depth *
        PARALLAX_CONFIG.mouseIntensity *
        0.75
      ).toFixed(2);
      const scrollOffsetY = (
        scrollProgress *
        conf.scrollSpeed *
        PARALLAX_CONFIG.scrollIntensity
      ).toFixed(2);
      const totalY = (
        parseFloat(moveY) + parseFloat(scrollOffsetY)
      ).toFixed(2);

      el.style.transform = `translate3d(${moveX}px, ${totalY}px, ${conf.z}px) scale(${conf.baseScale})`;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // =========================================================================
  // 🔽 NAVBAR DROPDOWNS — click/tap toggle (hover already handled in CSS)
  // =========================================================================
  const navItems = document.querySelectorAll(".site-nav .nav-item");

  navItems.forEach((item) => {
    const toggle = item.querySelector(".dropdown-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = item.classList.contains("open");
      navItems.forEach((other) => other.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  document.addEventListener("click", () => {
    navItems.forEach((item) => item.classList.remove("open"));
  });

  // =========================================================================
  // 🎨 TITLE HOVER GLOW — cursor-following, random blue/green/maroon
  // =========================================================================
  const glowColors = ["#3b82f6", "#16a34a", "#800000"]; // blue, green, maroon
  let glowInterval = null;

  function pickRandomGlowColor() {
    const color = glowColors[Math.floor(Math.random() * glowColors.length)];
    title.style.setProperty("--glow-color", color);
  }

  if (title) {
    title.addEventListener("mouseenter", () => {
      pickRandomGlowColor();
      glowInterval = setInterval(pickRandomGlowColor, 550);
    });

    title.addEventListener("mousemove", (e) => {
      const rect = title.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      title.style.setProperty("--glow-x", `${x}%`);
      title.style.setProperty("--glow-y", `${y}%`);
    });

    title.addEventListener("mouseleave", () => {
      clearInterval(glowInterval);
      title.style.setProperty("--glow-color", "transparent");
    });
  }
})();