document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const mainContent = document.querySelector('main.App');
    const topNavigation = document.querySelector('.top-navigation');

    // Loader logic
    setTimeout(() => {
        loader.classList.add('hidden');
        loader.addEventListener('transitionend', () => {
            loader.remove();
        });
    }, 3000);

    // Initialize Locomotive Scroll
    const scroll = new LocomotiveScroll({
        el: mainContent,
        smooth: true,
        smartphone: { smooth: true },
        tablet: { smooth: true },
    });

    // GSAP ScrollTrigger integration
    gsap.registerPlugin(ScrollTrigger);

    scroll.on('scroll', ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(mainContent, {
        scrollTop(value) {
            return arguments.length
                ? scroll.scrollTo(value, { duration: 0, disableLerp: true })
                : scroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
            return {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            };
        },
        // IMPORTANT: pinType must be set on the ScrollTrigger.scrollerProxy to work correctly with Locomotive Scroll
        pinType: mainContent.style.transform ? 'transform' : 'fixed',
    });

    ScrollTrigger.addEventListener('refresh', () => scroll.update());
    ScrollTrigger.refresh();

    // Main content and top-navigation fade-in
    gsap.fromTo(
        [mainContent, topNavigation],
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, delay: 3.2, ease: 'power2.out', stagger: 0.2 }
    );

    // Parallax effect for cover-head-vid and small-text-load2
    gsap.to('.cover-head-vid', {
        scrollTrigger: {
            scroller: mainContent,
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
        y: '-50vh',
        ease: 'none',
    });

    gsap.to('.small-text-load2', {
        scrollTrigger: {
            scroller: mainContent,
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
        y: '-50vh',
        ease: 'none',
    });

    // Discover Section: Sticky Text and Parallax Header
    const discoverSection = document.querySelector('.discover-section');
    const discoverPinWrapper = document.querySelector('.discover-section .pin-wrapper');
    const discoverContentLeft = document.querySelector('.discover-section .discover-content-left');
    const discoverMainHeader = document.querySelector('.discover-section .discover-main-header');

    if (discoverSection && discoverPinWrapper && discoverContentLeft && discoverMainHeader) {
        ScrollTrigger.create({
            scroller: mainContent,
            trigger: discoverSection, // Trigger the pinning based on the section
            start: 'top top',
            end: 'bottom top',
            pin: discoverPinWrapper, // Pin the wrapper
            pinSpacing: true, // Maintain space for the pinned element
            onEnter: () => gsap.to(discoverContentLeft, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
            onLeaveBack: () => gsap.to(discoverContentLeft, { opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' }),
            onEnterBack: () => gsap.to(discoverContentLeft, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
            onLeave: () => gsap.to(discoverContentLeft, { opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' }),
            // Only pin on non-mobile devices
            matchMedia: {
                "(min-width: 768px)": function() {
                    return { pin: true };
                },
                "(max-width: 767px)": function() {
                    // Disable pinning and reset animations for mobile
                    gsap.set(discoverContentLeft, { opacity: 1, y: 0 }); // Ensure visible on mobile without pin
                    return { pin: false };
                }
            }
        });

        gsap.fromTo(
            discoverMainHeader,
            { yPercent: 0, opacity: 0.5 },
            {
                yPercent: -100,
                opacity: 1,
                ease: 'none',
                scrollTrigger: {
                    scroller: mainContent,
                    trigger: discoverSection, // Trigger based on the section
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    onEnter: () => discoverMainHeader.classList.add('is-inview'),
                    onLeaveBack: () => discoverMainHeader.classList.remove('is-inview'),
                },
            }
        );

        // Initial state for discoverContentLeft is set below under "Initial states for elements"
    }

    // Deliver Section: Sticky Text and Parallax Header
    const deliverSection = document.querySelector('.deliver-section');
    const deliverPinWrapper = document.querySelector('.deliver-section .pin-wrapper');
    const deliverContentLeft = document.querySelector('.deliver-section .deliver-content-left');
    const deliverIntroText = document.querySelector('.deliver-section .deliver-intro-text');
    const deliverMainHeader = document.querySelector('.deliver-section .deliver-main-header');

    if (deliverSection && deliverPinWrapper && deliverContentLeft && deliverIntroText && deliverMainHeader) {
        ScrollTrigger.create({
            scroller: mainContent,
            trigger: deliverSection, // Trigger the pinning based on the section
            start: 'top top',
            end: 'bottom top',
            pin: deliverPinWrapper, // Pin the wrapper
            pinSpacing: true, // Maintain space for the pinned element
            onEnter: () => gsap.to(deliverContentLeft, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
            onLeaveBack: () => gsap.to(deliverContentLeft, { opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' }),
            onEnterBack: () => gsap.to(deliverContentLeft, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
            onLeave: () => gsap.to(deliverContentLeft, { opacity: 0, y: 50, duration: 0.8, ease: 'power2.out' }),
            // Only pin on non-mobile devices
            matchMedia: {
                "(min-width: 768px)": function() {
                    return { pin: true };
                },
                "(max-width: 767px)": function() {
                    // Disable pinning and reset animations for mobile
                    gsap.set(deliverContentLeft, { opacity: 1, y: 0 }); // Ensure visible on mobile without pin
                    return { pin: false };
                }
            }
        });

        gsap.fromTo(
            deliverMainHeader,
            { yPercent: 0, opacity: 0.5 },
            {
                yPercent: -100,
                opacity: 1,
                ease: 'none',
                scrollTrigger: {
                    scroller: mainContent,
                    trigger: deliverSection, // Trigger based on the section
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    onEnter: () => deliverMainHeader.classList.add('is-inview'),
                    onLeaveBack: () => deliverMainHeader.classList.remove('is-inview'),
                },
            }
        );

        // Initial state for deliverContentLeft is set below under "Initial states for elements"
    }

    // Footer section animations: Logo, nav-circles, credit, and link-ig
    const footerLogo = document.querySelector('.footer-section .logo-container h3');
    const prevCircle = document.querySelector('.footer-section .prev-circle');
    const nextCircle = document.querySelector('.footer-section .next-circle');
    const footerCredit = document.querySelector('.footer-section .credit');
    const footerLinkIg = document.querySelector('.footer-section .link-ig');

    if (footerLogo && prevCircle && nextCircle && footerCredit && footerLinkIg) {
        const footerTimeline = gsap.timeline({
            scrollTrigger: {
                scroller: mainContent,
                trigger: '.footer-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        });

        footerTimeline
            .fromTo(
                footerLogo,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
            )
            .fromTo(
                prevCircle,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
                '<0.2'
            )
            .fromTo(
                footerCredit,
                { opacity: 0, x: -50 },
                { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' },
                '<0.2'
            )
            .fromTo(
                nextCircle,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
                '<0.2'
            )
            .fromTo(
                footerLinkIg,
                { opacity: 0, x: 50 },
                { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' },
                '<0.2'
            );
    }

    // Fixed-nomad-market title animation if present
    const fixedTitle = document.querySelector('#fixed-nomad-market');
    if (fixedTitle) {
        gsap.to(fixedTitle, {
            scrollTrigger: {
                scroller: mainContent,
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
            y: '-=100px',
            opacity: 0.5,
            ease: 'none',
        });
    }

    // Initial states for elements
    gsap.set(['.discover-section .discover-main-header', '.deliver-section .deliver-intro-text', '.deliver-section .deliver-main-header'], {
        opacity: 0.5,
    });
    // Ensure sticky elements have their initial states set for proper animation on enter/leave for desktop
    // And visible on mobile by default (controlled by matchMedia in ScrollTrigger.create)
    gsap.set(discoverContentLeft, { opacity: 0, y: 50 });
    gsap.set(deliverContentLeft, { opacity: 0, y: 50 });

    gsap.set(footerLogo, { opacity: 0, y: 50 });
    gsap.set([prevCircle, nextCircle], { opacity: 0, y: 20 });
    gsap.set([footerCredit, footerLinkIg], { opacity: 0, y: 40 });

    // Product image grayscale animation
    document.querySelectorAll('.define-section .prod-img').forEach((img) => {
        img.addEventListener('mouseenter', () => {
            gsap.to(img, { filter: 'grayscale(0%)', duration: 0.5, ease: 'power2.out' });
        });
        img.addEventListener('mouseleave', () => {
            gsap.to(img, { filter: 'grayscale(100%)', duration: 0.5, ease: 'power2.out' });
        });
    });
});