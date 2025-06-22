// hero.js

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] hero.js loaded."); // 디버깅용 메시지: hero.js 로드됨

    // =========================================================
    // 기존 Hero 섹션 로직 (Hero Section Logic)
    // =========================================================

    // Hero 섹션에 사용될 변수들 정의
    const names = ["Oosu", "우수", "佑守", "優秀", "憂愁"]; // 이름 변경에 사용될 배열
    const scales = [1.4, 1.5, 1.6, 1.7]; // 이미지 확대/축소에 사용될 스케일 값
    const scalePercents = [10, 30, 60, 100]; // 게이지 바 퍼센트 값
    const profileImgs = []; // 프로필 이미지 경로 배열 (기본)
    const profileHoverImgs = []; // 프로필 이미지 경로 배열 (호버 시)
    for (let i = 1; i <= 23; i++) {
        profileImgs.push(`profile/${i}.png`);
        profileHoverImgs.push(`profile/hover${i}.png`);
    }
    const heroBgClasses = [
        "hero-bg-img-small", "hero-bg-img-medium",
        "hero-bg-img-large", "hero-bg-img-xlarge"
    ]; // 배경 이미지 클래스 배열
    const sliderTexts = document.querySelectorAll('.hero-slider .slider-text'); // 슬라이더 텍스트 요소들
    const sliderDots = document.querySelectorAll('.hero-slider-dots .slider-dot'); // 슬라이더 점(dot) 요소들
    const heroSection = document.getElementById('hero'); // Hero 섹션의 메인 컨테이너 (HTML에 #hero ID가 있어야 함)
    const heroSlider = document.querySelector('.hero-slider'); // Hero 슬라이더 요소
    const hoverName = document.querySelector('.hover-name'); // 이름 변경 클릭 요소
    const hoverImg = document.querySelector('.hover-img'); // 프로필 이미지 요소
    const gaugeBar = document.querySelector('.gauge-bar'); // 게이지 바 요소

    let nameIndex = 0, scaleIndex = 0, currentSlide = 0; // 현재 상태를 추적하는 인덱스 변수들
    let sliderInterval = null, sliderPaused = false; // 슬라이더 자동 재생 인터벌 및 정지 상태
    let profileImgIndex = 0, profileImgInterval = null; // 프로필 이미지 자동 변경 인덱스 및 인터벌
    let isHoveringImg = false; // 이미지를 호버 중인지 여부

    // Hero 섹션 관련 함수들
    function setHeroBgClass(bgClass) {
        if (!heroSection) return; // heroSection이 없으면 함수 종료
        // 가능한 모든 배경 클래스 목록
        const allPossibleBgClasses = [
            "hero-bg-default",
            ...names.map((_, i) => `hero-bg-name-${i}`),
            ...Array.from(sliderDots).map((_, i) => `hero-bg-dot-${i}`),
            ...heroBgClasses
        ];
        heroSection.classList.remove(...allPossibleBgClasses); // 기존 배경 클래스 모두 제거
        if (bgClass) {
            heroSection.classList.add(bgClass); // 새 배경 클래스 추가
        }

        if (hoverImg) {
            hoverImg.classList.remove('breathing1', 'breathing2'); // 기존 호흡 애니메이션 제거
            if (isHoveringImg) {
                hoverImg.classList.add('breathing2'); // 호버 중이면 'breathing2' 적용
            } else if (heroBgClasses.includes(bgClass)) {
                hoverImg.classList.add('breathing1'); // 특정 배경 클래스 활성 시 'breathing1' 적용
            } else {
                // 기본 스케일로 돌아가거나 현재 스케일 유지
                const currentScaleForTransform = scales.length > scaleIndex ? scales[scaleIndex] : (parseFloat(hoverImg.style.getPropertyValue('--img-current-scale')) || 1);
                hoverImg.style.transform = `scale(${currentScaleForTransform}) rotate(0deg)`;
            }
        }
    }

    function setGauge(percent) {
        if (gaugeBar) gaugeBar.style.width = `${percent}%`; // 게이지 바 너비 설정
    }

    function setImgScaleCustom(idx) {
        if (hoverImg && scales.length > idx && scalePercents.length > idx) {
            const currentScaleValue = scales[idx]; // 현재 스케일 값 가져오기
            hoverImg.style.setProperty('--img-scale', currentScaleValue); // CSS 변수 설정
            hoverImg.style.setProperty('--img-current-scale', currentScaleValue); // 현재 스케일 CSS 변수 설정
            hoverImg.style.transform = `scale(${currentScaleValue}) rotate(0deg)`; // 이미지 스케일 및 회전 적용
            setGauge(scalePercents[idx]); // 게이지 바 설정
            if (heroBgClasses[idx] !== undefined) {
                setHeroBgClass(heroBgClasses[idx]); // 배경 클래스 설정
            } else {
                setHeroBgClass(null); // 배경 클래스 초기화
            }
        }
    }

    function resetImgAndGauge() {
        scaleIndex = 0; // 스케일 인덱스 초기화
        setImgScaleCustom(scaleIndex); // 이미지와 게이지 바 초기화 적용
    }

    function showSlide(idx) {
        if (sliderTexts.length === 0 || idx < 0 || idx >= sliderTexts.length || !sliderDots[idx]) return; // 유효성 검사
        sliderTexts.forEach((el, i) => el.classList.toggle('active', i === idx)); // 슬라이더 텍스트 활성화/비활성화
        sliderDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === idx); // 슬라이더 점 활성화/비활성화
        });
        currentSlide = idx; // 현재 슬라이드 인덱스 업데이트
        if (!window.onboardingActive) { // 온보딩 비활성화 시
            const isImgScaleBgActive = heroBgClasses.some(cls => heroSection && heroSection.classList.contains(cls));
            if (!isImgScaleBgActive) {
                setHeroBgClass(`hero-bg-dot-${idx}`); // 점에 따른 배경 클래스 설정
            }
        }
    }

    function startSliderAutoPlay() {
        if (sliderInterval) clearInterval(sliderInterval); // 기존 인터벌 중지
        if (sliderTexts.length === 0) return; // 슬라이더 텍스트 없으면 함수 종료
        sliderInterval = setInterval(() => {
            if (!sliderPaused && !window.onboardingActive) { // 정지 상태가 아니고 온보딩 비활성화 시
                showSlide((currentSlide + 1) % sliderTexts.length); // 다음 슬라이드 표시
            }
        }, 6000); // 6초마다 반복
    }

    function startProfileImgAutoPlay() {
        if (profileImgInterval) clearInterval(profileImgInterval); // 기존 인터벌 중지

        function updateProfileImg(isHover) {
            if (hoverImg) {
                if (isHover && profileHoverImgs.length > 0 && profileImgIndex < profileHoverImgs.length) {
                    hoverImg.src = profileHoverImgs[profileImgIndex]; // 호버 중이면 호버 이미지로
                } else if (profileImgs.length > 0 && profileImgIndex < profileImgs.length) {
                    hoverImg.src = profileImgs[profileImgIndex]; // 아니면 기본 이미지로
                }
            }
        }

        updateProfileImg(isHoveringImg); // 초기 이미지 업데이트

        profileImgInterval = setInterval(() => {
            profileImgIndex = (profileImgIndex + 1) % profileImgs.length; // 이미지 인덱스 업데이트
            updateProfileImg(isHoveringImg); // 이미지 업데이트
        }, 1000); // 1초마다 반복
    }

    // Hero 섹션 이벤트 리스너들
    if (hoverName) {
        hoverName.addEventListener('click', () => {
            if (!window.onboardingActive) { // 온보딩 비활성화 시
                nameIndex = (nameIndex + 1) % names.length; // 다음 이름으로 변경
                hoverName.textContent = names[nameIndex]; // 이름 텍스트 업데이트
                setHeroBgClass(`hero-bg-name-${nameIndex}`); // 배경 클래스 업데이트
                const sparkle = document.querySelector('#sparkle-name');
                if (sparkle) sparkle.style.display = 'none'; // 스파클 숨기기
            } else if (window.onboardingActive && window.guideIndex === 0) { // 온보딩 활성화 및 가이드 인덱스 0일 때
                nameIndex = (nameIndex + 1) % names.length;
                hoverName.textContent = names[nameIndex];
                setHeroBgClass(`hero-bg-name-${nameIndex}`);
                const sparkle = document.querySelector('#sparkle-name');
                if (sparkle) sparkle.style.display = 'none';
                window.guideIndex++; // 가이드 인덱스 증가
                if (window.guideIndex < window.guideSteps.length) {
                    window.showGuideStep(window.guideIndex); // 다음 가이드 스텝 표시
                } else {
                    window.clearGuide(false); // 가이드 종료
                }
            }
        });
    }

    if (heroSlider) {
        heroSlider.addEventListener('dblclick', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            if (sliderTexts.length > 0) {
                const nextSlideIndex = (currentSlide + 1) % sliderTexts.length;
                showSlide(nextSlideIndex); // 다음 슬라이드 표시
            }
            sliderPaused = true; // 슬라이더 일시 정지
            if (sliderInterval) clearInterval(sliderInterval); // 자동 재생 인터벌 중지
            setTimeout(() => {
                sliderPaused = false; // 일시 정지 해제
                startSliderAutoPlay(); // 자동 재생 재시작
            }, 8000); // 8초 후
        });
    }

    if (hoverImg) {
        hoverImg.addEventListener('click', () => {
            if (!window.onboardingActive) { // 온보딩 비활성화 시
                scaleIndex = (scaleIndex + 1) % scales.length; // 다음 스케일로 변경
                setImgScaleCustom(scaleIndex); // 스케일 적용
                const sparkle = document.querySelector('#sparkle-img');
                if (sparkle) sparkle.style.display = 'none'; // 스파클 숨기기
            } else if (window.onboardingActive && window.guideIndex >= 2 && window.guideIndex <= 4) { // 온보딩 활성화 및 특정 가이드 인덱스 범위일 때
                scaleIndex = (scaleIndex + 1) % scales.length;
                setImgScaleCustom(scaleIndex);
                const sparkle = document.querySelector('#sparkle-img');
                if (sparkle) sparkle.style.display = 'none';
                window.guideIndex++;
                if (window.guideIndex < window.guideSteps.length) {
                    window.showGuideStep(window.guideIndex);
                } else {
                    window.clearGuide(false);
                }
            }
        });

        hoverImg.addEventListener('mouseenter', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            isHoveringImg = true; // 호버 상태 설정
            startProfileImgAutoPlay(); // 프로필 이미지 자동 재생 시작
            hoverImg.classList.remove('breathing1'); // 기존 호흡 애니메이션 제거
            hoverImg.classList.add('breathing2'); // 새 호흡 애니메이션 추가
            hoverImg.style.transform = ''; // 변형 초기화 (애니메이션이 담당하도록)
        });

        hoverImg.addEventListener('mouseleave', () => {
            if (window.onboardingActive) return; // 온보딩 활성화 시 종료
            isHoveringImg = false; // 호버 상태 해제
            startProfileImgAutoPlay(); // 프로필 이미지 자동 재생 시작
            hoverImg.classList.remove('breathing2'); // 호흡 애니메이션 제거
            const currentBgClass = heroBgClasses[scaleIndex];
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
            let targetIndex = currentSlide;
            if (clickedDot && clickedDot.dataset.index) {
                targetIndex = parseInt(clickedDot.dataset.index, 10); // 데이터 인덱스 파싱
            }
            showSlide(targetIndex); // 해당 슬라이드 표시
            sliderPaused = true; // 슬라이더 일시 정지
            if (sliderInterval) clearInterval(sliderInterval); // 자동 재생 인터벌 중지
            setTimeout(() => {
                sliderPaused = false; // 일시 정지 해제
                startSliderAutoPlay(); // 자동 재생 재시작
            }, 8000); // 8초 후
            const sparkle = document.querySelector('#sparkle-dot');
            if (sparkle) sparkle.style.display = 'none'; // 스파클 숨기기
        });
    }

    // Hero 섹션 초기 설정
    if (heroSection) {
        startProfileImgAutoPlay(); // 프로필 이미지 자동 재생 시작
        if (sliderTexts.length > 0 && sliderTexts[0]) showSlide(0); // 첫 슬라이드 표시
        else currentSlide = -1;
    }

    // 온보딩 상태에 따른 초기화
    if (!window.onboardingCompletedSetting || window.cameFromIndex) {
        resetImgAndGauge(); // 온보딩 미완료 또는 인덱스에서 온 경우 초기화
    } else {
        scaleIndex = scales.length - 1; // 마지막 스케일로 설정
        setImgScaleCustom(scaleIndex); // 스케일 적용
        startSliderAutoPlay(); // 슬라이더 자동 재생 시작
    }


    // =========================================================
    // 동적 티커 생성 로직 (Dynamic Ticker Generation Logic)
    // =========================================================

    // 각 티커 줄의 속성을 정의하는 배열
    // 'top': 세로 위치, 'rotate': 회전 각도, 'animation': 페이드인/아웃 애니메이션 (속도 포함),
    // 'marquee': 좌우 스크롤 애니메이션 (속도 포함), 'direction': 스크롤 방향 ('reverse'면 역방향)
    const tickerLines = [
      { top: '2rem',   rotate: -2, animation: 'fadeInOut3 25s ease-in-out infinite', marquee: 'marquee3 35s linear infinite', direction: 'reverse' },
      { top: '6rem',  rotate: 3,  animation: 'fadeInOut4 35s ease-in-out infinite', marquee: 'marquee1 45s linear infinite' },
      { top: '10rem',  rotate: -6, animation: 'fadeInOut5 40s ease-in-out infinite', marquee: 'marquee2 55s linear infinite' },
      { top: '15rem',  rotate: 2,  animation: 'fadeInOut1 30s ease-in-out infinite', marquee: 'marquee1 40s linear infinite' },
      { top: '20rem',  rotate: -12, animation: 'fadeInOut2 50s ease-in-out infinite', marquee: 'marquee2 60s linear infinite' },
      { top: '26rem',  rotate: 4,  animation: 'fadeInOut5 42s ease-in-out infinite', marquee: 'marquee3 48s linear infinite' },
      { top: '32rem',  rotate: -5, animation: 'fadeInOut4 55s ease-in-out infinite', marquee: 'marquee1 52s linear infinite',direction: 'reverse' },
      { top: '36rem',  rotate: 1,  animation: 'fadeInOut1 48s ease-in-out infinite', marquee: 'marquee2 58s linear infinite',direction: 'reverse' }
    ];

    // 티커에 표시될 아이템 텍스트 배열
    const tickerItems = [
        "Interactive Designer",
        "Frontend Developer",
        "UX/UI Designer",
        "Product Designer",
        "Creative Technologist",
        "Human-Centered Designer"
    ];

    // 티커들이 생성될 HTML 컨테이너를 가져옵니다.
    // HTML 파일에 <div id="tickerContainer"></div> 요소가 있어야 합니다.
    const tickerContainer = document.getElementById('tickerContainer');

    if (tickerContainer) { // 컨테이너 요소가 존재하는지 확인
        // tickerLines 배열을 순회하며 각 티커 줄 생성
        tickerLines.forEach((line, i) => {
            const section = document.createElement('section');
            section.className = 'ticker-section'; // 모든 생성된 섹션에 공통 클래스 부여
            // 인라인 스타일로 각 줄의 고유 속성 (top, rotate, animation) 설정
            section.style.cssText = `
                width: 100%;
                overflow: hidden;
                position: absolute;
                top: ${line.top};
                z-index: 1.5; /* z-index는 Hero 섹션 요소들과 충돌하지 않도록 조정 필요 */
                transform: rotate(${line.rotate}deg); /* <<< rotate 값을 여기서만 관리합니다. */
                animation: ${line.animation};
            `;

            // ticker-wrap (티커 내용물을 감싸는 래퍼)
            const wrap = document.createElement('div');
            wrap.className = 'ticker-wrap'; // 공통 클래스
            wrap.style.cssText = 'width:100%; margin:0 auto; overflow:hidden; white-space:nowrap;';

            // ticker (실제로 애니메이션될 내용물)
            const ticker = document.createElement('div');
            ticker.className = 'ticker'; // 공통 클래스
            // 인라인 스타일로 티커의 애니메이션 (좌우 스크롤) 설정
            ticker.style.cssText = `
                display: inline-block;
                padding-top: 2rem;
                animation: ${line.marquee};
                ${line.direction === 'reverse' ? 'animation-direction: reverse;' : ''}
            `;

            // item collection (끊김 없는 반복을 위해 두 번 반복)
            for(let repeat = 0; repeat < 2; repeat++) {
                const collection = document.createElement('span');
                collection.className = 'item-collection'; // 공통 클래스
                tickerItems.forEach(itemText => {
                    const item = document.createElement('span');
                    item.className = 'item'; // 이미 CSS에 정의된 공통 아이템 스타일 사용
                    item.textContent = itemText; // 아이템 텍스트 설정
                    collection.appendChild(item); // 컬렉션에 아이템 추가
                });
                ticker.appendChild(collection); // 티커에 컬렉션 추가
            }
            wrap.appendChild(ticker); // 래퍼에 티커 추가
            section.appendChild(wrap); // 섹션에 래퍼 추가
            tickerContainer.appendChild(section); // 최종적으로 컨테이너에 섹션 추가
        });

        // =========================================================
        // 티커 애니메이션을 위한 CSS @keyframes 동적 생성
        // (rotate 속성은 @keyframes에서 제거되어 JS에서 단일 관리)
        // =========================================================
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            /* 마키 애니메이션들 (좌우 스크롤) */
            @keyframes marquee1 {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); } /* 두 개의 item-collection 중 한 개 너비만큼 이동 */
            }
            @keyframes marquee2 {
                0% { transform: translateX(-50%); } /* 한 개 너비만큼 왼쪽에서 시작 */
                100% { transform: translateX(0%); }
            }
            @keyframes marquee3 {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); } /* marquee1과 동일, 역방향에서 사용 */
            }

            /* 페이드인/아웃 애니메이션들 - transform: rotate() 속성은 제거됨 */
            @keyframes fadeInOut1 {
                0% { opacity: 0.2; transform: scale(1); }
                15% { opacity: 0.3; transform: scale(1); }
                85% { opacity: 0.3; transform: scale(1); }
                100% { opacity: 0.2; transform: scale(1); }
            }
            @keyframes fadeInOut2 {
                0% { opacity: 0.2; transform: scale(1); }
                5% { opacity: 0.3; transform: scale(1); }
                20% { opacity: 0.3; transform: scale(1); }
                80% { opacity: 0.3; transform: scale(1); }
                95% { opacity: 0.3; transform: scale(1); }
                100% { opacity: 0.2; transform: scale(1); }
            }
            @keyframes fadeInOut3 {
                0% { opacity: 0.1; transform: scale(1); }
                15% { opacity: 0.2; transform: scale(1); }
                85% { opacity: 0.2; transform: scale(1); }
                100% { opacity: 0.1; transform: scale(1); }
            }
            @keyframes fadeInOut4 {
                0% { opacity: 0.2; transform: scale(1); }
                15% { opacity: 0.5; transform: scale(1); }
                85% { opacity: 0.5; transform: scale(1); }
                100% { opacity: 0.2; transform: scale(1); }
            }

            /* 동적으로 생성된 티커들을 위한 공통 스타일 */
            .ticker-section {
                /* 기본 스타일 (width, overflow, position, z-index, transform, animation)은 JS 인라인으로 관리 */
            }
            .ticker-wrap {
                /* 기본 스타일 (width, margin, overflow, white-space)은 JS 인라인으로 관리 */
            }
            .ticker {
                /* 기본 스타일 (display, padding-top, animation)은 JS 인라인으로 관리 */
            }
            .item-collection {
                /* 특별히 필요한 스타일 없음 */
            }
            .item {
                display: inline-block;
                padding: 0 1rem;
                font-size: 1.6rem;
                color: #bdbdbd77;
                font-weight: 500;
                font-family: "Poppins", sans-serif;
            }
        `;
        document.head.appendChild(styleSheet); // 생성된 스타일 시트를 <head>에 추가
    }
});