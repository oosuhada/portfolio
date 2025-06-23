// hero.js

// Hero 섹션에 사용될 변수들 정의 (window에 노출)
window.names = ["Oosu", "우수", "佑守", "優秀", "憂愁"]; // 이름 변경에 사용될 배열을 window에 노출
window.scales = [1.4, 1.5, 1.6, 1.7]; // 이미지 확대/축소에 사용될 스케일 값을 window에 노출
window.scalePercents = [10, 30, 60, 100]; // 게이지 바 퍼센트 값을 window에 노출
window.profileImgs = []; // 프로필 이미지 경로 배열 (기본)을 window에 노출
window.profileHoverImgs = []; // 프로필 이미지 경로 배열 (호버 시)를 window에 노출
for (let i = 1; i <= 23; i++) {
    window.profileImgs.push(`profile/${i}.png`);
    window.profileHoverImgs.push(`profile/hover${i}.png`);
}
window.heroBgClasses = [
    "hero-bg-img-small", "hero-bg-img-medium",
    "hero-bg-img-large", "hero-bg-img-xlarge"
]; // 배경 이미지 클래스 배열을 window에 노출

// 필요한 DOM 요소들은 여전히 hero.js 내부에서 직접 가져옵니다.
// 이렇게 하면 portfolio.js에서 이 요소들을 다시 쿼리할 필요가 없습니다.
const sliderTexts = document.querySelectorAll('.hero-slider .slider-text'); // 슬라이더 텍스트 요소들
const sliderDots = document.querySelectorAll('.hero-slider-dots .slider-dot'); // 슬라이더 점(dot) 요소들
const heroSection = document.getElementById('hero'); // Hero 섹션의 메인 컨테이너
const heroSlider = document.querySelector('.hero-slider'); // Hero 슬라이더 요소
const hoverName = document.querySelector('.hover-name'); // 이름 변경 클릭 요소
const hoverImg = document.querySelector('.hover-img'); // 프로필 이미지 요소
const gaugeBar = document.querySelector('.gauge-bar'); // 게이지 바 요소

// Hero 섹션 상태 변수 (window에 노출할 변수 추가/수정)
window.nameIndex = 0; // 현재 이름 인덱스를 window에 노출하여 portfolio.js에서 직접 제어 가능하도록 변경
let scaleIndex = 0; // 스케일 인덱스는 hero.js 내부에서 관리 (portfolio.js가 window.setImgScaleCustom 호출하여 간접 제어)
window.currentSlide = 0; // 현재 슬라이드 인덱스를 window에 노출하여 portfolio.js에서 참조 가능하게 함
window.sliderInterval = null; // 슬라이더 자동 재생 인터벌 ID를 window에 노출
window.sliderPaused = false; // 슬라이더 자동 재생 정지 상태를 window에 노출
let profileImgIndex = 0; // 프로필 이미지 자동 변경 인덱스
let profileImgInterval = null; // 프로필 이미지 자동 변경 인터벌 ID
let isHoveringImg = false; // 이미지를 호버 중인지 여부

// Hero 섹션 관련 함수들 (window에 노출)
window.setHeroBgClass = function(bgClass) {
    // Hero 섹션 배경 클래스를 설정하는 함수
    if (!heroSection) return;
    const allPossibleBgClasses = [
        "hero-bg-default",
        ...window.names.map((_, i) => `hero-bg-name-${i}`), // window.names 사용
        ...Array.from(sliderDots).map((_, i) => `hero-bg-dot-${i}`),
        ...window.heroBgClasses // window.heroBgClasses 사용
    ];
    heroSection.classList.remove(...allPossibleBgClasses); // 기존 배경 클래스 모두 제거
    if (bgClass) {
        heroSection.classList.add(bgClass); // 새 배경 클래스 추가
    }

    if (hoverImg) {
        hoverImg.classList.remove('breathing1', 'breathing2'); // 기존 호흡 애니메이션 제거
        if (isHoveringImg) {
            hoverImg.classList.add('breathing2'); // 호버 중이면 'breathing2' 적용
        } else if (window.heroBgClasses.includes(bgClass)) { // 특정 배경 클래스 활성 시 'breathing1' 적용
            hoverImg.classList.add('breathing1');
        } else {
            // 기본 스케일로 돌아가거나 현재 스케일 유지
            const currentScaleForTransform = window.scales.length > scaleIndex ? window.scales[scaleIndex] : (parseFloat(hoverImg.style.getPropertyValue('--img-current-scale')) || 1);
            hoverImg.style.transform = `scale(${currentScaleForTransform}) rotate(0deg)`;
        }
    }
};

window.setGauge = function(percent) {
    // 게이지 바 너비를 설정하는 함수
    if (gaugeBar) gaugeBar.style.width = `${percent}%`; // 게이지 바 너비 설정
};

window.setImgScaleCustom = function(idx) {
    // 이미지 스케일과 게이지 바를 설정하는 함수
    if (hoverImg && window.scales.length > idx && window.scalePercents.length > idx) {
        scaleIndex = idx; // 내부 scaleIndex 업데이트
        const currentScaleValue = window.scales[idx]; // 현재 스케일 값 가져오기
        hoverImg.style.setProperty('--img-scale', currentScaleValue); // CSS 변수 설정
        hoverImg.style.setProperty('--img-current-scale', currentScaleValue); // 현재 스케일 CSS 변수 설정
        hoverImg.style.transform = `scale(${currentScaleValue}) rotate(0deg)`; // 이미지 스케일 및 회전 적용
        window.setGauge(window.scalePercents[idx]); // 게이지 바 설정 (window.setGauge, window.scalePercents 사용)
        if (window.heroBgClasses[idx] !== undefined) { // 배경 클래스 설정 (window.heroBgClasses 사용)
            window.setHeroBgClass(window.heroBgClasses[idx]); // window.setHeroBgClass 사용
        } else {
            window.setHeroBgClass(null); // 배경 클래스 초기화
        }
    }
};

window.resetImgAndGauge = function() {
    // 이미지 스케일과 게이지 바를 초기 상태로 리셋하는 함수
    scaleIndex = 0; // 스케일 인덱스 초기화
    window.setImgScaleCustom(scaleIndex); // 이미지와 게이지 바 초기화 적용 (window.setImgScaleCustom 사용)
};

window.showSlide = function(idx) {
    // 슬라이더 텍스트와 점(dot)을 활성화하는 함수
    if (sliderTexts.length === 0 || idx < 0 || idx >= sliderTexts.length || !sliderDots[idx]) return; // 유효성 검사
    sliderTexts.forEach((el, i) => el.classList.toggle('active', i === idx)); // 슬라이더 텍스트 활성화/비활성화
    sliderDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === idx); // 슬라이더 점 활성화/비활성화
    });
    window.currentSlide = idx; // window.currentSlide 업데이트
    if (!window.onboardingActive) { // 온보딩 비활성화 시
        const isImgScaleBgActive = window.heroBgClasses.some(cls => heroSection && heroSection.classList.contains(cls)); // window.heroBgClasses 사용
        if (!isImgScaleBgActive) {
            window.setHeroBgClass(`hero-bg-dot-${idx}`); // 점에 따른 배경 클래스 설정 (window.setHeroBgClass 사용)
        }
    }
};

window.startSliderAutoPlay = function() {
    // 슬라이더 자동 재생을 시작하는 함수
    if (window.sliderInterval) clearInterval(window.sliderInterval); // 기존 인터벌 중지 (window.sliderInterval 사용)
    if (sliderTexts.length === 0) return; // 슬라이더 텍스트 없으면 함수 종료
    window.sliderInterval = setInterval(() => { // window.sliderInterval 사용
        if (!window.sliderPaused && !window.onboardingActive) { // 정지 상태가 아니고 온보딩 비활성화 시 (window.sliderPaused 사용)
            window.showSlide((window.currentSlide + 1) % sliderTexts.length); // 다음 슬라이드 표시 (window.currentSlide 사용)
        }
    }, 6000); // 6초마다 반복
};

window.stopSliderAutoPlay = function() {
    // 슬라이더 자동 재생을 명시적으로 멈추는 함수 추가
    if (window.sliderInterval) {
        clearInterval(window.sliderInterval);
        window.sliderInterval = null;
    }
};


window.startProfileImgAutoPlay = function() {
    // 프로필 이미지 자동 변경을 시작하는 함수
    if (profileImgInterval) clearInterval(profileImgInterval); // 기존 인터벌 중지

    function updateProfileImg(isHover) {
        // 프로필 이미지 소스를 업데이트하는 내부 함수
        if (hoverImg) {
            if (isHover && window.profileHoverImgs.length > 0 && profileImgIndex < window.profileHoverImgs.length) { // 호버 중이면 호버 이미지로 (window.profileHoverImgs 사용)
                hoverImg.src = window.profileHoverImgs[profileImgIndex];
            } else if (window.profileImgs.length > 0 && profileImgIndex < window.profileImgs.length) { // 아니면 기본 이미지로 (window.profileImgs 사용)
                hoverImg.src = window.profileImgs[profileImgIndex];
            }
        }
    }

    updateProfileImg(isHoveringImg); // 초기 이미지 업데이트

    profileImgInterval = setInterval(() => {
        profileImgIndex = (profileImgIndex + 1) % window.profileImgs.length; // 이미지 인덱스 업데이트 (window.profileImgs 사용)
        updateProfileImg(isHoveringImg); // 이미지 업데이트
    }, 1000); // 1초마다 반복
};

// =========================================================
// 동적 티커 생성 로직 (Dynamic Ticker Generation Logic)
// 이 로직은 Hero 섹션과 직접 관련이 없으므로 필요하다면 별도 파일로 분리할 수도 있습니다.
// 여기서는 hero.js에 그대로 두되, preloaderHidden 이벤트 리스너 내부로 옮깁니다.
// =========================================================

// Event listeners for hero elements - these will check window.onboardingActive
// preloaderHidden 이벤트 발생 후 Hero 섹션 관련 이벤트 리스너를 등록합니다.
document.addEventListener('preloaderHidden', function () {
    console.log("[DEBUG] hero.js initialized after preloader hidden.");

    if (hoverName) {
        hoverName.addEventListener('click', () => {
            // 온보딩 활성화 중이고 가이드 인덱스가 0일 때는 portfolio.js에서 이벤트를 처리하도록 합니다.
            // hero.js의 이 부분은 온보딩 중에는 동작하지 않도록 명확히 합니다.
            if (window.onboardingActive && window.guideIndex === 0) {
                console.log("[DEBUG] hero.js hoverName click ignored during onboarding for step 0.");
                return;
            }
            // 온보딩이 비활성화 상태일 때만 일반적인 상호작용 허용
            window.nameIndex = (window.nameIndex + 1) % window.names.length; // window.nameIndex 사용
            hoverName.textContent = window.names[window.nameIndex];
            window.setHeroBgClass(`hero-bg-name-${window.nameIndex}`);
            const sparkle = document.querySelector('#sparkle-name');
            if (sparkle) sparkle.style.display = 'none';
        });
    }

    if (heroSlider) {
        heroSlider.addEventListener('dblclick', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            if (sliderTexts.length > 0) {
                const nextSlideIndex = (window.currentSlide + 1) % sliderTexts.length; // window.currentSlide 사용
                window.showSlide(nextSlideIndex); // 다음 슬라이드 표시 (window.showSlide 사용)
            }
            window.sliderPaused = true; // 슬라이더 일시 정지 (window.sliderPaused 사용)
            if (window.sliderInterval) clearInterval(window.sliderInterval); // 자동 재생 인터벌 중지 (window.sliderInterval 사용)
            setTimeout(() => {
                window.sliderPaused = false; // 일시 정지 해제 (window.sliderPaused 사용)
                window.startSliderAutoPlay(); // 자동 재생 재시작 (window.startSliderAutoPlay 사용)
            }, 8000); // 8초 후
        });
    }

    if (hoverImg) {
        hoverImg.addEventListener('click', () => {
            // 온보딩 활성화 중이고 특정 가이드 스텝일 때는 portfolio.js에서 이벤트를 처리하도록 합니다.
            if (window.onboardingActive && window.guideIndex >= 2 && window.guideIndex <= 4) {
                 console.log("[DEBUG] hero.js hoverImg click ignored during onboarding for steps 2-4.");
                 return; // portfolio.js가 이벤트를 처리하도록 함
            } else if (!window.onboardingActive) {
                // 온보딩이 비활성화 상태일 때만 일반적인 상호작용 허용
                scaleIndex = (scaleIndex + 1) % window.scales.length; // window.scales 사용
                window.setImgScaleCustom(scaleIndex); // 스케일 적용 (window.setImgScaleCustom 사용)
                const sparkle = document.querySelector('#sparkle-img');
                if (sparkle) sparkle.style.display = 'none'; // 스파클 숨기기
            }
        });

        hoverImg.addEventListener('mouseenter', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            isHoveringImg = true; // 호버 상태 설정
            window.startProfileImgAutoPlay(); // 프로필 이미지 자동 재생 시작 (window.startProfileImgAutoPlay 사용)
            hoverImg.classList.remove('breathing1'); // 기존 호흡 애니메이션 제거
            hoverImg.classList.add('breathing2'); // 새 호흡 애니메이션 추가
            hoverImg.style.transform = ''; // 변형 초기화 (애니메이션이 담당하도록)
        });

        hoverImg.addEventListener('mouseleave', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            isHoveringImg = false; // 호버 상태 해제
            window.startProfileImgAutoPlay(); // 프로필 이미지 자동 재생 시작 (window.startProfileImgAutoPlay 사용)
            hoverImg.classList.remove('breathing2'); // 호흡 애니메이션 제거
            const currentBgClass = window.heroBgClasses[scaleIndex]; // window.heroBgClasses 사용
            if (currentBgClass && heroSection.classList.contains(currentBgClass)) {
                hoverImg.classList.add('breathing1'); // 특정 배경 클래스 활성 시 다시 추가
            }
            hoverImg.style.transform = ''; // 변형 초기화
        });
    }

    const heroSliderDotsArea = document.querySelector('.hero-slider-dots-area');
    if (heroSliderDotsArea) {
        heroSliderDotsArea.addEventListener('click', (e) => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            const clickedDot = e.target.closest('.slider-dot'); // 클릭된 점 요소 찾기
            let targetIndex = window.currentSlide; // window.currentSlide 사용
            if (clickedDot && clickedDot.dataset.index) {
                targetIndex = parseInt(clickedDot.dataset.index, 10); // 데이터 인덱스 파싱
            }
            window.showSlide(targetIndex); // 해당 슬라이드 표시 (window.showSlide 사용)
            window.sliderPaused = true; // 슬라이더 일시 정지 (window.sliderPaused 사용)
            if (window.sliderInterval) clearInterval(window.sliderInterval); // 자동 재생 인터벌 중지 (window.sliderInterval 사용)
            setTimeout(() => {
                window.sliderPaused = false; // 일시 정지 해제 (window.sliderPaused 사용)
                window.startSliderAutoPlay(); // 자동 재생 재시작 (window.startSliderAutoPlay 사용)
            }, 8000); // 8초 후
            const sparkle = document.querySelector('#sparkle-dot');
            if (sparkle) sparkle.style.display = 'none'; // 스파클 숨기기
        });
    }

    // Dynamic Ticker Generation Logic - (Should be inside preloaderHidden event listener or after DOM is ready)
    const tickerLines = [
        { top: '2rem', rotate: -2, animation: 'fadeInOut3 25s ease-in-out infinite', marquee: 'marquee3 35s linear infinite', direction: 'reverse' },
        { top: '6rem', rotate: 3, animation: 'fadeInOut4 35s ease-in-out infinite', marquee: 'marquee1 45s linear infinite' },
        { top: '10rem', rotate: -6, animation: 'fadeInOut5 40s ease-in-out infinite', marquee: 'marquee2 55s linear infinite' },
        { top: '15rem', rotate: 2, animation: 'fadeInOut1 30s ease-in-out infinite', marquee: 'marquee1 40s linear infinite' },
        { top: '20rem', rotate: -12, animation: 'fadeInOut2 50s ease-in-out infinite', marquee: 'marquee2 60s linear infinite' },
        { top: '26rem', rotate: 4, animation: 'fadeInOut5 42s ease-in-out infinite', marquee: 'marquee3 48s linear infinite' },
        { top: '32rem', rotate: -5, animation: 'fadeInOut4 55s ease-in-out infinite', marquee: 'marquee1 52s linear infinite', direction: 'reverse' },
        { top: '36rem', rotate: 1, animation: 'fadeInOut1 48s ease-in-out infinite', marquee: 'marquee2 58s linear infinite', direction: 'reverse' }
    ];

    const tickerItems = [
        "Interactive Designer", "Frontend Developer", "UX/UI Designer",
        "Product Designer", "Creative Technologist", "Human-Centered Designer"
    ];

    const tickerContainer = document.getElementById('tickerContainer');

    if (tickerContainer) { // 컨테이너 요소가 존재하는지 확인
        tickerLines.forEach((line) => {
            const section = document.createElement('section');
            section.className = 'ticker-section';
            section.style.cssText = `
                width: 100%; overflow: hidden; position: absolute; top: ${line.top}; z-index: 1.5;
                transform: rotate(${line.rotate}deg); animation: ${line.animation};
            `;
            const wrap = document.createElement('div');
            wrap.className = 'ticker-wrap';
            wrap.style.cssText = 'width:100%; margin:0 auto; overflow:hidden; white-space:nowrap;';
            const ticker = document.createElement('div');
            ticker.className = 'ticker';
            ticker.style.cssText = `
                display: inline-block; padding-top: 2rem; animation: ${line.marquee};
                ${line.direction === 'reverse' ? 'animation-direction: reverse;' : ''}
            `;
            for (let repeat = 0; repeat < 2; repeat++) {
                const collection = document.createElement('span');
                collection.className = 'item-collection';
                tickerItems.forEach(itemText => {
                    const item = document.createElement('span');
                    item.className = 'item';
                    item.textContent = itemText;
                    collection.appendChild(item);
                });
                ticker.appendChild(collection);
            }
            wrap.appendChild(ticker);
            section.appendChild(wrap);
            tickerContainer.appendChild(section);
        });

        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            /* 마키 애니메이션들 (좌우 스크롤) */
            @keyframes marquee1 { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
            @keyframes marquee2 { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
            @keyframes marquee3 { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
            /* 페이드인/아웃 애니메이션들 */
            @keyframes fadeInOut1 { 0% { opacity: 0.2; transform: scale(1); } 15% { opacity: 0.3; transform: scale(1); } 85% { opacity: 0.3; transform: scale(1); } 100% { opacity: 0.2; transform: scale(1); } }
            @keyframes fadeInOut2 { 0% { opacity: 0.2; transform: scale(1); } 5% { opacity: 0.3; transform: scale(1); } 20% { opacity: 0.3; transform: scale(1); } 80% { opacity: 0.3; transform: scale(1); } 95% { opacity: 0.3; transform: scale(1); } 100% { opacity: 0.2; transform: scale(1); } }
            @keyframes fadeInOut3 { 0% { opacity: 0.1; transform: scale(1); } 15% { opacity: 0.2; transform: scale(1); } 85% { opacity: 0.2; transform: scale(1); } 100% { opacity: 0.1; transform: scale(1); } }
            @keyframes fadeInOut4 { 0% { opacity: 0.2; transform: scale(1); } 15% { opacity: 0.5; transform: scale(1); } 85% { opacity: 0.5; transform: scale(1); } 100% { opacity: 0.2; transform: scale(1); } }
            /* 동적으로 생성된 티커들을 위한 공통 스타일 */
            .ticker-section {} .ticker-wrap {} .ticker {} .item-collection {}
            .item { display: inline-block; padding: 0 1rem; font-size: 1.6rem; color: #bdbdbd77; font-weight: 500; font-family: "Poppins", sans-serif; }
        `;
        document.head.appendChild(styleSheet);
    }
}); // END preloaderHidden event listener

// Add initial setup when DOM is ready but before preloader is hidden.
// 이 부분은 DOM 요소들이 존재해야 하므로 DOMContentLoaded에 유지합니다.
document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] hero.js DOMContentLoaded initial setup.");

    // Hero 섹션 초기 설정
    // portfolio.js의 startGuide()에서 초기화되므로 hero.js에서는 더 이상 직접 초기화하지 않습니다.
    // DOM 요소 쿼리는 여기서 유지되어 다른 함수에서 사용될 수 있도록 합니다.
    // (예: sliderTexts, sliderDots, heroSection 등은 이 범위에서 계속 사용 가능)

    // startProfileImgAutoPlay()는 preloaderHidden 이후 portfolio.js에서 호출될 수 있습니다.
    // showSlide(0)도 마찬가지입니다.
    if (heroSection) {
        // window.startProfileImgAutoPlay(); // portfolio.js에서 제어
        // if (sliderTexts.length > 0 && sliderTexts[0]) window.showSlide(0); // portfolio.js에서 제어
        // else currentSlide = -1; // portfolio.js에서 제어
    }
});