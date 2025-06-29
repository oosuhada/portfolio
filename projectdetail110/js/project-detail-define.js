function animateDefine(mainContent) {
    const section = document.querySelector('.define-section');
    if (!section) return;
    
    ScrollTrigger.matchMedia({
        "(min-width: 769px)": function() {
            const pinWrapper = section.querySelector('.pin-wrapper');
            const header = section.querySelector('.define-header');
            const content = section.querySelector('.section-main-content');
            if (!pinWrapper || !content) return;

            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    scroller: mainContent,
                    pin: pinWrapper,
                    start: "top top",
                    scrub: 2,
                    end: () => `+=${content.offsetHeight * 1.4}`
                }
            });

            if (header) {
                tl.fromTo(header, { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', duration: 0.2 }, 0)
                  .to(header, { y: -40, opacity: 0, ease: 'power1.in', duration: 0.2 }, 0.1);
            }

            tl.to(content, {
                y: () => -(content.offsetHeight * 1.5),
                ease: "none"
            }, 0);
        }
    });
}