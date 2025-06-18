// hero.js
// Manages the hero section's visual effects, including background video/image
// animation, zoom states, and the scroll-down button.

import { globalState, setGlobalState } from './experience.js';
import { updateFixedElementsDisplay } from './fixedGrapeImage.js';
import { playVineLoadAnimationThenActivateFirstStage, activateStage } from './timeline.js';

let _heroBg;
let _heroSection;
let _scrollDownBtn;
let _heroVideo;
let _navHeader;

let _HERO_ZOOM_SCALE_FACTOR;
let _heroBgZoomInTransition;
let _heroBgZoomOutTransition;

let _triggerHeroToWorkExpSequenceCallback;

/**
 * Initializes this module with necessary DOM elements and constants.
 * @param {object} elements - DOM elements.
 * @param {number} scaleFactor - HERO_ZOOM_SCALE_FACTOR.
 * @param {string} zoomInTransition - heroBgZoomInTransition.
 * @param {string} zoomOutTransition - heroBgZoomOutTransition.
 * @param {function} triggerSequence - Callback to trigger hero to work exp sequence from experience.js.
 * @param {function} updateFixedDisplay - Callback to update fixed elements.
 */
export function initHeroSection({
    heroBg, heroSection, scrollDownBtn, heroVideo, navHeader,
    HERO_ZOOM_SCALE_FACTOR, heroBgZoomInTransition, heroBgZoomOutTransition,
    triggerHeroToWorkExpSequence, updateFixedElementsDisplay
}) {
    _heroBg = heroBg;
    _heroSection = heroSection;
    _scrollDownBtn = scrollDownBtn;
    _heroVideo = heroVideo;
    _navHeader = navHeader;

    _HERO_ZOOM_SCALE_FACTOR = HERO_ZOOM_SCALE_FACTOR;
    _heroBgZoomInTransition = heroBgZoomInTransition;
    _heroBgZoomOutTransition = heroBgZoomOutTransition;

    _triggerHeroToWorkExpSequenceCallback = triggerHeroToWorkExpSequence;

    // Observe the hero section to trigger zoom in/out
    if (_heroSection) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isHeroAreaVisible: entry.isIntersecting });

                if (globalState.isHeroAreaVisible && window.scrollY < window.innerHeight / 2 && globalState.hasInitialHeroAnimationPlayed && globalState.zoomState === 'zoomOut' && !globalState.isAutoScrollingToWorkExp) {
                    heroZoomIn({ heroBg: _heroBg, navHeader: _navHeader, scrollDownBtn: _scrollDownBtn });
                }
                if (entry.isIntersecting) {
                    forceHeroSectionSync({ heroSection: _heroSection, heroBg: _heroBg, navHeader: _navHeader, scrollDownBtn: _scrollDownBtn });
                }
            });
            updateFixedElementsDisplay({ fixedGrapeImageContainer: document.querySelector('.fixed-image-container'), dragInstructionElement: document.getElementById('drag-instruction') });
        }, { threshold: [0, 0.5, 1.0] });
        obs.observe(_heroSection);
    }

    // Initialize resizable timeline area observer for Hero-to-Timeline transition
    const resizableTimelineArea = document.querySelector('.resizable-timeline-area');
    if (resizableTimelineArea) {
        const timelineAreaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isTimelineAreaVisible: entry.isIntersecting });
                if (entry.isIntersecting && _heroSection) {
                    const heroRect = _heroSection.getBoundingClientRect();
                    if (globalState.zoomState === 'zoomIn' && heroRect.bottom < (window.innerHeight * 0.85) && !globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                        _triggerHeroToWorkExpSequenceCallback({
                            heroBg: _heroBg,
                            navHeader: _navHeader,
                            scrollDownBtn: _scrollDownBtn
                        });
                    }
                }
                updateFixedElementsDisplay({ fixedGrapeImageContainer: document.querySelector('.fixed-image-container'), dragInstructionElement: document.getElementById('drag-instruction') });
            });
        }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
        timelineAreaObserver.observe(resizableTimelineArea);
    }

    if (_heroBg) {
        hideScrollDownButton();
        initialHeroSetup({ heroBg: _heroBg, heroVideo: _heroVideo, navHeader: _navHeader, scrollDownBtn: _scrollDownBtn });
    }

    if (_scrollDownBtn) {
        _scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!globalState.isAutoScrollingToWorkExp) {
                _triggerHeroToWorkExpSequenceCallback({ heroBg: _heroBg, navHeader: _navHeader, scrollDownBtn: _scrollDownBtn });
            }
        });
    }
}

/**
 * Shows the scroll down button.
 */
function showScrollDownButton() {
    if (_scrollDownBtn) {
        _scrollDownBtn.style.opacity = '1';
        _scrollDownBtn.style.visibility = 'visible';
        _scrollDownBtn.style.pointerEvents = 'auto';
    }
}

/**
 * Hides the scroll down button.
 */
function hideScrollDownButton() {
    if (_scrollDownBtn) {
        _scrollDownBtn.style.opacity = '0';
        _scrollDownBtn.style.visibility = 'hidden';
        _scrollDownBtn.style.pointerEvents = 'none';
    }
}

/**
 * Handles the initial setup and animation of the hero section background.
 * @param {object} elements - DOM elements.
 */
function initialHeroSetup({ heroBg, heroVideo, navHeader, scrollDownBtn }) {
    if (!heroBg || globalState.hasInitialHeroAnimationPlayed) {
        if (!heroVideo && !globalState.hasInitialHeroAnimationPlayed && heroBg) {
            heroBg.style.transform = `scale(${_HERO_ZOOM_SCALE_FACTOR})`;
            setGlobalState({ zoomState: 'zoomIn' });
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
            setGlobalState({ hasInitialHeroAnimationPlayed: true });
        }
        return;
    }
    const onVideoReady = () => {
        if (!globalState.hasInitialHeroAnimationPlayed) {
            heroBg.style.transform = `scale(${_HERO_ZOOM_SCALE_FACTOR})`;
            setGlobalState({ zoomState: 'zoomIn' });
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
            setGlobalState({ hasInitialHeroAnimationPlayed: true });
        }
    };
    if (heroVideo) {
        if (heroVideo.readyState >= 3) {
            onVideoReady();
        } else {
            heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
            heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
            heroVideo.addEventListener('error', () => { onVideoReady(); }, { once: true });
        }
    } else {
        if (heroBg && !globalState.hasInitialHeroAnimationPlayed) {
            heroBg.style.transform = `scale(${_HERO_ZOOM_SCALE_FACTOR})`;
            setGlobalState({ zoomState: 'zoomIn' });
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
            setGlobalState({ hasInitialHeroAnimationPlayed: true });
        }
    }
}

/**
 * Zooms in the hero background image.
 * @param {object} elements - DOM elements.
 */
export function heroZoomIn({ heroBg, navHeader, scrollDownBtn }) {
    if (heroBg && globalState.zoomState === 'zoomOut') {
        heroBg.style.transition = _heroBgZoomInTransition;
        heroBg.style.transform = `scale(${_HERO_ZOOM_SCALE_FACTOR})`;
        setGlobalState({ zoomState: 'zoomIn' });
        if (navHeader) navHeader.classList.add('experience-header-hidden-override');
        showScrollDownButton();
    }
}

/**
 * Zooms out the hero background image.
 * @param {object} elements - DOM elements.
 * @param {string} heroBgZoomOutTransition - The transition property.
 */
export function heroZoomOut({ heroBg, navHeader, scrollDownBtn, heroBgZoomOutTransition }) {
    if (heroBg && globalState.zoomState === 'zoomIn') {
        heroBg.style.transition = heroBgZoomOutTransition;
        heroBg.style.transform = 'scale(0.9)';
        setGlobalState({ zoomState: 'zoomOut' });
        hideScrollDownButton();
        if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
    }
}

/**
 * Triggers the sequence to transition from the hero section to the work experience section.
 * This is called by experience.js and orchestrated there.
 * @param {object} heroElements - Elements like heroBg, navHeader, scrollDownBtn.
 * @param {object} timelineElementsAndData - Elements and data for timeline.js.
 */
export function triggerHeroToWorkExpSequence(heroElements, timelineElementsAndData) {
    if (globalState.isAutoScrollingToWorkExp || globalState.zoomState === 'zoomOut') return;
    setGlobalState({ isAutoScrollingToWorkExp: true });

    heroZoomOut({
        heroBg: heroElements.heroBg,
        navHeader: heroElements.navHeader,
        scrollDownBtn: heroElements.scrollDownBtn,
        heroBgZoomOutTransition: timelineElementsAndData.heroBgZoomOutTransition
    });

    const targetStage = timelineElementsAndData.stageMapping[timelineElementsAndData.workExpHeaderStageIdx];
    let scrollTargetElement;
    if (targetStage && targetStage.row) {
        scrollTargetElement = targetStage.row.closest('.timeline-entry') || targetStage.row;
    } else {
        scrollTargetElement = document.getElementById('work-experience-section-refactored');
    }

    if (scrollTargetElement && window.smoothScrollToElement) {
        window.smoothScrollToElement(scrollTargetElement, 'start', () => {
            playVineLoadAnimationThenActivateFirstStage(() => {
                activateStage(timelineElementsAndData.workExpHeaderStageIdx, false, true, {
                    grapeTexts: timelineElementsAndData.grapeTexts,
                    grapeImgElement: timelineElementsAndData.grapeImgElement,
                    fixedVineGaugeContainer: timelineElementsAndData.fixedVineGaugeContainer,
                    workExperienceIntro: timelineElementsAndData.workExperienceIntro,
                    leftPane: timelineElementsAndData.leftPane,
                    resizableTimelineArea: timelineElementsAndData.resizableTimelineArea,
                    navHeader: timelineElementsAndData.navHeader,
                    heroBg: heroElements.heroBg,
                    heroZoomOut: heroZoomOut,
                    heroBgZoomOutTransition: timelineElementsAndData.heroBgZoomOutTransition
                }, timelineElementsAndData.stageMapping);
                setGlobalState({ isAutoScrollingToWorkExp: false });
            });
        }, 1200);
    } else {
        playVineLoadAnimationThenActivateFirstStage(() => {
            activateStage(timelineElementsAndData.workExpHeaderStageIdx, true, true, {
                grapeTexts: timelineElementsAndData.grapeTexts,
                grapeImgElement: timelineElementsAndData.grapeImgElement,
                fixedVineGaugeContainer: timelineElementsAndData.fixedVineGaugeContainer,
                workExperienceIntro: timelineElementsAndData.workExperienceIntro,
                leftPane: timelineElementsAndData.leftPane,
                resizableTimelineArea: timelineElementsAndData.resizableTimelineArea,
                navHeader: timelineElementsAndData.navHeader,
                heroBg: heroElements.heroBg,
                heroZoomOut: heroZoomOut,
                heroBgZoomOutTransition: timelineElementsAndData.heroBgZoomOutTransition
            }, timelineElementsAndData.stageMapping);
            setGlobalState({ isAutoScrollingToWorkExp: false });
        });
    }
    setGlobalState({ userInteractedDuringAnimation: false });
}

/**
 * Forces the hero section's state to synchronize (zoom, scroll button, header visibility).
 * @param {object} elements - DOM elements.
 */
export function forceHeroSectionSync({ heroSection, heroBg, navHeader, scrollDownBtn }) {
    if (!heroSection || !heroBg) return;

    const rect = heroSection.getBoundingClientRect();
    const visibleThreshold = 40;

    if (rect.top >= -visibleThreshold && rect.bottom <= window.innerHeight + visibleThreshold) {
        heroBg.style.transition = _heroBgZoomInTransition;
        heroBg.style.transform = `scale(${_HERO_ZOOM_SCALE_FACTOR})`;
        setGlobalState({ zoomState: 'zoomIn' });
        showScrollDownButton();
        if (navHeader) navHeader.classList.add('experience-header-hidden-override');
    }
}