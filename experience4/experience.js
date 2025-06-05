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
    const workExpHeaderFullEl = workExpHeaderTitleEl?.closest('.timeline-header') || null;
    const expHistoryDescEl = document.getElementById('exp-history-desc');
    const eduHeaderTitleEl = Array.from(document.querySelectorAll('.timeline-outer .timeline-header h2.exp-title')).find(h2 => h2.textContent.trim() === 'Education');
    const eduHeaderContainerEl = eduHeaderTitleEl?.closest('.timeline-header') || null;
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
    // ===================== Hero Animation Constants =====================
    const HERO_ZOOM_SCALE_FACTOR = 1.2;
    // ===================== Stage Mapping =====================
    const stageMapping = [
        { name: "Intro", visualTextIndex: 0, row: null, imgRange: [25, 25] },
        { name: "WorkExpHeader", visualTextIndex: -2, row: workExpHeaderFullEl, imgRange: [1, 25] },
        { name: "Ripening", visualTextIndex: 1, row: timelineRows[0], patternImage: 'images/grapes.svg' },
        { name: "Fruit Set", visualTextIndex: 2, row: timelineRows[1], patternImage: 'images/fruitset.svg' },
        { name: "Vine Flowering", visualTextIndex: 3, row: timelineRows[2], patternImage: 'images/flowering.svg' },
        { name: "Education Intro", visualTextIndex: -1, row: null },
        { name: "Keep Growing", visualTextIndex: 4, row: eduRows[0], patternImage: 'images/leaf.svg' },
        { name: "Bud break", visualTextIndex: 5, row: eduRows[1], patternImage: 'images/bud.svg' },
        { name: "Plant rootstock", visualTextIndex: 6, row: eduRows[2], patternImage: 'images/seed.svg' }
    ];
    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");
    // ===================== Footer Variables =====================
    let plantRootstockStageActive = false, hasScrolledToFooterAfterPlantRootstock = false;
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');
    const footerOverlayImageEl = document.getElementById('footerOverlayImage');
    let footerOverlayIntervalId = null, currentFooterOverlayImg = 1, footerZoomedIn = false;
    // ===================== Initial Background for new target =====================
    if (experienceRowWrapEl) {
        experienceRowWrapEl.style.backgroundImage = `url('images/25.png')`;
        experienceRowWrapEl.style.backgroundRepeat = 'no-repeat';
        experienceRowWrapEl.style.backgroundSize = 'contain';
        experienceRowWrapEl.style.backgroundPosition = 'center top';
        experienceRowWrapEl.style.backgroundAttachment = 'fixed';
    }
    // ===================== Hero Functions =====================
    function showScrollDownButton() {
        if (!scrollDownBtn) return;
        scrollDownBtn.style.opacity = '1';
        scrollDownBtn.style.visibility = 'visible';
        scrollDownBtn.style.pointerEvents = 'auto';
    }
    function hideScrollDownButton() {
        if (!scrollDownBtn) return;
        scrollDownBtn.style.opacity = '0';
        scrollDownBtn.style.visibility = 'hidden';
        scrollDownBtn.style.pointerEvents = 'none';
    }
    function initialHeroSetup() {
        if (!heroBg || hasInitialHeroAnimationPlayed) return;
        function onReady() {
            heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
            zoomState = 'zoomIn';
            navHeader?.classList.add('experience-header-hidden-override');
            showScrollDownButton();
            hasInitialHeroAnimationPlayed = true;
        }
        if (heroVideo) {
            if (heroVideo.readyState >= 3) onReady();
            else {
                heroVideo.addEventListener('canplaythrough', onReady, { once: true });
                heroVideo.addEventListener('loadeddata', onReady, { once: true });
                heroVideo.addEventListener('error', onReady, { once: true });
            }
        } else onReady();
    }
    function heroZoomIn() {
        if (heroBg && zoomState === 'zoomOut') {
            heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
            zoomState = 'zoomIn';
            navHeader?.classList.add('experience-header-hidden-override');
            showScrollDownButton();
        }
    }
    function heroZoomOut() {
        if (heroBg && zoomState === 'zoomIn') {
            heroBg.style.transform = 'scale(1)';
            zoomState = 'zoomOut';
            hideScrollDownButton();
            navHeader?.classList.remove('experience-header-hidden-override');
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
        setTimeout(() => { isAutoScrollingToWorkExp = false; }, 1000);
    }
    // ===================== Scroll & Interaction Observers =====================
    if (heroSection) {
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && hasInitialHeroAnimationPlayed && zoomState === 'zoomOut' && !isAutoScrollingToWorkExp) {
                    heroZoomIn();
                }
            });
        }, { threshold: 0.1 }).observe(heroSection);
    }
    if (contentWrapper && heroSection) {
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const heroRect = heroSection.getBoundingClientRect();
                if (entry.isIntersecting && zoomState === 'zoomIn' &&
                    heroRect.bottom < (window.innerHeight * 0.70) && !isAutoScrollingToWorkExp) {
                    triggerHeroToWorkExpSequence();
                }
            });
        }, { threshold: 0.01 }).observe(contentWrapper);
    }
    if (heroBg) { hideScrollDownButton(); initialHeroSetup(); }
    scrollDownBtn?.addEventListener('click', (e) => { e.preventDefault(); if (!isAutoScrollingToWorkExp) triggerHeroToWorkExpSequence(); });
    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
        // ===== Footer 스크롤 관찰 =====
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
    // ========== 패턴 배경 적용 ==========
    function setPatternedBackgroundSVG(imageUrl, element) {
        if (!element || !imageUrl) return;
        const imageActualSize = 70, imagesPerRow = 2, imagesPerCol = 2, pad = 30;
        const tileW = (imageActualSize + pad * 2) * imagesPerRow, tileH = (imageActualSize + pad * 2) * imagesPerCol;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">`;
        for (let r = 0; r < imagesPerCol; r++) {
            for (let c = 0; c < imagesPerRow; c++) {
                const angle = Math.round(Math.random() * 360);
                const x = c * (imageActualSize + pad * 2) + pad;
                const y = r * (imageActualSize + pad * 2) + pad;
                svg += `<image href="${imageUrl}" x="${x}" y="${y}" width="${imageActualSize}" height="${imageActualSize}" transform="rotate(${angle} ${x + imageActualSize / 2} ${y + imageActualSize / 2})"/>`;
            }
        }
        svg += `</svg>`;
        const dataUrl = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
        element.style.backgroundImage = dataUrl;
        element.style.backgroundRepeat = 'repeat';
        element.style.backgroundSize = 'auto';
        element.style.backgroundPosition = 'center center';
        element.style.backgroundAttachment = 'scroll';
    }
    // ========== 스테이지 하이라이트 ==========
    function setActiveHighlights(idx) {
        if (idx < 0 || idx >= stageMapping.length) return;
        grapeTexts.forEach(el => el.classList.remove('active'));
        stageMapping.forEach(m => m.row?.classList.remove('active'));
        if (stageMapping[idx].visualTextIndex >= 0) grapeTexts[stageMapping[idx].visualTextIndex]?.classList.add('active');
        stageMapping[idx].row?.classList.add('active');
    }
    // ========== 스테이지 활성화 및 배경전환 ==========
    function activateStage(idx, autoScrollToStage = false) {
        if (idx < 0 || idx >= stageMapping.length) return;
        const cur = stageMapping[idx];
        plantRootstockStageActive = (cur.name === "Plant rootstock");
        if (!plantRootstockStageActive && hasScrolledToFooterAfterPlantRootstock) {
            hasScrolledToFooterAfterPlantRootstock = false;
        }
        if (zoomState === 'zoomIn' && cur.name !== "Intro") heroZoomOut();
        setActiveHighlights(idx);
        if (experienceRowWrapEl) {
            if (cur.patternImage) setPatternedBackgroundSVG(cur.patternImage, experienceRowWrapEl);
            else if (cur.imgRange) {
                const bgImageNum = Array.isArray(cur.imgRange) && cur.imgRange.length
                    ? Math.max(1, Math.min(25, cur.imgRange[1] ?? cur.imgRange[0]))
                    : 25;
                experienceRowWrapEl.style.backgroundImage = `url('images/${bgImageNum}.png')`;
                experienceRowWrapEl.style.backgroundRepeat = 'no-repeat';
                experienceRowWrapEl.style.backgroundSize = 'contain';
                experienceRowWrapEl.style.backgroundPosition = 'center top';
                experienceRowWrapEl.style.backgroundAttachment = 'fixed';
            } else {
                experienceRowWrapEl.style.backgroundImage = 'none';
                experienceRowWrapEl.style.backgroundAttachment = 'scroll';
            }
        }
        if (autoScrollToStage) {
            let target = cur.row;
            if (cur.name === "WorkExpHeader") target = workExpHeaderFullEl;
            else if (cur.name === "Education Intro") target = eduHeaderContainerEl || expEduDescEl;
            if (target && cur.name !== "Intro") setTimeout(() => smoothScrollToElement(target), 50);
        }
        ignoreIntersection = true;
        setTimeout(() => { ignoreIntersection = false; }, 800);
    }
    function smoothScrollToElement(element, position = 'center') {
        if (!element) return;
        const rect = element.getBoundingClientRect(), vh = window.innerHeight, elH = rect.height;
        let yOffset = position === 'bottom' ? vh * 0.75 - elH : position === 'top' ? vh * 0.25 : (vh - elH) / 2;
        window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - yOffset), behavior: 'smooth' });
    }
    // ========== 타임라인/에듀 Intersection Observer ==========
    if ('IntersectionObserver' in window && (timelineRows.length || eduRows.length)) {
        const observer = new IntersectionObserver(entries => {
            if (ignoreIntersection || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;
            let best = null, minDist = Infinity, vh = window.innerHeight;
            entries.forEach(entry => {
                const rect = entry.target.getBoundingClientRect(), centerY = rect.top + rect.height / 2;
                const inZone = centerY > vh * 0.3 && centerY < vh * 0.7;
                const dist = Math.abs(centerY - vh / 2);
                if (entry.isIntersecting && inZone && dist < minDist) { minDist = dist; best = entry.target; }
                entry.target.querySelector('.timeline-dot')?.classList.toggle('dot-scrolled-into-view', entry.isIntersecting && inZone);
            });
            if (best) {
                const idx = stageMapping.findIndex(m => m.row === best);
                if (idx !== -1 && stageMapping[idx].name !== "Intro") {
                    activateStage(idx, false);
                    autoScrollLock = true;
                    if (autoScrollTimeoutId) clearTimeout(autoScrollTimeoutId);
                    autoScrollTimeoutId = setTimeout(() => { autoScrollLock = false; }, 1200);
                }
            }
        }, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
        stageMapping.forEach(m => m.row && observer.observe(m.row));
    }
    // ========== 클릭 이벤트 (grapeTexts, row 등) ==========
    stageMapping.forEach((stage, idx) => {
        const clickTargets = [];
        if (stage.row) clickTargets.push(stage.row);
        if (stage.visualTextIndex >= 0) clickTargets.push(grapeTexts[stage.visualTextIndex]);
        clickTargets.forEach(el => el && el.addEventListener('click', e => {
            e.stopPropagation();
            if (stage.name !== "Intro" && !isAutoScrollingToWorkExp) {
                userInteractedDuringAnimation = false;
                activateStage(idx, true);
            }
        }));
    });
    // ===== Work Experience Header 클릭 =====
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
    // ===== Education Header 클릭 =====
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
    // ===================== Footer Functions & Observer =====================
    function scrollFooterImgToCenter() {
        const currentFooterImgEl = document.getElementById('grapeFooterImg');
        if (!currentFooterImgEl || currentFooterImgEl.offsetParent === null) return;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        currentFooterImgEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
    function startFooterOverlayAnimation() {
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
      if (footerOverlayIntervalId) clearInterval(footerOverlayIntervalId);
      footerOverlayIntervalId = null;
      if (footerOverlayImageEl) footerOverlayImageEl.style.opacity = '0';
    }
    // ===================== Footer Animation & Observer =====================
    if (footerImgEl && footerTextEl) {
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
                for (const step of footerSteps) { if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) { currentText = step.text; break; } }
                footerTextEl.innerHTML = currentText; currentFooterImageFrame++;
                if (currentFooterImageFrame <= totalFooterImageFrames) { footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep); }
                else {
                    if (footerSteps.length > 0) { footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text; }
                    footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
                    footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
                }
            }
            nextFooterStep();
        }
        if ('IntersectionObserver' in window) {
            const footerObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (zoomState === 'zoomIn' || !footerImgEl) return; const ratio = entry.intersectionRatio;
                    if (ratio > 0.15 && !footerAutoScrolledByObserver && !hasScrolledToFooterAfterPlantRootstock) { footerAutoScrolledByObserver = true; setTimeout(() => { scrollFooterImgToCenter(); }, 100); }
                    if (ratio > 0.45 && !footerZoomedIn) { footerZoomedIn = true; footerImgEl.classList.add('zoomed-in'); footerImgEl.classList.remove('zoomed-out'); animateFooterLoop(); }
                    else if (ratio <= 0.10 && (footerZoomedIn || footerAutoScrolledByObserver)) { clearTimeout(footerAnimationTimeoutId); footerZoomedIn = false; footerAutoScrolledByObserver = false; footerImgEl.classList.remove('zoomed-in'); footerImgEl.classList.add('zoomed-out');}
                });
            }, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
            footerObserver.observe(footerImgEl);
        }
        if (footerOverlayImageEl) { footerOverlayImageEl.style.opacity = '0'; }
    }
    // ===================== Initial Setup Calls & Listeners =====================
    window.addEventListener('load', () => {
        if (stageMapping.length && stageMapping[0].name === "Intro") activateStage(0, false);
    });
    window.addEventListener('resize', () => {
        // 레이아웃 관련 resize 이벤트가 필요하면 여기에 작성
    });
    if (heroBg) {
        hideScrollDownButton();
        initialHeroSetup();
    } else {
        console.warn("[Initial Setup] heroBg element not found for hero setup.");
    }
});
