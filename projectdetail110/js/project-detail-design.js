// 범용 슬라이드쇼 애니메이션 함수
function createPinnedSlideshow(sectionSelector, scroller) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const pinWrapper = section.querySelector('.pin-wrapper');
    // 애니메이션 할 요소들을 순서대로 선택
    const animatedElements = gsap.utils.toArray(
        pinWrapper.children
    ).filter(el => !el.matches('.pin-spacer')); // pin-spacer 제외

    // 타임라인 생성
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            scroller: scroller,
            pin: pinWrapper,
            scrub: 1.5,
            start: "top top",
            end: () => "+=" + (animatedElements.length * 800), // 요소 개수에 따라 길이 동적 조절
            invalidateOnRefresh: true
        }
    });

    // 각 요소를 순차적으로 애니메이션
    animatedElements.forEach((elem, index) => {
        // 요소가 화면 안으로 들어오는 애니메이션
        tl.fromTo(elem, 
            { opacity: 0, yPercent: -50, scale: 0.95 }, 
            { opacity: 1, yPercent: -50, scale: 1, duration: 0.4 },
            `+=${index === 0 ? 0 : 0.6}` // 첫 요소는 바로, 나머지는 간격두고 시작
        );

        // 마지막 요소를 제외하고, 화면 밖으로 나가는 애니메이션 추가
        if (index < animatedElements.length - 1) {
            tl.to(elem, 
                { opacity: 0, yPercent: -50, scale: 0.95, duration: 0.4 },
                '>' // 이전 애니메이션이 끝난 직후
            );
        }
    });
}

// 메인 애니메이션 실행 함수
function animateAllSections(mainContent) {
    // ScrollTrigger가 데스크톱에서만 실행되도록 설정
    ScrollTrigger.matchMedia({
        "(min-width: 769px)": function() {
            // 각 섹션에 대해 슬라이드쇼 함수 호출
            createPinnedSlideshow('.design-section-1', mainContent);
            createPinnedSlideshow('.design-section-2', mainContent);
            createPinnedSlideshow('.deliver-section-1', mainContent);
            createPinnedSlideshow('.deliver-section-2', mainContent);
        }
    });
}

// 아래 함수를 Locomotive Scroll이 초기화 된 후 호출해주세요.
// 예시:
// const locoScroll = new LocomotiveScroll(...);
// locoScroll.on("scroll", ScrollTrigger.update);
// ScrollTrigger.scrollerProxy(mainContent, ...);
// ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
// animateAllSections(mainContent); // <- 여기!