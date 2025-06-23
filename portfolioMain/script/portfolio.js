// portfolio.js

import { projectDetailsHtml, initModalContentInteractions, openModal, closeModal } from './modal.js';

// Global variables for onboarding shared with hero.js
// 이 변수들은 window 객체에 명시적으로 할당되어 다른 스크립트(hero.js)에서 접근 가능합니다.
window.onboardingActive = false; // 온보딩 활성 상태
window.guideIndex = 0; // 현재 온보딩 가이드 스텝 인덱스
window.onboardingCompletedSetting = localStorage.getItem('onboardingCompleted'); // 온보딩 완료 여부 설정
window.cameFromIndex = new URLSearchParams(window.location.search).get('from') === 'index'; // index.html에서 왔는지 여부

let guideTooltip = null; // 가이드 툴팁 요소 (DOMContentLoaded 이후 할당)

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
    }
];

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] portfolio.js loaded.");

    // Preloader Handling (기존 내용 유지)
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

    // preloaderHidden 이벤트 리스너: 로딩 화면이 사라진 후 메인 콘텐츠와 온보딩 로직을 시작합니다.
    document.addEventListener('preloaderHidden', function() {
        console.log("[DEBUG] Received preloaderHidden event. Starting main content and onboarding logic.");
        if (mainContent) mainContent.style.display = 'block'; // 메인 콘텐츠 표시

        // 전역 변수 및 DOM 요소 할당 (기존 내용 유지)
        window.onboardingCompletedSetting = localStorage.getItem('onboardingCompleted');
        const guideOverlay = document.getElementById('guide-overlay');
        guideTooltip = document.getElementById('guide-tooltip'); // 전역 guideTooltip에 할당
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

        // URL Cleanup (기존 내용 유지)
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

        // 필수 요소 체크 (기존 내용 유지)
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

        // --- Global Onboarding Utility Functions ---
        // 스파클을 모두 숨기는 함수 (기존 내용 유지)
        function hideAllSparkles() {
            ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
                const sp = document.querySelector(sel);
                if (sp) sp.style.display = 'none';
            });
        }

        // 지속적으로 표시되는 스파클을 보여주는 함수 (window에 노출)
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

        // 밑줄 효과를 설정하는 함수 (window에 노출)
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

        // 스파클 표시 상태를 설정하는 함수 (window에 노출)
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

        // 가이드 스텝을 보여주는 함수 (window에 노출)
        window.showGuideStep = function(idx) {
            if (!window.guideSteps || idx < 0 || idx >= window.guideSteps.length || !guideTooltip) {
                if (window.guideSteps && idx >= window.guideSteps.length) window.clearGuide(false);
                return;
            }
            const step = window.guideSteps[idx];
            window.setUnderline(null, false);
            window.setSparkleDisplay(idx);
            const targetElement = document.querySelector(step.target);
            if (targetElement && step.pos) {
                guideTooltip.style.display = 'block';
                guideTooltip.style.opacity = "0";
                const pos = step.pos(targetElement);
                guideTooltip.style.top = `${pos.top}px`;
                guideTooltip.style.left = `${pos.left}px`;
                guideTooltip.textContent = step.msg;
                guideTooltip.style.opacity = "1";
            } else {
                if (!targetElement) console.error(`[DEBUG] showGuideStep: Target element '${step.target}' not found for tooltip positioning at step ${idx}.`);
                guideTooltip.style.opacity = "0";
                guideTooltip.style.display = 'none';
            }
            window.guideIndex = idx; // 전역 guideIndex 업데이트
        };

        // 가이드를 종료하는 함수 (window에 노출)
        window.clearGuide = function(isSkippingOrFinishedEarly = false) {
            console.log(`[DEBUG] clearGuide called. isSkippingOrFinishedEarly: ${isSkippingOrFinishedEarly}`);
            if (guideOverlay) guideOverlay.style.display = "none";
            if (guideCloseButton) guideCloseButton.style.display = "none";
            window.setUnderline(null, false);
            window.setSparkleDisplay(-1);
            window.onboardingActive = false;
            window.guideIndex = 0; // 인덱스 리셋
            document.body.classList.remove('no-scroll'); // 스크롤 허용

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
            // localStorage에 온보딩 완료 여부 저장
            if (!isSkippingOrFinishedEarly || (isSkippingOrFinishedEarly && localStorage.getItem('onboardingCompleted') !== 'true')) {
                console.log("[DEBUG] clearGuide: Setting onboardingCompleted to true in localStorage.");
                localStorage.setItem('onboardingCompleted', 'true');
            }

            // Hero 섹션을 온보딩 후 최종 상태로 복원 (hero.js 함수 호출)
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.setImgScaleCustom === 'function' && window.scales) {
                window.setImgScaleCustom(window.scales.length - 1); // 최대 스케일로 설정
            }
            if (typeof window.startSliderAutoPlay === 'function') window.startSliderAutoPlay();
            if (typeof window.startProfileImgAutoPlay === 'function') window.startProfileImgAutoPlay();

            // 이름 초기화 (첫 번째 이름으로) - hero.js의 window.nameIndex와 hoverName 사용
            const hoverName = document.querySelector('.hover-name');
            if (hoverName && typeof window.names !== 'undefined') {
                 window.nameIndex = 0; // hero.js의 nameIndex를 0으로 리셋
                 hoverName.textContent = window.names[window.nameIndex];
                 if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`);
            }

            setTimeout(() => { onScroll(); }, 100);
        };

        // 가이드를 시작하는 함수 (window에 노출)
        window.startGuide = function() {
            console.log("[DEBUG] startGuide: Attempting to start guide...");
            if (!guideOverlay || !guideTooltip || !guideCloseButton) { return; }
            // 모든 가이드 대상 요소가 DOM에 있는지 확인
            for (let i = 0; i < window.guideSteps.length; i++) {
                if (!document.querySelector(window.guideSteps[i].target)) {
                    console.error(`[DEBUG] startGuide: Required guide element '${window.guideSteps[i].target}' not found. Cannot start guide.`);
                    return;
                }
            }
            if (window.onboardingActive) { return; } // 이미 활성화된 경우 중복 실행 방지

            window.onboardingActive = true; // 온보딩 활성화
            window.guideIndex = 0; // 가이드 인덱스 초기화

            guideOverlay.style.display = "block"; // 오버레이 표시
            if (guideCloseButton) guideCloseButton.style.display = 'block'; // 닫기 버튼 표시
            if (scrollIcon) { scrollIcon.style.opacity = "0"; scrollIcon.style.pointerEvents = "none"; } // 스크롤 아이콘 숨김

            document.body.classList.add('no-scroll'); // 스크롤 비활성화
            window.scrollTo(0, 0); // 페이지 최상단으로 스크롤

            // Hero 섹션을 온보딩 시작 상태로 리셋 (hero.js 함수 호출)
            if (typeof window.resetImgAndGauge === 'function') window.resetImgAndGauge();
            if (typeof window.showSlide === 'function') {
                const sliderTexts = document.querySelectorAll('.hero-slider .slider-text');
                if (sliderTexts.length > 0) window.showSlide(0); // 첫 슬라이드 표시
            }
            if (typeof window.stopSliderAutoPlay === 'function') { // 슬라이더 자동 재생 중지
                 window.stopSliderAutoPlay();
            }
            if (typeof window.sliderPaused !== 'undefined') window.sliderPaused = true; // 슬라이더 정지 상태 설정


            // 이름 초기화 (첫 번째 이름으로) - hero.js의 window.nameIndex와 hoverName 사용
            const hoverName = document.querySelector('.hover-name');
            if (hoverName && typeof window.names !== 'undefined') {
                window.nameIndex = 0; // hero.js의 nameIndex를 0으로 초기화
                hoverName.textContent = window.names[window.nameIndex];
                if (typeof window.setHeroBgClass === 'function') window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`);
            }

            window.showGuideStep(window.guideIndex); // 첫 가이드 스텝 표시
            console.log("[DEBUG] startGuide: Guide started successfully.");
        };

        // --- General Interaction Functions ---
        // 프로젝트 활성 상태 설정 함수 (기존 내용 유지)
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

        // 스크롤 이벤트 핸들러 (기존 내용 유지)
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
        }

        if (guideCloseButton) { /* ... */ }
        if (guideTooltip) { /* ... */ }
        projectImageAnchors.forEach(anchor => { /* ... */ });
        if (mainLogo) { /* ... */ }
        if (allMarqueeInnerRows.length >= 4) { /* ... */ }

        // --- Initial Page Setup and Onboarding Decision Logic ---
        console.log("[DEBUG] Initial localStorage - onboardingCompleted:", window.onboardingCompletedSetting);
        console.log("[DEBUG] Came from index.html flag:", window.cameFromIndex);

        if (!window.onboardingCompletedSetting || window.cameFromIndex) {
            console.log("[DEBUG] Starting onboarding guide due to onboardingCompleted=false or cameFromIndex=true.");
            window.startGuide(); // 가이드 시작 (window.startGuide 호출)
        } else {
            console.log("[DEBUG] Onboarding already completed, showing persistent sparkles.");
            window.showPersistentSparkles(); // 지속 스파클 표시
            // 온보딩 완료 시 Hero 섹션을 최종 상태로 복원
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

        // Scroll and Resize Handling (기존 내용 유지)
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            if (window.onboardingActive) {
                window.showGuideStep(window.guideIndex); // 온보딩 중에는 툴팁 위치 재조정
            }
            onScroll();
        });

        console.log("[DEBUG] portfolio.js logic finished after preloader.");
    });
});