document.addEventListener('DOMContentLoaded', () => {
    // ===================== Hero Variables/DOM =====================
    const heroBg = document.querySelector('.hero-winery-bg');
    const heroSection = document.querySelector('.hero-section-winery');
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    const heroVideo = document.getElementById('heroVideo');
    const navHeader = document.querySelector('.nav-header');

    // ===================== Main Content Variables/DOM =====================
    const contentWrapper = document.querySelector('.experience-content-wrapper');
    const grapeTexts = document.querySelectorAll('.fade-in-list > div');
    const timelineRows = document.querySelectorAll('.timeline-row');
    const eduRows = document.querySelectorAll('.edu-row');
    const experienceRowWrapEl = document.querySelector('.experience-row-wrap');

    const workExpHeaderTitleEl = Array.from(document.querySelectorAll('.timeline-outer .timeline-header h2.exp-title')).find(h2 => h2.textContent.trim() === 'Work Experience');
    const workExpHeaderFullEl = workExpHeaderTitleEl ? workExpHeaderTitleEl.closest('.timeline-header') : null;
    const expHistoryDescEl = document.getElementById('exp-history-desc');

    const eduHeaderTitleEl = Array.from(document.querySelectorAll('.timeline-outer .timeline-header h2.exp-title')).find(h2 => h2.textContent.trim() === 'Education');
    const eduHeaderContainerEl = eduHeaderTitleEl ? eduHeaderTitleEl.closest('.timeline-header') : null;
    const expEduDescEl = document.getElementById('exp-edu-desc');

    // ===================== State Variables =====================
    let zoomState = 'zoomOut';
    let ignoreIntersection = false;
    let autoScrollLock = false;
    let autoScrollTimeoutId = null;
    let hasInitialHeroAnimationPlayed = false;
    let userInteractedDuringAnimation = false;
    let isAutoScrollingToWorkExp = false;
    let lastScrollY = window.scrollY;
    let ripeningAnimationIntervalId = null; // For Ripening stage background animation
    let currentRipeningBgIndex = 0; // For Ripening stage background animation

    // ===================== Hero Animation Constants =====================
    const heroBgCSSTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';
    const HERO_ZOOM_SCALE_FACTOR = 1.2;

    // ===================== Stage Mapping =====================
    const stageMapping = [
        { name: "Intro", visualTextIndex: 0, row: null, imgRange: [25, 25], isHeader: false },
        { name: "WorkExpHeader", visualTextIndex: -2, row: workExpHeaderFullEl, imgRange: [1, 25], isHeader: true },
        // MODIFIED: Ripening stage with alternating images
        { name: "Ripening", visualTextIndex: 1, row: timelineRows[0], imgRange: null, animatedBgImages: ['1-1.png', '1-2.png'], animationInterval: 1500, isHeader: false },
        { name: "Fruit Set", visualTextIndex: 2, row: timelineRows[1], imgRange: [21, 22], isHeader: false },
        { name: "Vine Flowering", visualTextIndex: 3, row: timelineRows[2], imgRange: [18, 20], isHeader: false },
        { name: "Education Intro", visualTextIndex: -1, row: null, imgRange: [17, 17], isHeader: true },
        { name: "Keep Growing", visualTextIndex: 4, row: eduRows[0], imgRange: [12, 17], isHeader: false },
        { name: "Bud break", visualTextIndex: 5, row: eduRows[1], imgRange: null, isHeader: false }, // imgRange null as it will use a class
        { name: "Plant rootstock", visualTextIndex: 6, row: eduRows[2], imgRange: null, isHeader: false } // imgRange null as it will use a class
    ];
    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");

    // ===================== Vine Gauge Variables =====================
    let vineSideGaugeEl, vineSideGaugeTrackContainerEl, vineSideGaugeThumbEl;
    let vineSideGaugeBlocks = [];
    const vineGaugeStageMapIndices = [
        workExpHeaderStageIdx,
        stageMapping.findIndex(s => s.name === "Ripening"),
        stageMapping.findIndex(s => s.name === "Fruit Set"),
        stageMapping.findIndex(s => s.name === "Vine Flowering"),
        stageMapping.findIndex(s => s.name === "Keep Growing"),
        stageMapping.findIndex(s => s.name === "Bud break"),
        stageMapping.findIndex(s => s.name === "Plant rootstock")
    ].filter(idx => idx !== -1 && idx < stageMapping.length && stageMapping[idx]);
    let currentVineGaugeActiveBlockIndex = -1;

    // ===================== Footer Variables =====================
    let plantRootstockStageActive = false, hasScrolledToFooterAfterPlantRootstock = false;
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');
    let footerOverlayIntervalId = null, currentFooterOverlayImg = 1, footerZoomedIn = false;

    // ===================== Initial Background for new target =====================
    if (experienceRowWrapEl) {
        experienceRowWrapEl.style.backgroundImage = `url('images/25.png')`;
    }

    // ===================== Hero Functions =====================
    function showScrollDownButton() { if (scrollDownBtn) { scrollDownBtn.style.opacity = '1'; scrollDownBtn.style.visibility = 'visible'; scrollDownBtn.style.pointerEvents = 'auto'; } }
    function hideScrollDownButton() { if (scrollDownBtn) { scrollDownBtn.style.opacity = '0'; scrollDownBtn.style.visibility = 'hidden'; scrollDownBtn.style.pointerEvents = 'none'; } }

    function initialHeroSetup() {
        if (!heroBg || hasInitialHeroAnimationPlayed) {
            if(!heroVideo && !hasInitialHeroAnimationPlayed && heroBg){
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton(); hasInitialHeroAnimationPlayed = true;
            } return;
        }
        const onVideoReady = () => {
            if (!hasInitialHeroAnimationPlayed) {
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton(); hasInitialHeroAnimationPlayed = true;
            }
        };
        if (heroVideo) {
            if (heroVideo.readyState >= 3) { onVideoReady(); }
            else {
                heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
                heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
                heroVideo.addEventListener('error', () => {
                    if (!hasInitialHeroAnimationPlayed) {
                        heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn';
                        if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                        showScrollDownButton(); hasInitialHeroAnimationPlayed = true;
                    }
                }, { once: true });
            }
        } else {
             if (heroBg && !hasInitialHeroAnimationPlayed) {
                heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn';
                if (navHeader) navHeader.classList.add('experience-header-hidden-override');
                showScrollDownButton(); hasInitialHeroAnimationPlayed = true;
            }
        }
    }

    function heroZoomIn() {
        if (heroBg && zoomState === 'zoomOut') {
            heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn';
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
        }
    }

    function heroZoomOut() {
        if (heroBg && zoomState === 'zoomIn') {
            heroBg.style.transform = 'scale(1)'; zoomState = 'zoomOut';
            hideScrollDownButton();
            if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
        }
    }

    function triggerHeroToWorkExpSequence() {
        if (isAutoScrollingToWorkExp || zoomState === 'zoomOut') return;
        isAutoScrollingToWorkExp = true;
        heroZoomOut();

        if (workExpHeaderStageIdx !== -1) {
            userInteractedDuringAnimation = false;
            activateStage(workExpHeaderStageIdx, true);
        }
        setTimeout(() => {
            isAutoScrollingToWorkExp = false;
        }, 1000);
    }

    // ===================== Scroll & Interaction Observers =====================
    if (heroSection) {
        const heroSectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasInitialHeroAnimationPlayed && zoomState === 'zoomOut' && !isAutoScrollingToWorkExp) {
                    heroZoomIn();
                }
            });
        }, { threshold: 0.1 });
        heroSectionObserver.observe(heroSection);
    }

    if (contentWrapper && heroSection) {
        const contentWrapperObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const heroRect = heroSection.getBoundingClientRect();
                if (entry.isIntersecting &&
                    zoomState === 'zoomIn' &&
                    heroRect.bottom < (window.innerHeight * 0.70) &&
                    !isAutoScrollingToWorkExp) {
                    triggerHeroToWorkExpSequence();
                }
            });
        }, { threshold: 0.01 });
        contentWrapperObserver.observe(contentWrapper);
    }

    if (heroBg) { hideScrollDownButton(); initialHeroSetup(); }

    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAutoScrollingToWorkExp) {
                triggerHeroToWorkExpSequence();
            }
        });
    }

    function tempScrollListenerDuringAnimation() {
        userInteractedDuringAnimation = true;
        window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
    }

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (navHeader) {
            if (zoomState === 'zoomOut') {
                if (navHeader.classList.contains('experience-header-hidden-override')) {
                    navHeader.classList.remove('experience-header-hidden-override');
                }
            } else if (zoomState === 'zoomIn') {
                if (currentScrollY < lastScrollY && currentScrollY < 50) {
                     navHeader.classList.remove('experience-header-hidden-override');
                } else if (currentScrollY > 50 && !navHeader.classList.contains('experience-header-hidden-override') && heroBg.style.transform === `scale(${HERO_ZOOM_SCALE_FACTOR})`) {
                    // navHeader.classList.add('experience-header-hidden-override');
                }
            }
        }
        lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        const currentFooterImgEl = document.getElementById('grapeFooterImg');
        if (plantRootstockStageActive &&
            !hasScrolledToFooterAfterPlantRootstock &&
            zoomState !== 'zoomIn' &&
            currentFooterImgEl &&
            eduRows.length > 2 && eduRows[2]) {
            const lastEduRowRect = eduRows[2].getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (lastEduRowRect.bottom < viewportHeight * 0.25 &&
                window.scrollY > (eduRows[2].offsetTop + eduRows[2].offsetHeight / 2 - viewportHeight * 0.25) ) {
                const footerRect = currentFooterImgEl.getBoundingClientRect();
                if (footerRect.top > viewportHeight * 0.4 && !footerZoomedIn) {
                    scrollFooterImgToCenter();
                    hasScrolledToFooterAfterPlantRootstock = true;
                }
            }
        }
    }, { passive: true });

    // ===================== Timeline/Grape Vine Logic =====================
    function updateVineGaugeLayout() {
        if (!vineSideGaugeEl && typeof createVineSideGauge === 'function') {
            const grapeVisualStoryColElCheck = document.querySelector('.grape-visual-story-col');
            if (grapeVisualStoryColElCheck && grapeTexts.length > 0) { createVineSideGauge(); }
        }
        if (!vineSideGaugeTrackContainerEl || !vineSideGaugeBlocks || vineSideGaugeBlocks.length === 0 || vineGaugeStageMapIndices.length === 0) { return; }

        const firstStageMapIndex = vineGaugeStageMapIndices[0];
        let lastValidTimelineElement = null;
        for (let i = vineGaugeStageMapIndices.length - 1; i >= 0; i--) {
            const stageIndex = vineGaugeStageMapIndices[i];
            if (stageIndex >=0 && stageIndex < stageMapping.length && stageMapping[stageIndex] && stageMapping[stageIndex].row) {
                lastValidTimelineElement = stageMapping[stageIndex].row; break;
            }
        }

        const firstTimelineElement = (firstStageMapIndex >=0 && firstStageMapIndex < stageMapping.length && stageMapping[firstStageMapIndex]) ? stageMapping[firstStageMapIndex].row : null;

        if (!firstTimelineElement || !lastValidTimelineElement) {
            const gaugeTrackHeightFallback = vineSideGaugeTrackContainerEl.offsetHeight || 200;
            const blockHeightFallback = Math.max(5, (gaugeTrackHeightFallback / Math.max(1, vineSideGaugeBlocks.length)) - 2);
            vineSideGaugeBlocks.forEach((block) => {
                block.style.position = 'relative'; block.style.height = `${blockHeightFallback}px`; block.style.top = 'auto'; block.style.marginBottom = '2px';
            });
            updateVineSideGaugeThumbPosition(); return;
        }

        const timelineRangeStart = firstTimelineElement.offsetTop;
        const timelineRangeEnd = lastValidTimelineElement.offsetTop + lastValidTimelineElement.offsetHeight;
        const totalTimelineRangeHeight = timelineRangeEnd - timelineRangeStart;
        const gaugeTrackDisplayHeight = vineSideGaugeTrackContainerEl.offsetHeight;

        if (totalTimelineRangeHeight <= 0 || gaugeTrackDisplayHeight <= 0) return;

        const MIN_BLOCK_HEIGHT_PX = 5;

        vineSideGaugeBlocks.forEach((block, index) => {
            const currentStageMapIndex = vineGaugeStageMapIndices[index];
            const currentTimelineElement = (currentStageMapIndex >=0 && currentStageMapIndex < stageMapping.length && stageMapping[currentStageMapIndex]) ? stageMapping[currentStageMapIndex].row : null;

            if (!currentTimelineElement) { block.style.display = 'none'; return; }
            block.style.display = '';

            const elementActualTopInDocument = currentTimelineElement.offsetTop;
            const elementOffsetInTimeline = elementActualTopInDocument - timelineRangeStart;
            const elementHeightInTimeline = currentTimelineElement.offsetHeight;

            let blockTop = (elementOffsetInTimeline / totalTimelineRangeHeight) * gaugeTrackDisplayHeight;
            let blockHeight = (elementHeightInTimeline / totalTimelineRangeHeight) * gaugeTrackDisplayHeight;

            blockHeight = Math.max(blockHeight, MIN_BLOCK_HEIGHT_PX); blockTop = Math.max(0, blockTop);
            if (blockTop + blockHeight > gaugeTrackDisplayHeight) { blockHeight = gaugeTrackDisplayHeight - blockTop; }
            blockHeight = Math.max(MIN_BLOCK_HEIGHT_PX, blockHeight);
            if (blockTop + blockHeight > gaugeTrackDisplayHeight && blockTop > 0) {
                 blockTop = Math.max(0, gaugeTrackDisplayHeight - blockHeight);
            }

            block.style.position = 'absolute'; block.style.top = `${blockTop}px`; block.style.height = `${blockHeight}px`; block.style.marginBottom = '0';
        });
        updateVineSideGaugeThumbPosition();
    }

    function setActiveHighlights(idx) {
        if (idx < 0 || idx >= stageMapping.length) return;
        const currentStage = stageMapping[idx];

        grapeTexts.forEach(el => el.classList.remove('active'));
        stageMapping.forEach(m => { if (m.row) m.row.classList.remove('active'); });
        if (typeof updateVineSideGaugeActiveState === 'function') { updateVineSideGaugeActiveState(idx); }

        if (!currentStage) return;

        if (currentStage.name !== "WorkExpHeader" && currentStage.name !== "Intro" && currentStage.name !== "Education Intro" &&
            currentStage.visualTextIndex >= 0 && currentStage.visualTextIndex < grapeTexts.length && grapeTexts[currentStage.visualTextIndex]) {
            grapeTexts[currentStage.visualTextIndex].classList.add('active');
        }
        if (currentStage.row) { currentStage.row.classList.add('active'); }
    }

    function activateStage(idx, autoScrollToStage = false) {
        if (idx < 0 || idx >= stageMapping.length || !stageMapping[idx]) { return; }
        const currentStageDetails = stageMapping[idx];

        plantRootstockStageActive = (currentStageDetails.name === "Plant rootstock");
        if (!plantRootstockStageActive && hasScrolledToFooterAfterPlantRootstock) { hasScrolledToFooterAfterPlantRootstock = false; }

        if (zoomState === 'zoomIn' && currentStageDetails.name !== "Intro") {
            if (heroBg) {
                heroBg.style.transition = heroBgCSSTransition; heroBg.style.transform = 'scale(1)';
                zoomState = 'zoomOut'; hideScrollDownButton();
                if (navHeader) navHeader.classList.remove('experience-header-hidden-override');
            }
        }

        setActiveHighlights(idx);

        // Clear any ongoing Ripening animation interval if it exists
        if (ripeningAnimationIntervalId) {
            clearInterval(ripeningAnimationIntervalId);
            ripeningAnimationIntervalId = null;
        }

        if (experienceRowWrapEl) {
            experienceRowWrapEl.classList.remove('bud-pattern', 'seed-pattern'); // Always remove pattern classes first
            experienceRowWrapEl.style.backgroundImage = ''; // Clear direct background image

            if (currentStageDetails.name === "Ripening" && currentStageDetails.animatedBgImages && currentStageDetails.animatedBgImages.length > 0) {
                currentRipeningBgIndex = 0; // Reset index
                const setRipeningBackground = () => {
                    if (experienceRowWrapEl) { // Check if element still exists
                         experienceRowWrapEl.style.backgroundImage = `url('images/${currentStageDetails.animatedBgImages[currentRipeningBgIndex]}')`;
                         currentRipeningBgIndex = (currentRipeningBgIndex + 1) % currentStageDetails.animatedBgImages.length;
                    }
                };
                setRipeningBackground(); // Set initial image
                const intervalTime = currentStageDetails.animationInterval || 1500; // Default to 1.5s
                ripeningAnimationIntervalId = setInterval(setRipeningBackground, intervalTime);

            } else if (currentStageDetails.name === "Bud break") {
                experienceRowWrapEl.classList.add('bud-pattern');
                // Ensure no direct background image is set if a pattern class is used
                experienceRowWrapEl.style.backgroundImage = '';
            } else if (currentStageDetails.name === "Plant rootstock") {
                experienceRowWrapEl.classList.add('seed-pattern');
                // Ensure no direct background image is set if a pattern class is used
                experienceRowWrapEl.style.backgroundImage = '';
            } else if (currentStageDetails.imgRange) {
                let bgImageNumber;
                if (currentStageDetails.name === "WorkExpHeader" || currentStageDetails.name === "Intro") {
                    bgImageNumber = 25;
                } else if (currentStageDetails.imgRange.length > 0) {
                    bgImageNumber = (currentStageDetails.imgRange[1] !== undefined && currentStageDetails.imgRange[1] >= currentStageDetails.imgRange[0]) ? currentStageDetails.imgRange[1] : currentStageDetails.imgRange[0];
                    bgImageNumber = Math.max(1, Math.min(25, bgImageNumber));
                }
                if (bgImageNumber) {
                    experienceRowWrapEl.style.backgroundImage = `url('images/${bgImageNumber}.png')`;
                }
            } else {
                 // Fallback if no specific background logic matched, clear bg and patterns
                 experienceRowWrapEl.style.backgroundImage = '';
                 experienceRowWrapEl.classList.remove('bud-pattern', 'seed-pattern');
            }
        }

        const shouldReallyAutoScroll = autoScrollToStage && (!userInteractedDuringAnimation || isAutoScrollingToWorkExp);

        if (shouldReallyAutoScroll) {
            const currentStage = stageMapping[idx];
            let targetElementToScroll = currentStage.row;

            if (currentStage.name === "WorkExpHeader") targetElementToScroll = workExpHeaderFullEl;
            else if (currentStage.name === "Intro") { /* No scroll for Intro */ }
            else if (currentStage.name === "Education Intro") targetElementToScroll = eduHeaderContainerEl || expEduDescEl;

            if (targetElementToScroll && currentStage.name !== "Intro") {
                const rect = targetElementToScroll.getBoundingClientRect();
                const isCentered = rect.top >= window.innerHeight * 0.3 && rect.bottom <= window.innerHeight * 0.7;

                const shouldAlwaysScrollToCenter = currentStage.isHeader ||
                                               currentStage.name === "Plant rootstock" ||
                                               (currentStage.name === "WorkExpHeader" && isAutoScrollingToWorkExp) ||
                                               (currentStage.name === "Education Intro");

                if (!isCentered || shouldAlwaysScrollToCenter) {
                    const scrollPosition = (shouldAlwaysScrollToCenter) ? 'center' : 'start';
                    setTimeout(() => smoothScrollToElement(targetElementToScroll, scrollPosition), 50);
                }
            }
        }

        ignoreIntersection = true;
        setTimeout(() => {
            ignoreIntersection = false;
        }, 800);
    }

    function smoothScrollToElement(element, position = 'center') {
        if (!element) return;
        let yOffset;
        const elementRect = element.getBoundingClientRect();
        const elementHeight = elementRect.height;
        const viewportHeight = window.innerHeight;

        if (position === 'bottom') { yOffset = viewportHeight * 0.75 - elementHeight; }
        else if (position === 'top' || position === 'start') { yOffset = viewportHeight * 0.25; }
        else { yOffset = (viewportHeight - elementHeight) / 2; }

        const elementPositionInDocument = elementRect.top + window.scrollY;
        const scrollToY = elementPositionInDocument - yOffset;
        window.scrollTo({ top: Math.max(0, scrollToY), behavior: 'smooth' });
    }

    if ('IntersectionObserver' in window && (timelineRows.length > 0 || eduRows.length > 0) ) {
        const sectionAndDotObserverCallback = (entries) => {
            if (ignoreIntersection || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;

            let bestEntry = null;
            let minDist = Number.POSITIVE_INFINITY;

            entries.forEach(entry => {
                const rect = entry.target.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                const dist = Math.abs(centerY - viewportCenter);
                const isCenterZone = centerY > window.innerHeight * 0.30 && centerY < window.innerHeight * 0.70;

                if (entry.isIntersecting && isCenterZone && dist < minDist) {
                    minDist = dist;
                    bestEntry = entry.target;
                }
                const dot = entry.target.querySelector('.timeline-dot');
                if (dot) dot.classList.toggle('dot-scrolled-into-view', entry.isIntersecting && isCenterZone);
            });

            if (bestEntry) {
                const idx = stageMapping.findIndex(m => m.row === bestEntry);
                if (idx !== -1 && stageMapping[idx].name !== "Intro") {
                    activateStage(idx, false);
                    autoScrollLock = true; if (autoScrollTimeoutId) clearTimeout(autoScrollTimeoutId);
                    autoScrollTimeoutId = setTimeout(() => { autoScrollLock = false; }, 1200);
                }
            }
        };
        const sectionAndDotObserver = new IntersectionObserver(sectionAndDotObserverCallback, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
        stageMapping.forEach(m => { if (m.row) sectionAndDotObserver.observe(m.row); });
    }

    stageMapping.forEach((stage, index) => {
        const elementsToClick = [];
        if (stage.row) elementsToClick.push(stage.row);
        if (stage.name !== "WorkExpHeader" && stage.name !== "Intro" && stage.name !== "Education Intro" &&
            stage.visualTextIndex >= 0 && stage.visualTextIndex < grapeTexts.length && grapeTexts[stage.visualTextIndex]) {
            elementsToClick.push(grapeTexts[stage.visualTextIndex]);
        }

        elementsToClick.forEach(element => {
            if (element) {
                element.style.cursor = 'pointer';
                element.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (stage.name !== "Intro" && !isAutoScrollingToWorkExp) {
                        userInteractedDuringAnimation = false;
                        activateStage(index, true);
                    }
                });
            }
        });
    });

    const workExpAction = (event) => {
        event.stopPropagation();
        if (!isAutoScrollingToWorkExp) {
             if (zoomState === 'zoomIn') {
                triggerHeroToWorkExpSequence();
            } else {
                userInteractedDuringAnimation = false;
                if(workExpHeaderStageIdx !== -1) activateStage(workExpHeaderStageIdx, true);
            }
        }
    };
    if (workExpHeaderFullEl) { workExpHeaderFullEl.style.cursor = 'pointer'; workExpHeaderFullEl.addEventListener('click', workExpAction); }
    if (expHistoryDescEl) { expHistoryDescEl.style.cursor = 'pointer'; if (workExpHeaderFullEl !== expHistoryDescEl) expHistoryDescEl.addEventListener('click', workExpAction); }

    function eduScrollAction(event) {
        event?.stopPropagation();
        if (zoomState === 'zoomIn' && !isAutoScrollingToWorkExp) heroZoomOut();
        userInteractedDuringAnimation = false;
        if (eduIntroStageMapIndex !== -1 && !isAutoScrollingToWorkExp) {
            activateStage(eduIntroStageMapIndex, true);
        }
    }
    if (eduHeaderContainerEl) { eduHeaderContainerEl.style.cursor = 'pointer'; eduHeaderContainerEl.addEventListener('click', eduScrollAction); }
    if (expEduDescEl) { expEduDescEl.style.cursor = 'pointer'; if (eduHeaderContainerEl !== expEduDescEl) expEduDescEl.addEventListener('click', eduScrollAction); }

    function createVineSideGauge() {
        const vineGaugeAndTextWrapper = document.querySelector('.vine-gauge-and-text-wrapper'); if (!vineGaugeAndTextWrapper) return;
        vineSideGaugeEl = document.getElementById('vineSideGauge');
        if (!vineSideGaugeEl) {
            vineSideGaugeEl = document.createElement('div');
            vineSideGaugeEl.id = 'vineSideGauge';
        }
        if (vineGaugeAndTextWrapper.firstChild !== vineSideGaugeEl) {
            vineGaugeAndTextWrapper.insertBefore(vineSideGaugeEl, vineGaugeAndTextWrapper.firstChild);
        }

        vineSideGaugeEl.innerHTML = '';
        vineSideGaugeTrackContainerEl = document.createElement('div');
        vineSideGaugeTrackContainerEl.className = 'vine-gauge-track-container';
        vineSideGaugeEl.appendChild(vineSideGaugeTrackContainerEl);
        vineSideGaugeBlocks = [];

        vineGaugeStageMapIndices.forEach((stageMapIndex) => {
            if (stageMapIndex === -1 || stageMapIndex >= stageMapping.length || !stageMapping[stageMapIndex]) return;
            const block = document.createElement('div'); block.className = 'vine-gauge-stage-block'; block.dataset.stageMapIndex = stageMapIndex;
            block.addEventListener('click', () => {
                if (stageMapping[stageMapIndex].name !== "Intro" && !isAutoScrollingToWorkExp) {
                    userInteractedDuringAnimation = false;
                    activateStage(stageMapIndex, true);
                }
            });
            vineSideGaugeTrackContainerEl.appendChild(block); vineSideGaugeBlocks.push(block);
        });

        if (vineSideGaugeBlocks.length > 0) {
            vineSideGaugeThumbEl = document.createElement('div'); vineSideGaugeThumbEl.className = 'vine-gauge-thumb';
            vineSideGaugeTrackContainerEl.appendChild(vineSideGaugeThumbEl);
        } else {
            vineSideGaugeThumbEl = null;
        }
        setTimeout(updateVineGaugeLayout, 100);
        updateVineSideGaugeActiveStateStyles();
    }

    function updateVineSideGaugeActiveState(currentActiveStageMapIndex) {
        const newVineBlockIndex = vineGaugeStageMapIndices.indexOf(currentActiveStageMapIndex);
        currentVineGaugeActiveBlockIndex = newVineBlockIndex !== -1 ? newVineBlockIndex : -1;
        updateVineSideGaugeActiveStateStyles();
        updateVineSideGaugeThumbPosition();
    }

    function updateVineSideGaugeActiveStateStyles() { /* No direct styling for blocks, thumb is positioned */ }

    function updateVineSideGaugeThumbPosition() {
        if (!vineSideGaugeThumbEl || !vineSideGaugeTrackContainerEl || vineSideGaugeBlocks.length === 0) { if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0'; return; }
        if (currentVineGaugeActiveBlockIndex === -1 || currentVineGaugeActiveBlockIndex >= vineSideGaugeBlocks.length || !vineSideGaugeBlocks[currentVineGaugeActiveBlockIndex]) { if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0'; return; }

        const activeBlock = vineSideGaugeBlocks[currentVineGaugeActiveBlockIndex];
        if (activeBlock) {
            requestAnimationFrame(() => {
                const blockHeight = activeBlock.offsetHeight;
                const blockTop = activeBlock.offsetTop;
                if (blockHeight > 0) {
                    vineSideGaugeThumbEl.style.top = `${blockTop}px`;
                    vineSideGaugeThumbEl.style.height = `${blockHeight}px`;
                    vineSideGaugeThumbEl.style.opacity = '1';
                } else {
                    vineSideGaugeThumbEl.style.opacity = '0';
                }
            });
        } else {
            if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0';
        }
    }

    const grapeVisualStoryColEl = document.querySelector('.grape-visual-story-col');
    if (grapeVisualStoryColEl && grapeTexts.length > 0 && typeof createVineSideGauge === 'function') {
        createVineSideGauge();
    }

    // ===================== Footer Functions & Observer =====================
    function scrollFooterImgToCenter() {
        const currentFooterImgEl = document.getElementById('grapeFooterImg');
        if (!currentFooterImgEl || currentFooterImgEl.offsetParent === null) return;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        currentFooterImgEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }

    function startFooterOverlayAnimation() {
        const footerOverlayImageEl = document.querySelector('.footer-overlay-image');
        if (!footerOverlayImageEl) return;
        stopFooterOverlayAnimation();
        footerOverlayImageEl.style.opacity = '1';
        footerOverlayImageEl.src = `images/footerx${currentFooterOverlayImg}.png`;
        footerOverlayIntervalId = setInterval(() => {
            currentFooterOverlayImg = currentFooterOverlayImg === 1 ? 2 : 1;
            footerOverlayImageEl.src = `images/footerx${currentFooterOverlayImg}.png`;
        }, 1000);
    }

    function stopFooterOverlayAnimation() {
        const footerOverlayImageEl = document.querySelector('.footer-overlay-image');
        if (footerOverlayIntervalId) clearInterval(footerOverlayIntervalId);
        footerOverlayIntervalId = null;
        if (footerOverlayImageEl) footerOverlayImageEl.style.opacity = '0';
    }

    const footerImgElGlobal = document.getElementById('grapeFooterImg');
    const footerTextElGlobal = document.getElementById('grapeFooterText');

    if (footerImgElGlobal && footerTextElGlobal) {
        const footerSteps = [
            { text: "Now, this grape is being transformed—", start: 1, end: 4 },
            { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
            { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
        ];
        const totalFooterImageFrames = 14;
        const showTimePerStep = 100; // This seems very fast for text reading, might need adjustment
        let currentFooterFrame = 1;
        let footerAnimationIntervalId = null;

        function updateFooterContent() {
            if (footerImgElGlobal && footerImgElGlobal.offsetParent !== null) {
                footerImgElGlobal.src = `images/${currentFooterFrame}.png`;
                const currentStep = footerSteps.find(step => currentFooterFrame >= step.start && currentFooterFrame <= step.end);
                if (currentStep && footerTextElGlobal) {
                    footerTextElGlobal.textContent = currentStep.text;
                }
                if (!footerZoomedIn) {
                    footerImgElGlobal.classList.remove('zoomed-out');
                    footerImgElGlobal.classList.add('zoomed-in');
                    footerZoomedIn = true;
                }
                currentFooterFrame = (currentFooterFrame % totalFooterImageFrames) + 1;
            } else {
                stopFooterAnimation();
            }
        }

        function startFooterAnimation() {
            stopFooterAnimation();
            currentFooterFrame = 1;
            footerZoomedIn = false;
            updateFooterContent();
            startFooterOverlayAnimation();
            footerAnimationIntervalId = setInterval(updateFooterContent, showTimePerStep);
        }

        function stopFooterAnimation() {
            if (footerAnimationIntervalId) clearInterval(footerAnimationIntervalId);
            footerAnimationIntervalId = null;
            stopFooterOverlayAnimation();
            if (footerImgElGlobal) {
                footerImgElGlobal.classList.remove('zoomed-in');
                footerImgElGlobal.classList.add('zoomed-out');
                footerZoomedIn = false;
            }
        }

        if ('IntersectionObserver' in window) {
            const footerObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && plantRootstockStageActive && !hasScrolledToFooterAfterPlantRootstock) {
                        startFooterAnimation();
                    } else {
                        stopFooterAnimation();
                    }
                });
            }, { threshold: 0.5 }); // Trigger when 50% of the image is visible
            footerObserver.observe(footerImgElGlobal);
        }
    }
});

// REMOVED setPatternedBackground function and its DOMContentLoaded listener
// The original CSS classes .bud-pattern and .seed-pattern will now be used by activateStage
// Make sure your CSS defines these classes with the appropriate background images/styles.
// e.g.,
// .bud-pattern { background-image: url('images/bud.png'); /* or your desired pattern */ }
// .seed-pattern { background-image: url('images/seed.png'); /* or your desired pattern */ }