// footer.js
// Manages the grape footer section, including its image and text animations,
// and intersection observation for triggering those animations.

import { globalState, setGlobalState } from './experience.js';

let _grapeFooterQuoteSection;
let _footerImgEl;
let _footerTextEl;

let _footerAnimationTimeoutId = null;

const footerSteps = [
    { text: "Now, this grape is being transformed—", start: 1, end: 4 },
    { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
    { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
];
const totalFooterImageFrames = 14;
const showTimePerStep = 1000;
const pauseTimeAtEnd = 2000;

/**
 * Initializes the footer animation module.
 * @param {object} elements - DOM elements for the footer.
 */
export function initFooterAnimation({ grapeFooterQuoteSection, footerImgEl, footerTextEl }) {
    _grapeFooterQuoteSection = grapeFooterQuoteSection;
    _footerImgEl = footerImgEl;
    _footerTextEl = footerTextEl;

    if (_footerImgEl) {
        const footerImgObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (globalState.zoomState === 'zoomIn' || !_footerImgEl) return;

                if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !globalState.footerZoomedIn) {
                    setGlobalState({ footerZoomedIn: true });
                    if (!_footerImgEl.classList.contains('zoomed-in')) {
                        scrollFooterImgToCenter();
                        _footerImgEl.classList.add('zoomed-in');
                        animateFooterLoop();
                    }
                } else if (!entry.isIntersecting && globalState.footerZoomedIn) {
                    clearTimeout(_footerAnimationTimeoutId);
                    setGlobalState({ footerZoomedIn: false });
                    _footerImgEl.classList.remove('zoomed-in');
                }
            });
        }, { threshold: [0.5, 0.55] });
        footerImgObserver.observe(_footerImgEl);
    }
}

/**
 * Scrolls the footer image into the center of the viewport.
 */
function scrollFooterImgToCenter() {
    if (!_footerImgEl || _footerImgEl.offsetParent === null) return;
    const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    _footerImgEl.scrollIntoView({ behavior: prm ? 'auto' : 'smooth', block: 'center' });
}

/**
 * Animates the footer image and text in a loop.
 */
function animateFooterLoop() {
    clearTimeout(_footerAnimationTimeoutId);
    let currentFooterImageFrame = 1;

    function nextFooterStep() {
        if (!_footerImgEl || !_footerTextEl || !globalState.footerZoomedIn) {
            clearTimeout(_footerAnimationTimeoutId);
            return;
        }
        _footerImgEl.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`;
        let currentText = "";
        for (const step of footerSteps) {
            if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) {
                currentText = step.text;
                break;
            }
        }
        _footerTextEl.innerHTML = currentText;
        currentFooterImageFrame++;
        if (currentFooterImageFrame <= totalFooterImageFrames) {
            _footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep);
        } else {
            if (footerSteps.length > 0) _footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text;
            _footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
            _footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
        }
    }
    nextFooterStep();
}