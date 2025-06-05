document.addEventListener('DOMContentLoaded', () => {
  // ===================== Hero Variables/DOM =====================
  const heroBg = document.querySelector('.hero-winery-bg');
  const heroSection = document.querySelector('.hero-section-winery');
  const scrollDownBtn = document.querySelector('.scroll-down-btn');
  const heroVideo = document.getElementById('heroVideo');
  const navHeader = document.querySelector('.nav-header');

  // ===================== Main Content Variables/DOM =====================
  const contentWrapper = document.querySelector('.experience-content-wrapper');
  const grapeImg = document.getElementById('vine-stage-img');
  const grapeTexts = document.querySelectorAll('.fade-in-list > div');
  const timelineRows = document.querySelectorAll('.timeline-row');
  const eduRows = document.querySelectorAll('.edu-row');
  const timelineOuterEl = document.querySelector('.timeline-outer'); // Added for dynamic background

  const workExpHeaderTitleEl = Array.from(document.querySelectorAll('.timeline-outer .timeline-header h2.exp-title')).find(h2 => h2.textContent.trim() === 'Work Experience');
  const workExpHeaderFullEl = workExpHeaderTitleEl ? workExpHeaderTitleEl.closest('.timeline-header') : null;
  const expHistoryDescEl = document.getElementById('exp-history-desc');

  const eduHeaderTitleEl = Array.from(document.querySelectorAll('.timeline-outer .timeline-header h2.exp-title')).find(h2 => h2.textContent.trim() === 'Education');
  const eduHeaderContainerEl = eduHeaderTitleEl ? eduHeaderTitleEl.closest('.timeline-header') : null;
  const expEduDescEl = document.getElementById('exp-edu-desc');

  // ===================== State Variables =====================
  let zoomState = 'zoomOut';
  let vineAnimationCurrentlyPlaying = false;
  let ignoreIntersection = false;
  let autoScrollLock = false;
  let autoScrollTimeoutId = null;
  let hasInitialHeroAnimationPlayed = false;
  let userInteractedDuringAnimation = false;
  let isAutoScrollingToWorkExp = false;

  // ===================== Hero Animation Constants =====================
  const heroBgCSSTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';
  const HERO_ZOOM_SCALE_FACTOR = 1.2;

  // ===================== Stage Mapping =====================
  const stageMapping = [
      { name: "Intro", visualTextIndex: 0, row: null, imgRange: [25, 25], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "WorkExpHeader", visualTextIndex: -2, row: workExpHeaderFullEl, imgRange: [1, 25], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: true },
      { name: "Ripening", visualTextIndex: 1, row: timelineRows[0], imgRange: [23, 24], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "Fruit Set", visualTextIndex: 2, row: timelineRows[1], imgRange: [21, 22], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "Vine Flowering", visualTextIndex: 3, row: timelineRows[2], imgRange: [18, 20], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "Education Intro", visualTextIndex: -1, row: null, imgRange: [17, 17], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: true }, // Edu header maps to an image
      { name: "Keep Growing", visualTextIndex: 4, row: eduRows[0], imgRange: [12, 17], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "Bud break", visualTextIndex: 5, row: eduRows[1], imgRange: [5, 11], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false },
      { name: "Plant rootstock", visualTextIndex: 6, row: eduRows[2], imgRange: [1, 4], currentImgLoopIdx: 0, loopIntervalId: null, isHeader: false }
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
      // eduIntroStageMapIndex, // Decided not to add Edu Intro to the physical gauge, but it has an image
      stageMapping.findIndex(s => s.name === "Keep Growing"),
      stageMapping.findIndex(s => s.name === "Bud break"),
      stageMapping.findIndex(s => s.name === "Plant rootstock")
  ].filter(idx => idx !== -1 && idx < stageMapping.length && stageMapping[idx]);
  let currentVineGaugeActiveBlockIndex = -1;

  // ===================== Footer Variables =====================
  let plantRootstockStageActive = false, hasScrolledToFooterAfterPlantRootstock = false;
  const footerImgEl = document.getElementById('grapeFooterImg');
  const footerTextEl = document.getElementById('grapeFooterText');
  const footerOverlayImageEl = document.getElementById('footerOverlayImage');
  let footerOverlayIntervalId = null, currentFooterOverlayImg = 1, footerZoomedIn = false;

  // ===================== Initial Timeline Background =====================
  if (timelineOuterEl) {
      timelineOuterEl.style.backgroundImage = `url('images/25.png')`; // Default starting background
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

      if (workExpHeaderFullEl && workExpHeaderStageIdx !== -1) {
          userInteractedDuringAnimation = false;
          // activateStage will handle background, scrolling for WorkExpHeader
          playVineLoadAnimationThenActivateFirstStage(() => {
              if (workExpHeaderStageIdx !== -1) {
                  activateStage(workExpHeaderStageIdx, true); // Scroll to work exp header after animation
              }
              isAutoScrollingToWorkExp = false;
          });
      } else {
          isAutoScrollingToWorkExp = false;
      }
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
                  !vineAnimationCurrentlyPlaying &&
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

  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (navHeader) {
          if (zoomState === 'zoomOut') {
              if (navHeader.classList.contains('experience-header-hidden-override')) {
                  navHeader.classList.remove('experience-header-hidden-override');
              }
          } else if (zoomState === 'zoomIn') {
              // Only show nav if scrolling up near top while hero is zoomed
              if (currentScrollY < lastScrollY && currentScrollY < 50) {
                   navHeader.classList.remove('experience-header-hidden-override');
              } else if (currentScrollY > 50 && !navHeader.classList.contains('experience-header-hidden-override') && heroBg.style.transform === `scale(${HERO_ZOOM_SCALE_FACTOR})`) {
                  // Hide if scrolling down and hero is still zoomed
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
  function setGrapeImage(num) { if (grapeImg) { grapeImg.src = `images/${num}.png`; grapeImg.style.opacity = '0.85'; } }
  function stopAllImageLoops() { stageMapping.forEach(stage => { if (stage.loopIntervalId) { clearInterval(stage.loopIntervalId); stage.loopIntervalId = null; } }); }
  
  function playVineLoadAnimationThenActivateFirstStage(cb) {
      vineAnimationCurrentlyPlaying = true;
      ignoreIntersection = true;
      userInteractedDuringAnimation = false; // Reset flag for this animation sequence
      window.addEventListener('scroll', tempScrollListenerDuringAnimation, { once: true });
      stopAllImageLoops();
      let currentVineImgIdx = 1;
      function showNextGrapeImage() {
          if (userInteractedDuringAnimation && !isAutoScrollingToWorkExp) { // Allow interruption if user scrolls unless it's the hero-to-work-exp auto-scroll
              vineAnimationCurrentlyPlaying = false;
              window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
               // If interrupted, we might not want to call the callback, or call it with a flag
              if (typeof cb === 'function') cb(true); // Pass true for interrupted
              return;
          }
          if (currentVineImgIdx <= 25) {
              setGrapeImage(currentVineImgIdx);
              currentVineImgIdx++;
              setTimeout(showNextGrapeImage, 70);
          } else {
              vineAnimationCurrentlyPlaying = false;
              window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
              if (typeof cb === 'function') cb(false); // Pass false for completed
          }
      }
      showNextGrapeImage();
  }


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
          const gaugeTrackHeightFallback = vineSideGaugeTrackContainerEl.offsetHeight || 200; // Estimate height
          const blockHeightFallback = Math.max(5, (gaugeTrackHeightFallback / Math.max(1, vineSideGaugeBlocks.length)) - 2); // Subtract gap
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
          block.style.display = ''; // Reset display

          const elementActualTopInDocument = currentTimelineElement.offsetTop;
          const elementOffsetInTimeline = elementActualTopInDocument - timelineRangeStart;
          const elementHeightInTimeline = currentTimelineElement.offsetHeight;

          let blockTop = (elementOffsetInTimeline / totalTimelineRangeHeight) * gaugeTrackDisplayHeight;
          let blockHeight = (elementHeightInTimeline / totalTimelineRangeHeight) * gaugeTrackDisplayHeight;
          
          blockHeight = Math.max(blockHeight, MIN_BLOCK_HEIGHT_PX); blockTop = Math.max(0, blockTop);
          if (blockTop + blockHeight > gaugeTrackDisplayHeight) { blockHeight = gaugeTrackDisplayHeight - blockTop; }
          blockHeight = Math.max(MIN_BLOCK_HEIGHT_PX, blockHeight); // Ensure min height again after adjustment
          if (blockTop + blockHeight > gaugeTrackDisplayHeight && blockTop > 0) { // If still overflows and not starting at top
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


  function startImageLoopForStage(stageIndex) {
      stopAllImageLoops();
      if (stageIndex < 0 || stageIndex >= stageMapping.length) return;

      const stage = stageMapping[stageIndex];
      if (!stage || !grapeImg || !stage.imgRange) return;

      const [start, end] = stage.imgRange;
      let imagesInLoop = [];

      if (stage.name === "Intro") { imagesInLoop.push(stage.imgRange[0] || 25); }
      else if (stage.name === "Ripening" || stage.name === "Fruit Set") { imagesInLoop.push(end, start); }
      else if (["Vine Flowering", "Keep Growing", "Bud break", "Plant rootstock"].includes(stage.name)) { for (let i = end; i >= start; i--) imagesInLoop.push(i); }
      else if (stage.name === "WorkExpHeader" || stage.name === "Education Intro") { imagesInLoop.push(end); } // For headers, use the end of their range.
      else { imagesInLoop.push(start); }


      if (imagesInLoop.length === 0) { imagesInLoop.push(stage.imgRange && stage.imgRange.length > 0 ? stage.imgRange[0] : 1); }

      stage.currentImgLoopIdx = 0;
      setGrapeImage(imagesInLoop[stage.currentImgLoopIdx]);

      if (imagesInLoop.length > 1) {
          stage.loopIntervalId = setInterval(() => {
              stage.currentImgLoopIdx = (stage.currentImgLoopIdx + 1) % imagesInLoop.length;
              setGrapeImage(imagesInLoop[stage.currentImgLoopIdx]);
          }, 1000);
      }
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

      startImageLoopForStage(idx);
      setActiveHighlights(idx);

      // Update timeline background
      if (timelineOuterEl && currentStageDetails.imgRange) {
          let bgImageNumber;
          if (currentStageDetails.name === "WorkExpHeader" || currentStageDetails.name === "Intro") {
              bgImageNumber = 25;
          } else if (currentStageDetails.imgRange.length > 0) {
              // Use the 'end' of the range for a more "developed" stage representation, or 'start' if 'end' is smaller (reversed ranges)
              bgImageNumber = (currentStageDetails.imgRange[1] !== undefined && currentStageDetails.imgRange[1] >= currentStageDetails.imgRange[0]) ? currentStageDetails.imgRange[1] : currentStageDetails.imgRange[0];
              bgImageNumber = Math.max(1, Math.min(25, bgImageNumber));
          }
          if (bgImageNumber) {
              timelineOuterEl.style.backgroundImage = `url('images/${bgImageNumber}.png')`;
          }
      }
      
      const shouldReallyAutoScroll = autoScrollToStage && (!userInteractedDuringAnimation || isAutoScrollingToWorkExp);


      if (shouldReallyAutoScroll) {
          const currentStage = stageMapping[idx];
          let targetElementToScroll = currentStage.row;

          if (currentStage.name === "WorkExpHeader") targetElementToScroll = workExpHeaderFullEl;
          else if (currentStage.name === "Intro") { /* No scroll for Intro */ }
          else if (currentStage.name === "Education Intro") targetElementToScroll = eduHeaderContainerEl || expEduDescEl; // Scroll to edu header/desc

          if (targetElementToScroll && currentStage.name !== "Intro") {
              const rect = targetElementToScroll.getBoundingClientRect();
              const isCentered = rect.top >= window.innerHeight * 0.3 && rect.bottom <= window.innerHeight * 0.7;
              
              const shouldAlwaysScrollToCenter = currentStage.isHeader ||
                                             currentStage.name === "Plant rootstock" ||
                                             (currentStage.name === "WorkExpHeader" && isAutoScrollingToWorkExp) || // Hero to work exp
                                             (currentStage.name === "Education Intro"); // Clicking Education header

              if (!isCentered || shouldAlwaysScrollToCenter) {
                  const scrollPosition = (shouldAlwaysScrollToCenter) ? 'center' : 'start';
                  setTimeout(() => smoothScrollToElement(targetElementToScroll, scrollPosition), 50);
              }
          }
      }
      
      // Temporarily ignore intersection observer events after manual activation/scroll
      ignoreIntersection = true;
      setTimeout(() => {
          ignoreIntersection = false;
          // isAutoScrollingToWorkExp flag is managed by triggerHeroToWorkExpSequence
      }, 800); // Duration might need adjustment based on scroll animation
  }


  function smoothScrollToElement(element, position = 'center') {
      if (!element) { return; }
      let yOffset;
      const elementRect = element.getBoundingClientRect();
      const elementHeight = elementRect.height;
      const viewportHeight = window.innerHeight;

      if (position === 'bottom') { yOffset = viewportHeight * 0.75 - elementHeight; }
      else if (position === 'top' || position === 'start') { yOffset = viewportHeight * 0.25; } // Default for 'start'
      else {  yOffset = (viewportHeight - elementHeight) / 2; } // Center

      const elementPositionInDocument = elementRect.top + window.scrollY;
      const scrollToY = elementPositionInDocument - yOffset;
      window.scrollTo({ top: Math.max(0, scrollToY), behavior: 'smooth' });
  }


  if ('IntersectionObserver' in window && (timelineRows.length > 0 || eduRows.length > 0) ) { // Check if either list has items
      const sectionAndDotObserverCallback = (entries) => {
          if (ignoreIntersection || vineAnimationCurrentlyPlaying || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;

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
                  activateStage(idx, false); // On scroll, just activate, don't force scroll
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
      // For visual texts in the left column (excluding headers/intro)
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
                      userInteractedDuringAnimation = false; // Click is explicit
                      activateStage(index, true); // Click scrolls to stage
                  }
              });
          }
      });
  });

  const workExpAction = (event) => {
      event.stopPropagation();
      if (!isAutoScrollingToWorkExp) { // Only if not already in hero->work exp transition
           if (zoomState === 'zoomIn') { // If hero is zoomed, trigger the sequence
              triggerHeroToWorkExpSequence();
          } else { // If hero is not zoomed, just activate and scroll to the work exp header
              userInteractedDuringAnimation = false;
              if(workExpHeaderStageIdx !== -1) activateStage(workExpHeaderStageIdx, true);
          }
      }
  };
  if (workExpHeaderFullEl) { workExpHeaderFullEl.style.cursor = 'pointer'; workExpHeaderFullEl.addEventListener('click', workExpAction); }
  if (expHistoryDescEl) { expHistoryDescEl.style.cursor = 'pointer'; if (workExpHeaderFullEl !== expHistoryDescEl) expHistoryDescEl.addEventListener('click', workExpAction); }


  function eduScrollAction(event) {
      event?.stopPropagation();
      if (zoomState === 'zoomIn' && !isAutoScrollingToWorkExp) heroZoomOut(); // Zoom out if hero is active
      userInteractedDuringAnimation = false;
      if (eduIntroStageMapIndex !== -1 && !isAutoScrollingToWorkExp) {
          activateStage(eduIntroStageMapIndex, true); // Activate and scroll to Edu Intro
      }
  }
  if (eduHeaderContainerEl) { eduHeaderContainerEl.style.cursor = 'pointer'; eduHeaderContainerEl.addEventListener('click', eduScrollAction); }
  if (expEduDescEl) { expEduDescEl.style.cursor = 'pointer'; if (eduHeaderContainerEl !== expEduDescEl) expEduDescEl.addEventListener('click', eduScrollAction); }


  function createVineSideGauge() {
      const vineGaugeAndTextWrapper = document.querySelector('.vine-gauge-and-text-wrapper'); if (!vineGaugeAndTextWrapper) return;
      vineSideGaugeEl = document.getElementById('vineSideGauge');
      if (!vineSideGaugeEl) { vineSideGaugeEl = document.createElement('div'); vineSideGaugeEl.id = 'vineSideGauge'; }
      // Ensure it's the first child if it needs to be prepended
      if (vineGaugeAndTextWrapper.firstChild !== vineSideGaugeEl) { vineGaugeAndTextWrapper.insertBefore(vineSideGaugeEl, vineGaugeAndTextWrapper.firstChild); }

      vineSideGaugeEl.innerHTML = ''; // Clear previous content
      vineSideGaugeTrackContainerEl = document.createElement('div'); vineSideGaugeTrackContainerEl.className = 'vine-gauge-track-container'; vineSideGaugeEl.appendChild(vineSideGaugeTrackContainerEl);
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
      setTimeout(updateVineGaugeLayout, 100); // Allow DOM to settle
      updateVineSideGaugeActiveStateStyles(); // Initial style update
  }
  function updateVineSideGaugeActiveState(currentActiveStageMapIndex) {
      const newVineBlockIndex = vineGaugeStageMapIndices.indexOf(currentActiveStageMapIndex);
      currentVineGaugeActiveBlockIndex = newVineBlockIndex !== -1 ? newVineBlockIndex : -1;
      updateVineSideGaugeActiveStateStyles();
      updateVineSideGaugeThumbPosition();
  }
  function updateVineSideGaugeActiveStateStyles() { /* Block styling is via CSS active class if needed, thumb is positioned */ }
  
  function updateVineSideGaugeThumbPosition() {
      if (!vineSideGaugeThumbEl || !vineSideGaugeTrackContainerEl || vineSideGaugeBlocks.length === 0) { if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0'; return; }
      if (currentVineGaugeActiveBlockIndex === -1 || currentVineGaugeActiveBlockIndex >= vineSideGaugeBlocks.length || !vineSideGaugeBlocks[currentVineGaugeActiveBlockIndex]) { if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0'; return; }
      
      const activeBlock = vineSideGaugeBlocks[currentVineGaugeActiveBlockIndex];
      if (activeBlock) { // Check if activeBlock is found
          requestAnimationFrame(() => { // Use rAF for style changes based on layout
              const blockHeight = activeBlock.offsetHeight;
              const blockTop = activeBlock.offsetTop;
              if (blockHeight > 0) { // Ensure block has rendered height
                  vineSideGaugeThumbEl.style.top = `${blockTop}px`;
                  vineSideGaugeThumbEl.style.height = `${blockHeight}px`;
                  vineSideGaugeThumbEl.style.opacity = '1';
              } else {
                  vineSideGaugeThumbEl.style.opacity = '0'; // Hide if block has no height
              }
          });
      } else {
          if(vineSideGaugeThumbEl) vineSideGaugeThumbEl.style.opacity = '0'; // Hide if no active block
      }
  }


  const grapeVisualStoryColEl = document.querySelector('.grape-visual-story-col');
  if (grapeVisualStoryColEl && grapeTexts.length > 0) { createVineSideGauge(); }


  // ===================== Footer Functions & Observer =====================
  function scrollFooterImgToCenter() {
      const currentFooterImgEl = document.getElementById('grapeFooterImg');
      if (!currentFooterImgEl || currentFooterImgEl.offsetParent === null) return; // Check if element is visible
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      currentFooterImgEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }
  // Footer overlay animation functions (if used, currently no element with this ID in HTML)
  function startFooterOverlayAnimation() { if (!footerOverlayImageEl) return; stopFooterOverlayAnimation(); footerOverlayImageEl.style.opacity = '1'; footerOverlayImageEl.src = `images/footerx${currentFooterOverlayImg}.png`; footerOverlayIntervalId = setInterval(() => { currentFooterOverlayImg = currentFooterOverlayImg === 1 ? 2 : 1; footerOverlayImageEl.src = `images/footerx${currentFooterOverlayImg}.png`; }, 1000); }
  function stopFooterOverlayAnimation() { if (footerOverlayIntervalId) clearInterval(footerOverlayIntervalId); footerOverlayIntervalId = null; if (footerOverlayImageEl) footerOverlayImageEl.style.opacity = '0'; }

  const footerImgElGlobal = document.getElementById('grapeFooterImg');
  const footerTextElGlobal = document.getElementById('grapeFooterText');

  if (footerImgElGlobal && footerTextElGlobal) {
      const footerSteps = [ { text: "Now, this grape is being transformed—", start: 1, end: 4 }, { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 }, { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 } ];
      const totalFooterImageFrames = 14; const showTimePerStep = 1000; const pauseTimeAtEnd = 2000;
      let footerAnimationTimeoutId = null; let footerAutoScrolledByObserver = false;

      function animateFooterLoop() {
          clearTimeout(footerAnimationTimeoutId); let currentFooterImageFrame = 1;
          function nextFooterStep() {
              if (!footerImgElGlobal || !footerTextElGlobal) return;
              footerImgElGlobal.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`;
              let currentText = "";
              for (const step of footerSteps) { if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) { currentText = step.text; break; } }
              footerTextElGlobal.innerHTML = currentText; currentFooterImageFrame++;
              if (currentFooterImageFrame <= totalFooterImageFrames) { footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep); }
              else {
                  if (footerSteps.length > 0) { footerTextElGlobal.innerHTML = footerSteps[footerSteps.length - 1].text; }
                  footerImgElGlobal.src = `images/footer${totalFooterImageFrames}.png`;
                  footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
              }
          }
          nextFooterStep();
      }

      if ('IntersectionObserver' in window) {
          const footerObserver = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                  if (zoomState === 'zoomIn' || !footerImgElGlobal) return; const ratio = entry.intersectionRatio;
                  if (ratio > 0.15 && !footerAutoScrolledByObserver && !hasScrolledToFooterAfterPlantRootstock) { footerAutoScrolledByObserver = true; setTimeout(() => { scrollFooterImgToCenter(); }, 100); }
                  if (ratio > 0.45 && !footerZoomedIn) { footerZoomedIn = true; footerImgElGlobal.classList.add('zoomed-in'); footerImgElGlobal.classList.remove('zoomed-out'); animateFooterLoop(); }
                  else if (ratio <= 0.10 && (footerZoomedIn || footerAutoScrolledByObserver)) { clearTimeout(footerAnimationTimeoutId); footerZoomedIn = false; footerAutoScrolledByObserver = false; footerImgElGlobal.classList.remove('zoomed-in'); footerImgElGlobal.classList.add('zoomed-out');}
              });
          }, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05) });
          if (footerImgElGlobal) footerObserver.observe(footerImgElGlobal);
      }
      if (footerOverlayImageEl) { footerOverlayImageEl.style.opacity = '0'; } // Ensure overlay is hidden if not used
  }


  // ===================== Initial Setup Calls & Listeners =====================
  window.addEventListener('load', () => {
      if (typeof updateVineGaugeLayout === 'function') updateVineGaugeLayout();
      // Activate the "Intro" stage by default if needed, or let scroll activate first real section
      // activateStage(0, false); // This would set image 25 for grape and timeline bg initially
  });
  window.addEventListener('resize', () => {
      if (typeof updateVineGaugeLayout === 'function') { updateVineGaugeLayout(); }
  });

  if (heroBg) { // This check is already present, ensure it's correctly placed
      hideScrollDownButton();
      initialHeroSetup();
  }
});