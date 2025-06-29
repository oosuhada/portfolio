function animateProjectDetails(mainContent) {
    const section = document.querySelector('.project-details-section');
    if (!section) return;

    const content = section.querySelector('.details-content');
    if (!content) return;

    // 1. 새로운 등장 애니메이션 추가
    // 섹션이 화면에 보이기 시작하면 콘텐츠가 아래에서 위로 떠오릅니다.
    gsap.from(content, {
        y: 50,      // 50px 아래에서 시작
        opacity: 0, // 투명한 상태에서 시작
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            scroller: mainContent,
            // 시작 기준점: 섹션의 상단이 화면의 80% 지점에 닿았을 때
            start: 'top 50%', 
            // 애니메이션 재생/역재생 설정
            toggleActions: 'play none none reverse', 
        }
    });

    // 2. 기존의 화면 고정(pin) 기능은 그대로 유지
    ScrollTrigger.matchMedia({
        "(min-width: 769px)": function() {
            const pinWrapper = section.querySelector('.pin-wrapper');
            if (!pinWrapper) return;

            ScrollTrigger.create({
                trigger: section,
                scroller: mainContent,
                pin: pinWrapper,
                start: "top top",
                end: "+=100%", 
            });
        }
    });
}