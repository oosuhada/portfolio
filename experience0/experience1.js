// experience1.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroBg = document.querySelector('.hero-winery-bg');
    const heroSection = document.querySelector('.hero-section-winery'); // For hero visibility
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    const heroVideo = document.getElementById('heroVideo');
    const navHeader = document.querySelector('.nav-header');
    const contentWrapper = document.querySelector('.experience-content-wrapper'); // For main content visibility
    let grapeImgElement = document.getElementById('central-timeline-image');
    const grapeTexts = document.querySelectorAll('#vineStageList > div');
    const workExpHeaderFullEl_refactored = document.getElementById('work-exp-header-refactored');
    const eduHeaderContainerEl_refactored = document.getElementById('edu-header-refactored');

    const fixedVineGaugeContainer = document.getElementById('fixed-vine-gauge-container');
    const fixedGrapeImageContainer = document.querySelector('.fixed-image-container');
    const grapeFooterQuoteSection = document.querySelector('.grape-footer-quote'); // For footer visibility

    // State Variables
    let zoomState = 'zoomOut';
    let vineAnimationCurrentlyPlaying = false;
    let ignoreIntersection = false;
    let autoScrollLock = false;
    let autoScrollTimeoutId = null;
    let hasInitialHeroAnimationPlayed = false;
    let userInteractedDuringAnimation = false;
    let isAutoScrollingToWorkExp = false;

    // NEW State variables for fixed elements visibility
    let isContentAreaActive = false; // True when main content (contentWrapper) is intersecting
    let isHeroAreaDominant = false;  // True when hero section is significantly visible
    let isFooterAreaDominant = false; // True when footer quote section is significantly visible

    // Constants
    const heroBgCSSTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';
    const HERO_ZOOM_SCALE_FACTOR = 1.2;

    // stageMapping definition
    const stageMapping = [
      { name: "Intro", visualTextIndex: 0, rowKey: null, imgRange: [25, 25], isHeader: false, isIntro: true },
      { name: "WorkExpHeader", visualTextIndex: -1, rowKey: "work-exp-header-refactored", imgRange: [1, 25], isHeader: true },
      { name: "Ripening", visualTextIndex: 1, rowKey: "work-item-0-left", imgRange: [23, 24], isHeader: false },
      { name: "Fruit Set", visualTextIndex: 2, rowKey: "work-item-1-left", imgRange: [21, 22], isHeader: false },
      { name: "Vine Flowering", visualTextIndex: 3, rowKey: "work-item-2-left", imgRange: [18, 20], isHeader: false },
      { name: "Education Intro", visualTextIndex: -1, rowKey: "edu-header-refactored", imgRange: [17, 17], isHeader: true },
      { name: "Keep Growing", visualTextIndex: 4, rowKey: "edu-item-0-left", imgRange: [12, 17], isHeader: false },
      { name: "Bud break", visualTextIndex: 5, rowKey: "edu-item-1-left", imgRange: [5, 11], isHeader: false },
      { name: "Plant rootstock", visualTextIndex: 6, rowKey: "edu-item-2-left", imgRange: [1, 4], isHeader: false }
    ];
    stageMapping.forEach(s => {
        s.row = null;
        s.currentImgLoopIdx = 0;
        s.loopIntervalId = null;
    });

    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");

    const vineGaugeStageMapIndices = [
        workExpHeaderStageIdx, stageMapping.findIndex(s => s.name === "Ripening"),
        stageMapping.findIndex(s => s.name === "Fruit Set"), stageMapping.findIndex(s => s.name === "Vine Flowering"),
        eduIntroStageMapIndex,
        stageMapping.findIndex(s => s.name === "Keep Growing"), stageMapping.findIndex(s => s.name === "Bud break"),
        stageMapping.findIndex(s => s.name === "Plant rootstock")
    ].filter(idx => idx !== -1 && idx < stageMapping.length && stageMapping[idx]);

    // Other state variables
    let plantRootstockStageActive = false, hasScrolledToFooterAfterPlantRootstock = false;
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');
    let footerOverlayIntervalId = null, currentFooterOverlayImg = 1, footerZoomedIn = false;

    // Hero interaction functions
    function showScrollDownButton() { if (scrollDownBtn) { scrollDownBtn.style.opacity = '1'; scrollDownBtn.style.visibility = 'visible'; scrollDownBtn.style.pointerEvents = 'auto'; } }
    function hideScrollDownButton() { if (scrollDownBtn) { scrollDownBtn.style.opacity = '0'; scrollDownBtn.style.visibility = 'hidden'; scrollDownBtn.style.pointerEvents = 'none'; } }
    function initialHeroSetup() {
        if (!heroBg || hasInitialHeroAnimationPlayed) {
            if (!heroVideo && !hasInitialHeroAnimationPlayed && heroBg) {
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
            else { heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true }); heroVideo.addEventListener('loadeddata', onVideoReady, { once: true }); heroVideo.addEventListener('error', onVideoReady, { once: true });}
        } else { if (heroBg && !hasInitialHeroAnimationPlayed) { heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn'; if (navHeader) navHeader.classList.add('experience-header-hidden-override'); showScrollDownButton(); hasInitialHeroAnimationPlayed = true; } }
    }
    function heroZoomIn() { if (heroBg && zoomState === 'zoomOut') { heroBg.style.transition = heroBgCSSTransition; heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`; zoomState = 'zoomIn'; if (navHeader) navHeader.classList.add('experience-header-hidden-override'); showScrollDownButton(); } }
    function heroZoomOut() { if (heroBg && zoomState === 'zoomIn') { heroBg.style.transition = heroBgCSSTransition; heroBg.style.transform = 'scale(1)'; zoomState = 'zoomOut'; hideScrollDownButton(); if (navHeader) navHeader.classList.remove('experience-header-hidden-override'); } }
    function triggerHeroToWorkExpSequence() {
        if (isAutoScrollingToWorkExp || zoomState === 'zoomOut') return;
        isAutoScrollingToWorkExp = true; heroZoomOut();
        const targetStage = stageMapping[workExpHeaderStageIdx];
        if (targetStage && targetStage.row) {
            userInteractedDuringAnimation = false;
            activateStage(workExpHeaderStageIdx, false, true);
            playVineLoadAnimationThenActivateFirstStage(() => {
                activateStage(workExpHeaderStageIdx, true);
                isAutoScrollingToWorkExp = false;
            });
        } else { isAutoScrollingToWorkExp = false; console.warn("Work ExHeader row not found for hero sequence.");}
    }

    // Original hero IntersectionObserver for zoom effect
    if (heroSection) { const obs = new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting && hasInitialHeroAnimationPlayed && zoomState==='zoomOut' && !isAutoScrollingToWorkExp)heroZoomIn();}),{threshold:0.1}); obs.observe(heroSection); }

    // Initial hero setup and scroll down button listener
    if (heroBg) { hideScrollDownButton(); initialHeroSetup(); }
    if (scrollDownBtn) { scrollDownBtn.addEventListener('click', (e)=>{e.preventDefault(); if(!isAutoScrollingToWorkExp)triggerHeroToWorkExpSequence();}); }

    function tempScrollListenerDuringAnimation() { userInteractedDuringAnimation = true; window.removeEventListener('scroll', tempScrollListenerDuringAnimation); }

    // General scroll listener for nav header and footer image logic
    let lastScrollYGlobal = window.scrollY; // Renamed to avoid conflict if 'lastScrollY' is used elsewhere
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        if (navHeader) {
             if (currentScrollY > lastScrollYGlobal && currentScrollY > 100 && zoomState === 'zoomOut') {
                navHeader.style.opacity = '0';
                navHeader.style.visibility = 'hidden';
                navHeader.style.transform = 'translateY(-100%)';
            } else if (currentScrollY < lastScrollYGlobal || currentScrollY <= 50) {
                navHeader.style.opacity = '1';
                navHeader.style.visibility = 'visible';
                navHeader.style.transform = 'translateY(0)';
            }
        }
        lastScrollYGlobal = currentScrollY <= 0 ? 0 : currentScrollY;

        const lastEduStage = stageMapping.find(s => s.name === "Plant rootstock");
        if (plantRootstockStageActive && lastEduStage && lastEduStage.row && !hasScrolledToFooterAfterPlantRootstock && zoomState !== 'zoomIn' && footerImgEl) {
            const lastEduRowRect = lastEduStage.row.getBoundingClientRect(); const vpHeight = window.innerHeight;
            if (lastEduRowRect.bottom < vpHeight * 0.25 && window.scrollY > (lastEduStage.row.offsetTop + lastEduStage.row.offsetHeight / 2 - vpHeight * 0.25) ) {
                const footerRect = footerImgEl.getBoundingClientRect(); if (footerRect.top > vpHeight * 0.4 && !footerZoomedIn) { scrollFooterImgToCenter(); hasScrolledToFooterAfterPlantRootstock = true; }
            }
        }
    }, { passive: true });

    // NEW: Function to update visibility of fixed elements
    function updateFixedElementsDisplay() {
        if (isHeroAreaDominant || isFooterAreaDominant) {
            if (fixedVineGaugeContainer) fixedVineGaugeContainer.classList.remove('visible');
            if (fixedGrapeImageContainer) fixedGrapeImageContainer.classList.remove('visible');
        } else if (isContentAreaActive) {
            if (fixedVineGaugeContainer) fixedVineGaugeContainer.classList.add('visible');
            if (fixedGrapeImageContainer) fixedGrapeImageContainer.classList.add('visible');
        } else { // Content not active, and hero/footer not explicitly dominant
            if (fixedVineGaugeContainer) fixedVineGaugeContainer.classList.remove('visible');
            if (fixedGrapeImageContainer) fixedGrapeImageContainer.classList.remove('visible');
        }
    }

    // MODIFIED/NEW IntersectionObservers for Hero, Content, and Footer
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
                // Original logic for hero zoom out when scrolling into content
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
            });
            updateFixedElementsDisplay();
        }, { threshold: 0.01 });
        footerVisibilityObserver.observe(grapeFooterQuoteSection);
    }

    // Grape image and vine animation functions
    function setGrapeImage(num) { if (grapeImgElement) { grapeImgElement.src = `images/${num}.png`; grapeImgElement.style.opacity = '0.85'; } }
    function stopAllImageLoops() { stageMapping.forEach(stage => { if (stage.loopIntervalId) { clearInterval(stage.loopIntervalId); stage.loopIntervalId = null; } }); }
    function playVineLoadAnimationThenActivateFirstStage(cb) {
        vineAnimationCurrentlyPlaying = true; ignoreIntersection = true; userInteractedDuringAnimation = false;
        window.addEventListener('scroll', tempScrollListenerDuringAnimation, { once: true });
        stopAllImageLoops(); let currentVineImgIdx = 1;
        function showNext() { if (currentVineImgIdx<=25) {setGrapeImage(currentVineImgIdx++); setTimeout(showNext,70);} else {vineAnimationCurrentlyPlaying=false; window.removeEventListener('scroll',tempScrollListenerDuringAnimation); if(typeof cb==='function')cb();}}
        showNext();
    }

    // Simplified vine gauge functions
    function createVineSideGauge() {
        console.log("Vine gauge setup: Using static HTML for #vineStageList within #fixed-vine-gauge-container.");
    }

    function updateVineGaugeLayout() {
        // This function is largely obsolete.
    }

    // Highlight and stage activation logic
    function setActiveHighlights(activeIndex) {
        if (activeIndex < 0 || activeIndex >= stageMapping.length) return;
        const currentStage = stageMapping[activeIndex]; if (!currentStage) return;

        grapeTexts.forEach(el => el.classList.remove('active'));
        if (currentStage.visualTextIndex >= 0 && currentStage.visualTextIndex < grapeTexts.length && grapeTexts[currentStage.visualTextIndex]) {
            grapeTexts[currentStage.visualTextIndex].classList.add('active');
            if (fixedVineGaugeContainer && fixedVineGaugeContainer.scrollHeight > fixedVineGaugeContainer.clientHeight) {
                const activeTextElement = grapeTexts[currentStage.visualTextIndex];
                if (fixedVineGaugeContainer.classList.contains('visible')) { // Check parent visibility
                    activeTextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        }

        stageMapping.forEach(m => { if (m.row) {
            m.row.classList.remove('active');
            const rightPaneItemId = m.row.id.replace('-left', '-right');
            const rightPaneItem = document.getElementById(rightPaneItemId);
            if (rightPaneItem) rightPaneItem.classList.remove('active');
        }});
        if (currentStage.row) {
            currentStage.row.classList.add('active');
            const rightPaneItemId = currentStage.row.id.replace('-left', '-right');
            const rightPaneItem = document.getElementById(rightPaneItemId);
            if (rightPaneItem) rightPaneItem.classList.add('active');
        }
    }

    function startImageLoopForStage(stageIndex) {
        stopAllImageLoops();
        if (stageIndex < 0 || stageIndex >= stageMapping.length) return;
        const stage = stageMapping[stageIndex];
        if (!stage || !grapeImgElement || !stage.imgRange) return;
        const [start, end] = stage.imgRange; let imagesInLoop = [];
        if (stage.name === "Intro") { imagesInLoop.push(stage.imgRange[0] || 25); }
        else if (stage.name === "Ripening" || stage.name === "Fruit Set") { imagesInLoop.push(end, start); }
        else if (["Vine Flowering", "Keep Growing", "Bud break", "Plant rootstock"].includes(stage.name)) { for (let i = end; i >= start; i--) imagesInLoop.push(i); }
        else if (stage.name === "WorkExpHeader" || stage.name === "Education Intro") { imagesInLoop.push(25); }
        else { imagesInLoop.push(start); }
        if (imagesInLoop.length === 0) { imagesInLoop.push(stage.imgRange && stage.imgRange.length > 0 ? stage.imgRange[0] : 1); }
        stage.currentImgLoopIdx = 0; setGrapeImage(imagesInLoop[stage.currentImgLoopIdx]);
        if (imagesInLoop.length > 1) {
            stage.loopIntervalId = setInterval(() => {
                stage.currentImgLoopIdx = (stage.currentImgLoopIdx + 1) % imagesInLoop.length;
                setGrapeImage(imagesInLoop[stage.currentImgLoopIdx]);
            }, 1000);
        }
    }
    function activateStage(idx, autoScrollToStage = false, isInitialHeroTransition = false) {
        if (idx < 0 || idx >= stageMapping.length || !stageMapping[idx]) { return; }
        const currentStageDetails = stageMapping[idx];
        plantRootstockStageActive = (currentStageDetails.name === "Plant rootstock");
        if (!plantRootstockStageActive && hasScrolledToFooterAfterPlantRootstock) { hasScrolledToFooterAfterPlantRootstock = false; }
        if (zoomState === 'zoomIn' && !currentStageDetails.isIntro && !isInitialHeroTransition) {
            if (heroBg) { heroBg.style.transition = heroBgCSSTransition; heroBg.style.transform = 'scale(1)'; zoomState = 'zoomOut'; hideScrollDownButton(); if (navHeader) navHeader.classList.remove('experience-header-hidden-override');}
        }
        startImageLoopForStage(idx); setActiveHighlights(idx);
        const shouldReallyAutoScroll = autoScrollToStage && (!userInteractedDuringAnimation || isAutoScrollingToWorkExp || isInitialHeroTransition);
        if (shouldReallyAutoScroll) {
            let targetElementToScroll = currentStageDetails.row;
            if (targetElementToScroll && !currentStageDetails.isIntro) {
                const rect = targetElementToScroll.getBoundingClientRect(); const isCentered = rect.top >= window.innerHeight*0.3 && rect.bottom <= window.innerHeight*0.7;
                const shouldAlwaysScrollToCenter = currentStageDetails.isHeader || currentStageDetails.name === "Plant rootstock" || (currentStageDetails.name === "WorkExpHeader" && (isAutoScrollingToWorkExp || isInitialHeroTransition));
                if (!isCentered || shouldAlwaysScrollToCenter) { const scrollPos = (shouldAlwaysScrollToCenter) ? 'center' : 'start'; setTimeout(() => smoothScrollToElement(targetElementToScroll, scrollPos), isInitialHeroTransition ? 300 : 50); }
            }
        }
        ignoreIntersection = true; setTimeout(() => { ignoreIntersection = false; }, 800);
    }
    function smoothScrollToElement(element, position = 'center') {
        if (!element) { console.warn("smoothScrollToElement: No element provided"); return; }
        let yOffset; const elementRect = element.getBoundingClientRect(); const elementHeight = elementRect.height; const viewportHeight = window.innerHeight;
        if (position === 'bottom') yOffset = viewportHeight * 0.75 - elementHeight;
        else if (position === 'top' || position === 'start') yOffset = viewportHeight * 0.25;
        else yOffset = (viewportHeight - elementHeight) / 2;
        const elementPositionInDocument = elementRect.top + window.scrollY;
        const scrollToY = elementPositionInDocument - yOffset;
        window.scrollTo({ top: Math.max(0, scrollToY), behavior: 'smooth' });
    }

    // Footer animation logic
    function scrollFooterImgToCenter() { if (!footerImgEl || footerImgEl.offsetParent === null) return; const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; footerImgEl.scrollIntoView({ behavior: prm ? 'auto' : 'smooth', block: 'center' }); }
    if (footerImgEl && footerTextEl && grapeFooterQuoteSection) { 
        const footerSteps = [ { text: "Now, this grape is being transformed—", start: 1, end: 4 }, { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 }, { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 } ];
        const totalFooterImageFrames = 14; const showTimePerStep = 1000; const pauseTimeAtEnd = 2000;
        let footerAnimationTimeoutId = null; let footerAutoScrolledByObserver = false;
        function animateFooterLoop() { clearTimeout(footerAnimationTimeoutId); let currentFooterImageFrame = 1; function nextFooterStep() { if (!footerImgEl || !footerTextEl) return; footerImgEl.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`; let currentText = ""; for (const step of footerSteps) { if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) { currentText = step.text; break; } } footerTextEl.innerHTML = currentText; currentFooterImageFrame++; if (currentFooterImageFrame <= totalFooterImageFrames) { footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep); } else { if (footerSteps.length > 0) { footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text; } footerImgEl.src = `images/footer${totalFooterImageFrames}.png`; footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd); } } nextFooterStep(); }

        const footerImgObserver = new IntersectionObserver(es => {
            es.forEach(e => {
                if (zoomState === 'zoomIn' || !footerImgEl) return;
                const r = e.intersectionRatio;
                if (r > 0.15 && !footerAutoScrolledByObserver && !hasScrolledToFooterAfterPlantRootstock) {
                    footerAutoScrolledByObserver = true; setTimeout(() => { scrollFooterImgToCenter(); }, 100);
                }
                if (r > 0.45 && !footerZoomedIn) {
                    footerZoomedIn = true; footerImgEl.classList.add('zoomed-in'); footerImgEl.classList.remove('zoomed-out'); animateFooterLoop();
                } else if (r <= 0.10 && (footerZoomedIn || footerAutoScrolledByObserver)) {
                    clearTimeout(footerAnimationTimeoutId); footerZoomedIn = false; footerAutoScrolledByObserver = false; footerImgEl.classList.remove('zoomed-in'); footerImgEl.classList.add('zoomed-out');
                }
            });
        }, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
        if (footerImgEl) footerImgObserver.observe(footerImgEl);
    }

    // Final page setup, called by experience2.js
    window.finalizePageSetup = function() {
        stageMapping.forEach(stage => { if (stage.rowKey) stage.row = document.getElementById(stage.rowKey); });

        if ('IntersectionObserver' in window && stageMapping.some(s => s.row && !s.isHeader && !s.isIntro)) {
            const obsCallback = (entries) => {
                if (ignoreIntersection || vineAnimationCurrentlyPlaying || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;
                let bestEntry = null; let minDist = Infinity;
                entries.forEach(entry => {
                    const target = entry.target;
                    target.classList.toggle('item-in-view', entry.isIntersecting);
                    const rect = target.getBoundingClientRect(); const centerY = rect.top + rect.height/2; const vpCenter = window.innerHeight/2; const dist = Math.abs(centerY - vpCenter);
                    const isCenterZone = centerY > window.innerHeight*0.3 && centerY < window.innerHeight*0.7;
                    const dot = target.querySelector('.timeline-dot-refactored');
                    if (dot) dot.classList.toggle('dot-scrolled-into-view', entry.isIntersecting && isCenterZone);
                    if (entry.isIntersecting && isCenterZone && dist < minDist) { minDist = dist; bestEntry = target; }
                });
                if (bestEntry) {
                    const idx = stageMapping.findIndex(m => m.row === bestEntry);
                    // Ensure stageMapping[idx] exists and is not an intro stage
                    if (idx !== -1 && stageMapping[idx] && !stageMapping[idx].isIntro) { 
                        activateStage(idx, false); 
                        autoScrollLock = true; 
                        if(autoScrollTimeoutId) clearTimeout(autoScrollTimeoutId); 
                        autoScrollTimeoutId = setTimeout(()=>autoScrollLock=false, 1200); 
                    }
                }
            };
            const sectionObserver = new IntersectionObserver(obsCallback, { threshold: Array.from({length:21},(_,i)=>i*0.05) });
            stageMapping.forEach(m => { 
                // Ensure m.row exists and it's not a header or intro stage before observing
                if (m.row && m.rowKey && !m.isHeader && !m.isIntro) { // Added m.rowKey check for robustness
                    sectionObserver.observe(m.row); 
                }
            });
        }

        grapeTexts.forEach((textEl, visualIndex) => {
            const stageIndex = stageMapping.findIndex(s => s.visualTextIndex === visualIndex);
            if (stageIndex !== -1 && stageMapping[stageIndex]) {
                textEl.style.cursor = 'pointer';
                textEl.addEventListener('click', (e) => { e.stopPropagation(); const cs = stageMapping[stageIndex]; if (!cs.isIntro && !isAutoScrollingToWorkExp) { userInteractedDuringAnimation = false; activateStage(stageIndex, true); }});
            }
        });

        stageMapping.forEach((stage, index) => {
            if (stage.row && !stage.isHeader && !stage.isIntro) {
                stage.row.addEventListener('click', (e) => { e.stopPropagation(); if (!isAutoScrollingToWorkExp) { userInteractedDuringAnimation = false; activateStage(index, true); }});
            }
        });

        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1) {
            workExpHeaderFullEl_refactored.style.cursor = 'pointer';
            workExpHeaderFullEl_refactored.addEventListener('click', (e) => { e.stopPropagation(); if (!isAutoScrollingToWorkExp) { if (zoomState === 'zoomIn') triggerHeroToWorkExpSequence(); else { userInteractedDuringAnimation = false; activateStage(workExpHeaderStageIdx, true); }}});
        }
        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1) {
            eduHeaderContainerEl_refactored.style.cursor = 'pointer';
            eduHeaderContainerEl_refactored.addEventListener('click', (e) => { e.stopPropagation(); if (zoomState === 'zoomIn' && !isAutoScrollingToWorkExp) heroZoomOut(); userInteractedDuringAnimation = false; if (!isAutoScrollingToWorkExp) activateStage(eduIntroStageMapIndex, true);});
        }
        updateFixedElementsDisplay(); // Call to set initial visibility
    };

    // Initializations
    if (heroBg) { initialHeroSetup(); }
    createVineSideGauge(); // Call simplified function

    // Initial activation for intro stage
    const introStageIdx = stageMapping.findIndex(s => s.isIntro);
    if (introStageIdx !== -1) setTimeout(() => activateStage(introStageIdx, false), 100);

    // Ensure initial display check happens after everything is potentially ready
    // setTimeout(updateFixedElementsDisplay, 50); // Already called in finalizePageSetup

});