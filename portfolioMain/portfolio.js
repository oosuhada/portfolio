import { projectDetailsHtml, initModalContentInteractions, openModal, closeModal } from './modal.js';

// ===== [0] Preloader Handling Functions =====
function handlePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        console.warn("[DEBUG] Preloader element not found. Skipping preloader handling.");
        document.dispatchEvent(new Event('preloaderHidden'));
        return;
    }

    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.addEventListener('animationend', () => {
            console.log("[DEBUG] Preloader text animation ended.");
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.6s ease-out';
        });
    } else {
        console.warn("[DEBUG] Loading text element not found. Preloader might not fade out as expected.");
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.6s ease-out';
    }

    preloader.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'opacity' && preloader.style.opacity === '0') {
            preloader.style.display = 'none';
            console.log("[DEBUG] Preloader fully hidden after transition.");
            document.dispatchEvent(new Event('preloaderHidden'));
        }
    });

    setTimeout(() => {
        if (preloader.style.display !== 'none') {
            console.warn("[DEBUG] Preloader did not hide via animation/transition. Forcing hide.");
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.6s ease-out';
            setTimeout(() => {
                if (preloader.style.display !== 'none') {
                     preloader.style.display = 'none';
                     console.log("[DEBUG] Preloader forced hidden and preloaderHidden event dispatched.");
                     document.dispatchEvent(new Event('preloaderHidden'));
                }
            }, 700);
        }
    }, 4000);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] DOMContentLoaded: Main script starting.");

    handlePreloader();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = 'none';

    document.addEventListener('preloaderHidden', function() {
        console.log("[DEBUG] Received preloaderHidden event. Starting main content and onboarding logic.");
        if (mainContent) mainContent.style.display = 'block';

        // ===== [1] Variable Declarations =====
        const onboardingCompletedSetting = localStorage.getItem('onboardingCompleted');
        const guideOverlay = document.getElementById('guide-overlay');
        const guideTooltip = document.getElementById('guide-tooltip');
        const guideCloseButton = document.querySelector('.guide-close');

        const urlParams = new URLSearchParams(window.location.search);
        const cameFromIndex = urlParams.get('from') === 'index';

        if (cameFromIndex) {
            console.log("[DEBUG] Detected 'from=index' query parameter.");
            let currentSearch = window.location.search;
            currentSearch = currentSearch.replace(/(\?|&)from=index/, '');
            if (currentSearch.startsWith('&')) {
                currentSearch = '?' + currentSearch.substring(1);
            }
            if (currentSearch === '?') currentSearch = '';

            const newUrl = window.location.pathname + currentSearch;
            history.replaceState(null, '', newUrl);
            console.log("[DEBUG] Cleaned URL, new relative URL:", newUrl);
        }

        if (!guideOverlay || !guideTooltip || !guideCloseButton) {
            console.error("[DEBUG] Essential guide elements (overlay, tooltip, or close button) are missing from the DOM! Onboarding may not work.");
        }
        if (!mainContent) console.warn("[DEBUG] Main content element not found.");

        const names = ["Oosu", "우수", "佑守", "優秀", "憂愁"];
        const scales = [1, 1.1, 1.2, 1.3];
        const scalePercents = [10, 30, 60, 100];
        const profileImgs = [];
        const profileHoverImgs = [];
        for (let i = 1; i <= 23; i++) {
            profileImgs.push(`profile/${i}.png`);
            profileHoverImgs.push(`profile/hover${i}.png`);
        }
        const heroBgClasses = [
            "hero-bg-img-small", "hero-bg-img-medium",
            "hero-bg-img-large", "hero-bg-img-xlarge"
        ];
        const sliderTexts = document.querySelectorAll('.hero-slider .slider-text');
        const sliderDots = document.querySelectorAll('.hero-slider-dots .slider-dot');
        const heroSection = document.getElementById('hero');
        const hoverName = document.querySelector('.hover-name');
        const hoverImg = document.querySelector('.hover-img');
        const gaugeBar = document.querySelector('.gauge-bar');
        const scrollIcon = document.querySelector('.scroll-indicator');
        const projects = Array.from(document.querySelectorAll('.project'));
        const portfolioSection = document.getElementById('portfolio');
        const footer = document.querySelector('footer'); // RECTIFIED: Ensure footer is correctly retrieved

        const mainLogo = document.getElementById('mainLogo');
        if (mainLogo) {
            mainLogo.style.display = 'none';
            mainLogo.style.opacity = '0';
        }

        const projectImageAnchors = Array.from(document.querySelectorAll('.project-image'));

        const projectModal = document.getElementById('projectModal');
        const modalContentBody = document.getElementById('modal-content-body');
        const closeModalButton = document.querySelector('.modal .close-button');

        let nameIndex = 0, scaleIndex = 0, currentSlide = 0;
        let sliderInterval = null, sliderPaused = false;
        let onboardingActive = false, guideIndex = 0;
        let profileImgIndex = 0, profileImgInterval = null;
        let currentActiveProjectIndex = -1;

        const allMarqueeInnerRows = document.querySelectorAll('.marquee-container .marquee-inner');


        projectImageAnchors.forEach((anchor, index) => {
            const img = anchor.querySelector('img');
            if (img && index < 5) {
                img.src = `projects/project${index + 1}-cover.png`;
            }
        });

        // ===== [2] Function Definitions =====
        function setHeroBgClass(bgClass) {
            if (!heroSection) return;
            const allPossibleBgClasses = [
                "hero-bg-default",
                ...names.map((_, i) => `hero-bg-name-${i}`),
                ...Array.from(sliderDots).map((_, i) => `hero-bg-dot-${i}`),
                ...heroBgClasses
            ];
            heroSection.classList.remove(...allPossibleBgClasses);
            if (bgClass) {
                heroSection.classList.add(bgClass);
            }

            if (hoverImg) {
                hoverImg.classList.remove('breathing1', 'breathing2');
                if (isHoveringImg) {
                    hoverImg.classList.add('breathing2');
                } else if (heroBgClasses.includes(bgClass)) {
                    hoverImg.classList.add('breathing1');
                } else {
                    const currentScaleForTransform = scales.length > scaleIndex ? scales[scaleIndex] : (parseFloat(hoverImg.style.getPropertyValue('--img-current-scale')) || 1);
                    hoverImg.style.transform = `scale(${currentScaleForTransform}) rotate(0deg)`;
                }
            }
        }

        function setGauge(percent) { if (gaugeBar) gaugeBar.style.width = `${percent}%`; }

        function setImgScaleCustom(idx) {
            if (hoverImg && scales.length > idx && scalePercents.length > idx) {
                const currentScaleValue = scales[idx];
                hoverImg.style.setProperty('--img-scale', currentScaleValue);
                hoverImg.style.setProperty('--img-current-scale', currentScaleValue);
                hoverImg.style.transform = `scale(${currentScaleValue}) rotate(0deg)`;
                setGauge(scalePercents[idx]);
                if (heroBgClasses[idx] !== undefined) {
                    setHeroBgClass(heroBgClasses[idx]);
                } else {
                    setHeroBgClass(null);
                }
            }
        }

        function resetImgAndGauge() {
            scaleIndex = 0;
            setImgScaleCustom(scaleIndex);
        }

        function showSlide(idx) {
            if (sliderTexts.length === 0 || idx < 0 || idx >= sliderTexts.length || !sliderDots[idx]) return;
            sliderTexts.forEach((el, i) => el.classList.toggle('active', i === idx));
            sliderDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === idx);
            });
            currentSlide = idx;
            if (!onboardingActive) {
                const isImgScaleBgActive = heroBgClasses.some(cls => heroSection && heroSection.classList.contains(cls));
                if (!isImgScaleBgActive) {
                    setHeroBgClass(`hero-bg-dot-${idx}`);
                }
            }
        }

        function startSliderAutoPlay() {
            if (sliderInterval) clearInterval(sliderInterval);
            if (sliderTexts.length === 0) return;
            sliderInterval = setInterval(() => {
                if (!sliderPaused && !onboardingActive) {
                    showSlide((currentSlide + 1) % sliderTexts.length);
                }
            }, 6000);
        }

        // =========== Image Auto-switch (hover/on state) ===========
        function startProfileImgAutoPlay() {
            if (profileImgInterval) clearInterval(profileImgInterval);

            function updateProfileImg(isHover) {
                if (hoverImg) {
                    if (isHover && profileHoverImgs.length > 0 && profileImgIndex < profileHoverImgs.length) {
                        hoverImg.src = profileHoverImgs[profileImgIndex];
                    } else if (profileImgs.length > 0 && profileImgIndex < profileImgs.length) {
                        hoverImg.src = profileImgs[profileImgIndex];
                    }
                }
            }

            updateProfileImg(isHoveringImg);

            profileImgInterval = setInterval(() => {
                profileImgIndex = (profileImgIndex + 1) % profileImgs.length;
                updateProfileImg(isHoveringImg);
            }, 1000);
        }

        let isHoveringImg = false;

        if (hoverImg) {
            hoverImg.addEventListener('mouseenter', () => {
                if (onboardingActive) return;
                isHoveringImg = true;
                startProfileImgAutoPlay();

                hoverImg.classList.remove('breathing1');
                hoverImg.classList.add('breathing2');
                hoverImg.style.transform = '';
            });

            hoverImg.addEventListener('mouseleave', () => {
                if (onboardingActive) return;
                isHoveringImg = false;
                startProfileImgAutoPlay();

                hoverImg.classList.remove('breathing2');
                const currentBgClass = heroBgClasses[scaleIndex];
                if (currentBgClass && heroSection.classList.contains(currentBgClass)) {
                    hoverImg.classList.add('breathing1');
                }
                hoverImg.style.transform = '';
            });
        }

        function hideAllSparkles() {
            ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
                const sp = document.querySelector(sel);
                if (sp) sp.style.display = 'none';
            });
        }

        function showPersistentSparkles() {
            console.log("[DEBUG] showPersistentSparkles called");
            const persistentSparkleTargets = [
                { el: '.hover-name', sparkle: '#sparkle-name' },
                { el: '.slider-dot' + '[data-index="0"]', sparkle: '#sparkle-dot' },
                { el: '.hover-img', sparkle: '#sparkle-img' }
            ];
            persistentSparkleTargets.forEach(target => {
                const mainEl = document.querySelector(target.el);
                const spElement = document.querySelector(target.sparkle);
                if (mainEl && spElement) {
                    spElement.style.display = 'inline-block';
                } else {
                    console.warn(` [DEBUG] Persistent sparkle target missing: mainEl ${target.el} or sparkle ${target.sparkle}`);
                }
            });
        }

        function setUnderline(selector, add, extraPx = 0) {
            document.querySelectorAll('.guide-underline').forEach(el => {
                el.classList.remove('guide-underline');
                el.style.setProperty('--underline-extra', '0px');
            });
            if (add && selector) {
                const el = document.querySelector(selector);
                if (el) {
                    el.classList.add('guide-underline');
                    el.style.setProperty('--underline-extra', extraPx + 'px');
                }
            }
        }

        function getSectionRect(el) {
            if (!el) return { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };
            const rect = el.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY, left: rect.left + window.scrollX,
                bottom: rect.bottom + window.scrollY, right: rect.right + window.scrollX,
                height: rect.height, width: rect.width
            };
        }

        function setProjectActive(activeIndex) {
            console.log(`[DEBUG] setProjectActive called with index: ${activeIndex}`);
            projects.forEach((project, idx) => {
                const projectInfo = project.querySelector('.project-info');
                const pImageAnchor = project.querySelector('.project-image');
                const viewOverlay = project.querySelector('.view-project-overlay'); // Added for direct check
                const isActive = idx === activeIndex;

                project.classList.toggle('active', isActive);
                if (projectInfo) {
                    projectInfo.classList.toggle('active', isActive);
                    console.log(`[DEBUG] Project ${idx+1} projectInfo active: ${isActive}`);
                }
                if (pImageAnchor) {
                    pImageAnchor.classList.toggle('grayscale', !isActive);
                    console.log(`[DEBUG] Project ${idx+1} pImageAnchor grayscale: ${!isActive}`);
                }
                // Verify overlay state (optional, but useful for debugging)
                if (viewOverlay) {
                    console.log(`[DEBUG] Project ${idx+1} viewOverlay opacity: ${viewOverlay.style.opacity}, visibility: ${viewOverlay.style.visibility}`);
                }
            });
        }

        function onScroll() {
            // console.log("[DEBUG] onScroll triggered.");
            if (onboardingActive || !heroSection || !portfolioSection) return;

            const scroll = window.scrollY;
            const windowHeight = window.innerHeight;

            const heroRect = getSectionRect(heroSection);
            // console.log(`[DEBUG] heroRect.bottom: ${heroRect.bottom}`);
            let footerTop = footer ? getSectionRect(footer).top : Infinity;
            // console.log(`[DEBUG] footerTop: ${footerTop}`);

            // --- Logo Visibility Control ---
            const scrollThresholdEnter = heroRect.bottom - (windowHeight * 0.1); // 10% of hero remaining
            const scrollThresholdExit = footerTop - (windowHeight * 0.9); // When 90% of screen is above footer

            if (mainLogo) {
                // console.log(`[DEBUG] Current scroll: ${scroll}, ThresholdEnter: ${scrollThresholdEnter}, ThresholdExit: ${scrollThresholdExit}`);
                if (scroll > scrollThresholdEnter && scroll < scrollThresholdExit) {
                    // console.log("[DEBUG] Showing mainLogo.");
                    mainLogo.style.display = 'flex';
                    setTimeout(() => mainLogo.style.opacity = '1', 10);
                    mainLogo.classList.add('is-fixed');
                } else {
                    // console.log("[DEBUG] Hiding mainLogo.");
                    mainLogo.style.opacity = '0';
                    mainLogo.classList.remove('is-fixed');
                    setTimeout(() => {
                        if (mainLogo.style.opacity === '0') {
                            mainLogo.style.display = 'none';
                        }
                    }, 300);
                }
            }
            // --- End Logo Visibility Control ---

            let newActiveProjectIndex = -1;
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                const rect = getSectionRect(project);
                // console.log(`[DEBUG] Project ${i+1} rect.top: ${rect.top}, rect.bottom: ${rect.bottom}`);
                // Project is active if its center is within the viewport, or a significant part of it.
                // Using windowHeight / 2 as a target line.
                if (scroll + windowHeight / 2 >= rect.top && scroll + windowHeight / 2 < rect.bottom) {
                    newActiveProjectIndex = i;
                    // console.log(`[DEBUG] Project ${i+1} is the new active project.`);
                    break;
                }
            }

            if (newActiveProjectIndex !== currentActiveProjectIndex) {
                console.log(`[DEBUG] Changing active project from ${currentActiveProjectIndex+1} to ${newActiveProjectIndex+1}`);
                setProjectActive(newActiveProjectIndex);
                currentActiveProjectIndex = newActiveProjectIndex;
            }

            // Deactivate all projects if outside project section (e.g., in hero or footer)
            if (newActiveProjectIndex === -1) {
                const inHeroZone = scroll < heroRect.bottom - (windowHeight * 0.2); // If still visually in hero section
                const inFooterZone = footer && (scroll + windowHeight * 0.9 > footerTop); // If 90% of screen covers footer top

                // console.log(`[DEBUG] No project active. In Hero Zone: ${inHeroZone}, In Footer Zone: ${inFooterZone}`);

                if (inHeroZone || inFooterZone) {
                    if (currentActiveProjectIndex !== -1) {
                        console.log(`[DEBUG] Deactivating all projects due to Hero/Footer zone.`);
                        setProjectActive(-1);
                        currentActiveProjectIndex = -1;
                    }
                }
            }
        }

        const guideSteps = [
            {
                msg: "Click 'Oosu'",
                target: '.hover-name',
                sparkle: '#sparkle-name',
                pos: (el) => { return getSectionRect(el) ? { top: getSectionRect(el).top - (guideTooltip?.offsetHeight || 60) - 25, left: getSectionRect(el).left - (guideTooltip?.offsetWidth || 180) - 10 } : { top: 0, left: 0 }; }
            },
            {
                msg: "Click slider dots",
                target: '.slider-dot' + '[data-index="0"]',
                sparkle: '#sparkle-dot',
                pos: (el) => { const r = getSectionRect(el); const tH = guideTooltip?.offsetHeight || 50; const tW = guideTooltip?.offsetWidth || 180; let iT = r.bottom + 15; let iL = r.left + (el.offsetWidth / 2) - tW + 100; if (iL < 10) iL = 10; if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - tW - 10; if (iT < 10) iT = 10; if (iT + tH > window.innerHeight - 10) iT = window.innerHeight - tH - 10; return { top: iT, left: iL }; }
            },
            {
                msg: "Click profile image",
                target: '.hover-img',
                sparkle: '#sparkle-img',
                pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 10; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
            },
            {
                msg: "Click profile image again",
                target: '.hover-img',
                sparkle: '#sparkle-img',
                pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 20; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
            },
            {
                msg: "One more click on image",
                target: '.hover-img',
                sparkle: '#sparkle-img',
                pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
            }
        ];

        function setSparkleDisplay(guideStepIndex) {
            if (!guideSteps) return;
            guideSteps.forEach((step, i) => {
                const spElement = document.querySelector(step.sparkle);
                if (spElement) spElement.style.display = (i === guideStepIndex ? 'inline-block' : 'none');
            });
            if (guideStepIndex < 0 || guideStepIndex >= guideSteps.length) {
                guideSteps.forEach(step => {
                    const spElement = document.querySelector(step.sparkle);
                    if (spElement) spElement.style.display = 'none';
                });
            }
        }

        function showGuideStep(idx) {
            if (!guideSteps || idx < 0 || idx >= guideSteps.length || !guideTooltip) {
                if (guideSteps && idx >= guideSteps.length) clearGuide(false);
                return;
            }
            const step = guideSteps[idx];
            setUnderline(null, false);
            setSparkleDisplay(idx);
            const targetElement = document.querySelector(step.target);
            if (targetElement && step.pos) {
                guideTooltip.style.display = 'block';
                guideTooltip.style.opacity = "0";
                const pos = step.pos(targetElement);
                guideTooltip.style.top = `${pos.top}px`;
                guideTooltip.style.left = `${pos.left}px`;
                guideTooltip.textContent = step.msg;
                guideTooltip.style.opacity = "1";
            } else {
                if (!targetElement) console.error(` [DEBUG] showGuideStep: Target element '${step.target}' not found for tooltip positioning at step ${idx}.`);
                guideTooltip.style.opacity = "0";
                guideTooltip.style.display = 'none';
            }
        }

        function clearGuide(isSkippingOrFinishedEarly = false) {
            console.log(` [DEBUG] clearGuide called. isSkippingOrFinishedEarly: ${isSkippingOrFinishedEarly}`);
            if (guideOverlay) guideOverlay.style.display = "none";
            if (guideCloseButton) guideCloseButton.style.display = "none";
            setUnderline(null, false);
            if (guideSteps) setSparkleDisplay(-1);
            onboardingActive = false;
            guideIndex = 0;
            document.body.classList.remove('no-scroll');

            if (localStorage.getItem('onboardingCompleted') === 'true' || !isSkippingOrFinishedEarly) {
                console.log(" [DEBUG] clearGuide: Showing persistent sparkles.");
                showPersistentSparkles();
            } else {
                console.log(" [DEBUG] clearGuide: Hiding all sparkles.");
                hideAllSparkles();
            }
            if (sliderTexts.length > 0) showSlide(currentSlide);
            scaleIndex = scales.length - 1;
            setImgScaleCustom(scaleIndex);
            startSliderAutoPlay();
            startProfileImgAutoPlay();
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            if (!isSkippingOrFinishedEarly || (isSkippingOrFinishedEarly && localStorage.getItem('onboardingCompleted') !== 'true')) {
                console.log(" [DEBUG] clearGuide: Setting onboardingCompleted to true in localStorage.");
                localStorage.setItem('onboardingCompleted', 'true');
            }
            setTimeout(() => { onScroll(); }, 100);
        }

        function startGuide() {
            console.log(" [DEBUG] startGuide: Attempting to start guide...");
            if (!guideOverlay || !guideTooltip || !guideCloseButton) { return; }
            for (let i = 0; i < guideSteps.length; i++) { if (!document.querySelector(guideSteps[i].target)) return; }
            if (onboardingActive) { return; }
            onboardingActive = true;
            guideIndex = 0;

            guideOverlay.style.display = "block";
            if (guideCloseButton) guideCloseButton.style.display = 'block';
            if (scrollIcon) { scrollIcon.style.opacity = "0"; scrollIcon.style.pointerEvents = "none"; }

            document.body.classList.add('no-scroll');
            window.scrollTo(0, 0);

            resetImgAndGauge();
            if (sliderTexts.length > 0 && sliderTexts[0]) showSlide(0);
            if (sliderInterval) clearInterval(sliderInterval);
            nameIndex = 0;
            if (hoverName) hoverName.textContent = names[nameIndex];
            showGuideStep(guideIndex);
            console.log(" [DEBUG] startGuide: Guide started successfully.");
        }

        // ===== Event Listener Setup (common interactions) =====
        if (hoverName) {
            hoverName.addEventListener('click', () => {
                if (!onboardingActive) {
                    nameIndex = (nameIndex + 1) % names.length;
                    hoverName.textContent = names[nameIndex];
                    setHeroBgClass(`hero-bg-name-${nameIndex}`);
                    const sparkle = document.querySelector('#sparkle-name');
                    if (sparkle) sparkle.style.display = 'none';
                }
            });
        }

        // ===== Image hover/leave events and effect management =====
        if (hoverImg) {
            hoverImg.addEventListener('click', () => {
                if (!onboardingActive) {
                    scaleIndex = (scaleIndex + 1) % scales.length;
                    setImgScaleCustom(scaleIndex);
                    const sparkle = document.querySelector('#sparkle-img');
                    if (sparkle) sparkle.style.display = 'none';
                }
            });

            hoverImg.addEventListener('mouseenter', () => {
                if (onboardingActive) return;
                isHoveringImg = true;
                startProfileImgAutoPlay();

                hoverImg.classList.remove('breathing1');
                hoverImg.classList.add('breathing2');
                hoverImg.style.transform = '';
            });

            hoverImg.addEventListener('mouseleave', () => {
                if (onboardingActive) return;
                isHoveringImg = false;
                startProfileImgAutoPlay();

                hoverImg.classList.remove('breathing2');
                const currentBgClass = heroBgClasses[scaleIndex];
                if (currentBgClass && heroSection.classList.contains(currentBgClass)) {
                    hoverImg.classList.add('breathing1');
                }
                hoverImg.style.transform = '';
            });
        }

        sliderDots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                if (!onboardingActive) {
                    showSlide(idx);
                    sliderPaused = true;
                    if (sliderInterval) clearInterval(sliderInterval);
                    setTimeout(() => { sliderPaused = false; startSliderAutoPlay(); }, 8000);
                    if (idx === 0) { const sparkle = document.querySelector('#sparkle-dot'); if (sparkle) sparkle.style.display = 'none'; }
                }
            });
        });

        if (scrollIcon) {
            scrollIcon.addEventListener('click', () => { const portfolioSection = document.getElementById('portfolio'); if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'smooth' }); });
        }

        projectImageAnchors.forEach(pImageAnchor => {
            const overlay = pImageAnchor.querySelector('.view-project-overlay');
            const parentProject = pImageAnchor.closest('.project');
            if (overlay && parentProject) {
                pImageAnchor.addEventListener('mouseenter', () => { if (parentProject.classList.contains('active')) { overlay.style.backgroundColor = parentProject.dataset.projectColor || 'var(--gray-dark)'; overlay.style.color = '#fff'; } });
                pImageAnchor.addEventListener('mouseleave', () => { overlay.style.backgroundColor = ''; overlay.style.color = ''; });
            }
        });

        if (guideOverlay) {
            guideOverlay.addEventListener('click', (e) => {
                if (!onboardingActive) return;
                if (e.target === guideTooltip || (guideCloseButton && guideCloseButton.contains(e.target))) {
                    return;
                }
                const currentStepConfig = guideSteps[guideIndex];
                if (!currentStepConfig) { clearGuide(false); return; }
                if (guideIndex === 0) { nameIndex = (nameIndex + 1) % names.length; if (hoverName) hoverName.textContent = names[nameIndex]; setHeroBgClass(`hero-bg-name-${nameIndex}`); }
                else if (guideIndex === 1) {
                    if (sliderTexts.length > 1) showSlide(1); else if (sliderTexts.length > 0) showSlide(0);
                }
                else if (guideIndex >= 2 && guideIndex <= 4) { scaleIndex = (scaleIndex + 1) % scales.length; setImgScaleCustom(scaleIndex); }
                guideIndex++;
                if (guideIndex < guideSteps.length) { showGuideStep(guideIndex); }
                else { clearGuide(false); }
            });
        }

        if (guideCloseButton) { guideCloseButton.addEventListener('click', () => { if (onboardingActive) clearGuide(true); }); }
        if (guideTooltip) { guideTooltip.addEventListener('click', (e) => e.stopPropagation()); }

        // ===== Project Modal Logic =====
        projectImageAnchors.forEach(anchor => {
            anchor.addEventListener('click', function (event) {
                event.preventDefault();

                const projectId = this.dataset.projectId;
                if (projectId) {
                    openModal(projectId, this);
                } else {
                    console.warn("Project ID not found for the clicked anchor.");
                }
            });
        });

        if (mainLogo) {
            mainLogo.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Marquee animation setup (Leaving as is, per your request)
        if (allMarqueeInnerRows.length >= 4) {
            allMarqueeInnerRows[0].style.animation = 'marquee-scroll-rtl-fast 25s linear infinite';
            allMarqueeInnerRows[1].style.animation = 'marquee-scroll-ltr-medium 35s linear infinite';
            allMarqueeInnerRows[2].style.animation = 'marquee-scroll-rtl-slow 45s linear infinite';
            allMarqueeInnerRows[3].style.animation = 'marquee-scroll-ltr-v_slow 55s linear infinite';
        } else {
            if (allMarqueeInnerRows.length >= 2) {
                allMarqueeInnerRows[0].style.animation = 'marquee-scroll-rtl-fast 30s linear infinite';
                allMarqueeInnerRows[1].style.animation = 'marquee-scroll-ltr-medium 40s linear infinite';
            }
        }

        // Marquee pause on hover logic (Leaving as is, per your request)
        allMarqueeInnerRows.forEach(inner => {
            const container = inner.closest('.marquee-container');
            if (container) {
                container.addEventListener('mouseenter', () => {
                    inner.classList.add('paused');
                });
                container.addEventListener('mouseleave', () => {
                    inner.classList.remove('paused');
                });
            }
        });


        // ===== [A] Initial Page Setup and Onboarding Decision Logic =====
        console.log(" [DEBUG] Initial localStorage - onboardingCompleted:", onboardingCompletedSetting);
        console.log(" [DEBUG] Came from index.html flag:", cameFromIndex);

        if (heroSection) {
            startProfileImgAutoPlay();
            if (sliderTexts.length > 0 && sliderTexts[0]) showSlide(0);
            else currentSlide = -1;
        }
        setProjectActive(-1); // Ensure no project is active initially
        hideAllSparkles();

        let runFullOnboardingNext = false;
        let showPersistentHintsNext = false;

        if (cameFromIndex) { runFullOnboardingNext = true; localStorage.removeItem('onboardingCompleted'); }
        else if (onboardingCompletedSetting === 'true') {
            showPersistentHintsNext = true;
        }
        else { runFullOnboardingNext = true; }

        if (runFullOnboardingNext) {
            if (document.body) document.body.classList.add('no-scroll');
            setTimeout(() => {
                if (typeof startGuide === 'function') startGuide();
                else console.error(" [DEBUG] startGuide function not found!");
            }, 100);
        } else if (showPersistentHintsNext) {
            if (document.body) document.body.classList.remove('no-scroll');
            showPersistentSparkles();
            scaleIndex = scales.length - 1;
            setImgScaleCustom(scaleIndex);
            startSliderAutoPlay();
        } else {
            if (document.body) document.body.classList.remove('no-scroll');
            scaleIndex = scales.length - 1;
            setImgScaleCustom(scaleIndex);
            startSliderAutoPlay();
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        setTimeout(() => { onScroll(); }, 350); // Initial call to set states correctly

        console.log(" [DEBUG] Main script logic finished after preloader.");
    });
});

console.log("[DEBUG] Main script loaded.");