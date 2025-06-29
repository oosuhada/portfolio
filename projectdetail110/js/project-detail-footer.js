function animateFooter(mainContent) {
    const footerSection = document.querySelector('.footer-section');
    if (footerSection) {
        const footerTimeline = gsap.timeline({
            scrollTrigger: {
                scroller: mainContent,
                trigger: footerSection,
                start: 'top 50%',
                toggleActions: 'play none none reverse',
            },
        });
        footerTimeline
            .from('.footer-section .logo-container h3', { opacity: 0, y: 50, duration: 1, ease: 'power2.out' })
            .from('.nav-circle', { opacity: 0, y: 20, stagger: 0.3, duration: 0.8, ease: 'power2.out' }, '+=0.5')
            .fromTo('.credit', { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, '<0.2')
            .fromTo('.link-ig', { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, '<');
    }
}