// 페이지 전환 및 전역 상태를 위한 주 진입점 및 오케스트레이터.

// 전역 상태 관리
const globalState = {
    isHeroAreaVisible: false,
    isTextHeroAreaVisible: false,
    isTimelineAreaVisible: false,
    isGrapeFooterAreaVisible: false,
    hasInitialHeroAnimationPlayed: false,
    userInteractedDuringAnimation: false,
    footerZoomedIn: false,
    vineAnimationCurrentlyPlaying: false,
    currentActiveTimelineSection: 0,
    lastScrollDirection: 0,
    textheroAnimationsActive: true,
    isExperienceHeaderVisible: false // NEW: Track experience-header visibility
};

/**
 * Updates global state variables.
 * @param {object} newState - New state object to update.
 */
function setGlobalState(newState) {
    Object.assign(globalState, newState);
    // console.log("DEBUG: Global state updated:", globalState);
}

// DOM 요소
let heroSection;
let heroBg;
let scrollDownBtn;
let heroVideo;
let navHeader;
let newExperienceHeader;
let textHeroSection;
let timelineSection;
let marqueeContainer;
let grapeFooterQuoteSection;
let footerImgEl;
let footerTextEl;

// 섹션 참조 객체
const sections = {};

// ScrollTrigger 인스턴스
let timelineSectionScrollTrigger;
let experienceHeaderVisibilityObserver;

// --- Utility Functions ---

/**
 * Smoothly scrolls to an element.
 * @param {HTMLElement} element - Target DOM element.
 * @param {string} block - Vertical alignment ('start', 'center', 'end', 'nearest').
 * @param {function} callback - Function to run after scroll completion.
 * @param {number} duration - Scroll animation duration in milliseconds.
 */
function smoothScrollToElement(element, block = 'start', callback = () => {}, duration = 800) {
    if (!element) {
        console.warn("DEBUG: Attempted to scroll to a non-existent element.", element);
        callback();
        return;
    }

    const startPosition = window.scrollY;
    const elementRect = element.getBoundingClientRect();
    let targetPosition;

    if (block === 'start') {
        targetPosition = elementRect.top + window.scrollY;
    } else if (block === 'center') {
        targetPosition = elementRect.top + window.scrollY - (window.innerHeight / 2) + (elementRect.height / 2);
    } else if (block === 'end') {
        targetPosition = elementRect.bottom + window.scrollY - window.innerHeight;
    } else {
        targetPosition = elementRect.top + window.scrollY;
    }

    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easeProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);

        window.scrollTo(0, startPosition + distance * easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animation);
        } else {
            callback();
            console.log(`DEBUG: Smooth scroll finished to element: ${element.id || element.className}`);
        }
    }
    console.log(`DEBUG: Starting smooth scroll to element: ${element.id || element.className}`);
    requestAnimationFrame(animation);
}

// --- Hero Section Functions ---

/**
 * Shows the scroll-down button.
 */
function showScrollDownButton() {
    if (scrollDownBtn) {
        console.log("DEBUG: Scroll down button should be visible (controlled by CSS).");
    } else {
        console.warn("DEBUG: scrollDownBtn element not found.");
    }
}

/**
 * Initial setup and state handling for the hero section background.
 */
function initialHeroSetup() {
    if (!heroBg || globalState.hasInitialHeroAnimationPlayed) {
        if (globalState.hasInitialHeroAnimationPlayed) {
            console.log("DEBUG: Initial hero setup already played.");
        }
        return;
    }

    const applyInitialHeroStyles = () => {
        if (!globalState.hasInitialHeroAnimationPlayed) {
            heroBg.style.transform = `scale(1)`;
            heroBg.style.transition = 'none';
            showScrollDownButton();
            setGlobalState({ hasInitialHeroAnimationPlayed: true });
            console.log("DEBUG: Initial hero setup (always large hero) completed.");
        }
    };

    if (heroVideo) {
        if (heroVideo.readyState >= 3) {
            applyInitialHeroStyles();
        } else {
            heroVideo.addEventListener('canplaythrough', applyInitialHeroStyles, { once: true });
            heroVideo.addEventListener('loadeddata', applyInitialHeroStyles, { once: true });
            heroVideo.addEventListener('error', () => {
                console.error("DEBUG: Hero video error encountered. Proceeding with initial setup.");
                applyInitialHeroStyles();
            }, { once: true });
            console.log("DEBUG: Waiting for hero video to be ready.");
        }
    } else {
        if (heroBg && !globalState.hasInitialHeroAnimationPlayed) {
            applyInitialHeroStyles();
        }
    }
}

/**
 * Forces synchronization of the hero section state.
 */
function forceHeroSectionSync() {
    if (!heroSection || !heroBg) {
        console.warn("DEBUG: Missing heroSection or heroBg for forceHeroSectionSync.");
        return;
    }

    const rect = heroSection.getBoundingClientRect();
    const visibleThreshold = 40;

    if (rect.top >= -visibleThreshold && rect.bottom <= window.innerHeight + visibleThreshold) {
        heroBg.style.transform = `scale(1)`;
        heroBg.style.transition = 'none';
        showScrollDownButton();
        console.log("DEBUG: Force syncing hero section to always large state.");
    } else {
        console.log("DEBUG: Hero section not fully in view, not forcing sync.");
    }
}

// --- Footer Section Transition Handlers ---

function handleHeroToTextHeroTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(textHeroSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Hero to TextHero transition completed.");
    }, 1200);
}

function handleTextHeroToTimelineTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(timelineSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: TextHero to Timeline transition completed.");
    }, 1200);
}

function handleTimelineToFooterTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(grapeFooterQuoteSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Timeline to Footer transition completed.");
    }, 1200);
}

function handleTextHeroToHeroTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(heroSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: TextHero to Hero transition completed.");
    }, 1200);
}

function handleTimelineToTextHeroTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(textHeroSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Timeline to TextHero transition completed.");
    }, 1200);
}

function handleGrapeFooterToTimelineTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(timelineSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Grape Footer to Timeline transition completed.");
    }, 1200);
}

// --- Footer Section Functions ---

let footerAnimationTimeoutId = null;

const footerSteps = [
    { text: "Now, this grape is being transformed—", start: 1, end: 4 },
    { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
    { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
];
const totalFooterImageFrames = 14;
const showTimePerStep = 1000;
const pauseTimeAtEnd = 2000;

/**
 * Scrolls footer image to viewport center.
 */
function scrollFooterImgToCenter() {
    if (!footerImgEl || footerImgEl.offsetParent === null) {
        console.warn("DEBUG: footerImgEl not found or not in DOM.");
        return;
    }
    const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    footerImgEl.scrollIntoView({ behavior: prm ? 'auto' : 'smooth', block: 'center' });
    console.log("DEBUG: Scrolling footer image to center.");
}

/**
 * Animates footer image and text in a loop.
 */
function animateFooterLoop() {
    clearTimeout(footerAnimationTimeoutId);
    console.log("DEBUG: Starting footer animation loop.");
    let currentFooterImageFrame = 1;

    function nextFooterStep() {
        if (!footerImgEl || !footerTextEl || !globalState.footerZoomedIn) {
            clearTimeout(footerAnimationTimeoutId);
            return;
        }
        footerImgEl.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`;
        let currentText = "";
        for (const step of footerSteps) {
            if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) {
                currentText = step.text;
                break;
            }
        }
        footerTextEl.innerHTML = currentText;
        currentFooterImageFrame++;
        if (currentFooterImageFrame <= totalFooterImageFrames) {
            footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep);
        } else {
            if (footerSteps.length > 0) footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text;
            footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
            footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
        }
    }
    nextFooterStep();
}

// --- Header Orchestration Logic ---
function orchestrateHeaderVisibility() {
    if (!newExperienceHeader || !navHeader) return;

    const isNavHeaderExpanded = window.getNavHeaderExpandedState ? window.getNavHeaderExpandedState() : false;
    const isTexthero90PercentVisible = globalState.isTextHeroAreaVisible && textHeroSection.getBoundingClientRect().height * 0.9 <= window.innerHeight;
    const isGrapeFooterVisible = globalState.isGrapeFooterAreaVisible;

    // Experience Header visibility
    if (isNavHeaderExpanded || !isTexthero90PercentVisible || isGrapeFooterVisible) {
        newExperienceHeader.classList.remove('visible');
        setGlobalState({ isExperienceHeaderVisible: false });
        console.log(`DEBUG: Experience header hidden. Expanded: ${isNavHeaderExpanded}, Texthero90%: ${isTexthero90PercentVisible}, Footer: ${isGrapeFooterVisible}`);
    } else {
        newExperienceHeader.classList.add('visible');
        setGlobalState({ isExperienceHeaderVisible: true });
        console.log("DEBUG: Experience header visible.");
    }

    // Main nav-header visibility
    if (isTexthero90PercentVisible && !isNavHeaderExpanded && !isGrapeFooterVisible) {
        navHeader.classList.add('hidden');
        console.log("DEBUG: Nav-header hidden by experience header logic.");
    } else {
        navHeader.classList.remove('hidden');
        console.log("DEBUG: Nav-header visible (or controlled by its own logic).");
    }

    // Update texthero animations
    if (window.textheroComponent) {
        if (isTexthero90PercentVisible && !isGrapeFooterVisible) {
            if (!globalState.textheroAnimationsActive) {
                window.textheroComponent.activateScrollAnimation();
                setGlobalState({ textheroAnimationsActive: true });
            }
        } else {
            if (globalState.textheroAnimationsActive) {
                window.textheroComponent.deactivateScrollAnimation();
                setGlobalState({ textheroAnimationsActive: false });
            }
        }
    }
}

// --- Main DOMContentLoaded Listener ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired.");

    // GSAP Registration
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        console.log("DEBUG: GSAP and ScrollTrigger registered.");
    } else {
        console.warn("DEBUG: GSAP or ScrollTrigger not found. Animations might not work.");
    }

    // Fetch DOM elements
    heroSection = document.getElementById('hero-section');
    heroBg = document.querySelector('.hero-winery-bg');
    scrollDownBtn = document.querySelector('.scroll-down-btn');
    heroVideo = document.getElementById('heroVideo');
    navHeader = document.querySelector('.nav-header');
    newExperienceHeader = document.querySelector('.experience-header');
    textHeroSection = document.getElementById('skills-showcase-section');
    timelineSection = document.querySelector('.timeline-section-container');
    marqueeContainer = document.querySelector('.marquee-container');
    grapeFooterQuoteSection = document.getElementById('grape-footer-section');
    footerImgEl = document.getElementById('grapeFooterImg'); 
    footerTextEl = document.getElementById('grapeFooterText');

    console.log("DEBUG: All main DOM elements retrieved.");

    // Initialize Timeline
    if (window.timeline && window.timeline.renderSection) {
        window.timeline.renderSection(0);
        console.log("DEBUG: Initial timeline section rendered.");
    } else {
        console.warn("DEBUG: timelineComponent not found.");
    }

    // Hero Section Observer
    if (heroSection) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isHeroAreaVisible: entry.isIntersecting });
                console.log(`DEBUG: Hero Section visibility: ${entry.isIntersecting}`);
                if (entry.isIntersecting) {
                    forceHeroSectionSync();
                }
                orchestrateHeaderVisibility();
            });
        }, { threshold: [0.6] });
        heroObserver.observe(heroSection);
        console.log("DEBUG: Hero section observer set up.");
    }

    // Text Hero Section Observer
    if (textHeroSection) {
        const textHeroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isTextHeroAreaVisible: entry.intersectionRatio >= 0.9 });
                console.log(`DEBUG: Text Hero Section visibility: ${entry.isIntersecting}, Ratio: ${entry.intersectionRatio.toFixed(2)}`);
                orchestrateHeaderVisibility();
            });
        }, { threshold: 0.9 });
        textHeroObserver.observe(textHeroSection);
    }

    // Timeline Section ScrollTrigger
    if (timelineSection && window.timeline) {
        timelineSectionScrollTrigger = ScrollTrigger.create({
            trigger: timelineSection,
            scroller: null,
            start: "top 60%",
            end: "bottom top",
            onEnter: () => {
                console.log("DEBUG: Timeline Section entered.");
                window.timeline.renderSection(globalState.currentActiveTimelineSection);
                orchestrateHeaderVisibility();
            },
            onLeaveBack: () => {
                console.log("DEBUG: Timeline Section left (up).");
                orchestrateHeaderVisibility();
            },
            onEnterBack: () => {
                console.log("DEBUG: Timeline Section re-entered.");
                window.timeline.renderSection(globalState.currentActiveTimelineSection);
                orchestrateHeaderVisibility();
            },
            onLeave: () => {
                console.log("DEBUG: Timeline Section left.");
                orchestrateHeaderVisibility();
            }
        });
    }

    // Footer Section Observer
    if (grapeFooterQuoteSection) {
        const footerObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isGrapeFooterAreaVisible: entry.isIntersecting });
                console.log(`DEBUG: Footer visibility: ${entry.isIntersecting}`);
                if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !globalState.footerZoomedIn) {
                    setGlobalState({ footerZoomedIn: true });
                    if (footerImgEl && !footerImgEl.classList.contains('zoomed-in')) {
                        scrollFooterImgToCenter();
                        footerImgEl.classList.add('zoomed-in');
                        animateFooterLoop();
                    }
                } else if (!entry.isIntersecting && globalState.footerZoomedIn && entry.boundingClientRect.bottom < 0) {
                    clearTimeout(footerAnimationTimeoutId);
                    setGlobalState({ footerZoomedIn: false });
                    if (footerImgEl) footerImgEl.classList.remove('zoomed-in');
                }
                orchestrateHeaderVisibility();
            });
        }, { threshold: [0, 0.5, 1.0] });
        footerObserver.observe(grapeFooterQuoteSection);
    }

    // Scroll Down Button Binding
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("DEBUG: Scroll down button clicked.");
        });
    }

    // Initial Hero Setup
    initialHeroSetup();
    orchestrateHeaderVisibility();

    // Accordion Menu Toggle Listener
    document.addEventListener('accordionMenuToggled', () => {
        orchestrateHeaderVisibility();
        console.log("DEBUG: Accordion menu toggled, re-evaluating header visibility.");
    });

    // Scroll Interaction Detection
    let lastScrollTop = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (document.documentElement.style.scrollBehavior === 'smooth' && Math.abs(currentScrollY - lastScrollTop) > 5) {
            setGlobalState({ userInteractedDuringAnimation: true });
            document.documentElement.style.scrollBehavior = 'auto';
        } else if (Math.abs(currentScrollY - lastScrollTop) <= 5) {
            setGlobalState({ userInteractedDuringAnimation: false });
        }
        lastScrollTop = currentScrollY;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
        if (window.timeline && window.timeline.renderSection) {
            let currentActiveIdx = 0;
            window.timeline.titles.forEach((t, i) => {
                if (t.classList.contains('active')) {
                    currentActiveIdx = i;
                }
            });
            window.timeline.renderSection(currentActiveIdx);
        }
        orchestrateHeaderVisibility();
    });

    // Theme Toggle
    const experienceThemeToggle = document.querySelector('.experience-header .theme-toggle');
    const experienceSunIcon = document.getElementById('sun-icon');
    const experienceMoonIcon = document.getElementById('moon-icon');

    function toggleExperienceHeaderTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'light') {
            experienceSunIcon.classList.remove('hidden');
            experienceMoonIcon.classList.add('hidden');
        } else {
            experienceSunIcon.classList.add('hidden');
            experienceMoonIcon.classList.remove('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'light') {
        if (experienceMoonIcon) experienceMoonIcon.classList.add('hidden');
    } else {
        if (experienceSunIcon) experienceSunIcon.classList.add('hidden');
    }

    if (experienceThemeToggle) {
        experienceThemeToggle.addEventListener('click', toggleExperienceHeaderTheme);
    }
});