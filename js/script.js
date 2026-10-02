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
    buildingBack: { depth: 25, scrollSpeed: 0.24, z: 35, baseScale: 1.15 },
  },
};

(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

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
  // ✨ TITLE ENTRANCE ANIMATION — Smooth, elegant letter-by-letter slide & fade up
  // =========================================================================
  function initTitleEntrance() {
    if (!title) return;

    const rawText = title.textContent.trim();
    title.innerHTML = "";

    const charElements = [];
    [...rawText].forEach((char) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = char === " " ? "\u00A0" : char;
      title.appendChild(span);
      charElements.push(span);
    });

    if (typeof gsap !== "undefined") {
      gsap.from(charElements, {
        y: 65,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08, // Graceful sequential letter reveal
        ease: "power3.out",
        delay: 0.2,
      });
    } else {
      // CSS Fallback animation
      charElements.forEach((span, idx) => {
        span.style.opacity = "0";
        span.style.transform = "translateY(65px)";
        span.style.transition = `transform 1.15s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + idx * 0.08}s, opacity 1.15s ease ${0.2 + idx * 0.08}s`;
      });
      requestAnimationFrame(() => {
        charElements.forEach((span) => {
          span.style.opacity = "1";
          span.style.transform = "translateY(0)";
        });
      });
    }
  }

  // =========================================================================
  // 🚀 NAVBAR ENTRANCE ANIMATION — Smooth, graceful sequential fade-down
  // =========================================================================
  function initNavbarEntrance() {
    const siteLogo = document.querySelector(".site-logo");
    const siteNav = document.querySelector(".site-nav");
    const navItems = document.querySelectorAll(".site-nav > *");
    const vConnectBtn = document.querySelector(".v-connect-btn");

    if (typeof gsap !== "undefined") {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(siteLogo, {
        y: -35,
        opacity: 0,
        scale: 0.92,
        duration: 1.1,
        clearProps: "transform,opacity,scale",
      })
        .from(
          siteNav,
          {
            y: -25,
            opacity: 0,
            duration: 1.0,
            clearProps: "transform,opacity",
          },
          "-=0.75",
        )
        .from(
          navItems,
          {
            y: -18,
            opacity: 0,
            duration: 0.8,
            stagger: 0.08, // Smooth word-by-word fade down
            clearProps: "transform,opacity",
          },
          "-=0.65",
        )
        .from(
          vConnectBtn,
          {
            y: -25,
            opacity: 0,
            duration: 1.0,
            clearProps: "transform,opacity",
          },
          "-=0.75",
        );
    } else {
      // CSS Fallback
      [siteLogo, siteNav, vConnectBtn].forEach((el, i) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(-30px)";
        el.style.transition = `transform 1.0s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, opacity 1.0s ease ${i * 0.1}s`;
      });
      requestAnimationFrame(() => {
        [siteLogo, siteNav, vConnectBtn].forEach((el) => {
          if (!el) return;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        });
      });
    }
  }

  // =========================================================================
  // 📜 PAGE SECTION SLIDING & SCROLL REVEALS (GSAP + ScrollTrigger)
  // =========================================================================
  function initPageSectionSliding() {
    if (typeof gsap === "undefined") return;

    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Hero Parallax Card Subtle Depth Transition on Scroll
    const heroSection = document.getElementById("parallaxSection");
    if (heroSection && typeof ScrollTrigger !== "undefined") {
      gsap.to("#parallaxCard", {
        scrollTrigger: {
          trigger: ".parallax-wrapper",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
        y: 40,
        scale: 0.96,
        opacity: 0.88,
        ease: "none",
      });
    }

    // 2. Section 2: About / Popup Section Kinetic Reveal & Awwwards 3D Transitions
    const popupSection = document.querySelector(".popup-section");
    if (popupSection) {
      const headingInners = popupSection.querySelectorAll(".reveal-inner");
      const copy = popupSection.querySelector(".popup-copy");
      const readMoreBtn = popupSection.querySelector(".read-more-btn");
      const photoSlots = popupSection.querySelectorAll(".photo-slot");

      function playAboutReveal() {
        gsap.killTweensOf([headingInners, copy, readMoreBtn, photoSlots, popupSection.querySelector(".popup-text")]);
        const tl = gsap.timeline();

        // 0. Reset any popup-text transforms
        if (popupSection.querySelector(".popup-text")) {
          gsap.set(popupSection.querySelector(".popup-text"), { y: 0, opacity: 1 });
        }

        // 1. Kinetic Masked Line Reveal for Heading (Snappy & Crisp)
        if (headingInners.length > 0) {
          tl.fromTo(
            headingInners,
            { y: "125%", rotateZ: 3.5, opacity: 0 },
            {
              y: "0%",
              rotateZ: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.08,
              ease: "power4.out",
              clearProps: "transform,opacity",
            },
          );
        } else {
          tl.fromTo(
            popupSection.querySelector(".popup-heading"),
            { y: 45, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power4.out",
              clearProps: "all",
            },
          );
        }

        // 2. Crisp Slide-up for Body Copy
        if (copy) {
          tl.fromTo(
            copy,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              clearProps: "all",
            },
            "-=0.55",
          );
        }

        // 3. Elastic Pop for "Read More" Action Button
        if (readMoreBtn) {
          tl.fromTo(
            readMoreBtn,
            { y: 25, opacity: 0, scale: 0.88 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.65,
              ease: "back.out(1.6)",
              clearProps: "all",
            },
            "-=0.5",
          );
        }

        // 4. Staggered Dynamic 3D Polaroid Fan-out Landing (Snappier & Punchy)
        if (photoSlots.length > 0) {
          photoSlots.forEach((slot, i) => {
            const rotOffset = [-8, 6, -5, 9][i] || 0;
            tl.fromTo(
              slot,
              { opacity: 0, y: 160, x: 0, rotation: rotOffset, scale: 0.85, force3D: true },
              {
                opacity: 1,
                y: 0,
                x: 0,
                rotation: 0,
                scale: 1,
                duration: 0.85,
                ease: "back.out(1.4)",
                force3D: true,
                clearProps: "transform,opacity",
              },
              i === 0 ? "-=0.55" : "-=0.72"
            );
          });
        }
      }

      function onDotgridSlideIn() {
        gsap.to(popupSection.querySelector(".popup-gallery"), {
          x: "-10%",
          opacity: 0.65,
          duration: 1.15,
          ease: "power3.inOut"
        });
      }

      function onDotgridSlideOut() {
        gsap.to(popupSection.querySelector(".popup-gallery"), {
          x: "0%",
          opacity: 1,
          duration: 1.05,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
        if (popupSection.querySelector(".popup-text")) {
          gsap.set(popupSection.querySelector(".popup-text"), { clearProps: "all" });
        }
        if (headingInners && headingInners.length > 0) {
          gsap.set(headingInners, { clearProps: "transform,opacity" });
        }
        if (copy) {
          gsap.set(copy, { clearProps: "all" });
        }
        if (readMoreBtn) {
          gsap.set(readMoreBtn, { clearProps: "all" });
        }
      }

      window.aboutSectionActions = {
        playReveal: playAboutReveal,
        onDotgridSlideIn: onDotgridSlideIn,
        onDotgridSlideOut: onDotgridSlideOut,
      };

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.create({
          trigger: popupSection,
          start: "top 78%",
          onEnter: () => playAboutReveal(),
        });
      }

      // Robust IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playAboutReveal();
            }
          });
        },
        { threshold: 0.6 },
      );
      observer.observe(popupSection);
    }

    // 3. Section 3: Dotgrid ("What Shapes Us") Notes (Lateral Spatial Sweep & Aerodynamic Flight)
    const dotgridSection = document.querySelector(".dotgrid-section");
    if (dotgridSection) {
      const inner = dotgridSection.querySelector(".dotgrid-inner");
      const heading = dotgridSection.querySelector(".dotgrid-heading");
      const noteVision = dotgridSection.querySelector(".note-vision");
      const noteAcademics = dotgridSection.querySelector(".note-academics");
      const noteMission = dotgridSection.querySelector(".note-mission");
      const notes = [noteVision, noteAcademics, noteMission].filter(Boolean);

      let isRevealed = false;

      function showRestingState() {
        isRevealed = true;
        gsap.killTweensOf([inner, heading, ...notes]);
        if (inner) gsap.set(inner, { x: 0, opacity: 1 });
        if (heading) gsap.set(heading, { opacity: 1, x: 0, y: 0 });
        if (noteVision)
          gsap.set(noteVision, {
            x: 0,
            y: 0,
            rotation: -3.5,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
        if (noteAcademics)
          gsap.set(noteAcademics, {
            x: 0,
            y: 0,
            rotation: 12.5,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
        if (noteMission)
          gsap.set(noteMission, {
            x: 0,
            y: 0,
            rotation: -1.5,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
      }

      function flyInFromRight() {
        isRevealed = true;
        gsap.killTweensOf([inner, heading, ...notes]);

        // Lateral panel entry from the right
        if (inner) {
          gsap.fromTo(
            inner,
            { x: "50vw", opacity: 0 },
            { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", force3D: true }
          );
        }

        // Kinetic Heading with Neon Accents
        if (heading) {
          gsap.fromTo(
            heading,
            { opacity: 0, x: 60 },
            { opacity: 1, x: 0, duration: 1.1, ease: "power3.out" },
          );
          const hlSpans = heading.querySelectorAll(".hl-green, .hl-red, .hl-yellow");
          if (hlSpans.length > 0) {
            gsap.fromTo(
              hlSpans,
              { scale: 0.75, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.85, stagger: 0.12, ease: "back.out(2)", delay: 0.2 }
            );
          }
        }

        // Aerodynamic 3D Flight of Sticky Notes entering with the lateral sweep
        if (noteVision) {
          gsap.fromTo(
            noteVision,
            { x: "115vw", y: 35, rotation: 22, rotateX: 20, scale: 0.84, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -3.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.35,
              ease: "power4.out",
              delay: 0.08,
              force3D: true,
            },
          );
        }

        if (noteAcademics) {
          gsap.fromTo(
            noteAcademics,
            { x: "135vw", y: -30, rotation: -18, rotateX: -20, scale: 0.84, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: 12.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.4,
              ease: "power4.out",
              delay: 0.18,
              force3D: true,
            },
          );
        }

        if (noteMission) {
          gsap.fromTo(
            noteMission,
            { x: "155vw", y: 45, rotation: 20, rotateX: 18, scale: 0.84, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -1.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.45,
              ease: "power4.out",
              delay: 0.28,
              force3D: true,
            },
          );
        }
      }

      function flyAwayToLeft() {
        isRevealed = false;
        gsap.killTweensOf([inner, heading, ...notes]);

        if (heading) {
          gsap.to(heading, { opacity: 0, y: -25, duration: 0.65, ease: "power2.inOut" });
        }

        if (noteVision) {
          gsap.to(noteVision, {
            x: "-120vw",
            y: -30,
            rotation: -22,
            rotateX: -15,
            scale: 0.9,
            opacity: 0,
            duration: 0.95,
            ease: "power3.inOut",
            force3D: true,
          });
        }

        if (noteAcademics) {
          gsap.to(noteAcademics, {
            x: "-140vw",
            y: 25,
            rotation: 18,
            rotateX: 15,
            scale: 0.9,
            opacity: 0,
            duration: 1.0,
            delay: 0.08,
            ease: "power3.inOut",
            force3D: true,
          });
        }

        if (noteMission) {
          gsap.to(noteMission, {
            x: "-160vw",
            y: -20,
            rotation: -18,
            rotateX: -15,
            scale: 0.9,
            opacity: 0,
            duration: 1.05,
            delay: 0.16,
            ease: "power3.inOut",
            force3D: true,
          });
        }
      }

      function flyInFromLeft() {
        isRevealed = true;
        gsap.killTweensOf([inner, heading, ...notes]);

        if (heading) {
          gsap.fromTo(
            heading,
            { opacity: 0, y: -30 },
            { opacity: 1, y: 0, duration: 1.15, ease: "power3.out" },
          );
        }

        if (noteVision) {
          gsap.fromTo(
            noteVision,
            { x: "-120vw", y: -30, rotation: -22, rotateX: -20, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -3.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.4,
              ease: "power4.out",
              delay: 0.06,
              force3D: true,
            },
          );
        }

        if (noteAcademics) {
          gsap.fromTo(
            noteAcademics,
            { x: "-140vw", y: 25, rotation: 18, rotateX: 20, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: 12.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.45,
              ease: "power4.out",
              delay: 0.16,
              force3D: true,
            },
          );
        }

        if (noteMission) {
          gsap.fromTo(
            noteMission,
            { x: "-160vw", y: -20, rotation: -18, rotateX: -18, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -1.5,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              duration: 1.5,
              ease: "power4.out",
              delay: 0.26,
              force3D: true,
            },
          );
        }
      }

      function flyAwayToRight() {
        isRevealed = false;
        gsap.killTweensOf([inner, heading, ...notes]);

        // Lateral panel exit to the right
        if (inner) {
          gsap.to(inner, { x: "55vw", opacity: 0, duration: 0.95, ease: "power3.inOut" });
        }

        if (heading) {
          gsap.to(heading, { opacity: 0, x: 60, duration: 0.65, ease: "power2.inOut" });
        }

        if (noteVision) {
          gsap.to(noteVision, {
            x: "115vw",
            y: 35,
            rotation: 18,
            rotateX: 18,
            scale: 0.9,
            opacity: 0,
            duration: 0.95,
            ease: "power3.inOut",
            force3D: true,
          });
        }

        if (noteAcademics) {
          gsap.to(noteAcademics, {
            x: "135vw",
            y: -25,
            rotation: -14,
            rotateX: -18,
            scale: 0.9,
            opacity: 0,
            duration: 1.0,
            delay: 0.08,
            ease: "power3.inOut",
            force3D: true,
          });
        }

        if (noteMission) {
          gsap.to(noteMission, {
            x: "155vw",
            y: 40,
            rotation: 16,
            rotateX: 16,
            scale: 0.9,
            opacity: 0,
            duration: 1.05,
            delay: 0.16,
            ease: "power3.inOut",
            force3D: true,
          });
        }
      }

      let lastScrollY = window.scrollY;

      // Expose actions for section pagination orchestration
      window.shapesSectionActions = {
        flyInFromRight,
        flyAwayToLeft,
        flyInFromLeft,
        flyAwayToRight,
        isRevealed: () => isRevealed,
      };
    }
  }

  // =========================================================================
  // 📑 ONE-SCROLL SECTION & HORIZONTAL STAGE PAGINATION
  // =========================================================================
  function initSectionPagination() {
    const heroSec = document.getElementById("parallaxSection") || document.querySelector(".parallax-section");
    const horizontalStage = document.getElementById("horizontalStage");
    const shapesSec = document.getElementById("shapesSection");
    const facultySec = document.getElementById("facultySection");
    const footerSec = document.getElementById("footerSection");

    if (!horizontalStage || !shapesSec) return;

    // 5 Visual Stages:
    // 0: Hero
    // 1: About (Polaroids Gallery)
    // 2: Dotgrid ("What Shapes Us" - Horizontal Lateral Sweep Door)
    // 3: Faculty
    // 4: Footer
    let currentStage = 0;
    let isTransitioning = false;

    // Determine current stage based on scroll position & dotgrid state
    function getCurrentStage() {
      const scrollY = window.scrollY;
      const stageTop = horizontalStage.offsetTop;
      const facultyTop = facultySec ? facultySec.offsetTop : Infinity;
      const footerTop = footerSec ? footerSec.offsetTop : Infinity;

      const tolerance = 120;

      if (scrollY < stageTop - tolerance) {
        return 0; // Hero
      } else if (scrollY >= stageTop - tolerance && scrollY < facultyTop - tolerance) {
        // We are on horizontal stage: check if dotgrid is slid in
        const transform = window.getComputedStyle(shapesSec).transform;
        if (transform && transform !== "none") {
          const matrix = new DOMMatrixReadOnly(transform);
          // If shapesSec is slid in (m41 near 0)
          if (matrix.m41 < window.innerWidth * 0.4) {
            return 2; // Dotgrid
          }
        }
        return 1; // About
      } else if (scrollY >= facultyTop - tolerance && scrollY < footerTop - tolerance) {
        return 3; // Faculty
      } else {
        return 4; // Footer
      }
    }

    currentStage = getCurrentStage();

    function goToStage(target) {
      if (target < 0 || target > 4) return;
      if (target === currentStage && !isTransitioning) return;

      isTransitioning = true;
      const from = currentStage;
      currentStage = target;

      // === 🚀 1 -> 2: LATERAL HORIZONTAL SWEEP (About -> Dotgrid) ===
      if (from === 1 && target === 2) {
        horizontalStage.scrollIntoView({ behavior: "auto" });

        gsap.to(shapesSec, {
          x: "0%",
          duration: 1.15,
          ease: "power3.inOut",
          force3D: true,
          onStart: () => {
            if (window.aboutSectionActions && window.aboutSectionActions.onDotgridSlideIn) {
              window.aboutSectionActions.onDotgridSlideIn();
            }
            if (window.shapesSectionActions && window.shapesSectionActions.flyInFromRight) {
              window.shapesSectionActions.flyInFromRight();
            }
          },
          onComplete: () => {
            setTimeout(() => {
              isTransitioning = false;
            }, 180);
          },
        });
        return;
      }

      // === 🚀 2 -> 1: SWEEP BACK REVEAL (Dotgrid -> About) ===
      if (from === 2 && target === 1) {
        horizontalStage.scrollIntoView({ behavior: "auto" });

        gsap.to(shapesSec, {
          x: "100%",
          duration: 1.15,
          ease: "power3.inOut",
          force3D: true,
          onStart: () => {
            if (window.shapesSectionActions && window.shapesSectionActions.flyAwayToRight) {
              window.shapesSectionActions.flyAwayToRight();
            }
            if (window.aboutSectionActions && window.aboutSectionActions.onDotgridSlideOut) {
              window.aboutSectionActions.onDotgridSlideOut();
            }
          },
          onComplete: () => {
            setTimeout(() => {
              isTransitioning = false;
            }, 180);
          },
        });
        return;
      }

      // === 0 -> 1: Hero to About ===
      if (from === 0 && target === 1) {
        gsap.set(shapesSec, { x: "100%" });
        horizontalStage.scrollIntoView({ behavior: "smooth" });
        if (window.aboutSectionActions && window.aboutSectionActions.playReveal) {
          window.aboutSectionActions.playReveal();
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // === 1 -> 0: About to Hero ===
      if (from === 1 && target === 0) {
        if (heroSec) {
          heroSec.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // === 2 -> 3: Dotgrid down to Faculty ===
      if (from === 2 && target === 3) {
        if (window.shapesSectionActions && window.shapesSectionActions.flyAwayToLeft) {
          window.shapesSectionActions.flyAwayToLeft();
        }
        if (facultySec) {
          facultySec.scrollIntoView({ behavior: "smooth" });
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // === 3 -> 2: Faculty up to Dotgrid ===
      if (from === 3 && target === 2) {
        gsap.set(shapesSec, { x: "0%" });
        horizontalStage.scrollIntoView({ behavior: "smooth" });
        if (window.shapesSectionActions && window.shapesSectionActions.flyInFromLeft) {
          window.shapesSectionActions.flyInFromLeft();
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // === 3 -> 4: Faculty to Footer ===
      if (from === 3 && target === 4) {
        if (footerSec) {
          footerSec.scrollIntoView({ behavior: "smooth" });
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // === 4 -> 3: Footer to Faculty ===
      if (from === 4 && target === 3) {
        if (facultySec) {
          facultySec.scrollIntoView({ behavior: "smooth" });
        }
        setTimeout(() => {
          isTransitioning = false;
        }, 850);
        return;
      }

      // Multi-step jump fallback
      if (target === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === 1) {
        gsap.set(shapesSec, { x: "100%" });
        horizontalStage.scrollIntoView({ behavior: "smooth" });
      } else if (target === 2) {
        gsap.set(shapesSec, { x: "0%" });
        horizontalStage.scrollIntoView({ behavior: "smooth" });
      } else if (target === 3 && facultySec) {
        facultySec.scrollIntoView({ behavior: "smooth" });
      } else if (target === 4 && footerSec) {
        footerSec.scrollIntoView({ behavior: "smooth" });
      }
      setTimeout(() => {
        isTransitioning = false;
      }, 850);
    }

    // Wheel event listener: 1 gesture scrolls to the next stage
    window.addEventListener(
      "wheel",
      (e) => {
        if (isTransitioning) {
          e.preventDefault();
          return;
        }

        if (Math.abs(e.deltaY) > 22) {
          e.preventDefault();
          currentStage = getCurrentStage();
          if (e.deltaY > 0) {
            goToStage(currentStage + 1);
          } else {
            goToStage(currentStage - 1);
          }
        }
      },
      { passive: false },
    );

    // Keyboard navigation (Arrow keys / PageUp / PageDown)
    window.addEventListener("keydown", (e) => {
      if (isTransitioning) return;
      if (["ArrowDown", "PageDown", "Space"].includes(e.code)) {
        e.preventDefault();
        currentStage = getCurrentStage();
        goToStage(currentStage + 1);
      } else if (["ArrowUp", "PageUp"].includes(e.code)) {
        e.preventDefault();
        currentStage = getCurrentStage();
        goToStage(currentStage - 1);
      }
    });

    // Touch swipe navigation for mobile
    let touchStartY = 0;
    window.addEventListener(
      "touchstart",
      (e) => {
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    window.addEventListener(
      "touchend",
      (e) => {
        if (isTransitioning) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchStartY - touchEndY;
        if (Math.abs(diffY) > 45) {
          currentStage = getCurrentStage();
          if (diffY > 0) {
            goToStage(currentStage + 1);
          } else {
            goToStage(currentStage - 1);
          }
        }
      },
      { passive: true },
    );
  }

  // =========================================================================
  // 🌐 DOT GRID 3D MOUSE DEPTH & REACTIVE PARALLAX
  // =========================================================================
  function initDotgrid3DParallax() {
    const section = document.querySelector(".dotgrid-section");
    const bg = document.getElementById("dotgridBg");
    const inner = section ? section.querySelector(".dotgrid-inner") : null;
    if (!section || !bg) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isInside = false;

    function onMouseMove(e) {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      targetX = Math.max(-1.5, Math.min(1.5, x));
      targetY = Math.max(-1.5, Math.min(1.5, y));
    }

    section.addEventListener("mouseenter", () => {
      isInside = true;
    });

    section.addEventListener("mouseleave", () => {
      isInside = false;
      targetX = 0;
      targetY = 0;
    });

    window.addEventListener("mousemove", (e) => {
      if (isInside) {
        onMouseMove(e);
      } else {
        const cx = (e.clientX / window.innerWidth) * 2 - 1;
        const cy = (e.clientY / window.innerHeight) * 2 - 1;
        targetX = cx * 0.25;
        targetY = cy * 0.25;
      }
    });

    function animate() {
      // Butter-smooth lerping
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      // Subtle, refined background grid 3D movement
      const bgMoveX = (-currentX * 16).toFixed(2);
      const bgMoveY = (-currentY * 12).toFixed(2);
      const rotY = (currentX * 1.8).toFixed(2);
      const rotX = (-currentY * 1.4).toFixed(2);

      bg.style.transform = `translate3d(${bgMoveX}px, ${bgMoveY}px, -20px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;

      // Subtle foreground content counter-parallax
      if (inner) {
        const fgMoveX = (currentX * 6).toFixed(2);
        const fgMoveY = (currentY * 4).toFixed(2);
        inner.style.transform = `translate3d(${fgMoveX}px, ${fgMoveY}px, 10px)`;
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // Run animations
  initNavbarEntrance();
  initTitleEntrance();
  initPageSectionSliding();
  initSectionPagination();
  initDotgrid3DParallax();

    // =========================================================================
  // =========================================================================
  // ⚛️ MATTER.JS 2D PHYSICS ENGINE FOR FOOTER CAPSULES
  // =========================================================================
  function initMatterPhysicsCapsules() {
    const container = document.querySelector(".footer-capsules");
    const footerSec = document.getElementById("footerSection");
    if (!container || typeof Matter === "undefined") return;

    const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

    let engine = null;
    let runner = null;
    let floor = null, leftWall = null, rightWall = null, ceiling = null;
    let pairs = [];
    let isRunning = false;
    let floatTimeout = null;
    let isFloating = false;
    let floatingStartTime = 0;
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };

    const capsuleEls = container.querySelectorAll(".capsule");

    // Initial state: hide capsules until section enters viewport
    function resetCapsulesDOM() {
      capsuleEls.forEach((el) => {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        el.style.transform = "translate3d(0, -250px, 0)";
      });
    }

    resetCapsulesDOM();

    // Prevent link click when dragged
    let dragListenersAttached = false;
    function attachDragListeners() {
      if (dragListenersAttached) return;
      dragListenersAttached = true;
      container.querySelectorAll("a.capsule").forEach((link) => {
        link.addEventListener("click", (e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      });
    }
    attachDragListeners();

    function startPhysics() {
      if (isRunning) return;
      isRunning = true;
      isFloating = false;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 320;

      engine = Engine.create({
        gravity: { x: 0, y: 1.2, scale: 0.0012 }
      });

      // Bounding box walls - floor aligned directly with the bottom end of the page
      floor = Bodies.rectangle(width / 2, height + 15, width * 3, 30, {
        isStatic: true,
        restitution: 0.82,
        friction: 0.15
      });

      leftWall = Bodies.rectangle(-20, height / 2, 40, height * 4, {
        isStatic: true,
        restitution: 0.7
      });

      rightWall = Bodies.rectangle(width + 20, height / 2, 40, height * 4, {
        isStatic: true,
        restitution: 0.7
      });

      // Ceiling is placed high above during drop so it never blocks falling capsules
      ceiling = Bodies.rectangle(width / 2, -800, width * 3, 40, {
        isStatic: true,
        restitution: 0.7
      });

      Composite.add(engine.world, [floor, leftWall, rightWall, ceiling]);

      // Measure and create rigid bodies for each DOM capsule
      const total = capsuleEls.length;
      pairs = [];

      capsuleEls.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const w = rect.width || (el.classList.contains("capsule-circle") ? 60 : el.classList.contains("capsule-sm") ? 130 : 240);
        const h = rect.height || (el.classList.contains("capsule-circle") ? 60 : el.classList.contains("capsule-sm") ? 56 : 72);

        // Calculate staggered drop positions from above viewport
        const xOffset = (width * 0.08) + (index / total) * (width * 0.84) + (Math.random() - 0.5) * 30;
        const yOffset = -50 - (index * 42) - (Math.random() * 50);
        const parsedRot = parseFloat(el.style.getPropertyValue("--rot")) || (Math.random() * 40 - 20);
        const startAngle = (parsedRot * Math.PI) / 180;

        let body;
        if (el.classList.contains("capsule-circle")) {
          body = Bodies.circle(xOffset, yOffset, w / 2, {
            restitution: 0.88,
            friction: 0.05,
            frictionAir: 0.01,
            density: 0.002
          });
        } else {
          body = Bodies.rectangle(xOffset, yOffset, w, h, {
            chamfer: { radius: h / 2 },
            restitution: 0.82,
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.002
          });
        }

        Matter.Body.setAngle(body, startAngle);
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);

        Composite.add(engine.world, body);
        pairs.push({ el, body, w, h, seed: Math.random() * 100, index });

        // Set immediate initial position so they are ready
        el.style.transform = `translate3d(${xOffset - w / 2}px, ${yOffset - h / 2}px, 0px) rotate(${parsedRot}deg)`;
        el.style.opacity = "1";
        el.style.visibility = "visible";
      });

      // Transition to Zero-Gravity Floating after first bounce
      floatTimeout = setTimeout(() => {
        if (!isRunning || !engine) return;
        isFloating = true;
        floatingStartTime = Date.now();
        engine.gravity.y = 0;
        engine.gravity.scale = 0.0001;

        // Bring ceiling down to top boundary to contain floating bodies
        if (ceiling) {
          Matter.Body.setPosition(ceiling, { x: width / 2, y: -15 });
        }

        // Increase air damping so capsules float smoothly
        pairs.forEach(({ body }) => {
          body.frictionAir = 0.032;
          body.restitution = 0.75;
          Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * 0.004,
            y: -0.006 - Math.random() * 0.004
          });
        });
      }, 1600);

      // Mouse and Touch Interaction
      const mouse = Mouse.create(container);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false }
        }
      });

      Composite.add(engine.world, mouseConstraint);

      Events.on(mouseConstraint, "startdrag", (e) => {
        isDragging = false;
        dragStartPos = { x: e.mouse.position.x, y: e.mouse.position.y };
      });

      Events.on(mouseConstraint, "mousemove", (e) => {
        if (mouseConstraint.body) {
          const dist = Math.hypot(e.mouse.position.x - dragStartPos.x, e.mouse.position.y - dragStartPos.y);
          if (dist > 6) isDragging = true;
        }
      });

      // Physics loop
      Events.on(engine, "beforeUpdate", () => {
        if (!isFloating) return;

        const time = (Date.now() - floatingStartTime) * 0.0015;

        // Apply organic zero-g micro-drift forces to each floating capsule
        pairs.forEach(({ body, seed, index }) => {
          const fx = Math.sin(time * 1.2 + seed) * 0.00014;
          const fy = Math.cos(time * 0.9 + seed + index) * 0.00012;
          const spin = Math.sin(time * 0.7 + seed) * 0.00003;

          Matter.Body.applyForce(body, body.position, { x: fx, y: fy });
          Matter.Body.setAngularVelocity(body, body.angularVelocity * 0.98 + spin);

          // Soft buoyant repelling boundaries
          const padBottom = 25;
          const padTop = 30;
          const padSides = 30;

          if (body.position.y > height - padBottom) {
            Matter.Body.applyForce(body, body.position, { x: 0, y: -0.0014 });
          } else if (body.position.y < padTop) {
            Matter.Body.applyForce(body, body.position, { x: 0, y: 0.0012 });
          }

          if (body.position.x > width - padSides) {
            Matter.Body.applyForce(body, body.position, { x: -0.0012, y: 0 });
          } else if (body.position.x < padSides) {
            Matter.Body.applyForce(body, body.position, { x: 0.0012, y: 0 });
          }
        });
      });

      // Sync Matter body coordinates to DOM styles
      Events.on(engine, "afterUpdate", () => {
        pairs.forEach(({ el, body, w, h }) => {
          const posX = (body.position.x - w / 2).toFixed(2);
          const posY = (body.position.y - h / 2).toFixed(2);
          const deg = (body.angle * (180 / Math.PI)).toFixed(2);
          el.style.transform = `translate3d(${posX}px, ${posY}px, 0px) rotate(${deg}deg)`;
        });
      });

      runner = Runner.create();
      Runner.run(runner, engine);
    }

    function stopPhysics() {
      if (!isRunning) return;
      isRunning = false;

      if (floatTimeout) {
        clearTimeout(floatTimeout);
        floatTimeout = null;
      }

      if (runner) {
        Runner.stop(runner);
        runner = null;
      }

      if (engine) {
        Events.off(engine);
        Composite.clear(engine.world, false, true);
        Engine.clear(engine);
        engine = null;
      }

      pairs = [];
      resetCapsulesDOM();
    }

    // Play ONLY when the section is on the viewport
    const observeTarget = footerSec || container;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startPhysics();
            } else {
              stopPhysics();
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(observeTarget);
    } else {
      startPhysics();
    }

    // Resize handling to keep walls matched to container
    window.addEventListener("resize", () => {
      if (!isRunning || !engine || !floor) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 320;

      Matter.Body.setPosition(floor, { x: w / 2, y: h + 15 });
      Matter.Body.setPosition(leftWall, { x: -20, y: h / 2 });
      Matter.Body.setPosition(rightWall, { x: w + 20, y: h / 2 });
    });
  }

  initMatterPhysicsCapsules();
})();

// =========================================================================
// 🎓 FACULTY TABS — swap active course + panel color
// =========================================================================
const facultyTabs = document.querySelectorAll(".faculty-tab");
const facultyPanel = document.getElementById("facultyPanel");
const facultyContents = document.querySelectorAll(".faculty-content");

facultyTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    facultyTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const targetKey = tab.dataset.tab;
    facultyContents.forEach((content) => {
      content.classList.toggle("active", content.dataset.content === targetKey);
    });

    if (facultyPanel) {
      facultyPanel.style.setProperty("--panel-color", tab.dataset.color);
    }
  });
});

// =========================================================================
// 🎯 HIGHLIGHT BOX SELECTION ANIMATION (Scroll-Triggered)
// =========================================================================
const highlightPinkBox = document.querySelector(".highlight-pink-box");
const facultySection = document.getElementById("facultySection");

if (facultySection && "IntersectionObserver" in window) {
  const selectObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          facultySection.classList.add("is-in-view");
        } else {
          facultySection.classList.remove("is-in-view");
        }
      });
    },
    { threshold: 0.25 }
  );

  selectObserver.observe(facultySection);
}

// =========================================================================
// 🍔 HAMBURGER MENU — Mobile drawer toggle
// =========================================================================
(function () {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const overlay = document.getElementById("mobileNavOverlay");
  const drawer = document.getElementById("mobileNavDrawer");
  const closeBtn = document.getElementById("mobileNavClose");

  if (!hamburgerBtn || !overlay || !drawer) return;

  function openDrawer() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    hamburgerBtn.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    hamburgerBtn.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  hamburgerBtn.addEventListener("click", () => {
    if (overlay.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  // Close on overlay backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDrawer();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) {
      closeDrawer();
    }
  });
})();