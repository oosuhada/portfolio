document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Setup
    const mainContent = document.querySelector('main.App');
    const loader = document.getElementById('loader');
    
    gsap.config({ force3D: true });
    gsap.registerPlugin(ScrollTrigger);

    // 2. Locomotive Scroll Setup
    const scroll = new LocomotiveScroll({
        el: mainContent,
        smooth: true,
        lerp: 0.08,
        multiplier: 0.9,
        smartphone: { smooth: true },
        tablet: { smooth: true },
    });

    scroll.on('scroll', ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(mainContent, {
        scrollTop(value) {
            return arguments.length ?
                scroll.scrollTo(value, { duration: 0, disableLerp: true }) :
                scroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return {
                top: 0, left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },
        pinType: mainContent.style.transform ? 'transform' : 'fixed',
    });

    // ✨ --- NEW: Scroll Progress Indicator Logic --- ✨
    const progressIndicator = document.getElementById('scroll-progress-indicator');
    const progressCircle = document.querySelector('.progress-circle-fill');
    
    if (progressIndicator && progressCircle) {
        const circleRadius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * circleRadius;

        // SVG 서클의 초기 상태 설정
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = circumference;

        // 스크롤 이벤트에 따라 프로그레스 바 업데이트
        scroll.on('scroll', (instance) => {
            // instance.scroll.y : 현재 스크롤 위치
            // instance.limit.y : 전체 스크롤 가능 높이
            const progress = Math.min(instance.scroll.y / instance.limit.y, 1); // 진행률 (0에서 1 사이)
            const offset = circumference * (1 - progress);
            
            progressCircle.style.strokeDashoffset = offset;

            // 스크롤이 시작되면 인디케이터를 보이게 처리
            if (instance.scroll.y > 10) {
                progressIndicator.style.opacity = 1;
            } else {
                progressIndicator.style.opacity = 0;
            }
        });

        // 초기에는 보이지 않도록 스타일 추가
        progressIndicator.style.opacity = 0;
        progressIndicator.style.transition = 'opacity 0.3s ease-in-out';
    }


    // 3. Initial Animations (Loader, Intro)
    if (loader) {
        gsap.to(loader, {
            opacity: 0,
            duration: 1,
            delay: 1.5,
            onComplete: () => loader.remove(),
            ease: 'power2.out'
        });
    }

    const tlIntro = gsap.timeline({ delay: 1.8 });
    tlIntro.fromTo(
        [mainContent, '.top-navigation', '.cover-head-vid', '.small-text-load2'],
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.1 }
    );

    // 4. Call Section-specific Animation Functions
    // These functions are defined in their respective JS files.
    animateHero(mainContent);
    animateProjectDetails(mainContent);
    animateDiscover(mainContent);
    animateDefine(mainContent);
    animateDesign(mainContent);
    animateDeliver(mainContent);
    animateFooter(mainContent);

    // 5. Final Refresh
    ScrollTrigger.addEventListener('refresh', () => scroll.update());
    ScrollTrigger.refresh();
});