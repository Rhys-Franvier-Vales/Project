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
  // ✨ TITLE ENTRANCE ANIMATION — Quick letter-by-letter slide & fade up
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
        y: 60,
        opacity: 0,
        duration: 0.85,
        stagger: 0.05, // Quick, crisp sequential reveal
        ease: "power3.out",
        delay: 0.15,
      });
    } else {
      // CSS Fallback animation
      charElements.forEach((span, idx) => {
        span.style.opacity = "0";
        span.style.transform = "translateY(60px)";
        span.style.transition = `transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + idx * 0.05}s, opacity 0.85s ease ${0.15 + idx * 0.05}s`;
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
  // 🚀 NAVBAR ENTRANCE ANIMATION — Smooth sequential fade-down
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
        duration: 0.85,
        clearProps: "transform,opacity,scale",
      })
        .from(
          siteNav,
          {
            y: -25,
            opacity: 0,
            duration: 0.75,
            clearProps: "transform,opacity",
          },
          "-=0.6",
        )
        .from(
          navItems,
          {
            y: -18,
            opacity: 0,
            duration: 0.55,
            stagger: 0.05, // Quick, snappy word-by-word fade down
            clearProps: "transform,opacity",
          },
          "-=0.5",
        )
        .from(
          vConnectBtn,
          {
            y: -25,
            opacity: 0,
            duration: 0.75,
            clearProps: "transform,opacity",
          },
          "-=0.6",
        );
    } else {
      // CSS Fallback
      [siteLogo, siteNav, vConnectBtn].forEach((el, i) => {
        if (!el) return;
        el.style.opacity = "0";
        el.style.transform = "translateY(-30px)";
        el.style.transition = `transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s, opacity 0.75s ease ${i * 0.08}s`;
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

    // 2. Section 2: About / Popup Section Sliding Reveal
    const popupSection = document.querySelector(".popup-section");
    if (popupSection) {
      const textElements = popupSection.querySelectorAll(
        ".popup-heading, .popup-copy, .read-more-btn",
      );
      const photoSlots = popupSection.querySelectorAll(".photo-slot");

      if (typeof ScrollTrigger !== "undefined") {
        const popupTl = gsap.timeline({
          scrollTrigger: {
            trigger: popupSection,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        });

        popupTl
          .from(textElements, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            clearProps: "all",
          })
          .from(
            photoSlots,
            {
              opacity: 0,
              y: 100,
              scale: 0.82,
              duration: 0.9,
              stagger: { amount: 0.45, from: "random" },
              ease: "back.out(1.3)",
              clearProps: "all",
            },
            "-=0.45",
          );
      } else {
        // Fallback with IntersectionObserver
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                observer.disconnect();
                gsap.from(textElements, {
                  opacity: 0,
                  y: 40,
                  duration: 0.8,
                  stagger: 0.12,
                  ease: "power3.out",
                  clearProps: "all",
                });
                gsap.from(photoSlots, {
                  opacity: 0,
                  y: 100,
                  scale: 0.82,
                  duration: 0.9,
                  stagger: { amount: 0.45, from: "random" },
                  ease: "back.out(1.3)",
                  clearProps: "all",
                });
              }
            });
          },
          { threshold: 0.15 },
        );
        observer.observe(popupSection);
      }
    }

    // 3. Section 3: Dotgrid ("What Shapes Us") Section Sliding Reveal
    const dotgridSection = document.querySelector(".dotgrid-section");
    if (dotgridSection) {
      const heading = dotgridSection.querySelector(".dotgrid-heading");
      const notes = dotgridSection.querySelectorAll(".sticky-note");

      if (typeof ScrollTrigger !== "undefined") {
        const dotgridTl = gsap.timeline({
          scrollTrigger: {
            trigger: dotgridSection,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        });

        dotgridTl
          .from(heading, {
            opacity: 0,
            y: 45,
            duration: 0.85,
            ease: "power3.out",
            clearProps: "opacity,transform",
          })
          .from(
            notes,
            {
              opacity: 0,
              y: 90,
              scale: 0.8,
              duration: 0.85,
              stagger: 0.16,
              ease: "back.out(1.4)",
              clearProps: "opacity,transform",
            },
            "-=0.45",
          );
      } else {
        // Fallback with IntersectionObserver
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                observer.disconnect();
                gsap.from(heading, {
                  opacity: 0,
                  y: 45,
                  duration: 0.85,
                  ease: "power3.out",
                  clearProps: "opacity,transform",
                });
                gsap.from(notes, {
                  opacity: 0,
                  y: 90,
                  scale: 0.8,
                  duration: 0.85,
                  stagger: 0.16,
                  ease: "back.out(1.4)",
                  clearProps: "opacity,transform",
                });
              }
            });
          },
          { threshold: 0.15 },
        );
        observer.observe(dotgridSection);
      }
    }
  }

  // =========================================================================
  // 📑 ONE-SCROLL SECTION PAGINATION (Small Scroll -> Next Section)
  // =========================================================================
  function initSectionPagination() {
    const sections = Array.from(document.querySelectorAll(".snap-section"));
    if (sections.length === 0) return;

    let isScrolling = false;

    function getClosestSectionIndex() {
      const scrollY = window.scrollY;
      let closestIdx = 0;
      let minDiff = Infinity;
      sections.forEach((sec, idx) => {
        const diff = Math.abs(sec.offsetTop - scrollY);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      return closestIdx;
    }

    function goToSection(index) {
      if (index < 0 || index >= sections.length) return;
      isScrolling = true;
      sections[index].scrollIntoView({ behavior: "smooth" });

      setTimeout(() => {
        isScrolling = false;
      }, 650);
    }

    // Wheel event: small scroll gesture triggers smooth jump to next/prev section
    window.addEventListener(
      "wheel",
      (e) => {
        if (isScrolling) {
          e.preventDefault();
          return;
        }

        if (Math.abs(e.deltaY) > 20) {
          e.preventDefault();
          const currentIndex = getClosestSectionIndex();
          if (e.deltaY > 0) {
            goToSection(currentIndex + 1);
          } else {
            goToSection(currentIndex - 1);
          }
        }
      },
      { passive: false },
    );

    // Keyboard navigation (Arrow keys / PageUp / PageDown)
    window.addEventListener("keydown", (e) => {
      if (["ArrowDown", "PageDown", "Space"].includes(e.code)) {
        e.preventDefault();
        const currentIndex = getClosestSectionIndex();
        goToSection(currentIndex + 1);
      } else if (["ArrowUp", "PageUp"].includes(e.code)) {
        e.preventDefault();
        const currentIndex = getClosestSectionIndex();
        goToSection(currentIndex - 1);
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
        if (isScrolling) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchStartY - touchEndY;
        if (Math.abs(diffY) > 40) {
          const currentIndex = getClosestSectionIndex();
          if (diffY > 0) {
            goToSection(currentIndex + 1);
          } else {
            goToSection(currentIndex - 1);
          }
        }
      },
      { passive: true },
    );
  }

  // Run animations
  initNavbarEntrance();
  initTitleEntrance();
  initPageSectionSliding();
  initSectionPagination();
})();