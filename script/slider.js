document.addEventListener('DOMContentLoaded', function() { 
    // === 0. Define SVG Filter ID === 
    const fixedFilterID = 'classicWetInk'; 
    const inkSpreadFilterID = 'inkSpreadEffectFilter'; 

    const preloaderElement = document.getElementById("preloader"); // The inner preloader text div in main portfolio HTML 
    const loadingTextElement = document.getElementById("loadingText"); // The "Oosu" text inside the inner preloader 

    // === Helper: Screen click ink splash (irregular blob) === 
    function createScreenInkSplash(targetElement, event) { 
        const existingSplash = targetElement.querySelector('.ink-splash'); 
        if (existingSplash) existingSplash.remove(); 

        const internalSplash = document.createElement('span'); 
        internalSplash.classList.add('ink-splash'); 

        const rect = targetElement.getBoundingClientRect(); 
        const splashSize = Math.max(rect.width, rect.height) * 0.02; 
        internalSplash.style.width = `${splashSize}px`; 
        internalSplash.style.height = `${splashSize}px`; 
        internalSplash.style.left = `${event.clientX - rect.left - splashSize / 2}px`; 
        internalSplash.style.top = `${event.clientY - rect.top - splashSize / 2}px`; 

        const borderRadii = [ 
            "47% 53% 50% 40% / 60% 37% 53% 40%", 
            "65% 42% 70% 55% / 70% 68% 46% 51%", 
            "60% 60% 45% 55% / 55% 60% 50% 60%", 
            "59% 58% 65% 62% / 52% 68% 37% 59%", 
            "60% 45% 46% 62% / 95% 62% 62% 58%", 
            "55% 66% 33% 55% / 66% 68% 66% 62%", 
            "54% 61% 67% 63% / 59% 27% 66% 65%", 
            "30% 65% 60% 62% / 60% 39% 60% 68%", 
            "61% 63% 35% 57% / 65% 26% 55% 62%", 
        ]; 
        const randomRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)]; 
        internalSplash.style.borderRadius = randomRadius; 

        const baseShade = Math.floor(Math.random() * 30) + 10; 
        internalSplash.style.backgroundColor = `rgb(${baseShade}, ${baseShade}, ${baseShade})`; 

        internalSplash.classList.add('splash-animate'); 

        targetElement.appendChild(internalSplash); 
        setTimeout(() => { 
            if (internalSplash.parentElement) internalSplash.remove(); 
        }, 700); 
    } 

    // === Helper: External "Ink" Confetti Particles (adding surface texture) === 
    function createExternalInkParticles(originX, originY) { 
        const particleCount = 5; 
        const inkColors = ['#000000', '#181818', '#282828', '#0A0A0A', '#111111', '#202020']; 

        const irregularBorderRadii = [ 
            '45% 58% 62% 37% / 52% 38% 67% 49%', 
            '62% 64% 58% 60% / 70% 50% 70% 50%', 
            '54% 42% 62% 57% / 54% 42% 62% 47%', 
            '62% 68% 60% 56% / 70% 60% 70% 50%', 
            '63% 38% 70% 33% / 53% 62% 39% 46%', 
            '65% 70% 65% 68% / 75% 54% 74% 50%', 
            '48% 56% 35% 38% / 54% 42% 62% 47%', 
            '66% 75% 65% 70% / 66% 55% 66% 60%', 
            '30% 70% 70% 30% / 30% 30% 70% 70%', 
            '50% 50% 30% 70% / 60% 40% 60% 40%', 
            '35% 65% 45% 55% / 60% 30% 70% 40%', 
            '70% 30% 80% 20% / 65% 35% 75% 25%' 
        ]; 

        for (let i = 0; i < particleCount; i++) { 
            const particle = document.createElement('div'); 
            particle.classList.add('confetti-particle'); 
            particle.style.backgroundColor = inkColors[Math.floor(Math.random() * inkColors.length)]; 
            particle.style.filter = 'url(#inkParticleSurface)'; 

            let width, height; 
            const sizeMultiplier = 4; 
            const randomFactor = Math.random(); 

            if (randomFactor < 0.6) { 
                const baseSize = (Math.random() * 10 + 8) * sizeMultiplier; 
                width = baseSize * (0.8 + Math.random() * 0.4); 
                height = baseSize * (0.8 + Math.random() * 0.4); 
            } else { 
                const baseWidth = (Math.random() * 12 + 6) * sizeMultiplier; 
                const baseHeight = (Math.random() * 8 + 4) * sizeMultiplier; 
                width = baseWidth; 
                height = baseHeight; 
            } 

            particle.style.width = `${width}px`; 
            particle.style.height = `${height}px`; 
            particle.style.borderRadius = irregularBorderRadii[Math.floor(Math.random() * irregularBorderRadii.length)]; 

            if (width < 15 && height < 15) { 
                particle.style.opacity = (Math.random() * 0.2 + 0.7).toString(); 
            } 

            document.body.appendChild(particle); 

            const angle = Math.random() * Math.PI * 2; 
            const distance = Math.random() * 60 + 40; 
            const duration = Math.random() * 1.5 + 2.5; 
            const initialRotation = Math.random() * 360; 
            const finalRotation = initialRotation + (Math.random() * 30 - 90); 
            const initialOpacity = parseFloat(particle.style.opacity || '0.6'); 
            const maxBlur = 5 + Math.random() * 5; 

            particle.style.left = `${originX}px`; 
            particle.style.top = `${originY}px`; 
            particle.style.transform = `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`; 

            particle.animate([ 
                { 
                    transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, 
                    opacity: initialOpacity, 
                    filter: 'blur(0.5px)' 
                }, 
                { 
                    transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.05) rotate(${finalRotation}deg)`, 
                    opacity: 0, 
                    filter: `blur(${maxBlur}px)` 
                } 
            ], { 
                duration: duration * 1000, 
                easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)', 
                fill: 'forwards' 
            }); 

            setTimeout(() => { 
                particle.remove(); 
            }, duration * 1000); 
        } 
    } 

    // === Main Balloon Click Effect Handler === 
    function createInkSplashes(clickedElement, event) { 
        createScreenInkSplash(clickedElement, event); 
        createExternalInkParticles(event.clientX, event.clientY); 

        if (window.gsap) { 
            gsap.to(clickedElement, { 
                duration: 2, 
                scale: 1.5, 
                opacity: 0, 
                ease: "power2.out", 
                onComplete: () => clickedElement.remove() 
            }); 
        } else { 
            clickedElement.animate([ 
                { transform: 'scale(1)', opacity: 1 }, 
                { transform: 'scale(1.5)', opacity: 0 } 
            ], { 
                duration: 600, 
                easing: 'ease-out', 
                fill: 'forwards' 
            }).onfinish = () => clickedElement.remove(); 
        } 
    } 

    // === "click me" fast text balloon (No Ink Filter on balloon body) === 
    function createFastTextBalloon(text, minLeft = 20, maxLeft = 80) { 
        const balloon = document.createElement('div'); 
        balloon.className = 'balloon fast-text-balloon'; 
        balloon.textContent = text; 

        const grayShade = Math.floor(Math.random() * 50) + 20; 
        balloon.style.backgroundColor = `rgba(${grayShade}, ${grayShade}, ${grayShade}, 0.85)`; 
        balloon.style.filter = 'none'; 

        balloon.style.display = 'flex'; 
        balloon.style.justifyContent = 'center'; 
        balloon.style.alignItems = 'center'; 
        balloon.style.textAlign = 'center'; 

        document.body.appendChild(balloon); 
        const left = minLeft + Math.random() * (maxLeft - minLeft); 
        balloon.style.left = `${left}vw`; 

        balloon.addEventListener('click', function(e) { 
            this.style.pointerEvents = 'none'; 
            createInkSplashes(this, e); 
        }); 

        const startY = -200; 
        const endY = -window.innerHeight - 100; 
        const duration = 8 + Math.random() * 8; 

        if (window.gsap) { 
            gsap.fromTo(balloon, 
                { y: startY, opacity: 0.6 }, 
                { 
                    y: endY, 
                    opacity: 0.2, 
                    duration: duration, 
                    ease: "power1.inOut", 
                    onComplete: () => balloon.remove() 
                } 
            ); 
        } else { 
            balloon.animate([ 
                { transform: `translateY(${startY}px)`, opacity: 0.6 }, 
                { transform: `translateY(${endY}px)`, opacity: 0.2 } 
            ], { 
                duration: duration * 1000, 
                easing: 'ease-in-out', 
                fill: 'forwards' 
            }).onfinish = () => balloon.remove(); 
        } 
    } 

    // === General balloon effect (Ink Styled body) === 
    function createBalloon() { 
        const balloon = document.createElement('div'); 
        balloon.className = 'balloon'; 
        document.body.appendChild(balloon); 

        const left = 10 + Math.random() * 80; 
        const width = 22 + Math.random() * 32; 
        const height = 30 + Math.random() * 42; 
        const opacity = 0.6 + Math.random() * 0.4; 

        const grayScale = Math.floor(Math.random() * 150) + 50; 
        balloon.style.backgroundColor = `rgb(${grayScale}, ${grayScale}, ${grayScale})`; 

        balloon.style.left = `${left}vw`; 
        balloon.style.width = `${width}px`; 
        balloon.style.height = `${height}px`; 
        balloon.style.opacity = opacity; 

        balloon.addEventListener('click', function(e) { 
            this.style.pointerEvents = 'none'; 
            createInkSplashes(this, e); 
        }); 

        if (window.gsap) { 
            const startY = -100; 
            const duration = 8 + Math.random() * 8; 
            gsap.fromTo(balloon, 
                { y: startY, opacity: opacity + 0.1 }, 
                { 
                    y: -window.innerHeight - Math.random() * 200 - 50, 
                    opacity: 0, 
                    duration: duration, 
                    delay: Math.random() * 0.5, 
                    ease: "power1.inOut", 
                    onComplete: () => balloon.remove() 
                } 
            ); 
        } else { 
            const startY = -100; 
            const endY = -window.innerHeight - Math.random() * 200 - 50; 
            const duration = 8 + Math.random() * 8; 
            balloon.animate([ 
                { transform: `translateY(${startY}px)`, opacity: opacity + 0.1 }, 
                { transform: `translateY(${endY}px)`, opacity: 0 } 
            ], { 
                duration: duration * 1000, 
                delay: Math.random() * 0.5 * 1000, 
                easing: 'ease-in-out', 
                fill: 'forwards' 
            }).onfinish = () => balloon.remove(); 
        } 
    } 

    // === Balloon creation interval === 
    function launchBalloonBatch() { 
        const numToLaunch = Math.floor(Math.random() * 2) + 1; 
        for (let i = 0; i < numToLaunch; i++) { 
            setTimeout(createBalloon, Math.random() * 500); 
        } 
    } 

    // Initialize balloons immediately when main portfolio becomes visible 
    // This function will be called by main.js's onComplete callback 
    window.initializeMainPortfolio = function() { 
        console.log("Main portfolio initialized, starting balloons."); 
        // The inner "preloader" for the Oosu text within the slider HTML 
        // should now be faded out if it was initially visible. 
        if (preloaderElement) { 
            gsap.to(preloaderElement, { 
                opacity: 0, 
                duration: 0.5, 
                ease: "power1.out", 
                onComplete: () => { 
                    if (preloaderElement) preloaderElement.style.display = "none"; 
                } 
            }); 
        } 

        // Now start the balloon animations 
        createFastTextBalloon('click me', 20, 45); 
        setTimeout(() => createFastTextBalloon('click me', 55, 80), 450); 
        setTimeout(launchBalloonBatch, 800); 
        setInterval(launchBalloonBatch, 2200); 
    }; 

    // === 4. Slider Main === 
    const slides = document.querySelectorAll('.slide'); 
    const totalSlides = slides.length; 
    const prevBtn = document.getElementById('prevBtn'); 
    const nextBtn = document.getElementById('nextBtn'); 
    const currentPageEl = document.getElementById('currentPage'); 
    const totalPagesEl = document.getElementById('totalPages'); 
    const pageIndicator = document.querySelector('.page-indicator'); 

    if (slides.length === 0) { 
        console.error("No slides found. Slider functionality will be disabled."); 
        if (prevBtn) prevBtn.style.display = 'none'; 
        if (nextBtn) nextBtn.style.display = 'none'; 
        if (pageIndicator) pageIndicator.style.display = 'none'; 
        return; 
    } 
    if (totalPagesEl) totalPagesEl.textContent = totalSlides; 
    if (currentPageEl) currentPageEl.textContent = 1; 

    let currentSlide = 0; 
    let isTransitioning = false; 
    initializeFirstSlide(); 

    if (prevBtn) prevBtn.addEventListener('click', function() { if (!isTransitioning) showPreviousSlide(); }); 
    if (nextBtn) nextBtn.addEventListener('click', function() { if (!isTransitioning) showNextSlide(); }); 
    document.addEventListener('keydown', function(e) { 
        if (isTransitioning) return; 
        if (e.key === 'ArrowLeft') showPreviousSlide(); 
        else if (e.key === 'ArrowRight') showNextSlide(); 
    }); 

    function initializeFirstSlide() { 
        slides.forEach(slide => { 
            slide.style.visibility = 'hidden'; 
            slide.style.opacity = '0'; 
            slide.classList.remove('active'); 
        }); 
        if (slides.length > 0) { 
            const firstSlide = slides[0]; 
            firstSlide.style.transition = 'none'; 
            firstSlide.style.visibility = 'visible'; 
            firstSlide.style.opacity = '1'; 
            firstSlide.classList.add('active'); 
            firstSlide.offsetHeight; 
            setTimeout(() => { firstSlide.style.transition = ''; }, 50); 
            if (currentPageEl) currentPageEl.textContent = 1; 
        } 
    } 

    function showSlide(index) { 
        if (isTransitioning || slides.length === 0) return; 
        isTransitioning = true; 
        const currentSlideElement = slides[currentSlide]; 
        const nextSlideElement = slides[index]; 
        nextSlideElement.style.visibility = 'visible'; 
        currentSlideElement.style.opacity = '0'; 
        nextSlideElement.style.opacity = '1'; 
        setTimeout(() => { 
            currentSlideElement.style.visibility = 'hidden'; 
            currentSlideElement.classList.remove('active'); 
            nextSlideElement.classList.add('active'); 
            currentSlide = index; 
            if (currentPageEl) currentPageEl.textContent = index + 1; 
            isTransitioning = false; 
            setupWelcomeBannerHover(); 
        }, 600); 
    } 

    function showNextSlide() { if (slides.length === 0) return; const nextIndex = (currentSlide + 1) % totalSlides; showSlide(nextIndex); } 
    function showPreviousSlide() { if (slides.length === 0) return; const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides; showSlide(prevIndex); } 

    let touchStartX = 0; 
    let touchEndX = 0; 
    const sliderElement = document.querySelector('.slider-container'); 
    if (sliderElement) { 
        sliderElement.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true }); 
        sliderElement.addEventListener('touchend', function(e) { 
            if (isTransitioning) return; 
            touchEndX = e.changedTouches[0].screenX; 
            handleSwipe(); 
        }); 
    } 
    function handleSwipe() { 
        const swipeThreshold = 50; 
        if (touchEndX < touchStartX - swipeThreshold) showNextSlide(); 
        else if (touchEndX > touchStartX + swipeThreshold) showPreviousSlide(); 
    } 

    // === [NEW] Slide 1 Title Hover Animation === 
    const slide1Title = document.querySelector('#slide1 .slide-title'); 
    const inkSpreadFilterElement = document.getElementById(inkSpreadFilterID); 

    if (slide1Title && inkSpreadFilterElement) { 
        const feGaussianBlur = inkSpreadFilterElement.querySelector('feGaussianBlur'); 
        const feDisplacementMap = inkSpreadFilterElement.querySelector('feDisplacementMap'); 

        if (feGaussianBlur && feDisplacementMap) { 
            const initialStdDeviation = parseFloat(feGaussianBlur.getAttribute('stdDeviation')) || 1.5; 
            const initialScale = parseFloat(feDisplacementMap.getAttribute('scale')) || 6; 
            const initialTextScale = 1; 

            const hoverStdDeviation = 3; 
            const hoverFilterScale = 1.6; 
            const hoverTextScale = 1.1; 

            const hoverDuration = 1; 
            const unHoverDuration = 0.2; 

            let slide1HoverAnimation; 

            slide1Title.addEventListener('mouseenter', () => { 
                if (slide1HoverAnimation) { 
                    slide1HoverAnimation.kill(); 
                } 

                slide1Title.style.filter = `url(#${inkSpreadFilterID})`; 

                gsap.set(feGaussianBlur, { attr: { stdDeviation: initialStdDeviation } }); 
                gsap.set(feDisplacementMap, { attr: { scale: initialScale } }); 
                gsap.set(slide1Title, { scale: initialTextScale }); 

                slide1HoverAnimation = gsap.timeline(); 
                slide1HoverAnimation.to(feGaussianBlur, { 
                    attr: { stdDeviation: hoverStdDeviation }, 
                    duration: hoverDuration, 
                    ease: "power2.out" 
                }, 0) 
                    .to(feDisplacementMap, { 
                        attr: { scale: hoverFilterScale }, 
                        duration: hoverDuration, 
                        ease: "power2.out" 
                    }, 0) 
                    .to(slide1Title, { 
                        scale: hoverTextScale, 
                        duration: hoverDuration, 
                        ease: "power2.out" 
                    }, 0); 
            }); 

            slide1Title.addEventListener('mouseleave', () => { 
                if (slide1HoverAnimation) { 
                    slide1HoverAnimation.kill(); 
                } 

                slide1HoverAnimation = gsap.timeline({ 
                    onComplete: () => { 
                        slide1Title.style.filter = ''; 
                        gsap.set(feGaussianBlur, { attr: { stdDeviation: initialStdDeviation } }); 
                        gsap.set(feDisplacementMap, { attr: { scale: initialScale } }); 
                        gsap.set(slide1Title, { scale: initialTextScale }); 
                    } 
                }); 

                slide1HoverAnimation.to(feGaussianBlur, { 
                    attr: { stdDeviation: initialStdDeviation }, 
                    duration: unHoverDuration, 
                    ease: "power1.in" 
                }, 0) 
                    .to(feDisplacementMap, { 
                        attr: { scale: initialScale }, 
                        duration: unHoverDuration, 
                        ease: "power1.in" 
                    }, 0) 
                    .to(slide1Title, { 
                        scale: initialTextScale, 
                        duration: unHoverDuration, 
                        ease: "power1.in" 
                    }, 0); 
            }); 
        } else { 
            console.error('Error: Could not find feGaussianBlur or feDisplacementMap within the inkSpreadEffectFilter. Animated hover for slide 1 title will not work as intended.'); 
            slide1Title.addEventListener('mouseenter', () => { 
                slide1Title.style.filter = `url(#${inkSpreadFilterID})`; 
            }); 
            slide1Title.addEventListener('mouseleave', () => { 
                slide1Title.style.filter = ''; 
            }); 
        } 
    } 

    function setupWelcomeBannerHover() { 
        document.querySelectorAll('.welcome-banner').forEach(banner => { 
            const span = banner.querySelector('span'); 
            if (!span && banner.textContent.trim() !== '') { 
                const originalText = banner.getAttribute('data-original-text') || banner.textContent; 
                if (!banner.getAttribute('data-original-text')) banner.setAttribute('data-original-text', originalText); 
                banner.innerHTML = `<span>${originalText}</span>`; 
            } else if (span && !banner.getAttribute('data-original-text')) { 
                banner.setAttribute('data-original-text', span.textContent); 
            } 
            banner.removeEventListener('mouseenter', handleBannerMouseEnter); 
            banner.removeEventListener('mouseleave', handleBannerMouseLeave); 
            banner.addEventListener('mouseenter', handleBannerMouseEnter); 
            banner.addEventListener('mouseleave', handleBannerMouseLeave); 
        }); 
    } 
    function handleBannerMouseEnter() { this.setAttribute('data-hovered', 'true'); } 
    function handleBannerMouseLeave() { this.removeAttribute('data-hovered'); } 
    setupWelcomeBannerHover(); 
    // === Screen-wide click ink splash (excluding balloons) === 
    document.addEventListener('click', function(e) { 
        const isBalloon = e.target.closest('.balloon, .fast-text-balloon'); 
        if (!isBalloon) { 
            createScreenInkSplash(document.body, e); 
        } 
    }); 
});
