function animateDeliver(mainContent) {
    // Deliver Section 1
    const deliverSection1 = document.querySelector('.deliver-section-1');
    if (deliverSection1) {
        ScrollTrigger.matchMedia({
            "(min-width: 769px)": function() {
                const pinWrapper = deliverSection1.querySelector('.pin-wrapper');
                const deliverHeader = deliverSection1.querySelector('.deliver-header-1');
                const longGalleryItems = gsap.utils.toArray('.deliver-long-gallery-item');
                
                let tl1 = gsap.timeline({
                    scrollTrigger: {
                        trigger: deliverSection1, scroller: mainContent, pin: pinWrapper,
                        scrub: 2, start: "top top", end: "+=4000"
                    }
                });

                tl1.fromTo(deliverHeader, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
                   .to(deliverHeader, { y: -50, opacity: 0, ease: 'power1.in' }, 0.5);

                longGalleryItems.forEach((item, index) => {
                    tl1.to(item, { xPercent: (index % 2 === 0 ? -20 : 20), ease: 'none', duration: 1 }, 0);
                });
                tl1.to({}, {}, "+=1");
            }
        });
    }

    // Deliver Section 2
    const deliverSection2 = document.querySelector('.deliver-section-2');
    if (deliverSection2) {
        ScrollTrigger.matchMedia({
            "(min-width: 769px)": function() {
                const pinWrapper = deliverSection2.querySelector('.pin-wrapper');
                const deliverHeader = deliverSection2.querySelector('.deliver-header-2');
                
                let tl2 = gsap.timeline({
                    scrollTrigger: {
                        trigger: deliverSection2, scroller: mainContent, pin: pinWrapper,
                        scrub: 1, start: "top top", end: "+=4000"
                    }
                });

                tl2.fromTo(deliverHeader, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
                   .to(deliverHeader, { y: -50, opacity: 0, ease: 'power1.in' }, 0.5);

                tl2.to('.deliver-gallery .gallery-row-1', { xPercent: -10, ease: 'none', duration: 1 }, 0)
                   .to('.deliver-gallery .gallery-row-2', { xPercent: 10, ease: 'none', duration: 1 }, 0);
                tl2.to({}, {}, "+=1");
            }
        });
    }
}