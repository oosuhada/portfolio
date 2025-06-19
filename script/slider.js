document.addEventListener('DOMContentLoaded', function() {
    // === 0. Define SVG Filter IDs ===
    const fixedFilterID = 'classicWetInk';
    const inkSpreadFilterID = 'inkSpreadEffectFilter';

    // === Slide-specific color palettes ===
    const slideColors = [
        { // Slide 1: Grayscale
            balloon: ['#333333', '#4b4b4b', '#666666', '#808080'],
            confetti: ['#000000', '#181818', '#282828', '#0A0A0A', '#111111', '#202020'],
            fastText: ['#4b4b4b', '#666666', '#808080']
        },
        { // Slide 2: Warm tones
            balloon: ['#ff8c42', '#ffaa6e', '#ffdec2', '#e07b39'],
            confetti: ['#ff8c42', '#ffaa6e', '#e07b39', '#d2691e', '#ffbf80'],
            fastText: ['#ff8c42', '#e07b39', '#d2691e']
        },
        { // Slide 3: Purple-Pink
            balloon: ['#d279ee', '#c45eda', '#f8c390', '#e89cd2'],
            confetti: ['#d279ee', '#c45eda', '#e89cd2', '#b54bc6', '#f8c390'],
            fastText: ['#d279ee', '#c45eda', '#b54bc6']
        },
        { // Slide 4: Pink-Yellow
            balloon: ['#f78fad', '#fdeb82', '#e43970', '#fdd090'],
            confetti: ['#f78fad', '#e43970', '#fdd090', '#db0567', '#c21d54'],
            fastText: ['#f78fad', '#e43970', '#db0567']
        },
        { // Slide 5: Green
            balloon: ['#6de195', '#2c5e1a', '#c4e759', '#4caf50'],
            confetti: ['#6de195', '#4caf50', '#2c5e1a', '#388e3c', '#c4e759'],
            fastText: ['#6de195', '#4caf50', '#388e3c']
        },
        { // Slide 6: Teal-Green
            balloon: ['#41c7af', '#155d47', '#54e38e', '#26a69a'],
            confetti: ['#41c7af', '#26a69a', '#155d47', '#54e38e', '#00796b'],
            fastText: ['#41c7af', '#26a69a', '#00796b']
        },
        { // Slide 7: Blue-Cyan
            balloon: ['#5583ee', '#41d8dd', '#1976d2', '#4fc3f7'],
            confetti: ['#5583ee', '#1976d2', '#41d8dd', '#0288d1', '#4fc3f7'],
            fastText: ['#5583ee', '#41d8dd', '#0288d1']
        },
        { // Slide 8: Light Blue
            balloon: ['#6cacff', '#8debff', '#2196f3', '#4fc3f7'],
            confetti: ['#6cacff', '#2196f3', '#8debff', '#0288d1', '#4fc3f7'],
            fastText: ['#6cacff', '#2196f3', '#0288d1']
        },
        { // Slide 9: Purple
            balloon: ['#a16bfe', '#deb0df', '#7b1fa2', '#ab47bc'],
            confetti: ['#a16bfe', '#7b1fa2', '#deb0df', '#8e24aa', '#ab47bc'],
            fastText: ['#a16bfe', '#7b1fa2', '#8e24aa']
        },
        { // Slide 10: Red-Purple
            balloon: ['#bc3d2f', '#a16bfe', '#d32f2f', '#c2185b', '#ab47bc'],
            confetti: ['#bc3d2f', '#a16bfe', '#d32f2f', '#c2185b', '#ab47bc'],
            fastText: ['#bc3d2f', '#a16bfe', '#c2185b']
        }
    ];

    // === Helper: Update balloon colors ===
    function updateBalloonColors() {
        const balloons = document.querySelectorAll('.balloon:not(.fast-text-balloon)');
        const fastTextBalloons = document.querySelectorAll('.fast-text-balloon');
        const colors = slideColors[currentSlide];

        balloons.forEach(balloon => {
            const newColor = colors.balloon[Math.floor(Math.random() * colors.balloon.length)];
            gsap.to(balloon, {
                backgroundColor: newColor,
                duration: 0.5,
                ease: "power1.out"
            });
            // 풍선 색상 업데이트 시 confetti 색상도 같이 업데이트 (선택 사항)
            balloon.dataset.confettiColors = JSON.stringify(colors.confetti);
            balloon.dataset.slideIndex = currentSlide; // 슬라이드 인덱스도 업데이트
        });

        fastTextBalloons.forEach(balloon => {
            const newColor = colors.fastText[Math.floor(Math.random() * colors.fastText.length)];
            gsap.to(balloon, {
                backgroundColor: newColor,
                duration: 0.5,
                ease: "power1.out"
            });
            // 풍선 색상 업데이트 시 confetti 색상도 같이 업데이트 (선택 사항)
            balloon.dataset.confettiColors = JSON.stringify(colors.confetti);
            balloon.dataset.slideIndex = currentSlide; // 슬라이드 인덱스도 업데이트
        });
    }

    // === Helper: Screen click ink splash ===
    function createScreenInkSplash(targetElement, event, confettiColors = null) { // confettiColors 파라미터 추가
        const existingSplash = targetElement.querySelector('.ink-splash');
        if (existingSplash) existingSplash.remove();

        const internalSplash = document.createElement('span');
        internalSplash.classList.add('ink-splash');

        const rect = targetElement.getBoundingClientRect();
        const splashSize = Math.max(rect.width, rect.height) * 0.02;

        if (targetElement === document.body) {
            internalSplash.style.left = `${event.clientX - splashSize / 2}px`;
            internalSplash.style.top = `${event.clientY - splashSize / 2}px`;
        } else {
            internalSplash.style.left = `${event.clientX - rect.left - splashSize / 2}px`;
            internalSplash.style.top = `${event.clientY - rect.top - splashSize / 2}px`;
        }

        internalSplash.style.width = `${splashSize}px`;
        internalSplash.style.height = `${splashSize}px`;

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

        const colorsToUse = confettiColors || slideColors[currentSlide].confetti;
        const color = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
        internalSplash.style.backgroundColor = color;
        internalSplash.classList.add('splash-animate');
        targetElement.appendChild(internalSplash);

        setTimeout(() => {
            if (internalSplash.parentElement) internalSplash.remove();
        }, 700);
    }

    // === Helper: External "Ink" Confetti Particles ===
    function createExternalInkParticles(originX, originY, confettiColors = null) { // confettiColors 파라미터 추가
        const particleCount = 5;
        const colors = confettiColors || slideColors[currentSlide].confetti;
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
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
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
        // 클릭된 요소에서 confetti 색상 팔레트 정보를 가져옴
        let confettiColorsForSplash = null;
        // dataset.slideIndex를 사용하여 confettiColors를 가져옴
        const slideIndexForConfetti = parseInt(clickedElement.dataset.slideIndex || currentSlide);
        confettiColorsForSplash = slideColors[slideIndexForConfetti].confetti;

        createScreenInkSplash(clickedElement, event, confettiColorsForSplash);
        createExternalInkParticles(event.clientX, event.clientY, confettiColorsForSplash);

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

    // === "click me" fast text balloon ===
    function createFastTextBalloon(text, minLeft = 20, maxLeft = 80) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon fast-text-balloon';
        balloon.textContent = text;

        const color = slideColors[currentSlide].fastText[Math.floor(Math.random() * slideColors[currentSlide].fastText.length)];
        balloon.style.backgroundColor = color;
        balloon.style.filter = 'none';

        balloon.style.display = 'flex';
        balloon.style.justifyContent = 'center';
        balloon.style.alignItems = 'center';
        balloon.style.textAlign = 'center';

        document.body.appendChild(balloon);

        const left = minLeft + Math.random() * (maxLeft - minLeft);
        balloon.style.left = `${left}vw`;

        // !!! 추가: 생성 시 현재 슬라이드의 confetti 색상 팔레트 저장 !!!
        balloon.dataset.confettiColors = JSON.stringify(slideColors[currentSlide].confetti);
        balloon.dataset.slideIndex = currentSlide; // 슬라이드 인덱스 저장

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
                    onComplete: () => {
                        balloon.remove();
                    }
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
            }).onfinish = () => {
                balloon.remove();
            };
        }
    }

    // === General balloon effect ===
    function createBalloon() {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        document.body.appendChild(balloon);

        const left = 10 + Math.random() * 80;
        const width = 22 + Math.random() * 32;
        const height = 30 + Math.random() * 42;
        const color = slideColors[currentSlide].balloon[Math.floor(Math.random() * slideColors[currentSlide].balloon.length)];

        balloon.style.backgroundColor = color;
        balloon.style.left = `${left}vw`;
        balloon.style.width = `${width}px`;
        balloon.style.height = `${height}px`;

        // !!! 추가: 생성 시 현재 슬라이드의 confetti 색상 팔레트 저장 !!!
        balloon.dataset.confettiColors = JSON.stringify(slideColors[currentSlide].confetti);
        balloon.dataset.slideIndex = currentSlide; // 슬라이드 인덱스 저장


        balloon.addEventListener('click', function(e) {
            this.style.pointerEvents = 'none';
            createInkSplashes(this, e);
        });

        if (window.gsap) {
            const startY = -100;
            const duration = 8 + Math.random() * 8;
            gsap.fromTo(balloon,
                { y: startY, opacity: 0.8 },
                {
                    y: -window.innerHeight - Math.random() * 200 - 50,
                    opacity: 0,
                    duration: duration,
                    delay: Math.random() * 0.5,
                    ease: "power1.inOut",
                    onComplete: () => {
                        balloon.remove();
                    }
                }
            );
        } else {
            const startY = -100;
            const endY = -window.innerHeight - Math.random() * 200 - 50;
            const duration = 8 + Math.random() * 8;
            balloon.animate([
                { transform: `translateY(${startY}px)`, opacity: 0.8 },
                { transform: `translateY(${endY}px)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                delay: Math.random() * 0.5 * 1000,
                easing: 'ease-in-out',
                fill: 'forwards'
            }).onfinish = () => {
                balloon.remove();
            };
        }
    }

    // === Balloon creation interval ===
    let balloonInterval = null;
    let isTabActive = true;
    let pendingTimeouts = [];

    function launchBalloonBatch() {
        const numToLaunch = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numToLaunch; i++) {
            const timeoutId = setTimeout(createBalloon, Math.random() * 500);
            pendingTimeouts.push(timeoutId);
        }
    }

    // Expose startBalloonInterval and stopBalloonInterval globally
    window.startBalloonInterval = function() {
        if (!balloonInterval) {
            balloonInterval = setInterval(launchBalloonBatch, 2200);
            console.log("Balloon interval started.");
        }
    };

    window.stopBalloonInterval = function() {
        if (balloonInterval) {
            clearInterval(balloonInterval);
            balloonInterval = null;
            pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
            pendingTimeouts = [];
            console.log("Balloon interval stopped and pending timeouts cleared.");
        }
        // Remove any existing balloons immediately
        document.querySelectorAll('.balloon, .fast-text-balloon').forEach(b => b.remove());
    };

    // Handle tab visibility
    document.addEventListener('visibilitychange', () => {
        isTabActive = document.visibilityState === 'visible';
        if (isTabActive) {
            window.startBalloonInterval();
        } else {
            window.stopBalloonInterval();
        }
    });

   // MODIFIED: initializeMainPortfolio for initial load
window.initializeMainPortfolio = function() {
    const preloaderElement = document.getElementById("preloader");
    const mainPortfolio = document.getElementById('mainPortfolio');
    const controls = document.getElementById('controls');
    const inboxIconContainer = document.getElementById('inboxIconContainer'); // Get the inbox icon

    console.log("initializeMainPortfolio called on load."); // Debugging

    if (preloaderElement) {
        gsap.set(preloaderElement, { opacity: 0, display: "none" }); // Ensure greeting is hidden
    }
    
    // Ensure main portfolio is visible on initial load
    gsap.set(mainPortfolio, { opacity: 1, display: 'block' });
    
    // Ensure controls are hidden on initial load
    gsap.set(controls, { opacity: 0, display: 'none' });

    // Ensure Lottie inbox icon is visible on initial load
    if (inboxIconContainer) {
        gsap.set(inboxIconContainer, { opacity: 1, display: 'block' });
    }

    createFastTextBalloon('click me', 20, 45);
    setTimeout(() => createFastTextBalloon('click me', 55, 80), 450);
    setTimeout(launchBalloonBatch, 800);
    window.startBalloonInterval(); // Start balloons on initial load of main portfolio

    // 나머지 슬라이더 초기화 (버튼 표시 등)는 initializeSlider에서 처리
    window.initializeSlider();

        // Ensure main portfolio is visible and greeting is hidden on initial load
        document.getElementById('mainPortfolio').style.display = 'block';
        document.getElementById('preloaderContainer').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
    };

    // === Slider Main ===
    // ---
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const pageIndicator = document.querySelector('.page-indicator');

    let currentSlide = 0;
    let isTransitioning = false;

    if (slides.length === 0) {
        console.error("No slides found. Slider functionality disabled.");
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (pageIndicator) pageIndicator.style.display = 'none';
        return;
    }

    if (totalPagesEl) totalPagesEl.textContent = totalSlides;
    if (currentPageEl) currentPageEl.textContent = 1;

    if (prevBtn) prevBtn.addEventListener('click', function() { if (!isTransitioning) showPreviousSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { if (!isTransitioning) showNextSlide(); });

    document.addEventListener('keydown', function(e) {
        if (isTransitioning) return;
        if (e.key === 'ArrowLeft') { showPreviousSlide(); }
        else if (e.key === 'ArrowRight') { showNextSlide(); }
    });

    window.initializeSlider = function() {
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

        if (prevBtn) {
            gsap.to(prevBtn, { opacity: 1, duration: 0.5, ease: "power1.out", display: 'flex' });
        }
        if (nextBtn) {
            gsap.to(nextBtn, { opacity: 1, duration: 0.5, ease: "power1.out", display: 'flex' });
        }
        if (pageIndicator) {
            gsap.to(pageIndicator, { opacity: 1, duration: 0.5, ease: "power1.out", display: 'flex' });
        }
        setupWelcomeBannerHover();
    };

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

    // ---
    // === Slide 1 Title Hover Animation ===
    // ---
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

    // ---
    // === 전역 클릭 리스너 (잉크 스플래시 생성) ===
    // ---
    document.addEventListener('click', function(e) {
        const isInteractiveElement = e.target.closest('.balloon, .fast-text-balloon, .slide-title, .nav-button, .welcome-banner-link, #inboxIconContainer'); // Added inboxIconContainer
        if (!isInteractiveElement) {
            // 전역 클릭 시에는 현재 슬라이드의 confetti 색상 사용
            createScreenInkSplash(document.body, e, slideColors[currentSlide].confetti);
        }
    });

    // ---
    // =======================================================
    // === 슬라이드 타이틀 클릭 (mousedown/mouseup) 인터랙션 로직 ===
    // =======================================================
    // ---
    let inkInterval;
    let isMouseDownOnTitle = false;
    let currentMousedownEvent = null;
    let currentMousedownConfettiColors = null; // mousedown 시 confetti 색상 저장

    const originalBalloonOpacities = new Map();
    const originalWelcomeBannerOpacities = new Map();

    document.querySelectorAll('.slide-title').forEach((title) => {
        title.addEventListener('mousedown', (e) => {
            if (e.button === 2) return; // 마우스 우클릭은 무시

            console.log("Slide title mousedown: Activating ink burst mode.");
            isMouseDownOnTitle = true;
            currentMousedownEvent = e;
            // mousedown 시 현재 슬라이드의 confetti 색상을 저장
            currentMousedownConfettiColors = slideColors[currentSlide].confetti;

            const slide = title.closest('.slide');
            if (slide) {
                // Changed: Animate 'background' property instead of 'backgroundColor'
                slide.classList.add('ink-mode-active'); // 클래스로 상태 표시
                gsap.to(slide, {
                    background: '#000000', // Animating 'background' shorthand
                    duration: 0.3,
                    ease: "power2.out"
                });
            }

            gsap.to('.nav-button', { opacity: 0, duration: 0.3, pointerEvents: 'none' });
            gsap.to('.page-indicator', { opacity: 0, duration: 0.3 });

            document.querySelectorAll('.welcome-banner').forEach(banner => {
                const currentOpacity = getComputedStyle(banner).opacity;
                originalWelcomeBannerOpacities.set(banner, currentOpacity);
                gsap.to(banner, { opacity: 0.1, duration: 0.3 }); // welcome-banner 투명도 조절
            });

            document.querySelectorAll('.balloon').forEach(balloon => { // 일반 풍선
                const currentOpacity = getComputedStyle(balloon).opacity;
                originalBalloonOpacities.set(balloon, currentOpacity);
                gsap.to(balloon, { opacity: 0.05, duration: 0.3 }); // 일반 풍선 투명도 조절
            });

            document.querySelectorAll('.fast-text-balloon').forEach(balloon => { // fast-text 풍선
                const currentOpacity = getComputedStyle(balloon).opacity;
                originalBalloonOpacities.set(balloon, currentOpacity);
                gsap.to(balloon, { opacity: 0.05, duration: 0.3 }); // fast-text 풍선 투명도 조절
            });


            clearInterval(inkInterval);
            inkInterval = setInterval(() => {
                if (currentMousedownEvent) {
                    // mousedown 시 저장된 confetti 색상을 사용하여 스플래시 생성
                    createScreenInkSplash(document.body, currentMousedownEvent, currentMousedownConfettiColors);
                    createExternalInkParticles(currentMousedownEvent.clientX, currentMousedownEvent.clientY, currentMousedownConfettiColors);
                }
            }, 100);
        });

        // !!! 수정: 슬라이드 타이틀 위에서 mouseup 시에도 resetInkBurstMode 호출 !!!
        title.addEventListener('mouseup', (e) => {
            if (e.button === 2) return;
            // isMouseDownOnTitle이 true인 경우에만 reset, 다른 요소 위에서 뗀 경우도 여기서 처리
            if (isMouseDownOnTitle) { // 이 조건만으로 충분합니다.
                console.log("Slide title mouseup: Deactivating ink burst mode.");
                resetInkBurstMode();
            }
        });
    });

    // !!! 추가: mousemove 이벤트 리스너
    document.addEventListener('mousemove', (e) => {
        if (isMouseDownOnTitle) {
            currentMousedownEvent = e; // 마우스가 움직일 때마다 현재 이벤트 객체 업데이트
        }
    });


    // !!! 수정: document 전체의 mouseup 리스너 조건 변경 (slide-title 자체 위에서 떼는 경우를 포함하기 위해)
    document.addEventListener('mouseup', (e) => {
        // isMouseDownOnTitle이 true이고, 현재 마우스업 위치가 슬라이드 타이틀 외부일 경우에만 처리.
        // 슬라이드 타이틀 위에서 떼는 경우는 위 title.addEventListener('mouseup')에서 처리
        if (isMouseDownOnTitle && !e.target.closest('.slide-title') && e.button !== 2) {
            console.log("Document-level mouseup fallback: Deactivating ink burst mode (outside title).");
            resetInkBurstMode();
        }
    });

    function resetInkBurstMode() {
        isMouseDownOnTitle = false;
        currentMousedownEvent = null;
        currentMousedownConfettiColors = null; // 초기화

        if (inkInterval) {
            clearInterval(inkInterval);
            inkInterval = null;
        }

        document.querySelectorAll('.slide.ink-mode-active').forEach(slide => {
            slide.classList.remove('ink-mode-active');
            gsap.to(slide, {
                background: '', // Revert to original CSS background
                duration: 0.5,
                ease: "power2.out"
            });
        });

        gsap.to('.nav-button', { opacity: 1, duration: 0.5, pointerEvents: 'auto' });
        gsap.to('.page-indicator', { opacity: 1, duration: 0.5 });

        // welcome-banner opacity 복원
        originalWelcomeBannerOpacities.forEach((originalOpacity, banner) => {
            gsap.to(banner, { opacity: originalOpacity, duration: 0.5 });
        });
        originalWelcomeBannerOpacities.clear();

        // balloon opacity 복원
        originalBalloonOpacities.forEach((originalOpacity, balloon) => {
            gsap.to(balloon, { opacity: originalOpacity, duration: 0.5 });
        });
        originalBalloonOpacities.clear();
    }

    // Call initializeMainPortfolio directly on DOMContentLoaded to start with the slider
    window.initializeSlider();
    window.initializeMainPortfolio();
});