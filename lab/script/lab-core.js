(function() {
// Prevent re-initialization
if (window.hobbyScriptHasFullyInitialized) {
return;
}
window.hobbyScriptHasFullyInitialized = true;

// Global state for the lab
const labGlobalState = {
currentProjectMode: 'css' // Default to CSS
};

// --- [1] Project Data Definitions ---
// Pure CSS project categories
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

// JavaScript project categories
const javascriptCategories = {
'3d': ['3dBlob', '3dWeather', 'LegoView', 'MorphingKnot', 'Sphere', 'Stardust'],
'ai-bot': ['Chatbot', 'DEEPOOSU', 'HeySarah', 'ImageGenerator'],
'game': ['ColorSwitch', 'GALACTICGUARDIAN', 'MathBlitz', 'MemoryCard', 'PACMAN', 'Pokemon', 'Tetris'],
'utility': ['Calculator', 'ColorPalette', 'DottedConverter', 'GradientGenerator', 'InkBlobGenerator', 'MinimalNotepad', 'PomodoroTimer', 'QRGenerator', 'UnitConverter'],
'cursor-effects': ['ArrowGrid', 'CharacterScramble', 'CursorBlob', 'DessertCursor', 'FOLLOWCURSOR', 'FingerCursor', 'LighteningEffect', 'Magnet', 'MagneticCursor', 'MouseRepellant', 'StackedCards', 'etchCanvas'],
'scroll-effects': ['BgColor', 'Horizontal', 'Hybrid', 'Nav', 'Parallax', 'Progress', 'Reveal', 'Split', 'Timeline', 'Trigger']
};

/**
* Builds a structured list of projects from a category map.
* @param {string} type - 'css' or 'js'
* @returns {Array} A list of project objects.
*/
function buildProjectListByType(type) {
    let acc = [];
    const categoriesMap = type === 'css' ? pureCssCategories : javascriptCategories;
    const basePath = type === 'css' ? 'pure-css' : 'javascript';

    Object.keys(categoriesMap).forEach(category => {
        categoriesMap[category].forEach((project) => {
            acc.push({
                category,
                type,
                title: project.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                issueNum: String(acc.length + 1).padStart(2, '0'),
                path: `${basePath}/${category}/${project}/index.html`
            });
        });
    });
    return acc;
}

// Expose data to the window object for access by other scripts
window.allCategories = {
    css: pureCssCategories,
    js: javascriptCategories,
};
window.projectLists = {
    css: buildProjectListByType('css'),
    js: buildProjectListByType('js'),
};

// Set legacy properties for compatibility if other scripts use them
window.pureCssCategories = pureCssCategories;
window.jsCategories = javascriptCategories; // Expose JS categories for consistency

// projectList will be dynamically updated on mode switch
window.projectList = window.projectLists.css; // Initial project list

// Calculate initial total images (for background slideshow)
labGlobalState.totalImages = window.projectLists.css.length;
console.log(`[Core] Total CSS projects mapped: ${labGlobalState.totalImages}`);

// Expose global state
window.labGlobalState = labGlobalState;

// --- [2] DOM Manipulation Functions ---

/**
 * Renders the category jump buttons in the .carousel-category-jump section.
 * @param {string} mode - 'css' or 'js' to determine which categories to render.
 */
function renderCarouselCategoryJumpButtons(mode) {
    const categoriesMap = window.allCategories[mode];
    const carouselCategoryJump = document.getElementById('carousel-category-jump'); // Use the new ID
    if (!carouselCategoryJump) {
        console.error("'.carousel-category-jump' container not found.");
        return;
    }

    const categoryButtonsHTML = Object.keys(categoriesMap).map((category, index) => {
        // Correctly generate image paths. For JS projects, you'll need specific icons or a default.
        // Assuming you want the same 6 icons to cycle/map to the categories regardless of type.
        // If JS categories have different icons, this logic needs to be more complex.
        const iconNumber = (index % 6) + 1; // Cycle through 6 icons
        const iconPath = `images/jumpbutton${iconNumber}.png`;

        // Format category name for display
        const displayCategory = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const displayLabel = displayCategory.includes(' ') ? displayCategory.replace(' ', '<br>') : displayCategory;

        return `
            <div class="category-jump-item">
                <button class="category-jump-btn" data-category="${category}" title="${displayCategory}">
                    <img src="${iconPath}" alt="${displayCategory} Icon">
                </button>
                <span class="category-jump-label">${displayLabel}</span>
            </div>
        `;
    }).join('');

    carouselCategoryJump.innerHTML = categoryButtonsHTML;
    console.log(`[Core] Category jump buttons rendered for mode: ${mode}.`);

    // *** 핵심 수정 부분 1: 카테고리 점프 섹션을 DOM에 추가된 직후 초기에 숨기고 약간 아래로 이동시킵니다. ***
    gsap.set(carouselCategoryJump, { opacity: 0, y: 20 });


    // If ModernCarousel instance exists, re-setup category jump events
    // This is called within switchProjectMode, so it will pick up new buttons
    if (window.modernCarouselInstanceForHobby) {
        window.modernCarouselInstanceForHobby.setupCategoryJump();
    }
}


/**
 * Generates and injects the carousel poster cards into the DOM.
 * @param {string} mode - The project mode ('css' or 'js') to generate cards for.
 * @param {function} [onReady] - Optional callback to execute after cards are in the DOM.
 */
function generatePosterCards(mode, onReady) {
    const currentProjectList = window.projectLists[mode];
    const carousel = document.getElementById('dynamic-carousel');
    if (!carousel) {
        console.error("Carousel container '#dynamic-carousel' not found.");
        if (onReady) onReady();
        return;
    }

    carousel.innerHTML = ''; // Clear previous content explicitly before mapping

    const posterHTML = currentProjectList.map(project => `
        <div class="poster poster-${project.category}"
            data-title="${project.title}"
            data-num="${project.issueNum}"
            data-path="${project.path}"
            data-type="${project.type}"
            data-iframe-loaded="false">
            <div class="poster-preview-container"></div>
            <div class="poster-paper-overlay"></div>
            <div class="poster-dim-overlay"></div>
            <div class="book-binding">
                <div class="binding-line binding-main"></div>
                <div class="binding-line binding-top"></div>
                <div class="binding-line binding-front-1"></div>
                <div class="binding-line binding-front-2"></div>
                <div glines="binding-line binding-front-3"></div>
                <div class="binding-line binding-side-1"></div>
                <div class="binding-line binding-side-2"></div>
                <div class="binding-line binding-side-3"></div>
            </div>
            <div class="poster-text-overlay">
                ISSUE ${project.issueNum}<br>${project.title}
            </div>
        </div>
    `).join('');

    carousel.innerHTML = posterHTML;
    console.log(`[Core] Dynamic poster cards generated for mode: ${mode}.`);

    if (onReady) {
        // Use requestAnimationFrame to ensure DOM has updated before callback
        requestAnimationFrame(onReady);
    }
}

// --- [3] Application Logic ---
/**
 * Destroys the current carousel instance to prepare for a new one.
 */
function destroyCarouselInstance() {
    if (window.modernCarouselInstanceForHobby) {
        // Kill any ongoing GSAP tweens on the old carousel elements
        if (window.modernCarouselInstanceForHobby.carousel) {
            gsap.killTweensOf(window.modernCarouselInstanceForHobby.carousel.querySelectorAll('.poster'));
        }
        if (window.modernCarouselInstanceForHobby.labels) { // Check if labels element exists
            gsap.killTweensOf(window.modernCarouselInstanceForHobby.labels.querySelectorAll('.label'));
        }

        // Clear content explicitly (also done by generatePosterCards, but for safety)
        if (window.modernCarouselInstanceForHobby.carousel) {
             window.modernCarouselInstanceForHobby.carousel.innerHTML = '';
        }

        // Remove event listeners from the old carousel instance
        if (window.modernCarouselInstanceForHobby._wheelHandler) {
            window.modernCarouselInstanceForHobby.carousel.removeEventListener('wheel', window.modernCarouselInstanceForHobby._wheelHandler);
            document.removeEventListener('mousemove', window.modernCarouselInstanceForHobby._mouseMoveHandler);
            document.removeEventListener('mouseup', window.modernCarouselInstanceForHobby._mouseUpHandler);
            window.modernCarouselInstanceForHobby.carousel.removeEventListener('touchstart', window.modernCarouselInstanceForHobby._touchStartHandler);
            window.modernCarouselInstanceForHobby.carousel.removeEventListener('touchend', window.modernCarouselInstanceForHobby._touchEndHandler);
            window.modernCarouselInstanceForHobby.posters.forEach(poster => {
                if (poster._carouselClickHandler) {
                    poster.removeEventListener('click', poster._carouselClickHandler);
                }
            });
            // Also remove category jump button listeners if they were attached dynamically within carousel
            document.querySelectorAll('.category-jump-btn').forEach(button => {
                if (button._categoryJumpHandler) {
                    button.removeEventListener('click', button._categoryJumpHandler);
                }
            });
        }


        window.modernCarouselInstanceForHobby = null;
        console.log('[Core] Previous carousel instance destroyed.');
    }
}

/**
 * Switches the project mode between CSS and JavaScript.
 * @param {string} newMode - The target mode, 'css' or 'js'.
 */
function switchProjectMode(newMode) {
    if (labGlobalState.currentProjectMode === newMode) return; // No change needed

    labGlobalState.currentProjectMode = newMode;
    console.log(`[Core] Switching project mode to: ${newMode}`);

    // 1. Update the 'active' class on the static mode toggle buttons
    document.querySelectorAll('.project-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === newMode);
    });

    // 2. Update the global project list for other scripts
    window.projectList = window.projectLists[newMode];
    labGlobalState.totalImages = window.projectList.length;
    console.log(`[Core] Total projects mapped for ${newMode}: ${labGlobalState.totalImages}`);

    // 3. Render the category jump buttons for the new mode in carousel-hero
    renderCarouselCategoryJumpButtons(newMode); // Call the new function

    // 4. Destroy and recreate carousel instance
    destroyCarouselInstance();

    // 5. Regenerate cards and reinitialize the carousel
    // Use requestAnimationFrame to ensure DOM is updated before carousel re-initializes
    requestAnimationFrame(() => {
        generatePosterCards(newMode, () => { // Pass a callback to run after DOM is ready
            if (typeof ModernCarousel !== 'undefined') {
                window.modernCarouselInstanceForHobby = new ModernCarousel();
                window.modernCarouselInstanceForHobby.setupDomReferences();
                window.modernCarouselInstanceForHobby.setupCategoryJump(); // Re-setup events for new category buttons
                window.modernCarouselInstanceForHobby.runCarousel(true); // Trigger entrance animation

                if (window.appBackgroundChanger) {
                    const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
                    window.appBackgroundChanger.refreshImagePaths(initialTheme); // Refresh background image paths based on current theme
                    const centerIndex = window.modernCarouselInstanceForHobby.center;
                    window.appBackgroundChanger.initializeCarouselModeBackground(centerIndex);
                }
            } else {
                console.error("[Core] ModernCarousel class is not defined during mode switch!");
            }
        });
    });
}

// --- [4] Initializers ---
/**
 * Initializes header observers for scroll effects.
 */
window.initHeaderObserver = function() {
    const navHeader = document.querySelector('.nav-header');
    const labHeader = document.querySelector('.lab-header');
    if (!navHeader || !labHeader) {
        console.warn("[Header] Header elements not found for IntersectionObserver.");
        return;
    }
    gsap.set(labHeader, { opacity: 0, visibility: 'hidden', zIndex: 99 });
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
    // jQuery based nav-menu hide on scroll
    $(function () {
        const $menu = $('.nav-menu.nav-center');
        if (!$menu.length) return;
        let lastScroll = 0;
        const delta = 8;
        let ticking = false;
        function updateMenuVisibility() {
            const st = $(window).scrollTop();
            if (st === 0) { $menu.removeClass('hide'); }
            else if (st > lastScroll + delta && st > 60) { $menu.addClass('hide'); }
            else if (st < lastScroll - delta || st <= 0) { $menu.removeClass('hide'); }
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
};

/**
 * Initializes the background image slideshow and controls.
 */
window.initBackgroundSlideshow = function() {
    let onBgIntroCompleteInternalCallback = null;
    let currentImagePaths = [];
    let currentIntroImagePaths = [];
    const imageBaseUrl = './images/';
    const totalAvailableBgImages = 50; // Max number of background images available

    const generateImagePaths = (themePrefix) => {
        const extension = themePrefix === 'bgdark' ? 'png' : 'jpg';
        return Array.from({ length: totalAvailableBgImages }, (_, i) => `${imageBaseUrl}${themePrefix}${i + 1}.${extension}`);
    };

    const generateIntroImagePaths = (allImagePaths) => {
        let introPaths = [];
        // Use a subset of images for intro animation
        const numIntroImages = Math.min(30, allImagePaths.length);
        for (let i = 0; i < numIntroImages; i++) {
            if (allImagePaths[i]) introPaths.push(allImagePaths[i]);
        }
        // You might want to adjust this logic if you want a specific "sweep" like before
        // For now, it's a simple sequence of the first N images.
        return introPaths;
    };

    let initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    currentImagePaths = generateImagePaths(initialTheme === 'dark' ? 'bgdark' : 'bglight');
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

    if (!bgImageA || !bgImageB) { finalBgIntroCallback(); return; }

    let initialAnimationIndex = 0;
    let initialAnimationTimeoutId = null;
    let bgCurrentElement = bgImageA;
    let bgNextElement = bgImageB;

    const getTransitionDelay = (index) => {
        // Adjusted logic for smoother intro based on the number of intro images
        const totalIntroSteps = currentIntroImagePaths.length;
        if (totalIntroSteps === 0) return 0;
        const progress = index / (totalIntroSteps - 1);
        const startDelay = 100;
        const endDelay = 50; // Faster towards the end
        return startDelay - (startDelay - endDelay) * progress;
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
            const isDark = document.documentElement.classList.contains('dark');
            gsap.timeline()
                .to(bgCurrentElement, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0)
                .to(bgNextElement, { opacity: isDark ? 0.2 : 0.5, duration: 0.5, ease: "power2.out" }, 0)
                .call(() => { [bgCurrentElement, bgNextElement] = [bgNextElement, bgCurrentElement]; });
            initialAnimationIndex++;
            initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
        };
        imgChecker.onerror = () => {
            console.warn(`Failed to load image: ${imagePathToLoad}. Skipping.`);
            initialAnimationIndex++;
            if (initialAnimationIndex >= currentIntroImagePaths.length) { finalBgIntroCallback(); }
            else { initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex)); }
        };
        imgChecker.src = imagePathToLoad;
    }

    function triggerPlayVisualIntro(onBgIntroAnimationComplete) {
        onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;
        onBgIntroCallbackProcessed = false;
        const isDark = document.documentElement.classList.contains('dark');
        currentImagePaths = generateImagePaths(isDark ? 'bgdark' : 'bglight');
        currentIntroImagePaths = generateIntroImagePaths(currentImagePaths);

        const firstImagePath = currentIntroImagePaths[0];
        if (!firstImagePath) {
            console.error("No intro images generated. Skipping intro animation.");
            gsap.set(bgImageA, { opacity: 0 });
            gsap.set(bgImageB, { opacity: 0 });
            finalBgIntroCallback();
            return;
        }
        const tempImgCheck = new Image();
        tempImgCheck.onload = () => {
            bgCurrentElement.src = firstImagePath;
            gsap.set(bgCurrentElement, { opacity: isDark ? 0.2 : 0.5 });
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
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const paths = generateImagePaths(theme === 'dark' ? 'bgdark' : 'bglight');
        let loaded = 0;
        // Don't rely on labGlobalState.totalImages here for preloading all 150 BGs
        const totalToPreload = paths.length;
        if (totalToPreload === 0) return;

        paths.forEach(path => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loaded++;
                if (loaded === totalToPreload) console.log(`[Core] All ${theme} background images preloaded.`);
            };
            img.src = path;
        });
    };

    function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
        // Ensure visualIndex wraps correctly based on totalAvailableBgImages
        const safeVisualIndex = (visualIndex % totalAvailableBgImages + totalAvailableBgImages) % totalAvailableBgImages;
        const pathForCarousel = currentImagePaths[safeVisualIndex];

        if (!pathForCarousel) {
            console.warn(`Path for carousel background not found at index ${safeVisualIndex}. Skipping background update.`);
            return;
        }

        if (initialAnimationTimeoutId) { clearTimeout(initialAnimationTimeoutId); initialAnimationTimeoutId = null; }
        const imgChecker = new Image();
        imgChecker.onload = () => {
            bgNextElement.src = pathForCarousel;
            const isDark = document.documentElement.classList.contains('dark');
            gsap.timeline()
                .to(bgCurrentElement, { opacity: 0, duration: duration, ease: "power2.out" }, 0)
                .to(bgNextElement, { opacity: isDark ? 0.2 : 0.5, duration: duration, ease: "power2.out" }, 0)
                .call(() => { [bgCurrentElement, bgNextElement] = [bgNextElement, bgCurrentElement]; });
        };
        imgChecker.onerror = () => {
            console.warn(`Failed to load background image for carousel: ${pathForCarousel}.`);
        };
        imgChecker.src = pathForCarousel;
    }

    window.appBackgroundChanger = {
        playVisualIntroAnimation: triggerPlayVisualIntro,
        initializeCarouselModeBackground: (index) => _setSingleBackgroundImageForCarousel(index, 0),
        _setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
        totalImages: totalAvailableBgImages, // Expose the total count of background images
        refreshImagePaths: (theme) => {
            currentImagePaths = generateImagePaths(theme === 'dark' ? 'bgdark' : 'bglight');
            currentIntroImagePaths = generateIntroImagePaths(currentImagePaths); // Also refresh intro paths
            preloadAllImages();
        }
    };
    preloadAllImages(); // Initial preload
};

/**
 * Main entry point for starting visuals after preloader.
 * This is where the initial carousel appearance is orchestrated.
 */
window.startApplicationVisuals = () => {
    // *** 핵심 수정 부분 1: 이제 .carousel-category-jump는 renderCarouselCategoryJumpButtons에서 초기에 숨겨지므로 여기서는 제거합니다. ***
    // gsap.set('.carousel-category-jump', { opacity: 0, y: 20 });

    gsap.to(['main', '.carousel-hero'], { opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1 });
    const backgroundSlideshow = document.getElementById('background-slideshow');
    if (backgroundSlideshow) {
        const isDark = document.documentElement.classList.contains('dark');
        backgroundSlideshow.style.backgroundColor = isDark ? 'rgba(0,0,0,0.8)' : '#ffffff';
        gsap.to(backgroundSlideshow, { opacity: 1, duration: 1.0, ease: "power2.out" });
    }

    // ** CRITICAL: Create carousel instance here before animations start **
    if (typeof ModernCarousel !== 'undefined') {
        if (!window.modernCarouselInstanceForHobby) {
            window.modernCarouselInstanceForHobby = new ModernCarousel();
            window.modernCarouselInstanceForHobby.setupDomReferences();
            window.modernCarouselInstanceForHobby.setupCategoryJump(); // Initial setup for category jump
        }
    } else {
        console.error("ModernCarousel class is not defined! Cannot initialize main component.");
        return;
    }

    // ** CRITICAL: This restores the original appearance effect **
    // Play the background intro animation FIRST, and only when it's done, run the carousel.
    if (window.appBackgroundChanger && typeof window.appBackgroundChanger.playVisualIntroAnimation === 'function') {
        let isCarouselStartTriggered = false;
        window.appBackgroundChanger.playVisualIntroAnimation(() => {
            if (isCarouselStartTriggered) return;
            isCarouselStartTriggered = true;
            if (window.appBackgroundChanger.initializeCarouselModeBackground) {
                const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
                window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
            }
            if (window.modernCarouselInstanceForHobby.runCarousel) {
                window.modernCarouselInstanceForHobby.runCarousel(true);
                gsap.to('.lab-header', { opacity: 1, visibility: 'visible', duration: 2, ease: "power2.out", delay: 1 });
            }
        });
    } else {
        // Fallback if the intro animation system isn't available
        console.warn("appBackgroundChanger not found. Starting carousel directly.");
        if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
            window.modernCarouselInstanceForHobby.runCarousel(true);
            gsap.to('.lab-header', { opacity: 1, visibility: 'visible', duration: 0.5, ease: "power2.out", delay: 0.5 });
        } else {
             console.error("ModernCarousel instance or runCarousel method not found for fallback!");
        }
    }
};

// --- [5] Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.appContentLoadedAndInitialized) {
        return;
    }
    window.appContentLoadedAndInitialized = true;

    // ** CRITICAL: Generate cards and UI but DO NOT initialize the carousel here **
    // The initialization is now handled by startApplicationVisuals()
    generatePosterCards(labGlobalState.currentProjectMode);
    renderCarouselCategoryJumpButtons(labGlobalState.currentProjectMode); // Initial render for category jump buttons

    // Attach listeners for the static project mode toggle buttons
    document.getElementById('toggle-css')?.addEventListener('click', () => switchProjectMode('css'));
    document.getElementById('toggle-js')?.addEventListener('click', () => switchProjectMode('js'));

    // Initialize other components
    window.initHeaderObserver();
    window.initBackgroundSlideshow();

    // Listen for theme changes to update visuals
    document.addEventListener('themeChanged', (event) => {
        const newTheme = event.detail.theme;
        console.log(`[Lab Core] Theme changed to ${newTheme}. Syncing visuals.`);

        if (window.appBackgroundChanger && window.modernCarouselInstanceForHobby) {
            gsap.to(['.carousel', '.carousel-hero'], {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                    window.appBackgroundChanger.refreshImagePaths(newTheme);
                    const bgSlideshow = document.getElementById('background-slideshow');
                    if (bgSlideshow) {
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
        }
    });

    // This event should be dispatched by your preloader script when it hides
    document.addEventListener('preloaderHidden', () => {
        // This is just a safety fade-in for the body
        gsap.to(document.body, { opacity: 1, duration: 0.5, ease: "power2.out" });
        // The main visual start is now assumed to be called separately, 
        // but we can hook it here if needed. For now, we assume another script calls startApplicationVisuals.
    });
});
})();
