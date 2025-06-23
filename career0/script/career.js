// script/career.js
// 페이지 전환 및 전역 상태를 위한 주 진입점 및 오케스트레이터.

// 전역 상태 관리
const globalState = {
    isHeroAreaVisible: false, // 히어로 영역 가시성
    isTextHeroAreaVisible: false, // 텍스트 히어로 영역 가시성
    isTimelineAreaVisible: false, // 타임라인 영역 가시성 (NEW)
    isGrapeFooterAreaVisible: false, // 포도 푸터 영역 가시성
    hasInitialHeroAnimationPlayed: false, // 초기 히어로 애니메이션 재생 여부
    userInteractedDuringAnimation: false, // 애니메이션 중 사용자 상호작용 여부
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
let newExperienceHeader; // experience-header 요소
let textHeroSection; // 텍스트 히어로 섹션 요소
let timelineSectionContainer; // 타임라인 섹션 컨테이너 요소
let grapeFooterQuoteSection; // 포도 푸터 인용구 섹션 요소

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

            // Ensure navHeader exists before trying to modify its classes
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

// --- 메인 페이지 전환 핸들러 (더 이상 자동 스크롤 기능 없음) ---
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


// --- Header Orchestration Logic ---
function orchestrateHeaderVisibility() {
    if (!newExperienceHeader || !navHeader) {
        console.warn("DEBUG: Header elements (newExperienceHeader or navHeader) not found for orchestration.");
        return;
    }

    const isNavHeaderExpanded = window.getNavHeaderExpandedState ? window.getNavHeaderExpandedState() : false;
    const isTextheroSectionActiveForHeader = textHeroSection && globalState.isTextHeroAreaVisible;
    const isGrapeFooterVisible = globalState.isGrapeFooterAreaVisible;

    newExperienceHeader.classList.add('visible');
    newExperienceHeader.classList.remove('hidden');
    setGlobalState({ isExperienceHeaderVisible: true });
    
    navHeader.classList.remove('hidden');

    if (window.textheroComponent) {
        if (isTextheroSectionActiveForHeader && !isGrapeFooterVisible) {
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


// --- 메인 DOMContentLoaded 리스너 ---
console.log("--- career.js 파일 로드됨 ---");
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired.");

    if(window.gsap && window.ScrollTrigger){
        gsap.registerPlugin(ScrollTrigger);
    } else {
        console.warn("DEBUG: GSAP or ScrollTrigger not found. Animations might not work.");
    }

    heroSection = document.getElementById('hero-section');
    heroBg = document.querySelector('.hero-winery-bg');
    scrollDownBtn = document.querySelector('.scroll-down-btn');
    heroVideo = document.getElementById('heroVideo');
    navHeader = document.querySelector('.nav-header');
    newExperienceHeader = document.querySelector('.experience-header');
    textHeroSection = document.getElementById('skills-showcase-section');
    timelineSectionContainer = document.querySelector('.timeline-section-container');
    grapeFooterQuoteSection = document.getElementById('grape-footer-section');

    if (window.timelineComponent && window.timelineComponent.renderSection) {
        window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);
    } else {
        console.warn("DEBUG: timelineComponent.renderSection not found.");
    }

    if (heroSection) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isHeroAreaVisible: entry.isIntersecting });
                if (entry.isIntersecting) {
                    forceHeroSectionSync();
                }
                orchestrateHeaderVisibility();
            });
        }, { threshold: [0, 0.5, 1.0] });
        heroObserver.observe(heroSection);
    }

    if (textHeroSection) {
        const textHeroAreaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.3;
                setGlobalState({ isTextHeroAreaVisible: isVisible });
                orchestrateHeaderVisibility();
            });
        }, { threshold: [0, 0.3, 0.6, 0.9], rootMargin: "0px 0px -5% 0px" });
        textHeroAreaObserver.observe(textHeroSection);
    }

    if (timelineSectionContainer && window.timelineComponent) {
        timelineSectionScrollTrigger = ScrollTrigger.create({
            trigger: timelineSectionContainer,
            scroller: window,
            start: "top 60%",
            end: "bottom top",
            onEnter: () => {
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);
                if (window.textheroComponent && globalState.textheroAnimationsActive) {
                    window.textheroComponent.deactivateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: false });
                }
                orchestrateHeaderVisibility();
            },
            onLeaveBack: () => {
                if (window.textheroComponent && !globalState.textheroAnimationsActive) {
                    window.textheroComponent.activateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: true });
                }
                orchestrateHeaderVisibility();
            },
            onEnterBack: () => {
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);
                if (window.textheroComponent && globalState.textheroAnimationsActive) {
                    window.textheroComponent.deactivateScrollAnimation();
                    setGlobalState({ textheroAnimationsActive: false });
                }
                orchestrateHeaderVisibility();
            },
            onLeave: () => {
                orchestrateHeaderVisibility();
            }
        });
    }

    // REMOVED: The IntersectionObserver for the grape footer is no longer needed.
    // All animation is now handled by ScrollTrigger in grapefooter.js.

    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleHeroToTextHeroTransition();
        });
    }

    initialHeroSetup();

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

    window.addEventListener('resize', () => {
        if (window.timelineComponent && window.timelineComponent.renderSection) {
            let currentActiveIdx = 0;
            window.timelineComponent.titles.forEach((t, i) => {
                if (t.classList.contains('active')) {
                    currentActiveIdx = i;
                }
            });
            window.timelineComponent.renderSection(currentActiveIdx);
        }
    });

    const experienceThemeToggle = document.querySelector('.experience-header .theme-toggle');
    const experienceSunIcon = document.getElementById('sun-icon');
    const experienceMoonIcon = document.getElementById('moon-icon');

    function toggleExperienceHeaderTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
            experienceSunIcon.classList.remove('hidden');
            experienceMoonIcon.classList.add('hidden');
        } else {
            experienceSunIcon.classList.add('hidden');
            experienceMoonIcon.classList.remove('hidden');
        }
        const themeChangeEvent = new CustomEvent('themeToggled', { detail: { theme: newTheme } });
        document.dispatchEvent(themeChangeEvent);
    }

    let savedTheme = localStorage.getItem('theme');
    if (!savedTheme || savedTheme === 'light') {
        savedTheme = 'dark';
        localStorage.setItem('theme', savedTheme);
    }
    document.body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
        if (experienceSunIcon) experienceSunIcon.classList.remove('hidden');
        if (experienceMoonIcon) experienceMoonIcon.classList.add('hidden');
    } else {
        if (experienceSunIcon) experienceSunIcon.classList.add('hidden');
        if (experienceMoonIcon) experienceMoonIcon.classList.remove('hidden');
    }

    if (experienceThemeToggle) {
        experienceThemeToggle.addEventListener('click', toggleExperienceHeaderTheme);
    }
    
    orchestrateHeaderVisibility();
});