document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroBg = document.querySelector('.hero-winery-bg');
    const heroSection = document.querySelector('.hero-section-winery');
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    const heroVideo = document.getElementById('heroVideo');
    const navHeader = document.querySelector('.nav-header');
    const contentWrapper = document.querySelector('.experience-content-wrapper');
    let grapeImgElement = document.getElementById('central-timeline-image');
    const grapeTexts = document.querySelectorAll('#fixed-vine-gauge-container #vineStageList > div');
    const workExpHeaderFullEl_refactored = document.getElementById('work-exp-header-refactored');
    const eduHeaderContainerEl_refactored = document.getElementById('edu-header-refactored');
    const fixedVineGaugeContainer = document.getElementById('fixed-vine-gauge-container');
    const fixedGrapeImageContainer = document.querySelector('.fixed-image-container');
    const grapeFooterQuoteSection = document.querySelector('.grape-footer-quote');

    // State Variables
    let zoomState = 'zoomOut';
    let vineAnimationCurrentlyPlaying = false;
    let ignoreIntersection = false;
    let autoScrollLock = false;
    let autoScrollTimeoutId = null;
    let hasInitialHeroAnimationPlayed = false;
    let userInteractedDuringAnimation = false;
    let isAutoScrollingToWorkExp = false;
    let isContentAreaActive = false;
    let isHeroAreaDominant = true;
    let isFooterAreaDominant = false;

    // Constants
    const heroBgCSSTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';
    const HERO_ZOOM_SCALE_FACTOR = 1.2;

    const stageMapping = [
        { name: "Intro", visualTextIndex: 0, rowKey: null, imgRange: [25, 25], isHeader: false, isIntro: true },
        { name: "WorkExpHeader", visualTextIndex: -1, rowKey: "work-exp-header-refactored", imgRange: [25, 25], isHeader: true },
        { name: "Ripening", visualTextIndex: 1, rowKey: "work-card-0", imgRange: [23, 24], isHeader: false },
        { name: "Fruit Set", visualTextIndex: 2, rowKey: "work-card-1", imgRange: [21, 22], isHeader: false },
        { name: "Vine Flowering", visualTextIndex: 3, rowKey: "work-card-2", imgRange: [18, 20], isHeader: false },
        { name: "Education Intro", visualTextIndex: -1, rowKey: "edu-header-refactored", imgRange: [17, 17], isHeader: true },
        { name: "Keep Growing", visualTextIndex: 4, rowKey: "edu-card-0", imgRange: [12, 17], isHeader: false },
        { name: "Bud break", visualTextIndex: 5, rowKey: "edu-card-1", imgRange: [5, 11], isHeader: false },
        { name: "Plant rootstock", visualTextIndex: 6, rowKey: "edu-card-2", imgRange: [1, 4], isHeader: false }
    ];

    stageMapping.forEach(s => {
        s.row = null;
    });

    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");

    let plantRootstockStageActive = false, hasScrolledToFooterAfterPlantRootstock = false;
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');
    let footerZoomedIn = false;

    // Global state for active stages and hover effects
    let _globalActiveStageIndex = -1;
    let _hoveredStageIndex = -1;
    let _activeImageLoopIntervalId = null;

    function showScrollDownButton() {
        if (scrollDownBtn) {
            scrollDownBtn.style.opacity = '1';
            scrollDownBtn.style.visibility = 'visible';
            scrollDownBtn.style.pointerEvents = 'auto';
        }
    }

    function hideScrollDownButton() {
        if (scrollDownBtn) {
            scrollDownBtn.style.opacity = '0';
            scrollDownBtn.style.visibility = 'hidden';
            scrollDownBtn.style.pointerEvents = 'none';
        }
    }

    function initialHeroSetup() {
        if (!heroBg || hasInitialHeroAnimationPlayed) {
            if (!heroVideo && !hasInitialHeroAnimationPlayed && heroBg) {
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
                zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton();
                hasInitialHeroAnimationPlayed = true;
            }
            return;
        }
        const onVideoReady = () => {
            if (!hasInitialHeroAnimationPlayed) {
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
                zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton();
                hasInitialHeroAnimationPlayed = true;
            }
        };
        if (heroVideo) {
            if (heroVideo.readyState >= 3) {
                onVideoReady();
            } else {
                heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
                heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
                heroVideo.addEventListener('error', () => {
                    onVideoReady();
                }, { once: true });
            }
        } else {
            if (heroBg && !hasInitialHeroAnimationPlayed) {
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
                zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton();
                hasInitialHeroAnimationPlayed = true;
            }
        }
    }

    function heroZoomIn() {
        if (heroBg && zoomState === 'zoomOut') {
            heroBg.style.transition = heroBgCSSTransition;
            heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
            zoomState = 'zoomIn';
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
        }
    }

    function heroZoomOut() {
        if (heroBg && zoomState === 'zoomIn') {
            heroBg.style.transition = heroBgCSSTransition;
            heroBg.style.transform = 'scale(1)';
            zoomState = 'zoomOut';
            hideScrollDownButton();
            if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
        }
    }

    function triggerHeroToWorkExpSequence() {
        if (isAutoScrollingToWorkExp || zoomState === 'zoomOut') return;
        isAutoScrollingToWorkExp = true;
        heroZoomOut();
        const targetStage = stageMapping[workExpHeaderStageIdx];
        if (targetStage && targetStage.row) {
            userInteractedDuringAnimation = false;
            activateStage(workExpHeaderStageIdx, false, true);
            // Show fixed elements immediately
            if (fixedVineGaugeContainer) fixedVineGaugeContainer.classList.add('visible');
            if (fixedGrapeImageContainer) fixedGrapeImageContainer.classList.add('visible');
            playVineLoadAnimationThenActivateFirstStage(() => {
                activateStage(workExpHeaderStageIdx, true, true);
                isAutoScrollingToWorkExp = false;
            });
        } else {
            // Fallback: Scroll to work-experience-section-refactored
            const workExpSection = document.getElementById('work-experience-section-refactored');
            if (workExpSection && window.smoothScrollToElement) {
                window.smoothScrollToElement(workExpSection, 'center');
                if (fixedVineGaugeContainer) fixedVineGaugeContainer.classList.add('visible');
                if (fixedGrapeImageContainer) fixedGrapeImageContainer.classList.add('visible');
                activateStage(workExpHeaderStageIdx, true, true);
            }
            isAutoScrollingToWorkExp = false;
        }
    }

    if (heroSection) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasInitialHeroAnimationPlayed && zoomState === 'zoomOut' && !isAutoScrollingToWorkExp) {
                    heroZoomIn();
                }
            });
        }, { threshold: 0.1 });
        obs.observe(heroSection);
    }

    if (heroBg) {
        hideScrollDownButton();
        initialHeroSetup();
    }

    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAutoScrollingToWorkExp) triggerHeroToWorkExpSequence();
        });
    }

    function tempScrollListenerDuringAnimation() {
        userInteractedDuringAnimation = true;
        window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
    }

    let lastScrollYGlobal = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (navHeader) {
            if (currentScrollY > lastScrollYGlobal && currentScrollY > 100 && zoomState === 'zoomOut' && !navHeader.classList.contains('experience-header-hidden-override')) {
                navHeader.style.opacity = '0';
                navHeader.style.visibility = 'hidden';
                navHeader.style.transform = 'translateY(-100%)';
            } else if ((currentScrollY < lastScrollYGlobal || currentScrollY <= 50) && !navHeader.classList.contains('experience-header-hidden-override')) {
                navHeader.style.opacity = '1';
                navHeader.style.visibility = 'visible';
                navHeader.style.transform = 'translateY(0)';
            }
        }
        lastScrollYGlobal = currentScrollY <= 0 ? 0 : currentScrollY;

        const lastEduStage = stageMapping.find(s => s.name === "Plant rootstock");
        if (plantRootstockStageActive && lastEduStage && lastEduStage.row && !hasScrolledToFooterAfterPlantRootstock && zoomState !== 'zoomIn' && footerImgEl) {
            const lastEduRowRect = lastEduStage.row.getBoundingClientRect();
            const vpHeight = window.innerHeight;
            if (lastEduRowRect.bottom < vpHeight * 0.25 && window.scrollY > (lastEduStage.row.offsetTop + lastEduStage.row.offsetHeight / 2 - vpHeight * 0.25)) {
                const footerRect = footerImgEl.getBoundingClientRect();
                if (footerRect.top > vpHeight * 0.4 && !footerZoomedIn) {
                    scrollFooterImgToCenter();
                    hasScrolledToFooterAfterPlantRootstock = true;
                }
            }
        }
        updateFixedElementsDisplay();
    }, { passive: true });

    function updateFixedElementsDisplay() {
        const showFixedElements = isContentAreaActive && !isHeroAreaDominant && !isFooterAreaDominant;

        if (fixedVineGaugeContainer) {
            if (showFixedElements && (_globalActiveStageIndex !== -1 || _hoveredStageIndex !== -1)) {
                fixedVineGaugeContainer.classList.add('visible');
            } else {
                fixedVineGaugeContainer.classList.remove('visible');
            }
        }
        if (fixedGrapeImageContainer) {
            if (showFixedElements && (_globalActiveStageIndex !== -1 || _hoveredStageIndex !== -1)) {
                fixedGrapeImageContainer.classList.add('visible');
            } else {
                fixedGrapeImageContainer.classList.remove('visible');
            }
        }
    }

    if (heroSection) {
        const heroVisibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isHeroAreaDominant = entry.isIntersecting;
            });
            updateFixedElementsDisplay();
        }, { threshold: 0.01 });
        heroVisibilityObserver.observe(heroSection);
    }

    if (contentWrapper) {
        const contentVisibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isContentAreaActive = entry.isIntersecting;
                if (entry.isIntersecting && heroSection) {
                    const heroRect = heroSection.getBoundingClientRect();
                    if (zoomState === 'zoomIn' && heroRect.bottom < (window.innerHeight * 0.7) && !vineAnimationCurrentlyPlaying && !isAutoScrollingToWorkExp) {
                        triggerHeroToWorkExpSequence();
                    }
                }
            });
            updateFixedElementsDisplay();
        }, { threshold: 0.01 });
        contentVisibilityObserver.observe(contentWrapper);
    }

    if (grapeFooterQuoteSection) {
        const footerVisibilityObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isFooterAreaDominant = entry.isIntersecting;
                if (entry.isIntersecting) {
                    footerZoomedIn = false; // Reset zoom state on each visit
                }
            });
            updateFixedElementsDisplay();
        }, { threshold: 0.01 });
        footerVisibilityObserver.observe(grapeFooterQuoteSection);
    }

    function setGrapeImage(num) {
        if (grapeImgElement) {
            grapeImgElement.src = `images/${num}.png`;
            grapeImgElement.style.opacity = '0.85';
        }
    }

    function stopAllImageLoops() {
        if (_activeImageLoopIntervalId) {
            clearInterval(_activeImageLoopIntervalId);
            _activeImageLoopIntervalId = null;
        }
    }

    function playVineLoadAnimationThenActivateFirstStage(cb) {
        vineAnimationCurrentlyPlaying = true;
        ignoreIntersection = true;
        userInteractedDuringAnimation = false;
        window.addEventListener('scroll', tempScrollListenerDuringAnimation, { once: true });
        stopAllImageLoops();
        let currentVineImgIdx = 1;
        function showNext() {
            if (currentVineImgIdx <= 25) {
                setGrapeImage(currentVineImgIdx++);
                setTimeout(showNext, 70);
            } else {
                vineAnimationCurrentlyPlaying = false;
                window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
                if (typeof cb === 'function') cb();
            }
        }
        showNext();
    }

    function setActiveStageVisuals(stageIndex, isHoverEffect) {
        stopAllImageLoops();

        const displayStageIndex = (isHoverEffect && stageIndex !== -1) ? stageIndex : _globalActiveStageIndex;

        if (displayStageIndex < 0 || displayStageIndex >= stageMapping.length) {
            grapeTexts.forEach(el => el.classList.remove('active'));
            if (grapeImgElement) grapeImgElement.style.opacity = '0';
            updateFixedElementsDisplay();
            return;
        }

        const stageToDisplay = stageMapping[displayStageIndex];
        if (!stageToDisplay) return;

        if (grapeImgElement) grapeImgElement.style.opacity = '0.85';

        grapeTexts.forEach((textEl) => {
            textEl.classList.remove('active');
        });
        if (stageToDisplay.visualTextIndex !== -1 && grapeTexts[stageToDisplay.visualTextIndex]) {
            grapeTexts[stageToDisplay.visualTextIndex].classList.add('active');
            if (fixedVineGaugeContainer && fixedVineGaugeContainer.classList.contains('visible') && fixedVineGaugeContainer.scrollHeight > fixedVineGaugeContainer.clientHeight) {
                grapeTexts[stageToDisplay.visualTextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }

        if (grapeImgElement && stageToDisplay.imgRange) {
            const [start, end] = stageToDisplay.imgRange;
            let imagesInLoop = [];

            if (stageToDisplay.name === "Intro") {
                imagesInLoop.push(stageToDisplay.imgRange[0] || 25);
            } else if (stageToDisplay.name === "Ripening" || stageToDisplay.name === "Fruit Set") {
                imagesInLoop.push(end, start);
            } else if (["Vine Flowering", "Keep Growing", "Bud break", "Plant rootstock"].includes(stageToDisplay.name)) {
                for (let i = end; i >= start; i--) imagesInLoop.push(i);
            } else if (stageToDisplay.isHeader) {
                imagesInLoop.push(stageToDisplay.imgRange[0] || 25);
            } else {
                imagesInLoop.push(start);
            }

            if (imagesInLoop.length === 0 && stageToDisplay.imgRange && stageToDisplay.imgRange.length > 0) {
                imagesInLoop.push(stageToDisplay.imgRange[0]);
            } else if (imagesInLoop.length === 0) {
                imagesInLoop.push(1);
            }

            let currentImgIdx = 0;
            setGrapeImage(imagesInLoop[currentImgIdx]);

            if (imagesInLoop.length > 1) {
                _activeImageLoopIntervalId = setInterval(() => {
                    currentImgIdx = (currentImgIdx + 1) % imagesInLoop.length;
                    setGrapeImage(imagesInLoop[currentImgIdx]);
                }, 1000);
            }
        }

        if (!isHoverEffect && stageIndex === _globalActiveStageIndex) {
            document.querySelectorAll('.masonry-card.active-stage-highlight').forEach(card => card.classList.remove('active-stage-highlight'));
            document.querySelectorAll('.timeline-entry.active-timeline-item').forEach(entry => entry.classList.remove('active-timeline-item'));
            if (stageToDisplay.row) {
                const parentEntry = stageToDisplay.row.closest('.timeline-entry');
                if (parentEntry) parentEntry.classList.add('active-timeline-item');
                if (!stageToDisplay.isHeader && stageToDisplay.row.classList.contains('masonry-card')) {
                    stageToDisplay.row.classList.add('active-stage-highlight');
                }
            }
        }
        updateFixedElementsDisplay();
    }

    function activateStage(idx, autoScrollToStage = false, isInitialHeroTransition = false) {
        if (idx < 0 || idx >= stageMapping.length || !stageMapping[idx]) {
            if (_globalActiveStageIndex !== -1) {
                _globalActiveStageIndex = -1;
                if (_hoveredStageIndex === -1) {
                    setActiveStageVisuals(-1, false);
                }
            }
            return;
        }

        _globalActiveStageIndex = idx;
        const currentStageDetails = stageMapping[_globalActiveStageIndex];

        plantRootstockStageActive = (currentStageDetails.name === "Plant rootstock");
        if (!plantRootstockStageActive && hasScrolledToFooterAfterPlantRootstock) {
            hasScrolledToFooterAfterPlantRootstock = false;
        }

        if (zoomState === 'zoomIn' && !currentStageDetails.isIntro && !isInitialHeroTransition) {
            heroZoomOut();
        }

        if (_hoveredStageIndex === -1) {
            setActiveStageVisuals(_globalActiveStageIndex, false);
        } else {
            document.querySelectorAll('.masonry-card.active-stage-highlight').forEach(card => card.classList.remove('active-stage-highlight'));
            document.querySelectorAll('.timeline-entry.active-timeline-item').forEach(entry => entry.classList.remove('active-timeline-item'));
            if (currentStageDetails.row) {
                const parentEntry = currentStageDetails.row.closest('.timeline-entry');
                if (parentEntry) parentEntry.classList.add('active-timeline-item');
                if (!currentStageDetails.isHeader && currentStageDetails.row.classList.contains('masonry-card')) {
                    currentStageDetails.row.classList.add('active-stage-highlight');
                }
            }
        }

        const shouldReallyAutoScroll = autoScrollToStage && (!userInteractedDuringAnimation || isAutoScrollingToWorkExp || isInitialHeroTransition);
        if (shouldReallyAutoScroll) {
            let targetElementToScroll = currentStageDetails.row;
            if (targetElementToScroll && !currentStageDetails.isIntro) {
                const elementToActuallyScroll = targetElementToScroll.closest('.timeline-entry') || targetElementToScroll;
                const rect = elementToActuallyScroll.getBoundingClientRect();
                const isCentered = rect.top >= window.innerHeight * 0.25 && rect.bottom <= window.innerHeight * 0.75;
                const shouldAlwaysScrollToCenter = currentStageDetails.isHeader || currentStageDetails.name === "Plant rootstock" || (currentStageDetails.name === "WorkExpHeader" && (isAutoScrollingToWorkExp || isInitialHeroTransition));
                if (!isCentered || shouldAlwaysScrollToCenter) {
                    const scrollPos = (shouldAlwaysScrollToCenter) ? 'center' : 'start';
                    if (window.smoothScrollToElement) {
                        setTimeout(() => window.smoothScrollToElement(elementToActuallyScroll, scrollPos), isInitialHeroTransition ? 300 : 100);
                    }
                }
            }
        }
        ignoreIntersection = true;
        setTimeout(() => {
            ignoreIntersection = false;
        }, 800);
        updateFixedElementsDisplay();
    }

    window.activateStageByCardId = function(cardId, autoScroll = false) {
        const stageIndex = stageMapping.findIndex(s => s.rowKey === cardId);
        if (stageIndex !== -1) {
            userInteractedDuringAnimation = false;
            activateStage(stageIndex, autoScroll);
        }
    };

    window.smoothScrollToElement = function(element, position = 'center') {
        if (!element) {
            console.warn("smoothScrollToElement: No element provided");
            return;
        }

        let yOffset;
        const elementRect = element.getBoundingClientRect();
        const elementHeight = elementRect.height;
        const viewportHeight = window.innerHeight;
        const navHeight = (navHeader && getComputedStyle(navHeader).visibility !== 'hidden' && getComputedStyle(navHeader).opacity !== '0') ? navHeader.offsetHeight : 0;

        if (position === 'bottom') {
            yOffset = viewportHeight * 0.75 - elementHeight;
        } else if (position === 'top' || position === 'start') {
            yOffset = viewportHeight * 0.20;
        } else {
            yOffset = (viewportHeight - elementHeight) / 2;
        }
        const elementPositionInDocument = elementRect.top + window.scrollY;
        let scrollToY = elementPositionInDocument - yOffset;
        scrollToY = Math.max(0, scrollToY - (navHeight > 0 ? navHeight + 10 : 0));
        window.scrollTo({ top: scrollToY, behavior: 'smooth' });
    }

    window.scrollElementToCenterPromise = function(element) {
        return new Promise((resolve) => {
            if (!element) {
                console.warn("scrollElementToCenterPromise: No element provided");
                resolve();
                return;
            }
            const scrollTarget = element.closest('.timeline-entry') || element;

            let scrollTimeout;
            const onScrollEnd = () => {
                window.removeEventListener('scroll', onScrollActivity);
                window.removeEventListener('scrollend', onScrollEnd);
                clearTimeout(scrollTimeout);
                setTimeout(resolve, 50);
            };

            const onScrollActivity = () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(onScrollEnd, 150);
            };

            if ('onscrollend' in window) {
                window.addEventListener('scrollend', onScrollEnd, { once: true });
            } else {
                window.addEventListener('scroll', onScrollActivity);
                scrollTimeout = setTimeout(onScrollEnd, 800);
            }
            window.smoothScrollToElement(scrollTarget, 'center');
        });
    }

    function scrollFooterImgToCenter() {
        if (!footerImgEl || footerImgEl.offsetParent === null) return;
        const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        footerImgEl.scrollIntoView({ behavior: prm ? 'auto' : 'smooth', block: 'center' });
    }

    if (footerImgEl && footerTextEl && grapeFooterQuoteSection) {
        const footerSteps = [
            { text: "Now, this grape is being transformed—", start: 1, end: 4 },
            { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
            { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
        ];
        const totalFooterImageFrames = 14;
        const showTimePerStep = 1000;
        const pauseTimeAtEnd = 2000;
        let footerAnimationTimeoutId = null;
        let footerAutoScrolledByObserver = false;

        function animateFooterLoop() {
            clearTimeout(footerAnimationTimeoutId);
            let currentFooterImageFrame = 1;
            function nextFooterStep() {
                if (!footerImgEl || !footerTextEl) return;
                footerImgEl.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`;
                let currentText = "";
                for (const step of footerSteps) {
                    if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) {
                        currentText = step.text;
                        break;
                    }
                }
                footerTextEl.innerHTML = currentText;
                currentFooterImageFrame++;
                if (currentFooterImageFrame <= totalFooterImageFrames) {
                    footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep);
                } else {
                    if (footerSteps.length > 0) {
                        footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text;
                    }
                    footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
                    footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
                }
            }
            nextFooterStep();
        }

        const footerImgObserver = new IntersectionObserver(es => {
            es.forEach(e => {
                if (zoomState === 'zoomIn' || !footerImgEl) return;
                const r = e.inter嫩
                if (r > 0.15 && !footerAutoScrolledByObserver && !hasScrolledToFooterAfterPlantRootstock) {
                    footerAutoScrolledByObserver = true;
                    setTimeout(() => {
                        scrollFooterImgToCenter();
                    }, 100);
                }
                if (r > 0.45 && !footerZoomedIn) {
                    footerZoomedIn = true;
                    footerImgEl.classList.add('zoomed-in');
                    footerImgEl.classList.remove('zoomed-out');
                    animateFooterLoop();
                } else if (r <= 0.10 && (footerZoomedIn || footerAutoScrolledByObserver)) {
                    clearTimeout(footerAnimationTimeoutId);
                    footerZoomedIn = false;
                    footerAutoScrolledByObserver = false;
                    footerImgEl.classList.remove('zoomed-in');
                    footerImgEl.classList.add('zoomed-out');
                }
            });
        }, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
        if (footerImgEl) footerImgObserver.observe(footerImgEl);
    }

    function initResizablePanes() {
        const leftPane = document.getElementById('timeline-left-pane');
        const rightPane = document.getElementById('timeline-right-pane');
        const dragger = document.getElementById('timeline-dragger');
        const resizableArea = document.querySelector('.resizable-timeline-area');

        if (!leftPane || !rightPane || !dragger || !resizableArea) {
            return;
        }

        let isDragging = false;
        let startX, startY, startLeftSize, startRightSize;
        let isVerticalDrag = false;

        dragger.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;

            const computedStyle = getComputedStyle(resizableArea);
            isVerticalDrag = computedStyle.flexDirection === 'column';

            if (isVerticalDrag) {
                startY = e.clientY;
                startLeftSize = leftPane.offsetHeight;
                startRightSize = rightPane.offsetHeight;
            } else {
                startX = e.clientX;
                startLeftSize = leftPane.offsetWidth;
                startRightSize = rightPane.offsetWidth;
            }

            document.body.style.cursor = isVerticalDrag ? 'row-resize' : 'col-resize';
            leftPane.style.transition = 'none';
            rightPane.style.transition = 'none';
            if (dragger) dragger.style.backgroundColor = '#aaa';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            e.preventDefault();

            if (isVerticalDrag) {
                const dy = e.clientY - startY;
                let newTopPaneSize = startLeftSize + dy;
                let newBottomPaneSize = startRightSize - dy;

                const minTopPaneHeight = parseFloat(getComputedStyle(leftPane).minHeight) || 50;
                const minBottomPaneHeight = parseFloat(getComputedStyle(rightPane).minHeight) || 20;
                const totalAvailableHeight = resizableArea.offsetHeight - dragger.offsetHeight;

                if (newTopPaneSize < minTopPaneHeight) {
                    newTopPaneSize = minTopPaneHeight;
                    newBottomPaneSize = totalAvailableHeight - newTopPaneSize;
                } else if (newBottomPaneSize < minBottomPaneHeight) {
                    newBottomPaneSize = minBottomPaneHeight;
                    newTopPaneSize = totalAvailableHeight - newBottomPaneSize;
                }

                leftPane.style.flexBasis = `${newTopPaneSize}px`;
                rightPane.style.flexBasis = `${newBottomPaneSize}px`;
            } else {
                const dx = e.clientX - startX;
                let newLeftPaneSize = startLeftSize + dx;
                let newRightPaneSize = startRightSize - dx;

                const minLeftPaneWidth = parseFloat(getComputedStyle(leftPane).minWidth) || 50;
                const minRightPaneWidth = parseFloat(getComputedStyle(rightPane).minWidth) || 20;
                const totalAvailableWidth = resizableArea.offsetWidth - dragger.offsetWidth;

                if (newLeftPaneSize < minLeftPaneWidth) {
                    newLeftPaneSize = minLeftPaneWidth;
                    newRightPaneSize = totalAvailableWidth - newLeftPaneSize;
                } else if (newRightPaneSize < minRightPaneWidth) {
                    newRightPaneSize = minRightPaneWidth;
                    newLeftPaneSize = totalAvailableWidth - newRightPaneSize;
                }

                leftPane.style.flexBasis = `${newLeftPaneSize}px`;
                rightPane.style.flexBasis = `${newRightPaneSize}px`;
            }
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.cursor = 'default';
            leftPane.style.transition = '';
            rightPane.style.transition = '';
            if (dragger) dragger.style.backgroundColor = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    let scalableElementsStore = [];
    let initialLeftPaneWidthForScaling = 0;
    let initialCardImageHeightVarValue = 0;

    function initResponsiveCardScaling() {
        const leftPane = document.getElementById('timeline-left-pane');
        if (!leftPane || typeof ResizeObserver === 'undefined') {
            return;
        }

        const cards = document.querySelectorAll('.masonry-card');
        scalableElementsStore = [];

        function debounce(func, delay) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), delay);
            };
        }

        if (initialLeftPaneWidthForScaling === 0 && leftPane.offsetWidth > 0) {
            initialLeftPaneWidthForScaling = leftPane.offsetWidth;
        }

        if (scalableElementsStore.length === 0 && cards.length > 0) {
            cards.forEach(card => {
                const elementsToScale = [
                    ...card.querySelectorAll('.card-title, .card-company, .card-date, .card-tags span')
                ];
                elementsToScale.forEach(el => {
                    scalableElementsStore.push({
                        element: el,
                        initialFontSize: parseFloat(window.getComputedStyle(el).fontSize)
                    });
                });
            });
            const root = document.documentElement;
            const cardImageHeightString = getComputedStyle(root).getPropertyValue('--card-image-height').trim();
            if (cardImageHeightString) {
                initialCardImageHeightVarValue = parseFloat(cardImageHeightString);
                if (isNaN(initialCardImageHeightVarValue)) {
                    initialCardImageHeightVarValue = 180;
                }
            } else {
                initialCardImageHeightVarValue = 180;
            }
        }

        const debouncedResizeHandler = debounce((currentWidth) => {
            if (initialLeftPaneWidthForScaling === 0 && currentWidth > 0) {
                initialLeftPaneWidthForScaling = currentWidth;
                if (cards.length > 0) {
                    scalableElementsStore = [];
                    cards.forEach(card => {
                        const elementsToScale = [
                            ...card.querySelectorAll('.card-title, .card-company, .card-date, .card-tags span')
                        ];
                        elementsToScale.forEach(el => {
                            scalableElementsStore.push({
                                element: el,
                                initialFontSize: parseFloat(window.getComputedStyle(el).fontSize)
                            });
                        });
                    });
                }
            }
            if (initialLeftPaneWidthForScaling === 0) return;

            const scaleFactor = currentWidth / initialLeftPaneWidthForScaling;

            scalableElementsStore.forEach(item => {
                if (item.element && typeof item.initialFontSize === 'number' && !isNaN(item.initialFontSize)) {
                    let newSize = item.initialFontSize * scaleFactor;
                    newSize = Math.max(16, newSize);
                    item.element.style.fontSize = newSize + 'px';
                }
            });

            const root = document.documentElement;
            if (!isNaN(initialCardImageHeightVarValue)) {
                const newImageHeight = initialCardImageHeightVarValue * scaleFactor;
                root.style.setProperty('--card-image-height', `${newImageHeight}px`);
            }
        }, 50);

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === leftPane) {
                    const currentWidth = entry.contentRect.width;
                    debouncedResizeHandler(currentWidth);
                }
            }
        });

        if (leftPane.offsetWidth > 0) {
            if (initialLeftPaneWidthForScaling === 0) initialLeftPaneWidthForScaling = leftPane.offsetWidth;
            resizeObserver.observe(leftPane);
        } else {
            resizeObserver.observe(leftPane);
        }
    }

    function adjustTimelineLineStart() {
        const timelineColumn = document.querySelector('.timeline-items-column');
        if (!timelineColumn) {
            return;
        }

        let firstActualItemEntry = null;
        const potentialEntries = timelineColumn.querySelectorAll('.timeline-section .timeline-entry');
        for (let entry of potentialEntries) {
            if (entry.querySelector('.masonry-card')) {
                firstActualItemEntry = entry;
                break;
            }
        }

        if (firstActualItemEntry) {
            const dotTopOffsetWithinEntry = 10;
            const lineStartOffset = firstActualItemEntry.offsetTop + dotTopOffsetWithinEntry;
            timelineColumn.style.setProperty('--timeline-line-start-offset', `${lineStartOffset}px`);
        }
    }

    window.finalizePageSetup = function() {
        stageMapping.forEach(stage => {
            if (stage.rowKey) {
                stage.row = document.getElementById(stage.rowKey);
                if (!stage.row) {
                    console.warn(`Row not found for stage: ${stage.name}, rowKey: ${stage.rowKey}`);
                }
            }
        });

        if ('IntersectionObserver' in window && stageMapping.some(s => s.row && !s.isHeader && !s.isIntro)) {
            const obsCallback = (entries) => {
                if (ignoreIntersection || vineAnimationCurrentlyPlaying || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;
                let bestEntry = null;
                let minDistToCenter = Infinity;

                entries.forEach(entry => {
                    const targetCard = entry.target;
                    const rect = targetCard.getBoundingClientRect();
                    const cardCenterY = rect.top + rect.height / 2;
                    const viewportCenterY = window.innerHeight / 2;
                    const dist = Math.abs(cardCenterY - viewportCenterY);
                    const isInCenterZone = cardCenterY > window.innerHeight * 0.25 && cardCenterY < window.innerHeight * 0.75;

                    if (entry.isIntersecting && isInCenterZone && dist < minDistToCenter) {
                        minDistToCenter = dist;
                        bestEntry = targetCard;
                    }
                });

                if (bestEntry) {
                    const idx = stageMapping.findIndex(m => m.row === bestEntry);
                    if (idx !== -1 && stageMapping[idx] && !stageMapping[idx].isIntro) {
                        activateStage(idx, false);
                        autoScrollLock = true;
                        if (autoScrollTimeoutId) clearTimeout(autoScrollTimeoutId);
                        autoScrollTimeoutId = setTimeout(() => autoScrollLock = false, 1000);
                    }
                }
            };
            const cardObserver = new IntersectionObserver(obsCallback, {
                threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
                rootMargin: "-10% 0px -10% 0px"
            });
            stageMapping.forEach(m => {
                if (m.row && m.rowKey && !m.isHeader && !m.isIntro && m.row.classList.contains('masonry-card')) {
                    cardObserver.observe(m.row);
                }
            });
        }

        grapeTexts.forEach((textEl, visualIndex) => {
            const stageIndex = stageMapping.findIndex(s => s.visualTextIndex === visualIndex);
            if (stageIndex !== -1 && stageMapping[stageIndex]) {
                textEl.style.cursor = 'pointer';
                textEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cs = stageMapping[stageIndex];
                    if (!cs.isIntro && !isAutoScrollingToWorkExp) {
                        userInteractedDuringAnimation = false;
                        _hoveredStageIndex = -1;
                        activateStage(stageIndex, true);
                    }
                });
            }
        });

        const hoverableElements = [];
        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1 && stageMapping[workExpHeaderStageIdx]) {
            hoverableElements.push({ element: workExpHeaderFullEl_refactored, stageIndex: workExpHeaderStageIdx });
        }
        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1 && stageMapping[eduIntroStageMapIndex]) {
            hoverableElements.push({ element: eduHeaderContainerEl_refactored, stageIndex: eduIntroStageMapIndex });
        }
        stageMapping.forEach((stage, index) => {
            if (stage.row && !stage.isHeader && !stage.isIntro) {
                hoverableElements.push({ element: stage.row, stageIndex: index });
            }
        });

        hoverableElements.forEach(item => {
            if (item.element) {
                item.element.addEventListener('mouseenter', () => {
                    _hoveredStageIndex = item.stageIndex;
                    setActiveStageVisuals(_hoveredStageIndex, true);
                });
                item.element.addEventListener('mouseleave', () => {
                    _hoveredStageIndex = -1;
                    setActiveStageVisuals(_globalActiveStageIndex, false);
                });
            }
        });

        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1) {
            workExpHeaderFullEl_refactored.style.cursor = 'pointer';
            workExpHeaderFullEl_refactored.addEventListener('click', (e) => {
                e.stopPropagation();
                _hoveredStageIndex = -1;
                if (!isAutoScrollingToWorkExp) {
                    if (zoomState === 'zoomIn') triggerHeroToWorkExpSequence();
                    else {
                        userInteractedDuringAnimation = false;
                        activateStage(workExpHeaderStageIdx, true);
                    }
                }
            });
        }
        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1) {
            eduHeaderContainerEl_refactored.style.cursor = 'pointer';
            eduHeaderContainerEl_refactored.addEventListener('click', (e) => {
                e.stopPropagation();
                _hoveredStageIndex = -1;
                if (zoomState === 'zoomIn' && !isAutoScrollingToWorkExp) heroZoomOut();
                userInteractedDuringAnimation = false;
                if (!isAutoScrollingToWorkExp) activateStage(eduIntroStageMapIndex, true);
            });
        }

        initResizablePanes();
        updateFixedElementsDisplay();
        setTimeout(() => {
            initResponsiveCardScaling();
            adjustTimelineLineStart();
            const introStageIdx = stageMapping.findIndex(s => s.isIntro);
            if (introStageIdx !== -1 && _globalActiveStageIndex === -1) {
                activateStage(introStageIdx, false);
            }
        }, 50);
    };

    if (heroBg) {
        initialHeroSetup();
    }

    updateFixedElementsDisplay();
});