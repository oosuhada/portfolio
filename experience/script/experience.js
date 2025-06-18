// experience.js
// 페이지 전환 및 전역 상태를 위한 주 진입점 및 오케스트레이터.

// 전역 상태 관리
const globalState = {
    isHeroAreaVisible: false, // 히어로 영역 가시성
    isTextHeroAreaVisible: false, // 텍스트 히어로 영역 가시성
    isTimelineAreaVisible: false, // 타임라인 영역 가시성 (NEW)
    isGrapeFooterAreaVisible: false, // 포도 푸터 영역 가시성
    hasInitialHeroAnimationPlayed: false, // 초기 히어로 애니메이션 재생 여부
    userInteractedDuringAnimation: false, // 애니메이션 중 사용자 상호작용 여부
    footerZoomedIn: false, // 푸터 이미지 줌인 상태 여부
    vineAnimationCurrentlyPlaying: false, // (다른 애니메이션용일 수 있음)
    currentActiveTimelineSection: 0, // 현재 활성화된 타임라인 섹션 인덱스
    lastScrollDirection: 0, // 마지막 스크롤 방향 (1: 아래, -1: 위)
    textheroAnimationsActive: true // NEW: texthero 애니메이션 활성화 상태 추적
};

/**
 * 전역 상태를 업데이트합니다.
 * @param {object} newState - 업데이트할 새로운 상태 객체.
 */
function setGlobalState(newState) {
    Object.assign(globalState, newState);
    // console.log("DEBUG: Global state updated:", globalState);
}

// DOM 요소 (쉬운 접근을 위해 전역 스코프)
let heroSection; // 히어로 섹션 요소
let heroBg;      // 히어로 배경 요소
let scrollDownBtn; // 아래로 스크롤 버튼 요소
let heroVideo;   // 히어로 비디오 요소
let navHeader;   // 네비게이션 헤더 요소
let textHeroSection; // 텍스트 히어로 섹션 요소
let timelineSectionContainer; // 타임라인 섹션 컨테이너 요소
let grapeFooterQuoteSection; // 포도 푸터 인용구 섹션 요소
let footerImgEl; // 푸터 이미지 요소
let footerTextEl; // 푸터 텍스트 요소

// 쉬운 조회를 위한 섹션 참조 객체
const sections = {}; // (Not used in provided code, kept for consistency)

// NEW: ScrollTrigger 인스턴스 저장을 위한 변수
let timelineSectionScrollTrigger;

// --- 유틸리티 함수 ---

/**
 * 대상 요소로 부드럽게 스크롤합니다.
 * @param {HTMLElement} element - 스크롤할 DOM 요소.
 * @param {ScrollLogicalPosition} block - 수직 정렬을 정의합니다. 'start', 'center', 'end', 'nearest'.
 * @param {function} callback - 스크롤 완료 후 실행할 함수.
 * @param {number} duration - 스크롤 애니메이션 지속 시간 (밀리초).
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

// --- 히어로 섹션 함수 ---

/**
 * 스크롤 다운 버튼을 표시합니다.
 */
function showScrollDownButton() {
    if (scrollDownBtn) {
        console.log("DEBUG: Scroll down button should be visible (controlled by CSS).");
    } else {
        console.warn("DEBUG: scrollDownBtn element not found.");
    }
}

/**
 * 히어로 섹션 배경의 초기 설정 및 상태를 처리합니다.
 */
function initialHeroSetup() {
    if (!heroBg || globalState.hasInitialHeroAnimationPlayed) {
        if (globalState.hasInitialHeroAnimationPlayed) {
            console.log("DEBUG: Initial hero setup already played. Skipping setup.");
        }
        return;
    }

    const applyInitialHeroStyles = () => {
        if (!globalState.hasInitialHeroAnimationPlayed) {
            heroBg.style.transform = `scale(1)`;
            heroBg.style.transition = 'none';

            if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
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
                console.error("DEBUG: Hero video error encountered. Proceeding with initial setup anyway.");
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
 * 히어로 섹션의 상태를 강제로 동기화합니다.
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
        if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
        showScrollDownButton();
        console.log("DEBUG: Force syncing hero section to always large state.");
    } else {
        console.log("DEBUG: Hero section not fully in view, not forcing sync.");
    }
}

// --- 푸터 섹션 함수 ---

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
 * 푸터 이미지를 뷰포트 중앙으로 스크롤합니다.
 */
function scrollFooterImgToCenter() {
    if (!footerImgEl || footerImgEl.offsetParent === null) {
        console.warn("DEBUG: footerImgEl not found or not in DOM to scroll to center.");
        return;
    }
    const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    footerImgEl.scrollIntoView({ behavior: prm ? 'auto' : 'smooth', block: 'center' });
    console.log("DEBUG: Scrolling footer image to center.");
}

/**
 * 푸터 이미지와 텍스트를 반복하여 애니메이션합니다.
 */
function animateFooterLoop() {
    clearTimeout(footerAnimationTimeoutId);
    console.log("DEBUG: Starting footer animation loop.");
    let currentFooterImageFrame = 1;

    function nextFooterStep() {
        if (!footerImgEl || !footerTextEl || !globalState.footerZoomedIn) {
            clearTimeout(footerAnimationTimeoutId);
            // console.log("DEBUG: Stopping footer animation due to missing elements or footer not zoomed in.");
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
        // console.log(`DEBUG: Footer animation frame: ${currentFooterImageFrame}, Text: "${currentText.substring(0, 30)}..."`);
        currentFooterImageFrame++;
        if (currentFooterImageFrame <= totalFooterImageFrames) {
            footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep);
        } else {
            if (footerSteps.length > 0) footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text;
            footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
            footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
            // console.log("DEBUG: Footer animation cycle complete, restarting loop after pause.");
        }
    }
    nextFooterStep();
}

// --- 메인 페이지 전환 핸들러 (더 이상 자동 스크롤 기능 없음) ---
// These functions are not used for automatic section transitions via scroll.
// They are kept if there are other manual triggers like direct link clicks.
function handleHeroToTextHeroTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(textHeroSection, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Hero to TextHero transition completed.");
    }, 1200);
}

function handleTextHeroToTimelineTransition() {
    document.documentElement.style.scrollBehavior = 'smooth';
    smoothScrollToElement(timelineSectionContainer, 'start', () => {
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
    smoothScrollToElement(timelineSectionContainer, 'start', () => {
        document.documentElement.style.scrollBehavior = 'auto';
        console.log("DEBUG: Grape Footer to Timeline transition completed.");
    }, 1200);
}


// --- 메인 DOMContentLoaded 리스너 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired.");

    // GSAP 플러그인 등록
    if(window.gsap && window.ScrollTrigger){
        gsap.registerPlugin(ScrollTrigger);
        console.log("DEBUG: GSAP and ScrollTrigger registered.");
    } else {
        console.warn("DEBUG: GSAP or ScrollTrigger not found. Animations might not work.");
    }

    // 필요한 모든 DOM 요소 가져오기
    heroSection = document.getElementById('hero-section');
    heroBg = document.querySelector('.hero-winery-bg');
    scrollDownBtn = document.querySelector('.scroll-down-btn');
    heroVideo = document.getElementById('heroVideo');
    navHeader = document.querySelector('.nav-header');
    textHeroSection = document.getElementById('skills-showcase-section');
    timelineSectionContainer = document.querySelector('.timeline-section-container');
    grapeFooterQuoteSection = document.getElementById('grape-footer-section');
    footerImgEl = document.getElementById('grapeFooterImg');
    footerTextEl = document.getElementById('grapeFooterText');

    console.log("DEBUG: All main DOM elements retrieved.");

    // timeline.js가 로드된 후 renderTimelineSection 함수를 호출
    // Note: timeline.js 스크립트가 experience.js보다 먼저 로드되어야 합니다.
    if (window.timelineComponent && window.timelineComponent.renderSection) {
        // 초기 로드 시 첫 번째 콘텐츠 영역만 보이도록 설정
        window.timelineComponent.renderSection(0);
        console.log("DEBUG: Initial timeline section rendered via timelineComponent.renderSection(0).");
    } else {
        console.warn("DEBUG: timelineComponent.renderSection not found. Ensure timeline.js is loaded and exposes its functions.");
    }

    // 히어로 섹션 옵저버 초기화
    if (heroSection) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isHeroAreaVisible: entry.isIntersecting });
                console.log(`DEBUG: Hero Section visibility: ${entry.isIntersecting}, IntersectionRatio: ${entry.intersectionRatio.toFixed(2)}`);

                if (entry.isIntersecting) {
                    forceHeroSectionSync();
                }
            });
        }, { threshold: [0, 0.5, 1.0] });
        heroObserver.observe(heroSection);
        console.log("DEBUG: Hero section observer set up.");
    } else {
        console.warn("DEBUG: heroSection not found. Hero observer not set up.");
    }

    // 텍스트 히어로 섹션 옵저버 초기화
    if (textHeroSection) {
        const textHeroAreaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isTextHeroAreaVisible: entry.isIntersecting });
                console.log(`DEBUG: Text Hero Section visibility: ${entry.isIntersecting}, IntersectionRatio: ${entry.intersectionRatio.toFixed(2)}`);
            });
        }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
        textHeroAreaObserver.observe(textHeroSection);
        console.log("DEBUG: Text Hero section observer set up.");
    } else {
        console.warn("DEBUG: textHeroSection not found. Text Hero observer not set up.");
    }

    // NEW: Timeline Section ScrollTrigger for animation orchestration
    if (timelineSectionContainer && window.timelineComponent) {
        timelineSectionScrollTrigger = ScrollTrigger.create({
            trigger: timelineSectionContainer,
            scroller: window,
            start: "top 60%", // When top of timeline section hits 60% down the viewport
            end: "bottom top", // Ends when bottom of timeline section goes above top of viewport
            // markers: true, // Uncomment for debugging
            onEnter: () => {
                console.log("DEBUG: Timeline Section entered view (onEnter). Triggering timeline animations.");
                // Activate timeline animations (main title, description, cards)
                // This re-renders the current active section, triggering its animations.
                // We ensure globalState.currentActiveTimelineSection is correct.
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);

                // Deactivate texthero animations
                if (window.textheroComponent && globalState.textheroAnimationsActive) {
                    window.textheroComponent.deactivateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: false });
                }
            },
            onLeaveBack: () => { // When scrolling UP and leaving the timeline section
                console.log("DEBUG: Timeline Section left view (onLeaveBack). Re-activating texthero animations.");
                // Re-activate texthero animations
                if (window.textheroComponent && !globalState.textheroAnimationsActive) {
                    window.textheroComponent.activateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: true });
                }
            },
            onEnterBack: () => { // When scrolling DOWN and entering timeline section again (after scrolling past it)
                console.log("DEBUG: Timeline Section re-entered view (onEnterBack). Triggering timeline animations.");
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);
                // Ensure texthero animations are off if re-entering timeline
                if (window.textheroComponent && globalState.textheroAnimationsActive) {
                    window.textheroComponent.deactivateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: false });
                }
            },
            onLeave: () => { // When scrolling DOWN and leaving timeline section completely
                console.log("DEBUG: Timeline Section left view (onLeave).");
                // If you want texthero animations to resume if you scroll way past timeline
                // and then back up into texthero, onLeaveBack already handles the primary "going back up" case.
            }
        });
        // You might want to store this ScrollTrigger if you need to kill it later for a full page reset
        // allDynamicScrollTriggers.push(timelineSectionScrollTrigger); // Assuming allDynamicScrollTriggers is in common.js or needs to be managed for top-level STs
        console.log("DEBUG: Timeline Section ScrollTrigger set up.");
    } else {
        console.warn("DEBUG: timelineSectionContainer or timelineComponent not found. Timeline section ScrollTrigger not set up.");
    }


    // 푸터 애니메이션 옵저버 초기화
    if (grapeFooterQuoteSection) {
        const footerObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isGrapeFooterAreaVisible: entry.isIntersecting });
                console.log(`DEBUG: Grape Footer Section visibility: ${entry.isIntersecting}, IntersectionRatio: ${entry.intersectionRatio.toFixed(2)}`);

                if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !globalState.footerZoomedIn) {
                    setGlobalState({ footerZoomedIn: true });
                    if (footerImgEl && !footerImgEl.classList.contains('zoomed-in')) {
                        scrollFooterImgToCenter();
                        footerImgEl.classList.add('zoomed-in');
                        animateFooterLoop();
                        console.log("DEBUG: Grape footer zoomed in and animation started.");
                    } else {
                        console.log("DEBUG: FooterImgEl not found or already zoomed-in class present.");
                    }
                }
                else if (!entry.isIntersecting && globalState.footerZoomedIn && entry.boundingClientRect.bottom < 0) {
                    clearTimeout(footerAnimationTimeoutId);
                    setGlobalState({ footerZoomedIn: false });
                    if (footerImgEl) footerImgEl.classList.remove('zoomed-in');
                    console.log("DEBUG: Grape footer zoomed out and animation stopped.");
                }
            });
        }, { threshold: [0, 0.5, 1.0] });
        footerObserver.observe(grapeFooterQuoteSection);
        console.log("DEBUG: Grape Footer section observer set up (maintained auto-animation).");
    } else {
        console.warn("DEBUG: grapeFooterQuoteSection not found. Footer observer not set up.");
    }

    // 스크롤 다운 버튼 바인딩
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("DEBUG: Scroll down button clicked. No auto-scroll triggered.");
        });
        console.log("DEBUG: Scroll down button event listener attached (no auto-scroll on click).");
    } else {
        console.warn("DEBUG: scrollDownBtn not found. Click listener not attached.");
    }

    // 초기 히어로 설정
    initialHeroSetup();

    let lastScrollTop = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (document.documentElement.style.scrollBehavior === 'smooth' && Math.abs(currentScrollY - lastScrollTop) > 5) {
            setGlobalState({ userInteractedDuringAnimation: true });
            document.documentElement.style.scrollBehavior = 'auto';
            console.log("DEBUG: User interaction detected during smooth scroll. Scroll behavior reset to 'auto'.");
        } else if (Math.abs(currentScrollY - lastScrollTop) <= 5) {
            setGlobalState({ userInteractedDuringAnimation: false });
        }
        lastScrollTop = currentScrollY;
    });
    console.log("DEBUG: Global scroll listener for user interaction attached.");

    // Re-render on window resize to adjust layout for mobile/desktop
    window.addEventListener('resize', () => {
        if (window.timelineComponent && window.timelineComponent.renderSection) {
            let currentActiveIdx = 0;
            // Get current active index from timelineComponent's titles
            window.timelineComponent.titles.forEach((t, i) => {
                if (t.classList.contains('active')) {
                    currentActiveIdx = i;
                }
            });
            window.timelineComponent.renderSection(currentActiveIdx);
        }
    });
    console.log("DEBUG: Resize event listener attached.");
});