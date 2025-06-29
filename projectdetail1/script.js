document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  const mainContent = document.querySelector('main.App');
  const topNavigation = document.querySelector('.top-navigation');
  const coverHeadVid = document.querySelector('.cover-head-vid');
  const smallTextLoad2 = document.querySelector('.small-text-load2');

  // --- Global GSAP Configuration ---
  gsap.config({ force3D: true, nullTargetWarn: false });

  // Apply force3D and transformStyle globally for elements that will be animated
  gsap.set(".section-main-content, .hero-section video, .deliver-item-inner", { force3D: true, transformStyle: "preserve-3d" });

  // --- Locomotive Scroll & ScrollTrigger Setup ---
  gsap.registerPlugin(ScrollTrigger);

  const scroll = new LocomotiveScroll({
    el: mainContent,
    smooth: true,
    lerp: 0.08,
    multiplier: 0.8,
    firefoxMultiplier: 50,
    touchMultiplier: 2,
    smartphone: { smooth: true, lerp: 0.15 },
    tablet: { smooth: true, lerp: 0.12 },
  });

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
    pinType: mainContent.style.transform ? 'transform' : 'fixed',
  });

  ScrollTrigger.addEventListener('refresh', () => scroll.update());
  ScrollTrigger.refresh();

  // --- Debugging: Conditional ScrollTrigger Markers ---
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  ScrollTrigger.defaults({
    markers: isDev,
    toggleClass: "active"
  });

  // --- 1. Loader Animation: Simple Fade Out ---
  if (loader) {
    console.log('Loader element:', loader); // Debug
    gsap.to(loader, {
      opacity: 0,
      duration: 1,
      delay: 1.5,
      onComplete: () => {
        console.log('Loader removed'); // Debug
        loader.classList.add('hidden');
        loader.remove();
        mainContent.classList.add('visible');
        scroll.update(); // Refresh Locomotive Scroll
      },
      ease: 'power2.out'
    });
    // Fallback to ensure loader is hidden
    setTimeout(() => {
      if (loader) {
        loader.style.display = 'none';
        mainContent.classList.add('visible');
        scroll.update();
      }
    }, 3000); // 3s to cover animation duration
  }

  // --- 2. Initial Page Animations (Main Content, Top Nav, Hero Text) ---
  gsap.set(mainContent, { opacity: 0, visibility: 'hidden' });
  gsap.fromTo(
    [mainContent, topNavigation, coverHeadVid, smallTextLoad2],
    { opacity: 0, y: 50 },
    { opacity: 1, y: 0, visibility: 'visible', duration: 1, delay: 2.5, ease: 'power2.out', stagger: 0.1 }
  );

  // --- Hero Section Video Parallax: Reverted to calmer version ---
  gsap.to('.hero-section video', {
    scrollTrigger: {
      scroller: mainContent,
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
    yPercent: 10,
    ease: 'none',
  });

  // --- 3. Main Header and Section Content Animations ---
  function setupSectionAnimations() {
    // Target all header classes
    const headerClasses = ['.discover-header', '.define-header', '.designmediator-header', '.deliver-header'];
    gsap.utils.toArray(headerClasses.join(',')).forEach(element => {
      const parentSection = element.closest('section');
      const pinWrapper = element.closest('.pin-wrapper');
      if (!parentSection || !pinWrapper) return;

      // Set initial state
      gsap.set(element, { force3D: true, transformStyle: "preserve-3d" });

      // Sticky pause effect with pinning
      ScrollTrigger.create({
        scroller: mainContent,
        trigger: parentSection,
        start: 'top top',
        end: '+=100%', // Pause for a distance equal to viewport height
        pin: pinWrapper,
        pinSpacing: true,
        matchMedia: {
          "(min-width: 768px)": () => ({ pin: true }),
          "(max-width: 767px)": () => ({ pin: false })
        },
        onEnter: () => gsap.to(element, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
        onEnterBack: () => gsap.to(element, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
        onLeave: () => gsap.to(element, { opacity: 0, y: -40, duration: 0.8, ease: 'power2.out' }),
        onLeaveBack: () => gsap.to(element, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out' }),
      });

      // Parallax effect
      gsap.to(element, {
        yPercent: -50,
        ease: 'none',
        scrollTrigger: {
          scroller: mainContent,
          trigger: parentSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // Animate section-main-content (simple fade/slide up)
    gsap.utils.toArray('.section-main-content').forEach(element => {
      gsap.set(element, { opacity: 0, y: 40, force3D: true, transformStyle: "preserve-3d" });

      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          scroller: mainContent,
          trigger: element,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });
    });
  }
  setupSectionAnimations();

  // --- Design Section: Horizontal Scroll Gallery ---
  function createDesignHorizontalScroll() {
    const designSection = document.querySelector('.design-section');
    if (!designSection) return;
    const galleryWrapper = designSection.querySelector('.design-gallery-wrapper');
    const gallery = designSection.querySelector('.design-gallery');
    if (!gallery || !galleryWrapper) return;

    gsap.to(gallery, {
      x: () => -(gallery.scrollWidth - galleryWrapper.offsetWidth),
      ease: "none",
      scrollTrigger: {
        scroller: mainContent,
        trigger: designSection,
        start: "top top",
        end: () => "+=" + (gallery.scrollWidth - galleryWrapper.offsetWidth),
        scrub: true,
        pin: galleryWrapper,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }
  createDesignHorizontalScroll();

  // --- Deliver Section: Staggered Reveal & 3D Tilt Hover ---
  function createDeliverInteractions() {
    gsap.utils.toArray('.deliver-item').forEach(item => {
      gsap.from(item, {
        opacity: 0,
        y: 100,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          scroller: mainContent,
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });

      // 3D Tilt on hover (for non-touch devices)
      if (!('ontouchstart' in window)) {
        const itemInner = item.querySelector('.deliver-item-inner');
        item.addEventListener('mousemove', (e) => {
          const { left, top, width, height } = item.getBoundingClientRect();
          const x = (e.clientX - left) / width - 0.5;
          const y = (e.clientY - top) / height - 0.5;

          gsap.to(itemInner, {
            rotationY: x * 20,
            rotationX: -y * 20,
            transformPerspective: 1000,
            ease: 'power2.out',
            duration: 0.4
          });
        });

        item.addEventListener('mouseleave', () => {
          gsap.to(itemInner, {
            rotationY: 0,
            rotationX: 0,
            ease: 'power2.out',
            duration: 0.6
          });
        });
      }
    });
  }
  createDeliverInteractions();

  // --- Footer Section Animations ---
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
      .fromTo(footerLogo, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
      .fromTo(prevCircle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '<0.2')
      .fromTo(footerCredit, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, '<0.2')
      .fromTo(nextCircle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '<0.2')
      .fromTo(footerLinkIg, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, '<0.2');
  }

  // Initial states for footer elements to prevent flash of unstyled content
  gsap.set(footerLogo, { opacity: 0, y: 50 });
  gsap.set([prevCircle, nextCircle], { opacity: 0, y: 20 });
  gsap.set([footerCredit, footerLinkIg], { opacity: 0, y: 40 });
});