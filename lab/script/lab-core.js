// lab-core.js
(function() {
  if (window.hobbyScriptHasFullyInitialized) {
    // console.warn("lab-core.js: Script has already been fully initialized. Skipping redundant full execution.");
    return;
  }
  window.hobbyScriptHasFullyInitialized = true;
  // console.log("lab-core.js: Starting initial script evaluation and setup.");

  /* === Header Hiding === */
  function initHeaderObserver() {
    const header = document.querySelector('.nav-header');
    const sentinel = document.getElementById('top-sentinel');
    if (!header || !sentinel) {
      // console.warn("[HEADER] Header or sentinel not found for IntersectionObserver.");
      return;
    }
    header.classList.remove('hide');
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          header.classList.toggle('hide', !entry.isIntersecting);
        });
      }, { root: null, threshold: 1.0 }
    );
    observer.observe(sentinel);
  }

  // ===== Scroll Direction Nav Menu Hiding =====
  $(function () {
    const $menu = $('.nav-menu.nav-center');
    if (!$menu.length) return;
    let lastScroll = 0;
    const delta = 8;
    let ticking = false;
    function updateMenuVisibility() {
      const st = $(window).scrollTop();
      if (st === 0) $menu.removeClass('hide');
      else if (st > lastScroll + delta && st > 60) $menu.addClass('hide');
      else if (st < lastScroll - delta || st <= 0) $menu.removeClass('hide');
      lastScroll = st;
      ticking = false;
    }
    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateMenuVisibility);
        ticking = true;
      }
    }
    $(window).on('scroll', requestTick).on('resize', requestTick);
    updateMenuVisibility();
  });

  // ===== Background Image Slideshow (for carousel section) =====
  function initBackgroundSlideshow() {
    let onBgIntroCompleteInternalCallback = null;

    // --- RESTORED IMAGE PATHS ---
    const imageBaseUrl = './images/';
    const totalImages = 45; // Total images available
let imagePaths = Array.from({ length: totalImages }, (_, i) => `${imageBaseUrl}bglight${i + 1}.jpg`);

    // Create intro image sequence: 15 to 1 (descending), then 1 to 15 (ascending)
    let introImagePaths = [];
    // Part 1: 15 to 1 (slow to less slow)
    for (let i = 15; i >= 1; i--) {
      introImagePaths.push(imagePaths[i - 1]);
    }
    // Part 2: 1 to 15 (less slow to normal)
    for (let i = 1; i <= 15; i++) {
      introImagePaths.push(imagePaths[i - 1]);
    }

    const bgImageA = document.getElementById('bgImageA');
    const bgImageB = document.getElementById('bgImageB');
    let onBgIntroCallbackProcessed = false;

    function finalBgIntroCallback() {
      if (!onBgIntroCallbackProcessed && typeof onBgIntroCompleteInternalCallback === 'function') {
        onBgIntroCompleteInternalCallback();
        onBgIntroCallbackProcessed = true;
      }
    }

    if (!bgImageA || !bgImageB) {
      finalBgIntroCallback();
      return;
    }

    let preloadAttempted = false;
    let initialAnimationIndex = 0;
    let initialAnimationTimeoutId = null;
    let bgCurrentElement = bgImageA;
    let bgNextElement = bgImageB;
    let currentBgVisualIndexForCarousel = 0;

    // Timing for image transitions
    // Part 1 (15 to 1): Start at 400ms, decrease to 200ms
    // Part 2 (1 to 15): Start at 200ms, decrease to 100ms
    const getTransitionDelay = (index) => {
      if (index < 15) {
        // Part 1: 15 to 1 (slow to less slow)
        const startDelay = 100;
        const endDelay = 100;
        const progress = index / 14;
        return startDelay - (startDelay - endDelay) * progress;
      } else {
        // Part 2: 1 to 15 (less slow to normal)
        const startDelay = 100;
        const endDelay = 100;
        const progress = (index - 15) / 14;
        return startDelay - (startDelay - endDelay) * progress;
      }
    };

    function runInitialAnimationInternal() {
      if (initialAnimationIndex >= introImagePaths.length) {
        initialAnimationTimeoutId = null;
        finalBgIntroCallback();
        return;
      }
      const imagePathToLoad = introImagePaths[initialAnimationIndex];
      if (!imagePathToLoad) {
        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
        return;
      }

      const imgChecker = new Image();
      imgChecker.onload = () => {
        console.log("Image loaded: ", imagePathToLoad); 
        bgNextElement.src = imagePathToLoad;

        gsap.timeline()
          .to(bgCurrentElement, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0)
          .to(bgNextElement, { opacity: 1.0, duration: 0.5, ease: "power2.out" }, 0)
          .call(() => {
            let temp = bgCurrentElement;
            bgCurrentElement = bgNextElement;
            bgNextElement = temp;
          });

        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
      };
      imgChecker.onerror = () => {
        initialAnimationIndex++;
        if (initialAnimationIndex >= introImagePaths.length) {
          finalBgIntroCallback();
        } else {
          initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
        }
      };
      imgChecker.src = imagePathToLoad;
    }

    function triggerPlayVisualIntro(onBgIntroAnimationComplete) {
      if (preloadAttempted) return;
      preloadAttempted = true;

      onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;

      const firstImagePath = introImagePaths[0];
      const tempImgCheck = new Image();
      tempImgCheck.onload = () => {
        bgCurrentElement.src = firstImagePath;
        gsap.set(bgCurrentElement, { opacity: 1.0 });
        gsap.set(bgNextElement, { opacity: 0 });
        initialAnimationIndex = 1;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
      };
      tempImgCheck.onerror = () => {
        gsap.set(bgImageA, { opacity: 0 });
        gsap.set(bgImageB, { opacity: 0 });
        finalBgIntroCallback();
      };
      tempImgCheck.src = firstImagePath;
    }

    // Image preloading logic
    if (imagePaths.length > 0) {
      let imagesToPreloadCount = imagePaths.length;
      imagePaths.forEach((path) => {
        const img = new Image();
        img.onload = () => {
          imagesToPreloadCount--;
          if (imagesToPreloadCount === 0 && !preloadAttempted) {
            // Wait for preloaderHidden event
          }
        };
        img.onerror = () => {
          imagesToPreloadCount--;
          if (imagesToPreloadCount === 0 && !preloadAttempted) {
            // Wait for preloaderHidden event
          }
        };
        img.src = path;
      });

      setTimeout(() => {
        if (!preloadAttempted) {
          // Fallback if preloading is too slow
        }
      }, 7000);
    } else {
      finalBgIntroCallback();
    }

    function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
      const safeVisualIndex = (visualIndex % imagePaths.length + imagePaths.length) % imagePaths.length;
      if (!imagePaths[safeVisualIndex]) {
        return;
      }

      if (initialAnimationTimeoutId) {
        clearTimeout(initialAnimationTimeoutId);
        initialAnimationTimeoutId = null;
      }

      const imgChecker = new Image();
      imgChecker.onload = () => {
        bgNextElement.src = imagePaths[safeVisualIndex];

        gsap.timeline()
          .to(bgCurrentElement, { opacity: 0, duration: duration, ease: "power2.out" }, 0)
          .to(bgNextElement, { opacity: 1.0, duration: duration, ease: "power2.out" }, 0)
          .call(() => {
            let temp = bgCurrentElement;
            bgCurrentElement = bgNextElement;
            bgNextElement = temp;
            currentBgVisualIndexForCarousel = safeVisualIndex;
          });
      };
      imgChecker.onerror = () => {
        // Image load failure handled here
      };
      imgChecker.src = imagePaths[safeVisualIndex];
    }

    function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
      const BACKGROUND_IMAGES_PER_CARD_STEP = 3;
      currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter * BACKGROUND_IMAGES_PER_CARD_STEP) % totalImages;
      _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel, 0);
    }

    window.appBackgroundChanger = {
      playVisualIntroAnimation: triggerPlayVisualIntro,
      initializeCarouselModeBackground: initializeCarouselModeBg,
      _setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
      totalImages: totalImages
    };
  } // --- End of initBackgroundSlideshow ---

  // Expose core initialization functions globally
  window.initHeaderObserver = initHeaderObserver;
  window.initBackgroundSlideshow = initBackgroundSlideshow;

  // This function will be called by lab-intro.js when the intro sequence finishes
  window.startApplicationVisuals = () => {
    console.log("[lab-core.js] startApplicationVisuals: Main content, hero, and background slideshow fade-in");

    const mainElement = document.querySelector('main');
    const carouselHero = document.querySelector('.carousel-hero');
    const backgroundSlideshow = document.getElementById('background-slideshow');

    if (mainElement) {
      gsap.fromTo(mainElement, { opacity: 0, pointerEvents: 'none' }, {
        opacity: 1, duration: 0.8, ease: "power2.out",
        onComplete: () => {
          mainElement.style.pointerEvents = 'auto';
          // console.log("[lab-core.js] main content faded in.");
        }
      });
    }
    if (carouselHero) {
      gsap.fromTo(carouselHero, { opacity: 0, pointerEvents: 'none' }, {
        opacity: 1, duration: 0.8, ease: "power2.out",
        onComplete: () => {
          carouselHero.style.pointerEvents = 'auto';
        }
      });
    }

    if (backgroundSlideshow) {
      gsap.fromTo(backgroundSlideshow, { opacity: 0 }, {
        opacity: 0.5, duration: 1.0, ease: "power2.out",
        onComplete: () => {
          // console.log("[lab-core.js] Background slideshow container faded in.");
        }
      });
    }

    // Initialize ModernCarousel (defined in lab-carousel.js)
    if (typeof ModernCarousel !== 'undefined') {
      if (!window.modernCarouselInstanceForHobby) {
        window.modernCarouselInstanceForHobby = new ModernCarousel();
        window.modernCarouselInstanceForHobby.setupDomReferences();
        window.modernCarouselInstanceForHobby.setupCategoryJump();
        console.log("[lab-core.js] ModernCarousel instance created and DOM references/category jump set up.");
      } else {
        console.log("[lab-core.js] ModernCarousel instance already exists.");
      }
    } else {
      console.error("ModernCarousel class is not defined! Cannot initialize main component.");
      return;
    }

    if (window.appBackgroundChanger && typeof window.appBackgroundChanger.playVisualIntroAnimation === 'function') {
      let isCarouselStartTriggered = false;
      console.log("[lab-core.js] Calling appBackgroundChanger.playVisualIntroAnimation with callback for carousel start.");
      window.appBackgroundChanger.playVisualIntroAnimation(() => {
        if (isCarouselStartTriggered) return;
        isCarouselStartTriggered = true;
        console.log("[CALLBACK] Background visual intro complete → carousel 등장 애니메이션 시작!");

        if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
          const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
          window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
          console.log(`[lab-core.js] Initializing background for carousel center: ${initialCenterIndex}`);
        }

        if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
          window.modernCarouselInstanceForHobby.runCarousel(true);
          console.log("[lab-core.js] ModernCarousel entrance animation triggered.");
        } else {
          console.error("ModernCarousel instance or runCarousel method not found!");
        }
      });
    } else {
      console.warn("[lab-core.js] appBackgroundChanger.playVisualIntroAnimation not found. Falling back to direct carousel start.");
      if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
        if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
          const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
          window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
          console.log(`[lab-core.js] Initializing background for carousel center: ${initialCenterIndex} (fallback mode).`);
        }
        window.modernCarouselInstanceForHobby.runCarousel(true);
        console.log("[lab-core.js] ModernCarousel entrance animation triggered (fallback).");
      } else {
        console.error("ModernCarousel instance or runCarousel method not found for fallback!");
      }
    }
  };

  // PRIMARY INITIALIZATION on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOMContentLoaded event fired for lab-core.js main logic.");
    if (window.appContentLoadedAndInitialized) {
      // console.warn("lab-core.js DOMContentLoaded: Logic has already been executed. Skipping.");
      return;
    }
    window.appContentLoadedAndInitialized = true;
    // console.log("DOMContentLoaded (lab-core.js): Main initialization sequence starting.");

    if (typeof window.initHeaderObserver === 'function') window.initHeaderObserver();
    if (typeof window.initBackgroundSlideshow === 'function') {
      window.initBackgroundSlideshow();
    }

    document.addEventListener('preloaderHidden', () => {
      // console.log("Received 'preloaderHidden' event. Fading in body and starting intro visuals.");
      gsap.to(document.body, { opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => {
        // Ensure IntroSequence is available from lab-intro.js
        if (typeof IntroSequence !== 'undefined') {
          const intro = new IntroSequence();
          intro.start();
        } else {
          console.error("IntroSequence class is not defined. Cannot start intro animation.");
          window.startApplicationVisuals();
        }
      }});
    });

    window.addEventListener('load', () => {
      // Add any additional window.load logic here if needed
    });
  });
})();