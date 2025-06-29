function animateHero(mainContent) {
    // Hero Section Video Parallax
    gsap.to('.hero-section video', {
        scrollTrigger: {
            scroller: mainContent,
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
        yPercent: 20,
        ease: 'none',
    });
}