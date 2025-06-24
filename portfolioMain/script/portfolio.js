// portfolio.js

import { projectDetailsHtml, initModalContentInteractions, openModal, closeModal } from './modal.js';

// Global variables for onboarding shared with hero.js
window.onboardingActive = false;
window.guideIndex = 0;
// guideTooltip needs to be accessible globally for position calculations in guideSteps
let guideTooltip = null; // Will be assigned in DOMContentLoaded after preloader

// 6단계에서 하이라이트된 요소를 추적하는 변수
let highlightedElementForUnhighlight = null;

// Custom cursor URL for the highlighter
const HIGHLIGHTER_CURSOR_URL = "url('../highlighter.png') 16 16, auto"; // Path to your highlighter.png

// ==================================================================
// [수정된 부분] 스크롤 애니메이션 버그를 수정한 올바른 함수입니다.
// ==================================================================
window.getSectionRect = function(el) { // Make it global as guideSteps uses it
    if (!el) return { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };
    const rect = el.getBoundingClientRect(); // getBoundingClientRect는 뷰포트 기준
    return {
        // 뷰포트 기준 좌표에 스크롤 값을 더해 문서 전체 기준 좌표로 변환
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        bottom: rect.bottom + window.scrollY,
        right: rect.right + window.scrollX,
        height: rect.height,
        width: rect.width
    };
};

window.guideSteps = [
    {
        msg: "Click 'Oosu'",
        target: '.hover-name',
        sparkle: '#sparkle-name',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top + window.scrollY - (guideTooltip?.offsetHeight || 60) - 25, left: r.left + window.scrollX - (guideTooltip?.offsetWidth || 180) - 10 };
        }
    },
    {
        msg: "Double-click the slider text",
        target: '.hero-slider-wrapper',
        sparkle: '',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.bottom + window.scrollY - 10;
            let iL = r.left + window.scrollX + (r.width / 2) - (tW / 2) - 100;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        requiresDblClick: true
    },
    {
        msg: "Click profile image",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tW = guideTooltip?.offsetWidth || 180;
            let iT = r.top + window.scrollY;
            let iL = r.left + window.scrollX + (el.offsetWidth / 2) - (tW / 2) + 40;
            if (iT < 10) iT = 10;
            return { top: iT, left: iL };
        }
    },
    {
        msg: "Click profile image again",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tW = guideTooltip?.offsetWidth || 180;
            let iT = r.top + window.scrollY + 10;
            let iL = r.left + window.scrollX + (el.offsetWidth / 2) - (tW / 2) + 20;
            if (iT < 10) iT = 10;
            return { top: iT, left: iL };
        }
    },
    {
        msg: "One more click on image",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tW = guideTooltip?.offsetWidth || 180;
            let iT = r.top + window.scrollY + 25;
            let iL = r.left + window.scrollX + (el.offsetWidth / 2) - (tW / 2) + 50;
            if (iT < 10) iT = 10;
            return { top: iT, left: iL };
        }
    },
    {
        msg: "You can highlight some phrases!",
        targetsToHighlight: ['[data-highlight-id="hero-intro-1"]', '[data-highlight-id="hero-intro-2"]', '[data-highlight-id="hero-slider-1-1"]', '[data-highlight-id="hero-slider-1-2"]'],
        target: '[data-highlight-id="hero-intro-1"]',
        sparkle: '',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.bottom + window.scrollY - 100;
            let iL = r.left + window.scrollX + (r.width / 2) - (tW / 2);
            if (iT + tH > window.innerHeight - 10 + window.scrollY) iT = window.innerHeight - tH - 10 + window.scrollY;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        requiresHighlighterCursor: true
    },
    {
        msg: "You can also unhighlight!",
        targetsToHighlight: ['[data-highlight-id="hero-intro-1"]', '[data-highlight-id="hero-intro-2"]', '[data-highlight-id="hero-slider-1-1"]', '[data-highlight-id="hero-slider-1-2"]'],
        target: '[data-highlight-id="hero-intro-1"]',
        sparkle: '',
        pos: (el) => {
            let currentTargetElement = document.querySelector('.onboarding-highlight-once') || highlightedElementForUnhighlight || el;
            const r = currentTargetElement.getBoundingClientRect();
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.bottom + window.scrollY + 10;
            let iL = r.left + window.scrollX + (r.width / 2) - (tW / 2);
            if (iT + tH > window.innerHeight - 10 + window.scrollY) iT = window.innerHeight - tH - 10 + window.scrollY;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        requiresHighlighterCursor: true,
        requiresUnhighlight: true
    },
    {
        msg: "Ask AI for any questions!",
        target: '#ai-assistant-FAB',
        sparkle: '',
        pos: (el) => {
            const r = el.getBoundingClientRect();
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.top + window.scrollY - tH - 0;
            let iL = r.left + window.scrollX + (r.width / 2) - (tW / 2) - 140;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        hideCloseButton: true
    }
];

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] portfolio.js loaded.");

    const fabAnimationStyle = document.createElement('style');
    fabAnimationStyle.textContent = `
        @keyframes onboarding-throb {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        #ai-assistant-FAB {
            transition: transform 0.5s ease-in-out, filter 0.3s ease-in-out;
        }
        #ai-assistant-FAB.onboarding-pulse {
            animation: onboarding-throb 1.5s ease-in-out infinite;
            transform-origin: center;
        }
        body.onboarding-exiting #guide-tooltip,
        body.onboarding-exiting #guide-overlay {
            opacity: 0 !important;
            transition: opacity 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(fabAnimationStyle);

    function handlePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) {
            document.dispatchEvent(new Event('preloaderHidden'));
            return;
        }
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.addEventListener('animationend', () => {
                preloader.style.opacity = '0';
                preloader.style.transition = 'opacity 0.6s ease-out';
            });
        } else {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.6s ease-out';
        }
        preloader.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && preloader.style.opacity === '0') {
                preloader.style.display = 'none';
                document.dispatchEvent(new Event('preloaderHidden'));
            }
        });
        setTimeout(() => {
            if (preloader.style.display !== 'none') {
                preloader.style.display = 'none';
                document.dispatchEvent(new Event('preloaderHidden'));
            }
        }, 4000);
    }

    handlePreloader();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = 'none';

    document.addEventListener('preloaderHidden', function() {
        if (mainContent) mainContent.style.display = 'block';

        let onboardingIsExiting = false;

        window.onboardingCompletedSetting = localStorage.getItem('onboardingCompleted');
        const guideOverlay = document.getElementById('guide-overlay');
        guideTooltip = document.getElementById('guide-tooltip');
        const guideCloseButton = document.querySelector('.guide-close');
        window.cameFromIndex = new URLSearchParams(window.location.search).get('from') === 'index';
        const scrollIcon = document.querySelector('.scroll-indicator');
        const projects = Array.from(document.querySelectorAll('.project'));
        const portfolioSection = document.getElementById('portfolio');
        const footer = document.querySelector('footer');
        const mainLogo = document.getElementById('mainLogo');
        const projectImageAnchors = Array.from(document.querySelectorAll('.project-image'));
        let currentActiveProjectIndex = -1;
        const allMarqueeInnerRows = document.querySelectorAll('.marquee-container .marquee-inner');

        if (window.cameFromIndex) {
            let currentSearch = window.location.search;
            currentSearch = currentSearch.replace(/(\?|&)from=index/, '');
            if (currentSearch.startsWith('&')) currentSearch = '?' + currentSearch.substring(1);
            if (currentSearch === '?') currentSearch = '';
            history.replaceState(null, '', window.location.pathname + currentSearch);
        }

        if (!guideOverlay || !guideTooltip || !guideCloseButton) {
            console.error("[DEBUG] Essential guide elements missing. Onboarding may not work.");
        }

        if (mainLogo) {
            mainLogo.style.display = 'none';
            mainLogo.style.opacity = '0';
        }

        projectImageAnchors.forEach((anchor, index) => {
            const img = anchor.querySelector('img');
            if (img && index < 5) img.src = `projects/project${index + 1}-cover.png`;
        });

        function hideAllSparkles() {
            ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
                const sp = document.querySelector(sel);
                if (sp) sp.style.display = 'none';
            });
        }

        window.showPersistentSparkles = function() {
            const persistentSparkleTargets = [
                { el: '.hover-name', sparkle: '#sparkle-name' },
                { el: '.slider-dot[data-index="0"]', sparkle: '#sparkle-dot' },
                { el: '.hover-img', sparkle: '#sparkle-img' }
            ];
            persistentSparkleTargets.forEach(target => {
                const mainEl = document.querySelector(target.el);
                const spElement = document.querySelector(target.sparkle);
                if (mainEl && spElement) spElement.style.display = 'inline-block';
            });
        };

        window.setUnderline = function(selector, add, extraPx = 0) {
            document.querySelectorAll('.guide-underline').forEach(el => {
                el.classList.remove('guide-underline');
                el.style.setProperty('--underline-extra', '0px');
            });
            if (add && selector) {
                const el = document.querySelector(selector);
                if (el) {
                    el.classList.add('guide-underline');
                    el.style.setProperty('--underline-extra', extraPx + 'px');
                }
            }
        };

        window.setSparkleDisplay = function(guideStepIndex) {
            if (!window.guideSteps) return;
            window.guideSteps.forEach((step, i) => {
                if (step.sparkle) {
                    const spElement = document.querySelector(step.sparkle);
                    if (spElement) spElement.style.display = (i === guideStepIndex ? 'inline-block' : 'none');
                }
            });
        };

        function applyOnboardingHighlightTemp(element) {
            if (element) element.classList.add('onboarding-highlight-temp');
        }

        function removeOnboardingHighlightTemp(element) {
            if (element) element.classList.remove('onboarding-highlight-temp');
        }

        function removeAllOnboardingHighlightsTemp() {
            document.querySelectorAll('.onboarding-highlight-temp, .onboarding-highlight-once').forEach(el => {
                el.classList.remove('onboarding-highlight-temp', 'onboarding-highlight-once');
            });
        }

        function checkAndCompleteHighlightStep6() {
            if (document.querySelector('.onboarding-highlight-once')) {
                document.body.style.cursor = 'auto';
                window.guideIndex++;
                if (window.guideIndex < window.guideSteps.length) window.showGuideStep(window.guideIndex);
                else window.clearGuide(false);
            }
        }

        function checkAndCompleteHighlightStep7() {
            if (document.querySelectorAll('.onboarding-highlight-once').length === 0) {
                document.body.style.cursor = 'auto';
                window.guideIndex++;
                if (window.guideIndex < window.guideSteps.length) window.showGuideStep(window.guideIndex);
                else window.clearGuide(false);
            }
        }

        window._onboardingMouseEnterHandler = function() {
            if (window.onboardingActive && (window.guideIndex === 5 || window.guideIndex === 6)) {
                document.body.style.cursor = HIGHLIGHTER_CURSOR_URL;
                if (!this.classList.contains('onboarding-highlight-once')) applyOnboardingHighlightTemp(this);
            }
        };

        window._onboardingMouseLeaveHandler = function() {
            if (window.onboardingActive && (window.guideIndex === 5 || window.guideIndex === 6)) {
                document.body.style.cursor = 'auto';
                if (!this.classList.contains('onboarding-highlight-once')) removeOnboardingHighlightTemp(this);
            }
        };

        window._onboardingClickHandler = function() {
            if (!window.onboardingActive || (window.guideIndex !== 5 && window.guideIndex !== 6)) return;
            removeOnboardingHighlightTemp(this);
            if (window.guideIndex === 5) {
                if (this.classList.contains('onboarding-highlight-once')) return;
                this.classList.add('onboarding-highlight-once');
                highlightedElementForUnhighlight = this;
                checkAndCompleteHighlightStep6();
            } else if (window.guideIndex === 6) {
                if (this.classList.contains('onboarding-highlight-once')) {
                    this.classList.remove('onboarding-highlight-once');
                    if (this === highlightedElementForUnhighlight) highlightedElementForUnhighlight = null;
                    checkAndCompleteHighlightStep7();
                }
            }
        };

        window._onboardingFabMouseEnterHandler = function() {
            if (onboardingIsExiting || !window.onboardingActive || window.guideIndex !== 7) return;
            onboardingIsExiting = true;

            const fabButton = document.getElementById('ai-assistant-FAB');
            const askImage = document.getElementById('ai-assistant-ask-image');

            document.body.classList.add('onboarding-exiting');
            if (fabButton) fabButton.classList.remove('onboarding-pulse', 'no-filter');
            if (askImage) askImage.style.opacity = '0';

            setTimeout(() => {
                window.clearGuide(false);
                onboardingIsExiting = false;
            }, 600);
        };

        window._onboardingFabMouseLeaveHandler = function() {
            if (onboardingIsExiting) return;
        };

        window.showGuideStep = function(idx) {
            if (!window.guideSteps || idx < 0 || idx >= window.guideSteps.length || !guideTooltip) {
                if (window.guideSteps && idx >= window.guideSteps.length) window.clearGuide(false);
                return;
            }
            const step = window.guideSteps[idx];
            window.setUnderline(null, false);
            window.setSparkleDisplay(idx);
            document.querySelectorAll('.onboarding-highlight-temp').forEach(el => el.classList.remove('onboarding-highlight-temp'));
            document.body.style.cursor = 'auto';

            if (guideCloseButton) guideCloseButton.style.display = (idx === 7 && step.hideCloseButton) ? 'none' : 'block';

            let tooltipTargetElement = document.querySelector(step.target);
            const fabButton = document.getElementById('ai-assistant-FAB');
            const askImage = document.getElementById('ai-assistant-ask-image');
            if (fabButton) {
                fabButton.removeEventListener('mouseenter', window._onboardingFabMouseEnterHandler);
                fabButton.removeEventListener('mouseleave', window._onboardingFabMouseLeaveHandler);
                fabButton.classList.remove('onboarding-pulse', 'no-filter');
                if (askImage) askImage.style.opacity = '0';
            }

            guideOverlay.style.pointerEvents = (idx === 5 || idx === 6 || idx === 7) ? 'none' : 'auto';

            if (tooltipTargetElement && step.pos) {
                if (idx === 6) {
                    const currentHighlightedElement = document.querySelector('.onboarding-highlight-once') || highlightedElementForUnhighlight;
                    if (currentHighlightedElement) {
                        tooltipTargetElement = currentHighlightedElement;
                    } else {
                        const firstTargetFromStep6 = document.querySelector(window.guideSteps[5].targetsToHighlight[0]);
                        if (firstTargetFromStep6) {
                            firstTargetFromStep6.classList.add('onboarding-highlight-once');
                            tooltipTargetElement = highlightedElementForUnhighlight = firstTargetFromStep6;
                        }
                    }
                }
                
                guideTooltip.style.display = 'block';
                guideTooltip.style.opacity = "0";
                const pos = step.pos(tooltipTargetElement);
                guideTooltip.style.top = `${pos.top}px`;
                guideTooltip.style.left = `${pos.left}px`;
                guideTooltip.textContent = step.msg;
                guideTooltip.style.opacity = "1";

                if (step.requiresHighlighterCursor && step.targetsToHighlight) {
                    const highlightableElements = Array.from(document.querySelectorAll('.hero-title-sub .meaning-chunk, .hero-slider .slider-text.active .meaning-chunk'));
                    document.querySelectorAll('.meaning-chunk').forEach(el => {
                        el.removeEventListener('mouseenter', window._onboardingMouseEnterHandler);
                        el.removeEventListener('mouseleave', window._onboardingMouseLeaveHandler);
                        el.removeEventListener('click', window._onboardingClickHandler);
                    });
                    highlightableElements.forEach(el => {
                        el.addEventListener('mouseenter', window._onboardingMouseEnterHandler);
                        el.addEventListener('mouseleave', window._onboardingMouseLeaveHandler);
                        el.addEventListener('click', window._onboardingClickHandler);
                    });
                    if (idx === 5) checkAndCompleteHighlightStep6();
                    else if (idx === 6) checkAndCompleteHighlightStep7();
                } else if (idx === 7) {
                    if (fabButton) {
                        fabButton.classList.add('no-filter', 'onboarding-pulse');
                        if (askImage) askImage.style.opacity = '1';
                        fabButton.addEventListener('mouseenter', window._onboardingFabMouseEnterHandler);
                        fabButton.addEventListener('mouseleave', window._onboardingFabMouseLeaveHandler);
                    }
                } else {
                    document.querySelectorAll('.meaning-chunk').forEach(el => {
                        el.removeEventListener('mouseenter', window._onboardingMouseEnterHandler);
                        el.removeEventListener('mouseleave', window._onboardingMouseLeaveHandler);
                        el.removeEventListener('click', window._onboardingClickHandler);
                    });
                    document.body.style.cursor = 'auto';
                    removeAllOnboardingHighlightsTemp();
                }
            } else {
                guideTooltip.style.opacity = "0";
                guideTooltip.style.display = 'none';
            }
            window.guideIndex = idx;
        };

        window.clearGuide = function(isSkippingOrFinishedEarly = false) {
            if (guideOverlay) guideOverlay.style.display = "none";
            if (guideCloseButton) {
                guideCloseButton.style.display = 'block';
                Object.assign(guideCloseButton.style, { position: '', top: '', right: '', zIndex: '', width: '', height: '', padding: '', lineHeight: '', textAlign: '', background: '', color: '', fontSize: '', border: '', borderRadius: '', cursor: '' });
            }
            window.setUnderline(null, false);
            window.setSparkleDisplay(-1);
            removeAllOnboardingHighlightsTemp();
            document.body.style.cursor = 'auto';
            document.body.classList.remove('onboarding-exiting');

            const allMeaningChunks = document.querySelectorAll('.meaning-chunk');
            allMeaningChunks.forEach(el => {
                el.removeEventListener('mouseenter', window._onboardingMouseEnterHandler);
                el.removeEventListener('mouseleave', window._onboardingMouseLeaveHandler);
                el.removeEventListener('click', window._onboardingClickHandler);
            });
            highlightedElementForUnhighlight = null;

            const fabButton = document.getElementById('ai-assistant-FAB');
            if (fabButton) {
                fabButton.removeEventListener('mouseenter', window._onboardingFabMouseEnterHandler);
                fabButton.removeEventListener('mouseleave', window._onboardingFabMouseLeaveHandler);
                const askImage = document.getElementById('ai-assistant-ask-image');
                if (askImage) askImage.style.opacity = '0';
                fabButton.classList.remove('no-filter', 'onboarding-pulse');
            }

            window.onboardingActive = false;
            window.guideIndex = 0;
            document.body.classList.remove('no-scroll');

            if (typeof applySavedHighlights === 'function') applySavedHighlights();

            if (localStorage.getItem('onboardingCompleted') === 'true' || !isSkippingOrFinishedEarly) {
                window.showPersistentSparkles();
            } else {
                hideAllSparkles();
            }
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            if (!isSkippingOrFinishedEarly || (localStorage.getItem('onboardingCompleted') !== 'true')) {
                localStorage.setItem('onboardingCompleted', 'true');
            }
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.setImgScaleCustom === 'function') {
                const scales = [1.4, 1.5, 1.6, 1.7];
                window.setImgScaleCustom(scales.length - 1);
            }
            if (typeof window.startSliderAutoPlay === 'function') window.startSliderAutoPlay();
            if (typeof window.startProfileImgAutoPlay === 'function') window.startProfileImgAutoPlay();
            setTimeout(() => { onScroll(); }, 100);
        };

        function startGuide() {
            if (!guideOverlay || !guideTooltip || !guideCloseButton) return;
            for (let i = 0; i < window.guideSteps.length; i++) {
                const step = window.guideSteps[i];
                const targetExists = step.targetsToHighlight ? step.targetsToHighlight.every(s => document.querySelector(s.replace('.active', ''))) : document.querySelector(step.target);
                if (!targetExists) {
                    console.error(`[DEBUG] startGuide: Required guide element not found for step ${i}.`);
                    return;
                }
            }
            if (window.onboardingActive) return;
            window.onboardingActive = true;
            window.guideIndex = 0;
            onboardingIsExiting = false;

            guideOverlay.style.display = "block";
            guideOverlay.style.pointerEvents = 'auto';

            if (guideCloseButton) {
                Object.assign(guideCloseButton.style, { display: 'block', position: 'fixed', bottom: '140px', right: '60px', zIndex: '10002', width: '120px', height: '40px', lineHeight: '40px', padding: '0', borderRadius: '10px', textAlign: 'center' });
            }
            if (scrollIcon) {
                scrollIcon.style.opacity = "0";
                scrollIcon.style.pointerEvents = "none";
            }
            document.body.classList.add('no-scroll');
            window.scrollTo(0, 0);

            if (typeof window.showSlide === 'function') window.showSlide(0);
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.clearInterval === 'function' && window.sliderInterval) clearInterval(window.sliderInterval);
            if (typeof window.hoverName !== 'undefined') window.hoverName.textContent = "Oosu";
            
            if (typeof getHighlightData === 'function') {
                const highlights = getHighlightData();
                for (const id in highlights) {
                    const el = document.querySelector(`[data-highlight-id="${id}"]`);
                    if (el) el.classList.remove(`highlight-${highlights[id].color}`);
                }
            }
            if (typeof hideMenu === 'function') hideMenu();
            highlightedElementForUnhighlight = null;
            window.showGuideStep(window.guideIndex);
        }

        function setProjectActive(activeIndex) {
            projects.forEach((project, idx) => {
                const isActive = idx === activeIndex;
                project.classList.toggle('active', isActive);
                project.querySelector('.project-info')?.classList.toggle('active', isActive);
                project.querySelector('.project-image')?.classList.toggle('grayscale', !isActive);
                project.querySelector('.view-project-overlay')?.classList.toggle('visible', isActive);
            });
        }

        function onScroll() {
            if (window.onboardingActive) return;
            const heroSection = document.getElementById('hero');
            if (!heroSection || !portfolioSection) return;

            const scroll = window.scrollY;
            const windowHeight = window.innerHeight;
            const heroRect = window.getSectionRect(heroSection);
            let footerTop = footer ? window.getSectionRect(footer).top : Infinity;

            const scrollThresholdEnter = heroRect.bottom - (windowHeight * 0.1);
            const scrollThresholdExit = footerTop - (windowHeight * 0.9);

            if (mainLogo) {
                if (scroll > scrollThresholdEnter && scroll < scrollThresholdExit) {
                    mainLogo.style.display = 'flex';
                    setTimeout(() => mainLogo.style.opacity = '1', 10);
                    mainLogo.classList.add('is-fixed');
                } else {
                    mainLogo.style.opacity = '0';
                    mainLogo.classList.remove('is-fixed');
                    setTimeout(() => { if (mainLogo.style.opacity === '0') mainLogo.style.display = 'none'; }, 300);
                }
            }

            let newActiveProjectIndex = -1;
            for (let i = 0; i < projects.length; i++) {
                const rect = window.getSectionRect(projects[i]);
                if (scroll + windowHeight / 2 >= rect.top && scroll + windowHeight / 2 < rect.bottom) {
                    newActiveProjectIndex = i;
                    break;
                }
            }
            if (newActiveProjectIndex !== currentActiveProjectIndex) {
                setProjectActive(newActiveProjectIndex);
                currentActiveProjectIndex = newActiveProjectIndex;
            }
            if (newActiveProjectIndex === -1) {
                const inHeroZone = scroll < heroRect.bottom - (window.innerHeight * 0.2);
                const inFooterZone = footer && (scroll + window.innerHeight * 0.9 > footerTop);
                if ((inHeroZone || inFooterZone) && currentActiveProjectIndex !== -1) {
                    setProjectActive(-1);
                    currentActiveProjectIndex = -1;
                }
            }
        }

        if (scrollIcon) {
            scrollIcon.addEventListener('click', () => {
                if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'smooth' });
            });
        }

        projectImageAnchors.forEach(pImageAnchor => {
            const overlay = pImageAnchor.querySelector('.view-project-overlay');
            const parentProject = pImageAnchor.closest('.project');
            if (overlay && parentProject) {
                pImageAnchor.addEventListener('mouseenter', () => {
                    if (parentProject.classList.contains('active')) {
                        overlay.style.backgroundColor = parentProject.dataset.projectColor || 'var(--gray-dark)';
                        overlay.style.color = '#fff';
                    }
                });
                pImageAnchor.addEventListener('mouseleave', () => {
                    overlay.style.backgroundColor = '';
                    overlay.style.color = '';
                });
            }
        });

        if (guideOverlay) {
            guideOverlay.addEventListener('click', (e) => {
                 if (!window.onboardingActive || onboardingIsExiting) return;
                 if (e.target === guideTooltip || (guideCloseButton && guideCloseButton.contains(e.target))) return;
                
                const currentStepConfig = window.guideSteps[window.guideIndex];
                if (currentStepConfig.requiresDblClick || currentStepConfig.requiresHighlighterCursor || window.guideIndex === 7) return;

                if (window.guideIndex === 0) {
                    const hoverName = document.querySelector('.hover-name');
                    if (hoverName) {
                        const names = ["Oosu", "우수", "佑守", "優秀", "憂愁"];
                        let currentNameIndex = names.indexOf(hoverName.textContent);
                        hoverName.textContent = names[(currentNameIndex + 1) % names.length];
                        if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${(currentNameIndex + 1) % names.length}`);
                    }
                } else if (window.guideIndex >= 2 && window.guideIndex <= 4) {
                    if (typeof window.setImgScaleCustom === 'function') {
                         const scales = [1.4, 1.5, 1.6, 1.7];
                         const currentScale = parseFloat(document.querySelector('.hover-img').style.getPropertyValue('--img-current-scale')) || 1;
                         const foundIndex = scales.findIndex(s => s === currentScale);
                         window.setImgScaleCustom((foundIndex + 1) % scales.length);
                    }
                }

                window.guideIndex++;
                if (window.guideIndex < window.guideSteps.length) {
                    window.showGuideStep(window.guideIndex);
                } else {
                    window.clearGuide(false);
                }
            });

            guideOverlay.addEventListener('dblclick', (e) => {
                if (!window.onboardingActive || onboardingIsExiting) return;
                const currentStepConfig = window.guideSteps[window.guideIndex];
                if (window.guideIndex === 1 && currentStepConfig.requiresDblClick) {
                    if (typeof window.showSlide === 'function') window.showSlide(1);
                    window.guideIndex++;
                    if (window.guideIndex < window.guideSteps.length) {
                        window.showGuideStep(window.guideIndex);
                    } else {
                        window.clearGuide(false);
                    }
                }
            });
        }

        if (guideCloseButton) {
            guideCloseButton.addEventListener('click', () => { if (window.onboardingActive) window.clearGuide(true); });
        }

        if (guideTooltip) {
            guideTooltip.addEventListener('click', (e) => e.stopPropagation());
        }

        projectImageAnchors.forEach(anchor => {
            anchor.addEventListener('click', function (event) {
                event.preventDefault();
                const projectId = this.dataset.projectId;
                if (projectId) openModal(projectId, this);
            });
        });

        if (mainLogo) {
            mainLogo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }

        if (allMarqueeInnerRows.length >= 4) {
            allMarqueeInnerRows.forEach((row, i) => {
                const durations = [20, 25, 30, 35];
                const directions = ['rtl', 'ltr', 'rtl', 'ltr'];
                const speeds = ['fast', 'medium', 'slow', 'v_slow'];
                row.style.animation = `marquee-scroll-${directions[i]}-${speeds[i]} ${durations[i]}s linear infinite`;
                const container = row.closest('.marquee-container');
                if (container) {
                    container.addEventListener('mouseenter', () => row.classList.add('paused'));
                    container.addEventListener('mouseleave', () => row.classList.remove('paused'));
                }
            });
        }

        if (!window.onboardingCompletedSetting || window.cameFromIndex) {
            startGuide();
        } else {
            console.log("[DEBUG] Onboarding already completed, applying final state.");
            window.showPersistentSparkles();
            if (typeof window.setImgScaleCustom === 'function') {
                const scales = [1.4, 1.5, 1.6, 1.7];
                window.setImgScaleCustom(scales.length - 1);
            }
            if (typeof window.startSliderAutoPlay === 'function') window.startSliderAutoPlay();
            if (typeof window.startProfileImgAutoPlay === 'function') window.startProfileImgAutoPlay();
            if (typeof applySavedHighlights === 'function') applySavedHighlights();
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            setTimeout(() => onScroll(), 100);
        }

        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            if (window.onboardingActive) window.showGuideStep(window.guideIndex);
            onScroll();
        });

        console.log("[DEBUG] portfolio.js logic finished after preloader.");
    });
});