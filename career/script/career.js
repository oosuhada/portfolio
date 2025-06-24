// script/career.js
// 페이지 전환 및 전역 상태 관리를 위한 주 진입점 및 오케스트레이터.

// 전역 상태 관리 객체
const globalState = {
isHeroAreaVisible: false, // 히어로 영역의 현재 가시성 상태 (true/false)
isTextHeroAreaVisible: false, // 텍스트 히어로 영역의 현재 가시성 상태 (true/false)
isTimelineAreaVisible: false, // 타임라인 영역의 현재 가시성 상태 (true/false) (새로 추가됨)
isGrapeFooterAreaVisible: false, // 포도 푸터 영역의 현재 가시성 상태 (true/false)
hasInitialHeroAnimationPlayed: false, // 초기 히어로 애니메이션의 재생 여부 (true = 재생됨, false = 재생 안 됨)
userInteractedDuringAnimation: false, // 애니메이션 중 사용자 상호작용 발생 여부 (true/false)
vineAnimationCurrentlyPlaying: false, // (다른 애니메이션을 위한 것일 수 있음) 포도 덩굴 애니메이션 재생 여부
currentActiveTimelineSection: 0, // 현재 활성화된 타임라인 섹션의 인덱스 (기본값: 0)
lastScrollDirection: 0, // 마지막 스크롤 방향 (1: 아래로, -1: 위로)
textheroAnimationsActive: true // 텍스트 히어로 애니메이션의 활성화 상태 추적 (true = 활성, false = 비활성)
};

/**
* 전역 상태를 업데이트합니다.
* @param {object} newState - 업데이트할 새로운 상태 객체.
*/
function setGlobalState(newState) {
Object.assign(globalState, newState);
// console.log("디버그: 전역 상태 업데이트됨:", globalState);
}

// DOM 요소 (쉬운 접근을 위해 전역 스코프에 선언)
let heroSection; // 히어로 섹션 DOM 요소
let heroBg; // 히어로 배경 DOM 요소
let scrollDownBtn; // 아래로 스크롤 버튼 DOM 요소
let heroVideo; // 히어로 비디오 DOM 요소
let navHeader; // 네비게이션 헤더 DOM 요소
let newExperienceHeader; // experience-header DOM 요소
let textHeroSection; // 텍스트 히어로 섹션 DOM 요소 (skills-showcase-section)
let timelineSectionContainer; // 타임라인 섹션 컨테이너 DOM 요소
let grapeFooterQuoteSection; // 포도 푸터 인용구 섹션 DOM 요소 (grape-footer-section)

// 쉬운 조회를 위한 섹션 참조 객체 (현재 코드에서는 사용되지 않음, 일관성을 위해 유지)
const sections = {};

// ScrollTrigger 인스턴스를 저장하기 위한 변수
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
console.warn("디버그: 존재하지 않는 요소로 스크롤 시도.", element);
callback();
return;
}

const startPosition = window.scrollY; // 현재 스크롤 위치
const elementRect = element.getBoundingClientRect(); // 대상 요소의 위치 정보

let targetPosition;
if (block === 'start') {
targetPosition = elementRect.top + window.scrollY; // 요소의 상단에 맞춰 스크롤
} else if (block === 'center') {
targetPosition = elementRect.top + window.scrollY - (window.innerHeight / 2) + (elementRect.height / 2); // 요소의 중앙에 맞춰 스크롤
} else if (block === 'end') {
targetPosition = elementRect.bottom + window.scrollY - window.innerHeight; // 요소의 하단에 맞춰 스크롤
} else {
targetPosition = elementRect.top + window.scrollY; // 기본값: 요소의 상단에 맞춰 스크롤
}

const distance = targetPosition - startPosition; // 이동해야 할 총 거리
let startTime = null; // 애니메이션 시작 시간

function animation(currentTime) {
if (startTime === null) startTime = currentTime;
const timeElapsed = currentTime - startTime; // 경과 시간
const progress = Math.min(timeElapsed / duration, 1); // 애니메이션 진행률 (0에서 1 사이)
const easeProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress); // 부드러운 이징 함수 적용
window.scrollTo(0, startPosition + distance * easeProgress); // 스크롤 위치 업데이트

if (progress < 1) {
requestAnimationFrame(animation); // 애니메이션이 끝나지 않았으면 다음 프레임 요청
} else {
callback(); // 애니메이션 완료 후 콜백 실행
console.log(`디버그: 요소로의 부드러운 스크롤 완료: ${element.id || element.className}`);
}
}

console.log(`디버그: 요소로의 부드러운 스크롤 시작: ${element.id || element.className}`);
requestAnimationFrame(animation); // 애니메이션 시작
}

// --- 히어로 섹션 함수 ---

/**
* 스크롤 다운 버튼을 표시합니다.
*/
function showScrollDownButton() {
if (scrollDownBtn) {
console.log("디버그: 스크롤 다운 버튼이 표시되어야 함 (CSS에 의해 제어됨).");
} else {
console.warn("디버그: scrollDownBtn 요소가 없습니다.");
}
}

/**
* 히어로 섹션 배경의 초기 설정 및 상태를 처리합니다.
*/
function initialHeroSetup() {
if (!heroBg || globalState.hasInitialHeroAnimationPlayed) {
if (globalState.hasInitialHeroAnimationPlayed) {
console.log("디버그: 초기 히어로 설정이 이미 재생되었습니다. 설정 건너뛰기.");
}
return;
}

const applyInitialHeroStyles = () => {
if (!globalState.hasInitialHeroAnimationPlayed) {
heroBg.style.transform = `scale(1)`; // 히어로 배경을 원래 크기로 설정
heroBg.style.transition = 'none'; // 전환 효과 없음
// navHeader가 존재하면 'experience-header-hidden-override' 클래스 제거
if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
showScrollDownButton(); // 스크롤 다운 버튼 표시
setGlobalState({ hasInitialHeroAnimationPlayed: true }); // 초기 애니메이션 재생 상태 업데이트
console.log("디버그: 초기 히어로 설정 (항상 큰 히어로) 완료.");
}
};

if (heroVideo) {
// 비디오가 준비되면 스타일 적용
if (heroVideo.readyState >= 3) { // HAVE_FUTURE_DATA 또는 그 이상 상태
applyInitialHeroStyles();
} else {
// 비디오 준비 이벤트 리스너 추가
heroVideo.addEventListener('canplaythrough', applyInitialHeroStyles, { once: true });
heroVideo.addEventListener('loadeddata', applyInitialHeroStyles, { once: true });
heroVideo.addEventListener('error', () => {
console.error("디버그: 히어로 비디오 오류 발생. 그래도 초기 설정을 진행합니다.");
applyInitialHeroStyles();
}, { once: true });
console.log("디버그: 히어로 비디오가 준비되기를 기다리는 중.");
}
} else {
// 비디오가 없으면 즉시 스타일 적용
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
console.warn("디버그: forceHeroSectionSync를 위한 heroSection 또는 heroBg가 없습니다.");
return;
}

const rect = heroSection.getBoundingClientRect(); // 히어로 섹션의 크기 및 위치 정보
const visibleThreshold = 40; // 가시성 임계값 (픽셀)

// 히어로 섹션이 뷰포트 내에 완전히 또는 거의 들어와 있을 때
if (rect.top >= -visibleThreshold && rect.bottom <= window.innerHeight + visibleThreshold) {
heroBg.style.transform = `scale(1)`; // 배경 크기를 1로 설정
heroBg.style.transition = 'none'; // 전환 효과 없음
if (navHeader) navHeader.classList.remove('experience-header-hidden-override'); // 헤더 클래스 제거
showScrollDownButton(); // 스크롤 다운 버튼 표시
console.log("디버그: 히어로 섹션을 항상 큰 상태로 강제 동기화.");
} else {
console.log("디버그: 히어로 섹션이 뷰포트에 완전히 보이지 않아 동기화 강제 적용 안 함.");
}
}

// --- 메인 페이지 전환 핸들러 (더 이상 자동 스크롤 기능 없음) ---

function handleHeroToTextHeroTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(textHeroSection, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 히어로에서 텍스트 히어로로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

function handleTextHeroToTimelineTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(timelineSectionContainer, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 텍스트 히어로에서 타임라인으로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

function handleTimelineToFooterTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(grapeFooterQuoteSection, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 타임라인에서 푸터로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

function handleTextHeroToHeroTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(heroSection, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 텍스트 히어로에서 히어로로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

function handleTimelineToTextHeroTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(textHeroSection, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 타임라인에서 텍스트 히어로로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

function handleGrapeFooterToTimelineTransition() {
document.documentElement.style.scrollBehavior = 'smooth'; // 부드러운 스크롤 활성화
smoothScrollToElement(timelineSectionContainer, 'start', () => {
document.documentElement.style.scrollBehavior = 'auto'; // 스크롤 동작 자동 (기본)으로 복원
console.log("디버그: 포도 푸터에서 타임라인으로 전환 완료.");
}, 1200); // 1.2초 동안 스크롤
}

// --- 헤더 오케스트레이션 로직 ---
function orchestrateHeaderVisibility() {
if (!newExperienceHeader || !navHeader) {
console.warn("디버그: 헤더 요소(newExperienceHeader 또는 navHeader)를 찾을 수 없어 오케스트레이션을 실행할 수 없습니다.");
return;
}

const isNavHeaderExpanded = window.getNavHeaderExpandedState ? window.getNavHeaderExpandedState() : false; // 네비게이션 헤더 확장 상태 (외부 함수)
const isTextheroSectionActiveForHeader = textHeroSection && globalState.isTextHeroAreaVisible; // 텍스트 히어로 섹션이 헤더에 대해 활성 상태인지 여부
const isGrapeFooterVisible = globalState.isGrapeFooterAreaVisible; // 포도 푸터 가시성

newExperienceHeader.classList.add('visible'); // 경험 헤더를 표시
newExperienceHeader.classList.remove('hidden'); // 'hidden' 클래스 제거
setGlobalState({ isExperienceHeaderVisible: true }); // 전역 상태 업데이트
navHeader.classList.remove('hidden'); // 네비게이션 헤더 'hidden' 클래스 제거

// 텍스트 히어로 컴포넌트의 활성화/비활성화는 이제 texthero.js 내부의 IntersectionObserver에 의해 관리됩니다.
// 여기서는 헤더 가시성만 조정합니다.
if (window.textheroComponent) {
// 이곳에서는 texthero 애니메이션 활성화 상태에 따라 직접 activate/deactivate를 호출하지 않습니다.
// 이는 textheroComponent의 컨트롤이 해당 Observer로 이전되었기 때문입니다.
}
}

// --- 메인 DOMContentLoaded 리스너 ---
console.log("--- career.js 파일 로드됨 ---");

document.addEventListener('DOMContentLoaded', () => {
    console.log("디버그: DOMContentLoaded 이벤트 발생.");

    // ▼▼▼ [수정된 최종 로직] ▼▼▼
    if (window.themeManager) {
        // localStorage에 사용자가 설정한 테마가 있는지 확인합니다.
        if (!localStorage.getItem('user-theme')) {
            // 저장된 테마가 없으면, 이 페이지의 기본값인 'dark'로 초기화합니다.
            window.themeManager.initialize('dark');
            console.log("테마 기록 없음: Career 페이지 기본값(dark)으로 설정.");
        } else {
            // 저장된 테마가 있으면, 그 값을 존중하여 초기화합니다. (인자 없이 호출)
            window.themeManager.initialize();
        }
    } else {
        console.error("Theme Manager가 로드되지 않았습니다.");
    }
    // ▲▲▲ [수정된 최종 로직] ▲▲▲

    // GSAP 및 ScrollTrigger 플러그인 등록
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    } else {
        console.warn("디버그: GSAP 또는 ScrollTrigger를 찾을 수 없습니다. 애니메이션이 작동하지 않을 수 있습니다.");
    }

    // DOM 요소 초기화
    heroSection = document.getElementById('hero-section');
    heroBg = document.querySelector('.hero-winery-bg');
    scrollDownBtn = document.querySelector('.scroll-down-btn');
    heroVideo = document.getElementById('heroVideo');
    navHeader = document.querySelector('.nav-header');
    newExperienceHeader = document.querySelector('.experience-header');
    textHeroSection = document.getElementById('skills-showcase-section');
    timelineSectionContainer = document.querySelector('.timeline-section-container');
    grapeFooterQuoteSection = document.getElementById('grape-footer-section');

    // 타임라인 컴포넌트 초기 렌더링
    if (window.timelineComponent && window.timelineComponent.renderSection) {
        window.timelineComponent.renderSection(globalState.currentActiveTimelineSection);
    } else {
        console.warn("디버그: timelineComponent.renderSection을 찾을 수 없습니다.");
    }

    // 히어로 섹션 가시성 감지 (IntersectionObserver)
    if (heroSection) {
        const heroObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                setGlobalState({ isHeroAreaVisible: entry.isIntersecting }); // 히어로 영역 가시성 업데이트
                if (entry.isIntersecting) {
                    forceHeroSectionSync(); // 히어로 섹션 강제 동기화
                }
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
            });
        }, { threshold: [0, 0.5, 1.0] }); // 0%, 50%, 100% 지점에서 콜백 실행
        heroObserver.observe(heroSection);
    }

    // 텍스트 히어로 섹션 가시성 감지 및 애니메이션 활성화/비활성화 (IntersectionObserver)
    if (textHeroSection) {
        const textHeroAreaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                // 텍스트 히어로 섹션이 화면에 15% 이상 보이면 '활성'으로 간주
                const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.15;
                setGlobalState({ isTextHeroAreaVisible: isVisible }); // 전역 상태 업데이트

                if (isVisible) {
                    // 텍스트 히어로가 보이고, 아직 애니메이션이 활성화되지 않았다면 활성화
                    if (window.textheroComponent && !globalState.textheroAnimationsActive) {
                        window.textheroComponent.activateScrollAnimation();
                        setGlobalState({ textheroAnimationsActive: true });
                        console.log("디버그: TextHeroObserver: 텍스트 히어로 애니메이션 활성화됨.");
                    }
                } else {
                    // 텍스트 히어로가 화면에서 거의 사라졌을 때 (5% 미만) 비활성화
                    if (entry.intersectionRatio <= 0.05 && globalState.textheroAnimationsActive) {
                        window.textheroComponent.deactivateScrollAnimation();
                        setGlobalState({ textheroAnimationsActive: false });
                        console.log("디버그: TextHeroObserver: 텍스트 히어로 애니메이션 비활성화됨.");
                    }
                }
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
            });
        }, { threshold: [0, 0.05, 0.15, 0.3, 0.6, 0.9], rootMargin: "0px" }); // 다양한 임계점 설정, rootMargin은 기본 0px
        textHeroAreaObserver.observe(textHeroSection);
    }

    // 타임라인 섹션 가시성 감지 (ScrollTrigger)
    if (timelineSectionContainer && window.timelineComponent) {
        timelineSectionScrollTrigger = ScrollTrigger.create({
            trigger: timelineSectionContainer,
            scroller: window,
            start: "top 80%", // 타임라인 컨테이너의 상단이 뷰포트 상단에서 80% 지점에 도달했을 때 시작
            end: "bottom top", // 타임라인 컨테이너의 하단이 뷰포트 상단에 도달했을 때 종료
            onEnter: () => {
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection); // 타임라인 섹션 렌더링
                setGlobalState({ isTimelineAreaVisible: true }); // 타임라인 영역 가시성 전역 상태 업데이트
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
                console.log("디버그: 타임라인 ScrollTrigger onEnter 발생.");
            },
            onLeaveBack: () => {
                setGlobalState({ isTimelineAreaVisible: false }); // 타임라인 영역 가시성 전역 상태 업데이트
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
                console.log("디버그: 타임라인 ScrollTrigger onLeaveBack 발생.");
            },
            onEnterBack: () => {
                window.timelineComponent.renderSection(globalState.currentActiveTimelineSection); // 타임라인 섹션 렌더링
                setGlobalState({ isTimelineAreaVisible: true }); // 타임라인 영역 가시성 전역 상태 업데이트
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
                console.log("디버그: 타임라인 ScrollTrigger onEnterBack 발생.");
            },
            onLeave: () => {
                setGlobalState({ isTimelineAreaVisible: false }); // 타임라인 영역 가시성 전역 상태 업데이트
                orchestrateHeaderVisibility(); // 헤더 가시성 오케스트레이션
                console.log("디버그: 타임라인 ScrollTrigger onLeave 발생.");
            }
        });
    }

    // 스크롤 다운 버튼 클릭 이벤트 리스너
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 기본 이벤트 방지
            handleHeroToTextHeroTransition(); // 텍스트 히어로 섹션으로 스크롤
        });
    }

    initialHeroSetup(); // 초기 히어로 설정 실행

    let lastScrollTop = window.scrollY; // 마지막 스크롤 위치 저장

    // 스크롤 이벤트 리스너 (사용자 상호작용 감지)
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY; // 현재 스크롤 위치
        if (document.documentElement.style.scrollBehavior === 'smooth' && Math.abs(currentScrollY - lastScrollTop) > 5) {
            setGlobalState({ userInteractedDuringAnimation: true }); // 사용자 상호작용 상태 업데이트
            document.documentElement.style.scrollBehavior = 'auto'; // 부드러운 스크롤 중지
        } else if (Math.abs(currentScrollY - lastScrollTop) <= 5) {
            setGlobalState({ userInteractedDuringAnimation: false }); // 사용자 상호작용 상태 리셋
        }
        lastScrollTop = currentScrollY; // 마지막 스크롤 위치 업데이트
    });

    // 창 크기 변경 이벤트 리스너
    window.addEventListener('resize', () => {
        if (window.timelineComponent && window.timelineComponent.renderSection) {
            let currentActiveIdx = 0;
            window.timelineComponent.titles.forEach((t, i) => {
                if (t.classList.contains('active')) {
                    currentActiveIdx = i;
                }
            });
            ScrollTrigger.refresh(); // ScrollTrigger 위치 새로고침
            window.timelineComponent.renderSection(currentActiveIdx); // 현재 섹션 다시 렌더링
        }
    });
    
    orchestrateHeaderVisibility(); // 초기 헤더 가시성 오케스트레이션 실행
});
