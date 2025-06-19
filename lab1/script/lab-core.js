// lab-core.js
(function() {
if (window.hobbyScriptHasFullyInitialized) {
// console.warn("lab-core.js: Script has already been fully initialized. Skipping redundant full execution.");
return;
}
window.hobbyScriptHasFullyInitialized = true;
// console.log("lab-core.js: Starting initial script evaluation and setup.");

/* === Header Hiding (for nav-header) === */
function initHeaderObserver() {
const header = document.querySelector('.nav-header');
const sentinel = document.getElementById('top-sentinel');
if (!header || !sentinel) {
// console.warn("[HEADER] Header or sentinel not found for IntersectionObserver.");
return;
}
// Initially show the nav-header
header.classList.remove('hide');
header.classList.add('show'); // Ensure it starts visible for interaction
const observer = new window.IntersectionObserver(
(entries) => {
entries.forEach(entry => {
// Only hide if the sentinel is not intersecting (meaning we scrolled past the top)
// This makes the nav-header disappear when scrolling down, and reappear when scrolling up to top
// It does NOT control the new lab-header.
header.classList.toggle('hide', !entry.isIntersecting);
});
}, { root: null, threshold: 0.1 } // Use a small threshold to trigger hide earlier
);
observer.observe(sentinel);
}

// ===== Scroll Direction Nav Menu Hiding (for nav-menu) =====
$(function () {
const $menu = $('.nav-menu.nav-center');
if (!$menu.length) return;
let lastScroll = 0;
const delta = 8;
let ticking = false;
function updateMenuVisibility() {
const st = $(window).scrollTop();
// Only apply hide/show logic if the nav menu is not expanded (common.js toggle)
const isNavMenuExpanded = document.body.classList.contains('nav-menu-expanded');
if (isNavMenuExpanded) {
$menu.removeClass('hide'); // Always show if expanded
} else {
if (st === 0) $menu.removeClass('hide');
else if (st > lastScroll + delta && st > 60) $menu.addClass('hide');
else if (st < lastScroll - delta || st <= 0) $menu.removeClass('hide');
}
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

// Function to get image paths based on current theme
function getImagePathsForCurrentTheme() {
const totalImages = 45; // Total images available
const theme = document.body.getAttribute('data-theme') || 'light';
const imageBaseName = theme === 'dark' ? 'bgdark' : 'bglight';
return Array.from({ length: totalImages }, (_, i) => `./images/${imageBaseName}${i + 1}.jpg`);
}

let imagePaths = getImagePathsForCurrentTheme(); // Initialize with current theme

// Timing for image transitions (Remains consistent regardless of theme)
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
if (initialAnimationIndex >= imagePaths.length) {
initialAnimationTimeoutId = null;
finalBgIntroCallback();
return;
}
const imagePathToLoad = imagePaths[initialAnimationIndex];
if (!imagePathToLoad) { // Fallback for undefined path
initialAnimationIndex++;
initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
return;
}

const imgChecker = new Image();
imgChecker.onload = () => {
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
// In case of image loading error, skip to next image
console.error(`Failed to load image: ${imagePathToLoad}. Skipping.`);
initialAnimationIndex++;
if (initialAnimationIndex >= imagePaths.length) {
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
onBgIntroCallbackProcessed = false; // Reset for new animation cycle

onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;

// Update imagePaths based on current theme before starting animation
imagePaths = getImagePathsForCurrentTheme();
// Create intro image sequence: 15 to 1 (descending), then 1 to 15 (ascending)
let introImagePaths = [];
const tempImagePaths = getImagePathsForCurrentTheme(); // Use current theme images
// Part 1: 15 to 1 (slow to less slow)
for (let i = 15; i >= 1; i--) {
introImagePaths.push(tempImagePaths[i - 1]);
}
// Part 2: 1 to 15 (less slow to normal)
for (let i = 1; i <= 15; i++) {
introImagePaths.push(tempImagePaths[i - 1]);
}
imagePaths = introImagePaths; // Set imagePaths to the intro sequence

const firstImagePath = imagePaths[0];
if (!firstImagePath) { // Handle case where imagePaths might be empty
finalBgIntroCallback();
return;
}

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

// Image preloading logic for the *entire set* of images for current theme
function preloadAllThemeImages() {
imagePaths = getImagePathsForCurrentTheme(); // Ensure current theme images are used
let imagesToPreloadCount = imagePaths.length;
if (imagesToPreloadCount === 0) {
// console.log("No images to preload.");
return;
}
// console.log(`Preloading ${imagesToPreloadCount} images for current theme...`);
imagePaths.forEach((path) => {
const img = new Image();
img.onload = img.onerror = () => {
imagesToPreloadCount--;
if (imagesToPreloadCount === 0) {
// console.log("All background images for current theme preloaded.");
// This callback isn't tied to animation start, just preload completion
}
};
img.src = path;
});
}

function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
const currentThemeImagePaths = getImagePathsForCurrentTheme(); // Get theme-specific paths
const safeVisualIndex = (visualIndex % currentThemeImagePaths.length + currentThemeImagePaths.length) % currentThemeImagePaths.length;
if (!currentThemeImagePaths[safeVisualIndex]) {
// console.warn(`Image path not found for index ${safeVisualIndex} in current theme.`)
return;
}

if (initialAnimationTimeoutId) {
clearTimeout(initialAnimationTimeoutId);
initialAnimationTimeoutId = null;
}

const imgChecker = new Image();
imgChecker.onload = () => {
bgNextElement.src = currentThemeImagePaths[safeVisualIndex];

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
console.error(`Failed to load background image: ${currentThemeImagePaths[safeVisualIndex]}`);
};
imgChecker.src = currentThemeImagePaths[safeVisualIndex];
}

function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
const BACKGROUND_IMAGES_PER_CARD_STEP = 3;
currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter * BACKGROUND_IMAGES_PER_CARD_STEP) % imagePaths.length;
_setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel, 0);
}

window.appBackgroundChanger = {
playVisualIntroAnimation: triggerPlayVisualIntro,
initializeCarouselModeBackground: initializeCarouselModeBg,
_setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
// totalImages: totalImages, // This will be dynamic now
preloadAllThemeImages: preloadAllThemeImages // Expose preload function
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


// Theme Toggle Logic for Lab Header
const labThemeToggle = document.querySelector('.lab-header .theme-toggle');
const labSunIcon = document.getElementById('sun-icon');
const labMoonIcon = document.getElementById('moon-icon');

function toggleLabHeaderTheme() {
const currentTheme = document.body.getAttribute('data-theme');
const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; // Toggle

document.body.setAttribute('data-theme', newTheme);
localStorage.setItem('theme', newTheme); // Save the new theme

// Update icons
if (newTheme === 'light') {
if (labSunIcon) labSunIcon.classList.remove('hidden');
if (labMoonIcon) labMoonIcon.classList.add('hidden');
} else { // newTheme is 'dark'
if (labSunIcon) labSunIcon.classList.add('hidden');
if (labMoonIcon) labMoonIcon.classList.remove('hidden');
}

// Trigger background image change and carousel animation on theme toggle
if (window.appBackgroundChanger) {
window.appBackgroundChanger.preloadAllThemeImages(); // Preload images for the new theme
// Restart the visual intro animation which also triggers carousel entrance
window.appBackgroundChanger.playVisualIntroAnimation(() => {
    if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
        const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
        window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
        window.modernCarouselInstanceForHobby.runCarousel(true); // Re-run carousel entrance animation
    }
});
}
}

// Initial theme setup on page load for Lab page
let savedTheme = localStorage.getItem('theme');

// If no theme is saved or if the saved theme is 'dark', force it to 'light' for this page.
if (!savedTheme || savedTheme === 'dark') {
savedTheme = 'light';
localStorage.setItem('theme', savedTheme); // Also save 'light' to local storage
}

document.body.setAttribute('data-theme', savedTheme); // Apply the determined initial theme

// Set icon visibility based on the *applied* initial theme
if (savedTheme === 'light') {
if (labSunIcon) labSunIcon.classList.remove('hidden');
if (labMoonIcon) labMoonIcon.classList.add('hidden');
} else { // savedTheme is 'dark'
if (labSunIcon) labSunIcon.classList.add('hidden');
if (labMoonIcon) labMoonIcon.classList.remove('hidden');
}

if (labThemeToggle) {
labThemeToggle.addEventListener('click', toggleLabHeaderTheme);
}

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
window.appBackgroundChanger.preloadAllThemeImages(); // Preload images for the initial theme
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
