// lab-core.js
(function() {
  if (window.hobbyScriptHasFullyInitialized) {
    return;
  }
  window.hobbyScriptHasFullyInitialized = true;

  // Global state for lab page
  const labGlobalState = {
    currentTheme: 'light', // Default to light theme for lab page (Request 6)
    currentBgImageBase: 'bglight', // Default background image prefix
    totalImages: 45, // Total images available for backgrounds
  };

  let labHeader; // Reference to the new lab header element
  let navHeader; // Reference to the existing common nav header
  let backgroundSlideshow; // Reference to the background slideshow container

  /* === Header Hiding === */
  function initHeaderObserver() {
    navHeader = document.querySelector('.nav-header'); // Existing common nav header
    labHeader = document.querySelector('.lab-header'); // New lab specific header
    const introScreen = document.getElementById('intro-screen'); // The intro full-screen element

    if (!navHeader || !labHeader || !introScreen) {
      console.warn("[HEADER] One or more header/intro elements not found for IntersectionObserver.");
      return;
    }

    // Ensure labHeader is always visible (Request 1)
    // We explicitly set these properties to ensure it's on top and visible
    labHeader.classList.remove('hidden');
    labHeader.style.opacity = '1';
    labHeader.style.visibility = 'visible';
    labHeader.style.zIndex = '999'; // [수정] z-index 값을 9999에서 999로 변경


    // The existing navHeader visibility logic remains as is
    const sentinel = document.getElementById('top-sentinel');
    if (sentinel) {
        const observer = new window.IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    navHeader.classList.toggle('hide', !entry.isIntersecting);
                });
            }, { root: null, threshold: 1.0 }
        );
        observer.observe(sentinel);
    }
  }

  // ===== Scroll Direction Nav Menu Hiding =====
  // This logic is for the original nav-menu, lab-header remains fixed.
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
    let currentImagePaths = []; // Will store theme-specific paths
    let currentIntroImagePaths = []; // Will store theme-specific intro paths

    const imageBaseUrl = './images/';
    const totalImages = labGlobalState.totalImages;

    // Helper to generate paths based on current theme
    const generateImagePaths = (themePrefix) => {
        const extension = themePrefix === 'bgdark' ? 'png' : 'jpg';
        return Array.from({ length: totalImages }, (_, i) => `${imageBaseUrl}${themePrefix}${i + 1}.${extension}`);
    };
    

    const generateIntroImagePaths = (allImagePaths) => {
        let introPaths = [];
        // Part 1: 15 to 1 (descending)
        for (let i = 15; i >= 1; i--) {
            introPaths.push(allImagePaths[i - 1]);
        }
        // Part 2: 1 to 15 (ascending)
        for (let i = 1; i <= 15; i++) {
            introPaths.push(allImagePaths[i - 1]);
        }
        return introPaths;
    };

    // Initialize paths based on current global theme state
    currentImagePaths = generateImagePaths(labGlobalState.currentBgImageBase);
    currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);

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
    const getTransitionDelay = (index) => {
      // These delays are fixed for the intro animation sequence
      if (index < 15) {
        const startDelay = 100;
        const endDelay = 100;
        const progress = index / 14;
        return startDelay - (startDelay - endDelay) * progress;
      } else {
        const startDelay = 100;
        const endDelay = 100;
        const progress = (index - 15) / 14;
        return startDelay - (startDelay - endDelay) * progress;
      }
    };

    function runInitialAnimationInternal() {
      if (initialAnimationIndex >= currentIntroImagePaths.length) {
        initialAnimationTimeoutId = null;
        finalBgIntroCallback();
        return;
      }
      const imagePathToLoad = currentIntroImagePaths[initialAnimationIndex];
      if (!imagePathToLoad) {
        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
        return;
      }

      const imgChecker = new Image();
      imgChecker.onload = () => {
        bgNextElement.src = imagePathToLoad;

        gsap.timeline()
          .to(bgCurrentElement, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0)
          .to(bgNextElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5, duration: 0.5, ease: "power2.out" }, 0) // Theme-aware opacity
          .call(() => {
            let temp = bgCurrentElement;
            bgCurrentElement = bgNextElement;
            bgNextElement = temp;
          });

        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
      };
      imgChecker.onerror = () => {
        console.warn(`Failed to load image: ${imagePathToLoad}. Skipping.`);
        initialAnimationIndex++;
        if (initialAnimationIndex >= currentIntroImagePaths.length) {
          finalBgIntroCallback();
        } else {
          initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
        }
      };
      imgChecker.src = imagePathToLoad;
    }

    function triggerPlayVisualIntro(onBgIntroAnimationComplete) {
      // Reset preload status for a fresh animation on theme change
      preloadAttempted = false;
      onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;
      onBgIntroCallbackProcessed = false; // Reset for new animation

      // Ensure paths are updated before starting (Crucial for Request 3 & 4)
      currentImagePaths = generateImagePaths(labGlobalState.currentBgImageBase);
      currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);

      const firstImagePath = currentIntroImagePaths[0]; // Use updated intro paths
      const tempImgCheck = new Image();
      tempImgCheck.onload = () => {
        bgCurrentElement.src = firstImagePath;
        gsap.set(bgCurrentElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5 }); // Theme-aware initial opacity
        gsap.set(bgNextElement, { opacity: 0 });
        initialAnimationIndex = 1;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
      };
      tempImgCheck.onerror = () => {
        console.error(`Failed to load first image for intro: ${firstImagePath}. Skipping intro animation.`);
        gsap.set(bgImageA, { opacity: 0 });
        gsap.set(bgImageB, { opacity: 0 });
        finalBgIntroCallback();
      };
      tempImgCheck.src = firstImagePath;
    }

    // Image preloading logic for current theme
    const preloadAllImages = () => {
        let imagesToPreloadCount = currentImagePaths.length;
        if (imagesToPreloadCount === 0) return; // Nothing to preload

        currentImagePaths.forEach((path) => {
            const img = new Image();
            img.onload = img.onerror = () => {
                imagesToPreloadCount--;
                if (imagesToPreloadCount === 0) {
                    console.log("All current theme images preloaded.");
                }
            };
            img.src = path;
        });
    };
    preloadAllImages(); // Initial preload

    function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
      const safeVisualIndex = (visualIndex % totalImages + totalImages) % totalImages;
      // Use currentImagePaths which are already theme-aware
      const pathForCarousel = currentImagePaths[safeVisualIndex];

      if (!pathForCarousel) {
        console.warn(`Path for carousel background not found at index ${safeVisualIndex}`);
        return;
      }

      if (initialAnimationTimeoutId) {
        clearTimeout(initialAnimationTimeoutId);
        initialAnimationTimeoutId = null;
      }

      const imgChecker = new Image();
      imgChecker.onload = () => {
        bgNextElement.src = pathForCarousel;

        gsap.timeline()
          .to(bgCurrentElement, { opacity: 0, duration: duration, ease: "power2.out" }, 0)
          .to(bgNextElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5, duration: duration, ease: "power2.out" }, 0) // Theme-aware opacity
          .call(() => {
            let temp = bgCurrentElement;
            bgCurrentElement = bgNextElement;
            bgNextElement = temp;
            currentBgVisualIndexForCarousel = safeVisualIndex;
          });
      };
      imgChecker.onerror = () => {
        console.warn(`Failed to load background image for carousel: ${pathForCarousel}`);
      };
      imgChecker.src = pathForCarousel;
    }

    function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
      const BACKGROUND_IMAGES_PER_CARD_STEP = 3;
      currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter * BACKGROUND_IMAGES_PER_CARD_STEP) % totalImages;
      _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel, 0); // 초기 설정은 즉시
    }

    window.appBackgroundChanger = {
      playVisualIntroAnimation: triggerPlayVisualIntro,
      initializeCarouselModeBackground: initializeCarouselModeBg,
      _setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
      totalImages: totalImages,
      // Expose a way to refresh image paths (for theme change)
      refreshImagePaths: () => {
        labGlobalState.currentBgImageBase = labGlobalState.currentTheme === 'dark' ? 'bgdark' : 'bglight';
        currentImagePaths = generateImagePaths(labGlobalState.currentBgImageBase);
        currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);
        preloadAllImages(); // Preload new theme images
      }
    };
  } // --- End of initBackgroundSlideshow ---


  // Theme Toggle Logic for Lab Header
    function toggleLabHeaderTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
        // 1. 테마 속성 및 전역 상태 업데이트
        body.setAttribute('data-theme', newTheme);
        labGlobalState.currentTheme = newTheme;
    
        // 2. 테마 아이콘(해/달) 업데이트
        const labSunIcon = document.getElementById('sun-icon');
        const labMoonIcon = document.getElementById('moon-icon');
        if (labSunIcon) labSunIcon.classList.toggle('hidden', newTheme === 'dark');
        if (labMoonIcon) labMoonIcon.classList.toggle('hidden', newTheme === 'light');
    
        // 3. 빠른 크로스페이드 전환 로직 실행
        if (window.appBackgroundChanger && window.modernCarouselInstanceForHobby) {
            console.log(`[Theme] Starting fast transition to ${newTheme}`);
            
            // 현재 캐러셀과 히어로 섹션을 부드럽게 숨김
            gsap.to(['.carousel', '.carousel-hero'], { 
                opacity: 0, 
                duration: 0.4, 
                ease: 'power2.in',
                onComplete: () => {
                    // 3a. 숨겨진 동안 새 테마의 이미지 경로 로드
                    window.appBackgroundChanger.refreshImagePaths();
                    
                    // 3b. 새 테마의 배경색으로 변경
                    const bgSlideshow = document.getElementById('background-slideshow');
                    if(bgSlideshow) {
                        gsap.to(bgSlideshow, {
                            backgroundColor: newTheme === 'dark' ? 'rgba(0,0,0,0.8)' : '#ffffff',
                            duration: 0.5
                        });
                    }
                    
                    // 3c. 현재 캐러셀 위치에 맞는 새 테마의 배경 이미지로 즉시 교체 (부드러운 전환)
                    const centerIndex = window.modernCarouselInstanceForHobby.center;
                    window.appBackgroundChanger._setSingleBackgroundImageForCarousel(centerIndex * 3, 0.8);
                    
                    // 3d. 캐러셀과 히어로 섹션을 다시 부드럽게 표시
                    gsap.to(['.carousel', '.carousel-hero'], {
                        opacity: 1,
                        duration: 0.6,
                        delay: 0.2, // 배경이 바뀔 시간을 약간 줌
                        ease: 'power2.out'
                    });
                }
            });
        } else {
            console.warn("Cannot perform fast theme transition: core components not found.");
        }
    }


  // Expose core initialization functions globally
  window.initHeaderObserver = initHeaderObserver;
  window.initBackgroundSlideshow = initBackgroundSlideshow;

  // This function will be called by lab-intro.js when the intro sequence finishes
  window.startApplicationVisuals = () => {
    const mainElement = document.querySelector('main');
    const carouselHero = document.querySelector('.carousel-hero');
    backgroundSlideshow = document.getElementById('background-slideshow'); // Assign to global var

    if (mainElement) {
      gsap.fromTo(mainElement, { opacity: 0, pointerEvents: 'none' }, {
        opacity: 1, duration: 0.8, ease: "power2.out",
        onComplete: () => {
          mainElement.style.pointerEvents = 'auto';
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
      // Set background slideshow initial color based on theme
      backgroundSlideshow.style.backgroundColor = labGlobalState.currentTheme === 'dark' ? 'rgba(0,0,0,0.8)' : '#ffffff';
      gsap.fromTo(backgroundSlideshow, { opacity: 0 }, {
        opacity: 1, duration: 1.0, ease: "power2.out", // Fade in the container itself
        onComplete: () => {
        }
      });
    }

    // Initialize ModernCarousel (defined in lab-carousel.js)
    if (typeof ModernCarousel !== 'undefined') {
      if (!window.modernCarouselInstanceForHobby) {
        window.modernCarouselInstanceForHobby = new ModernCarousel();
        window.modernCarouselInstanceForHobby.setupDomReferences();
        window.modernCarouselInstanceForHobby.setupCategoryJump();
      }
    } else {
      console.error("ModernCarousel class is not defined! Cannot initialize main component.");
      return;
    }

    if (window.appBackgroundChanger && typeof window.appBackgroundChanger.playVisualIntroAnimation === 'function') {
      let isCarouselStartTriggered = false;
      window.appBackgroundChanger.playVisualIntroAnimation(() => {
        if (isCarouselStartTriggered) return;
        isCarouselStartTriggered = true;

        if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
          const initialCenterIndex = window.modernCarouselInstanceForHobby ? window.modernCarouselInstanceForHobby.center : 0;
          window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
        }

        if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
          window.modernCarouselInstanceForHobby.runCarousel(true);
        } else {
          console.error("ModernCarousel instance or runCarousel method not found!");
        }
      });
    } else {
      console.warn("appBackgroundChanger.playVisualIntroAnimation not found. Falling back to direct carousel start.");
      if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
        if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
          const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
          window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
        }
        window.modernCarouselInstanceForHobby.runCarousel(true);
      } else {
        console.error("ModernCarousel instance or runCarousel method not found for fallback!");
      }
    }
  };

  // PRIMARY INITIALIZATION on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    if (window.appContentLoadedAndInitialized) {
      return;
    }
    window.appContentLoadedAndInitialized = true;

    // Initial theme setup (Request 6) - Lab page always starts with light theme
    // We remove any localStorage interference for the Lab page's initial load.
    document.body.setAttribute('data-theme', 'light');
    labGlobalState.currentTheme = 'light';
    labGlobalState.currentBgImageBase = 'bglight';

    // Set intro screen text/arrow initial color based on theme
    const typingContainer = document.querySelector('.typing-container');
    const scrollDownArrow = document.getElementById('scroll-down-arrow');
    const labHeaderButtonGroup = document.querySelector('.lab-header .button-group');

    if (typingContainer) typingContainer.style.color = 'white';
    if (scrollDownArrow) scrollDownArrow.style.color = 'white';
    if (labHeaderButtonGroup) {
        labHeaderButtonGroup.style.setProperty('--button-intro-color', 'white');
        labHeaderButtonGroup.style.setProperty('--button-intro-text-color', 'black');
    }

    // Set icon visibility based on the initial theme
    const labSunIcon = document.getElementById('sun-icon');
    const labMoonIcon = document.getElementById('moon-icon');
    if (labSunIcon) labSunIcon.classList.remove('hidden');
    if (labMoonIcon) labMoonIcon.classList.add('hidden');


    if (typeof window.initHeaderObserver === 'function') window.initHeaderObserver();
    if (typeof window.initBackgroundSlideshow === 'function') {
      window.initBackgroundSlideshow();
    }

    // Attach theme toggle listener to the new lab header button
    const labThemeToggle = document.querySelector('.lab-header .theme-toggle');
    if (labThemeToggle) {
        labThemeToggle.addEventListener('click', toggleLabHeaderTheme);
    }


    document.addEventListener('preloaderHidden', () => {
      gsap.to(document.body, { opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => {
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
      // Any additional window.load logic here if needed
    });
  });
})();