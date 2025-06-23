// lab-core.js
(function() {
if (window.hobbyScriptHasFullyInitialized) {
return;
}
window.hobbyScriptHasFullyInitialized = true;

const labGlobalState = {
currentTheme: 'light', 
currentBgImageBase: 'bglight', 
totalImages: 0, 
};

// Reordered categories as requested
const pureCssCategories = {
'animation-art': [
'024-waves', '036-solar-eclipse', '050-newtons-cradle', '083-a-ball-climbing-the-stairs',
'093-lightning-cable', '094-polaroid-camera', '119-draught-beer', '122-apple-photos-icon',
'124-origami-cranes', '134-sapling-loader', '149-polo-mints-animation', '166-safari-logo'
],
'interactive-art': [
'041-pencil', '076-hey-take-it-easy', '131-scissors', '145-power-switch',
'153-emoji-tooltips', '156-airplane-window-toggle', '158-umbrella-toggle',
'168-oo-words', '179-tear-calendar'
],
'loading-effect': [
'065-swaying-loader', '068-color-cards', '071-8-shaped-dancing-loader', '078-windows-boot-screen',
'082-bouncing-letter-i', '097-swagger-dots', '118-hourglass-loader',
'128-the-goddess-is-coming', '136-colorful-bar-loader'
],
'text-effect': [
'022-stripy-rainbow-text-effects', '033-milk-text-effect', '038-stairs-lettering-effect',
'056-a-programmers-life', '059-rainbow-background-text', '100-shimmering-neon-text',
'126-button-hover-effect'
],
'button-effect': [
'001-button-text-staggered-sliding-effects', '009-aimed-button-effects', '037-stroke-animation-button-effect',
'072-bubble-coloring-button', '112-button-hover-effect', '148-button-hover-effect'
],
'screensaver': [
'081-swapping-colors-rotating-animation', '090-endless-hexagonal-space', '095-rotating-worm',
'106-animation-with-no-dom', '139-glowing-particles-animation', '144-pattern-animation',
'150-pattern-animation'
]
};

const projectList = Object.keys(pureCssCategories).reduce((acc, category) => {
const projectsInCategory = pureCssCategories[category].map((project, idx) => {
const issueNum = String(acc.length + idx + 1).padStart(2, '0');
return {
category: category,
title: project.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
issueNum: issueNum,
path: `pure-css/${category}/${project}/index.html`
};
});
return acc.concat(projectsInCategory);
}, []);

labGlobalState.totalImages = projectList.length;
console.log(`[Core] Total projects mapped: ${labGlobalState.totalImages}`);

window.pureCssCategories = pureCssCategories;
window.projectList = projectList;

function generatePosterCards() {
  const carousel = document.getElementById('dynamic-carousel');
  if (!carousel) {
    console.error("Carousel container '#dynamic-carousel' not found.");
    return;
  }
  // START OF CHANGE: Added a .poster-paper-overlay div to hold the paper texture.
  const posterHTML = projectList.map(project => `
  <div class="poster poster-${project.category}" 
       data-title="${project.title}" 
       data-num="${project.issueNum}" 
       data-path="${project.path}"
       data-iframe-loaded="false">
    <div class="poster-preview-container">
      </div>
    <div class="poster-paper-overlay"></div>
    <div class="poster-dim-overlay"></div>
    <div class="book-binding">
      <div class="binding-line binding-main"></div>
      <div class="binding-line binding-top"></div>
      <div class="binding-line binding-front-1"></div>
      <div class="binding-line binding-front-2"></div>
      <div class="binding-line binding-front-3"></div>
      <div class="binding-line binding-side-1"></div>
      <div class="binding-line binding-side-2"></div>
      <div class="binding-line binding-side-3"></div>
    </div>
    <div class="poster-text-overlay">
      ISSUE ${project.issueNum}<br>${project.title}
    </div>
  </div>
  `).join('');
  // END OF CHANGE
  carousel.innerHTML = posterHTML;
  console.log("[Core] Dynamic poster cards generated.");
}

let labHeader; 
let navHeader; 
let backgroundSlideshow;

function initHeaderObserver() {
    navHeader = document.querySelector('.nav-header'); 
    labHeader = document.querySelector('.lab-header');
    const introScreen = document.getElementById('intro-screen');

    if (!navHeader || !labHeader || !introScreen) {
        console.warn("[HEADER] One or more header/intro elements not found for IntersectionObserver.");
        return;
    }

    labHeader.classList.remove('hidden');
    labHeader.style.opacity = '1';
    labHeader.style.visibility = 'visible';
    labHeader.style.zIndex = '999';

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

function initBackgroundSlideshow() {
    let onBgIntroCompleteInternalCallback = null;
    let currentImagePaths = []; 
    let currentIntroImagePaths = []; 

    const imageBaseUrl = './images/';
    const totalImages = labGlobalState.totalImages;

    const generateImagePaths = (themePrefix) => {
        const extension = themePrefix === 'bgdark' ? 'png' : 'jpg';
        return Array.from({ length: totalImages }, (_, i) => `${imageBaseUrl}${themePrefix}${i + 1}.${extension}`);
    };

    const generateIntroImagePaths = (allImagePaths) => {
        let introPaths = [];
        for (let i = 15; i >= 1; i--) {
            if (allImagePaths[i-1]) introPaths.push(allImagePaths[i - 1]);
        }
        for (let i = 1; i <= 15; i++) {
            if (allImagePaths[i-1]) introPaths.push(allImagePaths[i - 1]);
        }
        return introPaths;
    };

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

    let initialAnimationIndex = 0;
    let initialAnimationTimeoutId = null;
    let bgCurrentElement = bgImageA;
    let bgNextElement = bgImageB;
    let currentBgVisualIndexForCarousel = 0;

    const getTransitionDelay = (index) => {
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
            .to(bgNextElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5, duration: 0.5, ease: "power2.out" }, 0) 
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
        onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;
        onBgIntroCallbackProcessed = false; 

        currentImagePaths = generateImagePaths(labGlobalState.currentBgImageBase);
        currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);

        const firstImagePath = currentIntroImagePaths[0]; 
        const tempImgCheck = new Image();
        tempImgCheck.onload = () => {
            bgCurrentElement.src = firstImagePath;
            gsap.set(bgCurrentElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5 });
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

    const preloadAllImages = () => {
        let imagesToPreloadCount = currentImagePaths.length;
        if (imagesToPreloadCount === 0) return; 

        currentImagePaths.forEach((path) => {
            const img = new Image();
            img.onload = img.onerror = () => {
                imagesToPreloadCount--;
                if (imagesToPreloadCount === 0) {
                    console.log("[Core] All current theme background images preloaded.");
                }
            };
            img.src = path;
        });
    };
    preloadAllImages(); 

    function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
        const safeVisualIndex = (visualIndex % totalImages + totalImages) % totalImages;
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
            .to(bgNextElement, { opacity: labGlobalState.currentTheme === 'dark' ? 0.2 : 0.5, duration: duration, ease: "power2.out" }, 0)
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
        currentBgVisualIndexForCarousel = posterIndexOfCarouselCenter % totalImages;
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel, 0); 
    }

    window.appBackgroundChanger = {
        playVisualIntroAnimation: triggerPlayVisualIntro,
        initializeCarouselModeBackground: initializeCarouselModeBg,
        _setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
        totalImages: totalImages,
        refreshImagePaths: () => {
            labGlobalState.currentBgImageBase = labGlobalState.currentTheme === 'dark' ? 'bgdark' : 'bglight';
            currentImagePaths = generateImagePaths(labGlobalState.currentBgImageBase);
            currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);
            preloadAllImages(); 
        }
    };
}

function toggleLabHeaderTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    labGlobalState.currentTheme = newTheme;
    const labSunIcon = document.getElementById('sun-icon');
    const labMoonIcon = document.getElementById('moon-icon');
    if (labSunIcon) labSunIcon.classList.toggle('hidden', newTheme === 'dark');
    if (labMoonIcon) labMoonIcon.classList.toggle('hidden', newTheme === 'light');

    if (window.appBackgroundChanger && window.modernCarouselInstanceForHobby) {
        console.log(`[Theme] Starting fast transition to ${newTheme}`);
        gsap.to(['.carousel', '.carousel-hero'], {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                window.appBackgroundChanger.refreshImagePaths();
                const bgSlideshow = document.getElementById('background-slideshow');
                if(bgSlideshow) {
                    gsap.to(bgSlideshow, {
                        backgroundColor: newTheme === 'dark' ? 'rgba(0,0,0,0.8)' : '#ffffff',
                        duration: 0.5
                    });
                }
                const centerIndex = window.modernCarouselInstanceForHobby.center;
                window.appBackgroundChanger._setSingleBackgroundImageForCarousel(centerIndex, 0.8);
                gsap.to(['.carousel', '.carousel-hero'], {
                    opacity: 1,
                    duration: 0.6,
                    delay: 0.2,
                    ease: 'power2.out'
                });
            }
        });
    } else {
        console.warn("Cannot perform fast theme transition: core components not found.");
    }
}

window.initHeaderObserver = initHeaderObserver;
window.initBackgroundSlideshow = initBackgroundSlideshow;

window.startApplicationVisuals = () => {
    const mainElement = document.querySelector('main');
    const carouselHero = document.querySelector('.carousel-hero');
    backgroundSlideshow = document.getElementById('background-slideshow');

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
        backgroundSlideshow.style.backgroundColor = labGlobalState.currentTheme === 'dark' ? 'rgba(0,0,0,0.8)' : '#ffffff';
        gsap.fromTo(backgroundSlideshow, { opacity: 0 }, {
            opacity: 1, duration: 1.0, ease: "power2.out",
            onComplete: () => {}
        });
    }

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

document.addEventListener('DOMContentLoaded', () => {
    if (window.appContentLoadedAndInitialized) {
        return;
    }
    window.appContentLoadedAndInitialized = true;

    generatePosterCards();

    document.body.setAttribute('data-theme', 'light');
    labGlobalState.currentTheme = 'light';
    labGlobalState.currentBgImageBase = 'bglight';

    const typingContainer = document.querySelector('.typing-container');
    const scrollDownArrow = document.getElementById('scroll-down-arrow');
    const labHeaderButtonGroup = document.querySelector('.lab-header .button-group');

    if (typingContainer) typingContainer.style.color = 'white';
    if (scrollDownArrow) scrollDownArrow.style.color = 'white';
    if (labHeaderButtonGroup) {
        labHeaderButtonGroup.style.setProperty('--button-intro-color', 'white');
        labHeaderButtonGroup.style.setProperty('--button-intro-text-color', 'black');
    }

    const labSunIcon = document.getElementById('sun-icon');
    const labMoonIcon = document.getElementById('moon-icon');
    if (labSunIcon) labSunIcon.classList.remove('hidden');
    if (labMoonIcon) labMoonIcon.classList.add('hidden');

    if (typeof window.initHeaderObserver === 'function') window.initHeaderObserver();
    if (typeof window.initBackgroundSlideshow === 'function') {
        window.initBackgroundSlideshow();
    }

    const labThemeToggle = document.querySelector('.lab-header .theme-toggle');
    if (labThemeToggle) {
        labThemeToggle.addEventListener('click', toggleLabHeaderTheme);
    }

    // This listener seems to be superseded by the new intro logic,
    // but keeping it for now to avoid breaking other unprovided parts.
    document.addEventListener('preloaderHidden', () => {
        gsap.to(document.body, { opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => {
            // The new intro logic in lab-intro.js now handles this startup sequence.
            // if (typeof IntroSequence !== 'undefined') {
            //     const intro = new IntroSequence();
            //     intro.start();
            // } else {
            //     console.error("IntroSequence class is not defined. Cannot start intro animation.");
            //     window.startApplicationVisuals();
            // }
        }});
    });

    window.addEventListener('load', () => {
    });
});
})();