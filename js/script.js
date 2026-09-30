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

    // 2. Section 2: About / Popup Section Kinetic Reveal
    const popupSection = document.querySelector(".popup-section");
    if (popupSection) {
      const headingInners = popupSection.querySelectorAll(".reveal-inner");
      const copy = popupSection.querySelector(".popup-copy");
      const readMoreBtn = popupSection.querySelector(".read-more-btn");
      const photoSlots = popupSection.querySelectorAll(".photo-slot");

      let hasPlayed = false;

      function playAboutReveal() {
        if (hasPlayed) return;
        hasPlayed = true;

        const tl = gsap.timeline();

        // 1. Kinetic Masked Line Reveal for Heading
        if (headingInners.length > 0) {
          tl.fromTo(
            headingInners,
            { y: "125%", rotateZ: 3.5, opacity: 0 },
            {
              y: "0%",
              rotateZ: 0,
              opacity: 1,
              duration: 1.15,
              stagger: 0.15,
              ease: "power4.out",
              clearProps: "transform,opacity",
            },
          );
        } else {
          tl.fromTo(
            popupSection.querySelector(".popup-heading"),
            { y: 55, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.05,
              ease: "power4.out",
              clearProps: "all",
            },
          );
        }

        // 2. Luxurious Blur + Slide-up for Body Copy
        if (copy) {
          tl.fromTo(
            copy,
            { y: 45, opacity: 0, filter: "blur(10px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 1.0,
              ease: "power3.out",
              clearProps: "all",
            },
            "-=0.8",
          );
        }

        // 3. Elastic Pop for "Read More" Action Button
        if (readMoreBtn) {
          tl.fromTo(
            readMoreBtn,
            { y: 30, opacity: 0, scale: 0.85 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.85,
              ease: "back.out(1.6)",
              clearProps: "all",
            },
            "-=0.65",
          );
        }

        // 4. Staggered Dynamic Polaroid Fan-out Entrance
        if (photoSlots.length > 0) {
          tl.fromTo(
            photoSlots,
            { opacity: 0, y: 130, scale: 0.82 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.05,
              stagger: { amount: 0.45, from: "start" },
              ease: "back.out(1.25)",
              clearProps: "all",
            },
            "-=0.7",
          );
        }
      }

      window.aboutSectionActions = {
        playReveal: playAboutReveal,
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
        { threshold: 1 },
      );
      observer.observe(popupSection);
    }

    // 3. Section 3: Dotgrid ("What Shapes Us") Notes (Ultra-Smooth Aerodynamic Flight)
    const dotgridSection = document.querySelector(".dotgrid-section");
    if (dotgridSection) {
      const heading = dotgridSection.querySelector(".dotgrid-heading");
      const noteVision = dotgridSection.querySelector(".note-vision");
      const noteAcademics = dotgridSection.querySelector(".note-academics");
      const noteMission = dotgridSection.querySelector(".note-mission");
      const notes = [noteVision, noteAcademics, noteMission].filter(Boolean);

      let isRevealed = false;

      function showRestingState() {
        isRevealed = true;
        gsap.killTweensOf([heading, ...notes]);
        if (heading) gsap.set(heading, { opacity: 1, y: 0 });
        if (noteVision)
          gsap.set(noteVision, {
            x: 0,
            y: 0,
            rotation: -3.5,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
        if (noteAcademics)
          gsap.set(noteAcademics, {
            x: 0,
            y: 0,
            rotation: 12.5,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
        if (noteMission)
          gsap.set(noteMission, {
            x: 0,
            y: 0,
            rotation: -1.5,
            scale: 1,
            opacity: 1,
            force3D: true,
          });
      }

      function flyInFromRight() {
        isRevealed = true;
        gsap.killTweensOf([heading, ...notes]);

        if (heading) {
          gsap.fromTo(
            heading,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, duration: 1.15, ease: "power3.out" },
          );
        }

        if (noteVision) {
          gsap.fromTo(
            noteVision,
            { x: "115vw", y: 35, rotation: 18, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -3.5,
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
            { x: "135vw", y: -25, rotation: -14, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: 12.5,
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
            { x: "155vw", y: 40, rotation: 16, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -1.5,
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

      function flyAwayToLeft() {
        isRevealed = false;
        gsap.killTweensOf([heading, ...notes]);

        if (heading) {
          gsap.to(heading, { opacity: 0, y: -25, duration: 0.65, ease: "power2.inOut" });
        }

        if (noteVision) {
          gsap.to(noteVision, {
            x: "-120vw",
            y: -30,
            rotation: -22,
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
        gsap.killTweensOf([heading, ...notes]);

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
            { x: "-120vw", y: -30, rotation: -22, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -3.5,
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
            { x: "-140vw", y: 25, rotation: 18, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: 12.5,
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
            { x: "-160vw", y: -20, rotation: -18, scale: 0.88, opacity: 0 },
            {
              x: 0,
              y: 0,
              rotation: -1.5,
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
        gsap.killTweensOf([heading, ...notes]);

        if (heading) {
          gsap.to(heading, { opacity: 0, y: 35, duration: 0.65, ease: "power2.inOut" });
        }

        if (noteVision) {
          gsap.to(noteVision, {
            x: "115vw",
            y: 35,
            rotation: 18,
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

      // Robust IntersectionObserver that reliably handles page loads & directional in-view checks
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const currentScrollY = window.scrollY;
            if (entry.isIntersecting) {
              if (!isRevealed) {
                // If coming upwards from Faculty section below
                if (currentScrollY > dotgridSection.offsetTop) {
                  flyInFromLeft();
                } else {
                  flyInFromRight();
                }
              }
            } else {
              if (entry.boundingClientRect.top < 0) {
                flyAwayToLeft();
              } else {
                flyAwayToRight();
              }
            }
            lastScrollY = currentScrollY;
          });
        },
        { threshold: 0.3 },
      );

      observer.observe(dotgridSection);
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

      const currentIndex = getClosestSectionIndex();
      const currentSec = sections[currentIndex];
      const targetSec = sections[index];

      // 1. If leaving Dotgrid section, allow notes to fly away first before scrolling
      if (
        currentSec &&
        currentSec.classList.contains("dotgrid-section") &&
        window.shapesSectionActions
      ) {
        if (index > currentIndex) {
          window.shapesSectionActions.flyAwayToLeft();
        } else {
          window.shapesSectionActions.flyAwayToRight();
        }

        setTimeout(() => {
          targetSec.scrollIntoView({ behavior: "smooth" });
          if (targetSec.id === "aboutSection" && window.aboutSectionActions) {
            window.aboutSectionActions.playReveal();
          }
          setTimeout(() => {
            isScrolling = false;
          }, 800);
        }, 280);
        return;
      }

      // 2. If entering Dotgrid section from above or below, trigger directional flight
      if (
        targetSec &&
        targetSec.classList.contains("dotgrid-section") &&
        window.shapesSectionActions
      ) {
        if (currentIndex > index) {
          // Coming from Faculty below -> fly in from left to center
          window.shapesSectionActions.flyInFromLeft();
        } else {
          // Coming from About above -> fly in from right to center
          window.shapesSectionActions.flyInFromRight();
        }
      }

      // 3. If entering About section, trigger kinetic reveal
      if (
        targetSec &&
        targetSec.id === "aboutSection" &&
        window.aboutSectionActions
      ) {
        window.aboutSectionActions.playReveal();
      }

      targetSec.scrollIntoView({ behavior: "smooth" });

      setTimeout(() => {
        isScrolling = false;
      }, 750);
    }

    // Wheel event: 1 small scroll gesture jumps to next/prev section instantly
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