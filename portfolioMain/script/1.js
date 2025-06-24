// portfolio.js

import { projectDetailsHtml, initModalContentInteractions, openModal, closeModal } from './modal.js';

// Global variables for onboarding shared with hero.js
// 이 변수들은 window 객체에 명시적으로 할당되어 다른 스크립트(hero.js)에서 접근 가능합니다.
window.onboardingActive = false; // 온보딩 활성 상태
window.guideIndex = 0; // 현재 온보딩 가이드 스텝 인덱스
window.onboardingCompletedSetting = localStorage.getItem('onboardingCompleted'); // 온보딩 완료 여부 설정
window.cameFromIndex = new URLSearchParams(window.location.search).get('from') === 'index'; // index.html에서 왔는지 여부

let guideTooltip = null; // 가이드 툴팁 요소 (DOMContentLoaded 이후 할당)

// NEW: Dynamically create style tag for onboarding specific cursors
function setupOnboardingCursorStyles() {
    const styleId = 'onboarding-cursor-styles';
    if (document.getElementById(styleId)) return; // Prevent duplicate
    
    const style = document.createElement('style');
    style.id = styleId;
    // Assuming portfolio.js is in /portfolioMain/ and img is in project root.
    // So, from portfolio.js, it's ../img/ for project root img folder
    style.textContent = `
        /* General cursor reset for onboarding overlay */
        #guide-overlay {
            cursor: default !important;
        }

        /* Highlighter cursor for step 6 (index 5) */
        /* Applied when body has 'onboarding-highlighter-active' class AND hovering specific elements */
        body.onboarding-highlighter-active .meaning-chunk[data-highlight-id]:hover {
            cursor: url('./highlighter.png') 20 20, auto !important;
        }
        /* Ensure default cursor when onboarding-highlighter-active but not over a meaning-chunk */
        body.onboarding-highlighter-active {
            cursor: default !important;
        }

        /* Custom cursors for AI FAB during step 7 (index 6) */
        /* These override default body cursor when mouse is over FAB area (simulated hover) */
        body.onboarding-fab-hover {
            cursor: none !important; /* Hide default browser cursor */
        }
        
        /* Ensure custom cursor elements are positioned correctly relative to mouse */
        #custom-cursor-dot, #ai-assistant-ask-image {
            position: fixed;
            z-index: 100000; /* Ensure it's above the overlay */
            pointer-events: none; /* Make them click-through */
            transition: opacity 0.1s ease-in-out;
            display: block; /* Always visible for positioning, opacity controls visibility */
        }
        #custom-cursor-dot {
            width: 8px; /* Small dot */
            height: 8px;
            background-color: var(--black); /* Or appropriate theme color */
            border-radius: 50%;
            transform: translate(-50%, -50%); /* Center on mouse */
        }
        #ai-assistant-ask-image {
            width: 40px; /* Size of ask AI image */
            height: auto;
            transform: translate(-5px, -5px); /* Adjust position relative to mouse for FAB */
            /* Assuming light mode is default, if dark mode is default, adjust path */
            content: url('./asklightmode.png'); /* Default for onboarding start */
        }
        /* FAB Lottie filter control */
        #ai-assistant-FAB {
            filter: grayscale(100%);
            transition: filter 0.3s ease-in-out;
        }
        #ai-assistant-FAB.no-filter,
        #ai-assistant-FAB.onboarding-hover { /* Added onboarding-hover class for clarity */
            filter: grayscale(0%);
        }
    `;
    document.head.appendChild(style);
}


window.getSectionRect = function(el) {
    // 요소의 스크롤 위치를 포함한 사각형 정보를 반환하는 함수 (가이드 스텝의 위치 계산에 사용)
    if (!el) return { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };
    const rect = el.getBoundingClientRect();
    return {
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
        msg: "Click 'Oosu'", // 첫 번째 온보딩 메시지
        target: '.hover-name', // 대상 요소 선택자
        sparkle: '#sparkle-name', // 스파클 요소 선택자
        pos: (el) => { return window.getSectionRect(el) ? { top: window.getSectionRect(el).top - (guideTooltip?.offsetHeight || 60) - 25, left: window.getSectionRect(el).left - (guideTooltip?.offsetWidth || 180) - 10 } : { top: 0, left: 0 }; }
    },
    {
        msg: "Double-click the slider text", // 두 번째 온보딩 메시지
        target: '.hero-slider-wrapper', // 대상 요소 선택자
        sparkle: '', // 스파클 없음
        pos: (el) => { // 툴팁 위치 계산 함수
            const r = window.getSectionRect(el); // 대상 요소의 사각형 정보
            const tH = guideTooltip?.offsetHeight || 60; // 툴팁의 높이
            const tW = guideTooltip?.offsetWidth || 200; // 툴팁의 너비
            let iT = r.bottom - 50; // 툴팁의 상단 위치: 대상 요소 하단에서 위로 50px (더 위로)
            let iL = r.left + (r.width / 2) - (tW / 2) - 200; // 툴팁의 왼쪽 위치: 대상 요소 중앙에서 왼쪽으로 200px (더 왼쪽으로)
            if (iL < 10) iL = 10; // 화면 왼쪽 경계 최소값
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW; // 화면 오른쪽 경계 최대값
            return { top: iT, left: iL };
        },
        requiresDblClick: true // 더블 클릭 필요 플래그
    },
    {
        msg: "Click profile image", // 세 번째 온보딩 메시지
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = window.getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 10; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    },
    {
        msg: "Click profile image again", // 네 번째 온보딩 메시지
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = window.getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 20; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    },
    {
        msg: "One more click on image", // 다섯 번째 온보딩 메시지
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = window.getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    },
    {
        msg: "You'll be able to highlight some memorable phrases!",
        target: '.hero-slider .slider-text.active', // Target the currently active slider text
        sparkle: '', // No sparkle for this step
        pos: (el) => {
            const r = window.getSectionRect(el);
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.bottom + 10; // Position BELOW the element
            let iL = r.left + (r.width / 2) - (tW / 2);
            if (iT + tH > window.innerHeight - 10 + window.scrollY) iT = window.innerHeight - tH - 10 + window.scrollY;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        requiresHighlighterCursor: true // Custom flag for highlighter cursor
    },
    {
        msg: "Ask AI for any questions you have!",
        target: '#ai-assistant-FAB',
        sparkle: '', // No sparkle for this step
        pos: (el) => {
            const r = window.getSectionRect(el);
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.top - tH - 20; // Position above the FAB
            let iL = r.left + (r.width / 2) - (tW / 2);
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        hoverTarget: '#ai-assistant-FAB' // Custom flag to trigger hover state
    }
];

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] portfolio.js loaded.");

    function handlePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) {
            console.warn("[DEBUG] Preloader element not found. Skipping preloader handling.");
            document.dispatchEvent(new Event('preloaderHidden'));
            return;
        }

        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.addEventListener('animationend', () => {
                console.log("[DEBUG] Preloader text animation ended.");
                preloader.style.opacity = '0';
                preloader.style.transition = 'opacity 0.6s ease-out';
            });
        } else {
            console.warn("[DEBUG] Loading text element not found. Preloader might not fade out as expected.");
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.6s ease-out';
        }

        preloader.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && preloader.style.opacity === '0') {
                preloader.style.display = 'none';
                console.log("[DEBUG] Preloader fully hidden after transition.");
                document.dispatchEvent(new Event('preloaderHidden'));
            }
        });

        setTimeout(() => {
            if (preloader.style.display !== 'none') {
                console.warn("[DEBUG] Preloader did not hide via animation/transition. Forcing hide.");
                preloader.style.opacity = '0';
                preloader.style.transition = 'opacity 0.6s ease-out';
                setTimeout(() => {
                    if (preloader.style.display !== 'none') {
                        preloader.style.display = 'none';
                        console.log("[DEBUG] Preloader forced hidden and preloaderHidden event dispatched.");
                        document.dispatchEvent(new Event('preloaderHidden'));
                    }
                }, 700);
            }
        }, 4000);
    }

    handlePreloader();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = 'none';

    document.addEventListener('preloaderHidden', function() {
        console.log("[DEBUG] Received preloaderHidden event. Starting main content and onboarding logic.");
        if (mainContent) mainContent.style.display = 'block';

        // NEW: Setup onboarding cursor styles here
        setupOnboardingCursorStyles();


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
        const projectModal = document.getElementById('projectModal');
        const modalContentBody = document.getElementById('modal-content-body');
        const closeModalButton = document.querySelector('.modal .close-button');
        let currentActiveProjectIndex = -1;
        const allMarqueeInnerRows = document.querySelectorAll('.marquee-container .marquee-inner');

        if (window.cameFromIndex) {
            console.log("[DEBUG] Detected 'from=index' query parameter.");
            let currentSearch = window.location.search;
            currentSearch = currentSearch.replace(/(\?|&)from=index/, '');
            if (currentSearch.startsWith('&')) {
                currentSearch = '?' + currentSearch.substring(1);
            }
            if (currentSearch === '?') currentSearch = '';
            const newUrl = window.location.pathname + currentSearch;
            history.replaceState(null, '', newUrl);
            console.log("[DEBUG] Cleaned URL, new relative URL:", newUrl);
        }

        if (!guideOverlay || !guideTooltip || !guideCloseButton) {
            console.error("[DEBUG] Essential guide elements missing. Onboarding may not work.");
        }
        if (!mainContent) console.warn("[DEBUG] Main content element not found.");

        if (mainLogo) {
            mainLogo.style.display = 'none';
            mainLogo.style.opacity = '0';
        }

        projectImageAnchors.forEach((anchor, index) => {
            const img = anchor.querySelector('img');
            if (img && index < 5) {
                img.src = `projects/project${index + 1}-cover.png`;
            }
        });

        function hideAllSparkles() {
            ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
                const sp = document.querySelector(sel);
                if (sp) sp.style.display = 'none';
            });
        }

        window.showPersistentSparkles = function() {
            console.log("[DEBUG] showPersistentSparkles called");
            const persistentSparkleTargets = [
                { el: '.hover-name', sparkle: '#sparkle-name' },
                { el: '.slider-dot' + '[data-index="0"]', sparkle: '#sparkle-dot' },
                { el: '.hover-img', sparkle: '#sparkle-img' }
            ];
            persistentSparkleTargets.forEach(target => {
                const mainEl = document.querySelector(target.el);
                const spElement = document.querySelector(target.sparkle);
                if (mainEl && spElement) {
                    spElement.style.display = 'inline-block';
                } else {
                    console.warn(`[DEBUG] Persistent sparkle target missing: mainEl ${target.el} or sparkle ${target.sparkle}`);
                }
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
            if (guideStepIndex < 0 || guideStepIndex >= window.guideSteps.length) {
                window.guideSteps.forEach(step => {
                    if (step.sparkle) {
                        const spElement = document.querySelector(step.sparkle);
                        if (spElement) spElement.style.display = 'none';
                    }
                });
            }
        };

        // MODIFIED: showGuideStep에서 FAB 및 커서 필터/클래스 관리 개선
        window.showGuideStep = function(idx) {
            if (!window.guideSteps || idx < 0 || idx >= window.guideSteps.length || !guideTooltip) {
                if (window.guideSteps && idx >= window.guideSteps.length) window.clearGuide(false);
                return;
            }
            const step = window.guideSteps[idx];
            window.setUnderline(null, false);
            window.setSparkleDisplay(idx);
            const targetElement = document.querySelector(step.target);

            // 모든 단계에서 커서 및 FAB 상태를 초기화
            document.body.classList.remove('onboarding-highlighter-active'); // 하이라이터 커서 클래스 제거
            document.body.classList.remove('onboarding-fab-hover'); // FAB 커서 클래스 제거
            document.body.style.cursor = ''; // 기본값으로 리셋

            const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
            if (aiAssistantFAB) {
                aiAssistantFAB.classList.remove('onboarding-hover'); // FAB 시각 효과 클래스 제거
                aiAssistantFAB.classList.remove('no-filter'); // FAB 필터 제거
            }

            // 커스텀 커서 이미지 숨기기
            const customCursorDot = document.getElementById('custom-cursor-dot');
            const askImage = document.getElementById('ai-assistant-ask-image');
            if (customCursorDot) customCursorDot.style.opacity = '0';
            if (askImage) askImage.style.opacity = '0';


            if (targetElement && step.pos) {
                guideTooltip.style.display = 'block';
                guideTooltip.style.opacity = "0";
                const pos = step.pos(targetElement);
                guideTooltip.style.top = `${pos.top}px`;
                guideTooltip.style.left = `${pos.left}px`;
                guideTooltip.textContent = step.msg;
                guideTooltip.style.opacity = "1";

                // Step 7 (index 6)에 대한 FAB 호버 시각 효과 적용
                if (step.hoverTarget === '#ai-assistant-FAB') {
                    if (aiAssistantFAB) {
                        aiAssistantFAB.classList.add('onboarding-hover');
                        aiAssistantFAB.classList.add('no-filter'); // 흑백 필터 제거
                    }
                    document.body.classList.add('onboarding-fab-hover'); // FAB 커스텀 커서 활성화
                }
                // Step 6 (index 5)에 대한 하이라이터 커서 준비 (body에 클래스 추가)
                else if (step.requiresHighlighterCursor) {
                    document.body.classList.add('onboarding-highlighter-active'); // 하이라이터 커서 활성화
                }
            } else {
                if (!targetElement) console.error(`[DEBUG] showGuideStep: Target element '${step.target}' not found for tooltip positioning at step ${idx}.`);
                guideTooltip.style.opacity = "0";
                guideTooltip.style.display = 'none';
            }
            window.guideIndex = idx; // 전역 guideIndex 업데이트
        };


        window.clearGuide = function(isSkippingOrFinishedEarly = false) {
            console.log(`[DEBUG] clearGuide called. isSkippingOrFinishedEarly: ${isSkippingOrFinishedEarly}`);
            if (guideOverlay) guideOverlay.style.display = "none";
            if (guideCloseButton) {
                guideCloseButton.style.display = "none";
                // Reset all inline styles to prevent conflicts
                guideCloseButton.style.position = '';
                guideCloseButton.style.top = '';
                guideCloseButton.style.right = '';
                guideCloseButton.style.zIndex = '';
                guideCloseButton.style.width = '';
                guideCloseButton.style.height = '';
                guideCloseButton.style.padding = '';
                guideCloseButton.style.lineHeight = '';
                guideCloseButton.style.textAlign = '';
                guideCloseButton.style.background = '';
                guideCloseButton.style.color = '';
                guideCloseButton.style.fontSize = '';
                guideCloseButton.style.border = '';
                guideCloseButton.style.borderRadius = '';
                guideCloseButton.style.cursor = '';
            }
            window.setUnderline(null, false);
            window.setSparkleDisplay(-1);
            window.onboardingActive = false;
            window.guideIndex = 0; // 인덱스 리셋
            document.body.classList.remove('no-scroll'); // 스크롤 허용
            
            // 온보딩 관련 커서/FAB 클래스 제거
            document.body.classList.remove('onboarding-highlighter-active');
            document.body.classList.remove('onboarding-fab-hover');
            document.body.style.cursor = ''; // 기본 커서로 리셋

            const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
            if (aiAssistantFAB) {
                aiAssistantFAB.classList.remove('onboarding-hover');
                aiAssistantFAB.classList.remove('no-filter'); // 흑백 필터 다시 적용

                // FAB의 마우스 이벤트를 초기화 (마우스가 FAB 위에 있었던 것처럼 가정하고 leave 이벤트 발생)
                const mouseLeaveEvent = new MouseEvent('mouseleave', {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                });
                aiAssistantFAB.dispatchEvent(mouseLeaveEvent);
            }
            // 커스텀 커서 이미지 숨기기
            const customCursorDot = document.getElementById('custom-cursor-dot');
            const askImage = document.getElementById('ai-assistant-ask-image');
            if (customCursorDot) customCursorDot.style.opacity = '0';
            if (askImage) askImage.style.opacity = '0';


            if (localStorage.getItem('onboardingCompleted') === 'true' || !isSkippingOrFinishedEarly) {
                console.log("[DEBUG] clearGuide: Showing persistent sparkles.");
                window.showPersistentSparkles();
            } else {
                console.log("[DEBUG] clearGuide: Hiding all sparkles.");
                hideAllSparkles();
            }
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            // Save onboarding completion status
            if (!isSkippingOrFinishedEarly || (isSkippingOrFinishedEarly && localStorage.getItem('onboardingCompleted') !== 'true')) {
                console.log("[DEBUG] clearGuide: Setting onboardingCompleted to true in localStorage.");
                localStorage.setItem('onboardingCompleted', 'true');
            }

            // Restore Hero section to post-onboarding state
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.setImgScaleCustom === 'function' && window.scales) {
                window.setImgScaleCustom(window.scales.length - 1); // Set to max scale
            }
            if (typeof window.startSliderAutoPlay === 'function') window.startSliderAutoPlay();
            if (typeof window.startProfileImgAutoPlay === 'function') window.startProfileImgAutoPlay();

            // Reset name to first name
            const hoverName = document.querySelector('.hover-name');
            if (hoverName && typeof window.names !== 'undefined') {
                 window.nameIndex = 0; // Reset hero.js nameIndex to 0
                 hoverName.textContent = window.names[window.nameIndex];
                 if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`);
            }

            setTimeout(() => { onScroll(); }, 100);
        };

        window.startGuide = function() {
            console.log("[DEBUG] startGuide: Attempting to start guide...");
            if (!guideOverlay || !guideTooltip || !guideCloseButton) { return; }
            // Check if all target elements exist in DOM
            for (let i = 0; i < window.guideSteps.length; i++) {
                if (!document.querySelector(window.guideSteps[i].target)) {
                    console.error(`[DEBUG] startGuide: Required guide element '${window.guideSteps[i].target}' not found. Cannot start guide.`);
                    return;
                }
            }
            if (window.onboardingActive) { return; } // Prevent re-running if already active

            window.onboardingActive = true; // Activate onboarding
            window.guideIndex = 0; // Reset guide index

            guideOverlay.style.display = "block"; // Show overlay
            if (guideCloseButton) {
                guideCloseButton.style.display = 'block'; // Show close button
                // MODIFIED: Close button positioning and styling (larger area, slightly lower)
                guideCloseButton.style.position = 'fixed';
                guideCloseButton.style.top = '30px'; // Adjust as needed
                guideCloseButton.style.right = '30px'; // Adjust as needed
                guideCloseButton.style.zIndex = '10002';
                guideCloseButton.style.width = '40px'; // Larger touch area
                guideCloseButton.style.height = '40px'; // Larger touch area
                guideCloseButton.style.padding = '0';
                guideCloseButton.style.lineHeight = '40px'; // Vertically center text
                guideCloseButton.style.textAlign = 'center';
                guideCloseButton.style.background = 'rgba(0, 0, 0, 0.8)'; // Darker background
                guideCloseButton.style.color = 'white';
                guideCloseButton.style.fontSize = '24px'; // Larger 'x'
                guideCloseButton.style.border = 'none';
                guideCloseButton.style.borderRadius = '50%';
                guideCloseButton.style.cursor = 'pointer';
            }


            if (scrollIcon) { scrollIcon.style.opacity = "0"; scrollIcon.style.pointerEvents = "none"; } // Hide scroll icon

            document.body.classList.add('no-scroll'); // Disable scroll
            window.scrollTo(0, 0); // Scroll to top of the page

            // Reset Hero section to initial onboarding state
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.showSlide === 'function') {
                const sliderTexts = document.querySelectorAll('.hero-slider .slider-text');
                if (sliderTexts.length > 0) window.showSlide(0); // Show first slide
            }
            if (typeof window.stopSliderAutoPlay === 'function') { // Stop slider autoplay
                 window.stopSliderAutoPlay();
            }
            if (typeof window.sliderPaused !== 'undefined') window.sliderPaused = true; // Set slider to paused state


            // Reset name to first name
            const hoverName = document.querySelector('.hover-name');
            if (hoverName && typeof window.names !== 'undefined') {
                 window.nameIndex = 0; // hero.js의 nameIndex를 0으로 리셋
                 hoverName.textContent = window.names[window.nameIndex];
                 if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`);
            }

            window.showGuideStep(window.guideIndex); // Show first guide step
            console.log("[DEBUG] startGuide: Guide started successfully.");
        };

        function setProjectActive(activeIndex) {
            console.log(`[DEBUG] setProjectActive called with index: ${activeIndex}`);
            projects.forEach((project, idx) => {
                const projectInfo = project.querySelector('.project-info');
                const pImageAnchor = project.querySelector('.project-image');
                const viewOverlay = project.querySelector('.view-project-overlay');
                const isActive = idx === activeIndex;

                project.classList.toggle('active', isActive);
                if (projectInfo) {
                    projectInfo.classList.toggle('active', isActive);
                    console.log(`[DEBUG] Project ${idx + 1} projectInfo active: ${isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} projectInfo not found`);
                }
                if (pImageAnchor) {
                    pImageAnchor.classList.toggle('grayscale', !isActive);
                    console.log(`[DEBUG] Project ${idx + 1} pImageAnchor grayscale: ${!isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} pImageAnchor not found`);
                }
                if (viewOverlay) {
                    viewOverlay.classList.toggle('visible', isActive);
                    console.log(`[DEBUG] Project ${idx + 1} viewOverlay visible: ${isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} viewOverlay not found`);
                }
            });
        }

        function onScroll() {
            console.log("[DEBUG] onScroll triggered. ScrollY:", window.scrollY);
            const heroSection = document.getElementById('hero');
            if (window.onboardingActive || !heroSection || !portfolioSection) {
                console.log("[DEBUG] onScroll skipped: onboardingActive or hero/portfolio missing");
                return;
            }

            const scroll = window.scrollY;
            const windowHeight = window.innerHeight;
            const heroRect = window.getSectionRect(heroSection);
            console.log(`[DEBUG] heroRect.bottom: ${heroRect.bottom}`);
            let footerTop = footer ? window.getSectionRect(footer).top : Infinity;
            console.log(`[DEBUG] footerTop: ${footerTop}`);

            const scrollThresholdEnter = heroRect.bottom - (windowHeight * 0.1);
            const scrollThresholdExit = footerTop - (windowHeight * 0.9);

            if (mainLogo) {
                console.log(`[DEBUG] Logo check - scroll: ${scroll}, enter: ${scrollThresholdEnter}, exit: ${scrollThresholdExit}`);
                if (scroll > scrollThresholdEnter && scroll < scrollThresholdExit) {
                    mainLogo.style.display = 'flex';
                    setTimeout(() => mainLogo.style.opacity = '1', 10);
                    mainLogo.classList.add('is-fixed');
                } else {
                    mainLogo.style.opacity = '0';
                    mainLogo.classList.remove('is-fixed');
                    setTimeout(() => {
                        if (mainLogo.style.opacity === '0') {
                            mainLogo.style.display = 'none';
                        }
                    }, 300);
                }
            }

            let newActiveProjectIndex = -1;
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                const rect = window.getSectionRect(project);
                console.log(`[DEBUG] Project ${i + 1} rect.top: ${rect.top}, rect.bottom: ${rect.bottom}, viewport center: ${scroll + windowHeight / 2}`);
                if (scroll + windowHeight / 2 >= rect.top && scroll + windowHeight / 2 < rect.bottom) {
                    newActiveProjectIndex = i;
                    console.log(`[DEBUG] Project ${i + 1} is in view, setting as active`);
                    break;
                }
            }

            if (newActiveProjectIndex !== currentActiveProjectIndex) {
                console.log(`[DEBUG] Changing active project from ${currentActiveProjectIndex + 1} to ${newActiveProjectIndex + 1}`);
                setProjectActive(newActiveProjectIndex);
                currentActiveProjectIndex = newActiveProjectIndex;
            }

            if (newActiveProjectIndex === -1) {
                const inHeroZone = scroll < heroRect.bottom - (windowHeight * 0.2);
                const inFooterZone = footer && (scroll + windowHeight * 0.9 > footerTop);
                console.log(`[DEBUG] No project active. In Hero Zone: ${inHeroZone}, In Footer Zone: ${inFooterZone}`);

                if (inHeroZone || inFooterZone) {
                    if (currentActiveProjectIndex !== -1) {
                        console.log(`[DEBUG] Deactivating all projects due to Hero/Footer zone`);
                        setProjectActive(-1);
                        currentActiveProjectIndex = -1;
                    }
                }
            }
        }

        // --- Event Listeners ---
        if (scrollIcon) { /* ... */ }
        projectImageAnchors.forEach(pImageAnchor => { /* ... */ });

        if (guideOverlay) {
            // SINGLE CLICK handler for the guide overlay
            guideOverlay.addEventListener('click', (e) => {
                if (!window.onboardingActive) return; // 온보딩 비활성화 시 무시
                // 툴팁이나 닫기 버튼 클릭 시 전파 방지 (기존 내용 유지)
                if (e.target === guideTooltip || (guideCloseButton && guideCloseButton.contains(e.target))) {
                    return;
                }
                const currentStepConfig = window.guideSteps[window.guideIndex];
                // 현재 스텝이 더블 클릭을 요구하면 단일 클릭은 무시
                if (currentStepConfig && currentStepConfig.requiresDblClick) {
                    console.log("[DEBUG] Guide overlay single click ignored for double-click step.");
                    return;
                }

                // 현재 가이드 스텝에 따른 동작 처리
                if (window.guideIndex === 0) { // 스텝 0: 'Oosu' 클릭
                    const hoverName = document.querySelector('.hover-name'); // hoverName 요소 가져오기
                    // hero.js의 전역 nameIndex를 직접 변경하고 hero.js의 함수 호출
                    if (hoverName && typeof window.names !== 'undefined' && typeof window.nameIndex !== 'undefined') {
                        window.nameIndex = (window.nameIndex + 1) % window.names.length; // 전역 nameIndex 증가
                        hoverName.textContent = window.names[window.nameIndex]; // 이름 텍스트 업데이트
                        if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`); // 배경 클래스 업데이트
                    }
                    window.setSparkleDisplay(-1); // 스파클 숨기기
                } else if (window.guideIndex >= 2 && window.guideIndex <= 4) { // 스텝 2, 3, 4: 프로필 이미지 클릭
                    if (typeof window.setImgScaleCustom === 'function' && typeof window.scales !== 'undefined') {
                        const hoverImg = document.querySelector('.hover-img'); // hoverImg 요소 가져오기
                        // 현재 이미지 스케일을 기반으로 다음 스케일 인덱스 계산
                        const currentScale = parseFloat(hoverImg.style.getPropertyValue('--img-current-scale')) || 1;
                        let currentScaleIdx = window.scales.findIndex(s => s === currentScale);
                        currentScaleIdx = (currentScaleIdx + 1) % window.scales.length;
                        window.setImgScaleCustom(currentScaleIdx); // 스케일 적용
                    }
                    window.setSparkleDisplay(-1); // 스파클 숨기기
                } else if (window.guideIndex === 5) { // NEW STEP 6: Highlighter
                    // For the highlighter step, just advance on click, the instruction is informational.
                    // The common.js event listener for highlightable elements will handle the actual highlight.
                } else if (window.guideIndex === 6) { // NEW STEP 7: AI Assistant
                    // For the AI Assistant step, just advance on click, the instruction is informational.
                }

                console.log(`[DEBUG] Guide overlay single click detected for step ${window.guideIndex}. Advancing guide.`);
                window.guideIndex++; // 다음 스텝으로 진행
                if (window.guideIndex < window.guideSteps.length) {
                    window.showGuideStep(window.guideIndex); // 다음 가이드 스텝 표시
                } else {
                    window.clearGuide(false); // 가이드 종료
                }
            });

            // DOUBLE CLICK handler for the guideOverlay (specifically for step 1)
            guideOverlay.addEventListener('dblclick', (e) => {
                if (!window.onboardingActive) return; // 온보딩 비활성화 시 무시
                const currentStepConfig = window.guideSteps[window.guideIndex];
                // 현재 스텝이 더블 클릭을 요구하는 경우에만 진행 (스텝 1)
                if (window.guideIndex === 1 && currentStepConfig && currentStepConfig.requiresDblClick) {
                    console.log("[DEBUG] Guide overlay double-click detected for step 1. Advancing guide.");
                    const sliderTexts = document.querySelectorAll('.hero-slider .slider-text');
                    if (typeof window.showSlide === 'function') {
                        // hero.js의 전역 currentSlide를 사용하여 다음 슬라이드 인덱스 계산
                        const nextSlideIdx = (window.currentSlide + 1) % sliderTexts.length;
                        window.showSlide(nextSlideIdx); // 다음 슬라이드 표시
                    }
                    window.setSparkleDisplay(-1); // 스파클 숨기기

                    window.guideIndex++; // 다음 스텝으로 진행
                    if (window.guideIndex < window.guideSteps.length) {
                        window.showGuideStep(window.guideIndex); // 다음 가이드 스텝 표시
                    } else {
                        window.clearGuide(false); // 가이드 종료
                    }
                } else {
                    console.log("[DEBUG] Guide overlay double-click ignored for current step or not onboarding.");
                }
            });

            // NEW: Mousemove handler for guideOverlay to simulate hover states
            guideOverlay.addEventListener('mousemove', (e) => {
                if (!window.onboardingActive) {
                    // Ensure all onboarding-related visual overrides are removed if onboarding is suddenly inactive
                    document.body.classList.remove('onboarding-highlighter-active');
                    document.body.classList.remove('onboarding-fab-hover');
                    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
                    if(aiAssistantFAB) aiAssistantFAB.classList.remove('onboarding-hover', 'no-filter');
                    
                    const customCursorDot = document.getElementById('custom-cursor-dot');
                    const askImage = document.getElementById('ai-assistant-ask-image');
                    if (customCursorDot) customCursorDot.style.opacity = '0';
                    if (askImage) askImage.style.opacity = '0';
                    
                    document.body.style.cursor = 'default';
                    return;
                }

                // Simulate hover for Step 6: Highlighter Cursor
                if (window.guideIndex === 5) { // If it's the 6th step (index 5)
                    const activeSliderText = document.querySelector('.hero-slider .slider-text.active');
                    if (activeSliderText) {
                        const meaningChunks = activeSliderText.querySelectorAll('.meaning-chunk[data-highlight-id]');
                        let isMouseOverMeaningChunk = false;

                        meaningChunks.forEach(chunk => {
                            const rect = chunk.getBoundingClientRect();
                            // Check if mouse is within the chunk's boundaries
                            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                                isMouseOverMeaningChunk = true;
                            }
                        });

                        if (isMouseOverMeaningChunk) {
                            document.body.classList.add('onboarding-highlighter-active');
                            document.body.style.cursor = ''; // Let CSS handle it
                        } else {
                            document.body.classList.remove('onboarding-highlighter-active');
                            document.body.style.cursor = 'default';
                        }
                    } else {
                        // If activeSliderText not found, ensure default cursor
                        document.body.classList.remove('onboarding-highlighter-active');
                        document.body.style.cursor = 'default';
                    }
                    // Ensure FAB effects are off for this step
                    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
                    if(aiAssistantFAB) aiAssistantFAB.classList.remove('onboarding-hover', 'no-filter');
                    const customCursorDot = document.getElementById('custom-cursor-dot');
                    const askImage = document.getElementById('ai-assistant-ask-image');
                    if (customCursorDot) customCursorDot.style.opacity = '0';
                    if (askImage) askImage.style.opacity = '0';

                }
                // Simulate hover for Step 7: FAB Lottie Animation
                else if (window.guideIndex === 6) { // If it's the 7th step (index 6)
                    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
                    const customCursorDot = document.getElementById('custom-cursor-dot');
                    const askImage = document.getElementById('ai-assistant-ask-image');

                    if (aiAssistantFAB) {
                        const fabRect = aiAssistantFAB.getBoundingClientRect();
                        // Check if mouse is within FAB's boundaries
                        if (e.clientX >= fabRect.left && e.clientX <= fabRect.right &&
                            e.clientY >= fabRect.top && e.clientY <= fabRect.bottom) {
                            // Mouse is over FAB - apply simulated hover
                            aiAssistantFAB.classList.add('onboarding-hover');
                            aiAssistantFAB.classList.add('no-filter'); // Remove grayscale
                            if (customCursorDot) customCursorDot.style.opacity = '1';
                            if (askImage) askImage.style.opacity = '1';
                            document.body.classList.add('onboarding-fab-hover'); // Activate custom cursor
                            
                            // NEW: Update custom cursor position
                            if (customCursorDot) {
                                customCursorDot.style.left = `${e.clientX}px`;
                                customCursorDot.style.top = `${e.clientY}px`;
                            }
                            if (askImage) {
                                // Positioning askImage relative to mouse, slightly offset
                                askImage.style.left = `${e.clientX}px`;
                                askImage.style.top = `${e.clientY}px`;
                            }

                        } else {
                            // Mouse is off FAB - revert simulated hover
                            aiAssistantFAB.classList.remove('onboarding-hover');
                            aiAssistantFAB.classList.remove('no-filter'); // Reapply grayscale
                            if (customCursorDot) customCursorDot.style.opacity = '0';
                            if (askImage) askImage.style.opacity = '0';
                            document.body.classList.remove('onboarding-fab-hover'); // Deactivate custom cursor
                            document.body.style.cursor = 'default';
                        }
                    } else {
                        document.body.style.cursor = 'default'; // FAB not found, ensure default cursor
                    }
                }
                // For other steps or when not simulating hover, ensure default cursor
                else {
                    document.body.classList.remove('onboarding-highlighter-active');
                    document.body.classList.remove('onboarding-fab-hover');
                    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
                    if(aiAssistantFAB) aiAssistantFAB.classList.remove('onboarding-hover', 'no-filter');
                    
                    const customCursorDot = document.getElementById('custom-cursor-dot');
                    const askImage = document.getElementById('ai-assistant-ask-image');
                    if (customCursorDot) customCursorDot.style.opacity = '0';
                    if (askImage) askImage.style.opacity = '0';

                    document.body.style.cursor = 'default';
                }
            });
        }

        // --- Initial Page Setup and Onboarding Decision Logic ---
        console.log("[DEBUG] Initial localStorage - onboardingCompleted:", window.onboardingCompletedSetting);
        console.log("[DEBUG] Came from index.html flag:", window.cameFromIndex);

        if (!window.onboardingCompletedSetting || window.cameFromIndex) {
            console.log("[DEBUG] Starting onboarding guide due to onboardingCompleted=false or cameFromIndex=true.");
            window.startGuide();
        } else {
            console.log("[DEBUG] Onboarding already completed, showing persistent sparkles.");
            window.showPersistentSparkles();
            if (typeof window.setImgScaleCustom === 'function' && typeof window.scales !== 'undefined') {
                window.setImgScaleCustom(window.scales.length - 1);
            }
            if (typeof window.startSliderAutoPlay === 'function') window.startSliderAutoPlay();
            if (typeof window.startProfileImgAutoPlay === 'function') window.startProfileImgAutoPlay();

            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            setTimeout(() => onScroll(), 100);
        }

        // Scroll and Resize Handling
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            if (window.onboardingActive) {
                window.showGuideStep(window.guideIndex); // Re-position tooltip during onboarding
            }
            onScroll();
        });

        console.log("[DEBUG] portfolio.js logic finished after preloader.");
    });
});