document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const heroBg = document.querySelector('.hero-winery-bg');
    const heroSection = document.querySelector('.hero-section-winery');
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    const heroVideo = document.getElementById('heroVideo');
    const navHeader = document.querySelector('.nav-header');
    const resizableTimelineArea = document.querySelector('.resizable-timeline-area');
    let grapeImgElement = document.getElementById('central-timeline-image');
    const grapeTexts = document.querySelectorAll('#fixed-vine-gauge-container #vineStageList > div');
    const workExpHeaderFullEl_refactored = document.getElementById('work-exp-header-refactored');
    const eduHeaderContainerEl_refactored = document.getElementById('edu-header-refactored');
    const fixedVineGaugeContainer = document.getElementById('fixed-vine-gauge-container');
    const fixedGrapeImageContainer = document.querySelector('.fixed-image-container');
    const grapeFooterQuoteSection = document.querySelector('.grape-footer-quote');
    const workExperienceIntro = document.querySelector('.work-experience-intro.center');
    const experienceContentWrapper = document.querySelector('.experience-content-wrapper');

    // State Variables
    let zoomState = 'zoomOut';
    let vineAnimationCurrentlyPlaying = false;
    let ignoreIntersection = false;
    let autoScrollLock = false;
    let autoScrollTimeoutId = null;
    let hasInitialHeroAnimationPlayed = false;
    let userInteractedDuringAnimation = false;
    let isAutoScrollingToWorkExp = false;
    let isTimelineAreaVisible = false;
    let isHeroAreaDominant = true;
    let isFooterAreaDominant = false;

    // Constants
    const heroBgZoomInTransition = 'transform 5.0s cubic-bezier(.25,1,.5,1)';
    const heroBgZoomOutTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';
    const HERO_ZOOM_SCALE_FACTOR = 1.2;

    const stageMapping = [
        { name: "Intro", visualTextIndex: 0, rowKey: null, imgRange: [25, 25], isHeader: false, isIntro: true },
        { name: "WorkExpHeader", visualTextIndex: 1, rowKey: "work-exp-header-refactored", imgRange: [25, 25], isHeader: true },
        { name: "Ripening", visualTextIndex: 2, rowKey: "work-card-0", imgRange: [23, 24], isHeader: false },
        { name: "Fruit Set", visualTextIndex: 3, rowKey: "work-card-1", imgRange: [21, 22], isHeader: false },
        { name: "Vine Flowering", visualTextIndex: 4, rowKey: "work-card-2", imgRange: [18, 20], isHeader: false },
        { name: "Education Intro", visualTextIndex: 5, rowKey: "edu-header-refactored", imgRange: [17, 17], isHeader: true },
        { name: "Keep Growing", visualTextIndex: 6, rowKey: "edu-card-0", imgRange: [12, 17], isHeader: false },
        { name: "Bud break", visualTextIndex: 7, rowKey: "edu-card-1", imgRange: [5, 11], isHeader: false },
        { name: "Plant rootstock", visualTextIndex: 8, rowKey: "edu-card-2", imgRange: [1, 4], isHeader: false }
    ];

    stageMapping.forEach(s => { s.row = null; });

    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");

    let plantRootstockStageActive = false;
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');
    let footerZoomedIn = false;

    let _globalActiveStageIndex = -1;
    let _hoveredStageIndex = -1;
    let _activeImageLoopIntervalId = null;

    // --- Modal & Timeline ---
    const workCardsContainer = document.getElementById('work-experience-cards-container');
    const educationCardsContainer = document.getElementById('education-cards-container');
    const modalContainer = document.getElementById('experience-modal-container');
    const modalImageElement = document.getElementById('modal-image-element');
    const modalImageCounter = document.getElementById('modal-image-index');
    const modalTitle = document.getElementById('modal-title');
    const modalCompany = document.getElementById('modal-company');
    const modalDate = document.getElementById('modal-date');
    const modalField = document.getElementById('modal-field');
    const modalDescription = document.getElementById('modal-description');
    const modalTagsContainer = document.getElementById('modal-tags');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalPrevButton = document.getElementById('modal-prev-button');
    const modalNextButton = document.getElementById('modal-next-button');
    
    const modalCardNavContainer = document.getElementById('modal-card-nav');
    let allCardsData = []; 
    let currentModalIndex = -1;

    const placeholderImages = [
        ['images/1-1.png', 'images/1-2.png', 'images/1-3.png', 'images/1-4.png', 'images/1-5.png'],
        ['images/exp_placeholder_2.jpg'],
        ['images/exp_placeholder_3.jpg'],
        ['images/exp_placeholder_4.jpg'],
        ['images/exp_placeholder_5.jpg'],
        ['images/exp_placeholder_6.jpg']
    ];
    let imageCounter = 0;

    let currentModalImages = [];
    let currentImageIndex = 0;

    function getNextImage(itemTitle = "experience") {
        const assignedImages = placeholderImages[imageCounter % placeholderImages.length] || ['images/default_placeholder.jpg'];
        imageCounter++;
        return assignedImages[0];
    }

    function populateTimeline() {
        const workDataSource = document.querySelector('#original-work-exp-items');
        if (workDataSource && workCardsContainer) {
            const workItemsOriginal = workDataSource.querySelectorAll('.timeline-row');
            workItemsOriginal.forEach((item, index) => {
                const cardData = extractItemData(item, false, index);
                cardData.id = `work-card-${index}`;
                cardData.images = placeholderImages[allCardsData.length % placeholderImages.length] || [placeholderImages[0][0]];
                const timelineEntryElement = createTimelineEntry(cardData);
                workCardsContainer.appendChild(timelineEntryElement);
                allCardsData.push(cardData);
            });
        }

        const eduDataSource = document.querySelector('#original-edu-exp-items');
        if (eduDataSource && educationCardsContainer) {
            const eduItemsOriginal = eduDataSource.querySelectorAll('.edu-row');
            eduItemsOriginal.forEach((item, index) => {
                const cardData = extractItemData(item, true, index);
                cardData.id = `edu-card-${index}`;
                cardData.images = placeholderImages[allCardsData.length % placeholderImages.length] || [placeholderImages[0][0]];
                const timelineEntryElement = createTimelineEntry(cardData);
                educationCardsContainer.appendChild(timelineEntryElement);
                allCardsData.push(cardData);
            });
        }
    }

    function extractItemData(itemData, isEducation, index) {
        const title = itemData.querySelector(isEducation ? '.timeline-title.edu-title' : '.timeline-title')?.textContent || 'N/A';
        const company = itemData.querySelector(isEducation ? '.company.edu-org' : '.company')?.textContent || 'N/A';
        const date = itemData.querySelector(isEducation ? '.timeline-date.edu-date' : '.timeline-date')?.textContent || 'N/A';
        const field = itemData.querySelector(isEducation ? '.timeline-field.edu-role' : '.timeline-field')?.textContent || '';
        const descriptionHTML = itemData.querySelector(isEducation ? '.timeline-desc.edu-desc' : '.timeline-desc')?.innerHTML || '';
        const tagsSource = itemData.querySelector(isEducation ? '.timeline-tags.edu-tags' : '.timeline-tags');
        const tags = tagsSource ? Array.from(tagsSource.querySelectorAll('span')).map(span => span.textContent) : [];
        const representativeImage = getNextImage(title);
        return { title, company, date, field, descriptionHTML, tags, representativeImage, type: isEducation ? 'edu' : 'work', originalIndex: index, id: '' };
    }

    function createTimelineEntry(data) {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('timeline-entry');
        const dotDiv = document.createElement('div');
        dotDiv.classList.add('timeline-dot-new');
        entryDiv.appendChild(dotDiv);
        const cardElement = createMasonryCard(data);
        entryDiv.appendChild(cardElement);
        return entryDiv;
    }

    function createMasonryCard(data) {
        const card = document.createElement('div');
        card.classList.add('masonry-card');
        card.id = data.id;
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
        <div class="card-image-container">
            <img src="${data.representativeImage}" alt="${data.title}" class="card-image" onerror="this.style.display='none'; if(this.parentElement) this.parentElement.style.backgroundColor='#ddd';">
        </div>
        <div class="card-content">
            <h3 class="card-title">${data.title}</h3>
            <p class="card-company">${data.company}</p>
            <p class="card-date">${data.date}</p>
            <div class="card-tags">
                ${data.tags.map(tag => `<span>${tag}</span>`).join('')}
            </div>
        </div>`;
        card.addEventListener('click', () => {
            const scrollTarget = card.closest('.timeline-entry') || card;
            window.scrollElementToCenterPromise(scrollTarget)
                .then(() => {
                    openModal(data);
                    window.activateStageByCardId(data.id, false);
                })
                .catch(error => {
                    console.error("Scroll promise failed:", error);
                    openModal(data);
                    window.activateStageByCardId(data.id, false);
                });
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        return card;
    }
    
    function updateModalContents(data) {
        if (!data) return;
        modalTitle.textContent = data.title;
        modalCompany.textContent = data.company;
        modalDate.textContent = data.date;
        modalField.textContent = data.field;
        modalDescription.innerHTML = data.descriptionHTML;
        modalTagsContainer.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
        currentModalImages = data.images || [data.representativeImage];
        currentImageIndex = 0;
        updateModalImage();
        updateNavButtons();
    }
    
    function populateModalCardNav() {
        if (!modalCardNavContainer) return;
        modalCardNavContainer.innerHTML = '';
        allCardsData.forEach((item, index) => {
            const dot = document.createElement('div');
            dot.classList.add('modal-nav-dot');
            if (index === currentModalIndex) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => {
                switchToModalCard(index);
            });
            modalCardNavContainer.appendChild(dot);
        });
    }

    function switchToModalCard(newIndex) {
        if (newIndex >= 0 && newIndex < allCardsData.length) {
            currentModalIndex = newIndex;
            const newData = allCardsData[newIndex];
            updateModalContents(newData);
            populateModalCardNav(); 
    
            if (newData && newData.id) {
                const targetCardElement = document.getElementById(newData.id);
                if (targetCardElement && window.scrollElementToCenterPromise) {
                    const scrollTarget = targetCardElement.closest('.timeline-entry') || targetCardElement;
                    window.scrollElementToCenterPromise(scrollTarget);
                }
            }
        }
    }
    
    function openModal(data) {
        if (!modalContainer) return;
        currentModalIndex = allCardsData.findIndex(item => item.id === data.id);
        if (currentModalIndex === -1) return;

        updateModalContents(data);
        populateModalCardNav();
        modalContainer.classList.add('active');

        const descChunks = modalDescription.querySelectorAll('.meaning-chunk');
        descChunks.forEach((chunk, index) => {
            chunk.setAttribute('data-chunk-index', String(index));
            chunk.addEventListener('click', () => {
                const chunkIndex = parseInt(chunk.getAttribute('data-chunk-index') || '0', 10);
                if (!isNaN(chunkIndex) && chunkIndex >= 0 && chunkIndex < currentModalImages.length) {
                    currentImageIndex = chunkIndex;
                    updateModalImage();
                    updateNavButtons();
                }
            });
        });
    }

    function updateModalImage() {
        if (modalImageElement && currentModalImages && currentModalImages.length > 0) {
            modalImageElement.src = currentModalImages[currentImageIndex];
            modalImageElement.alt = `Image ${currentImageIndex + 1} for ${modalTitle.textContent}`;
            if (modalImageCounter) {
                modalImageCounter.textContent = `${currentImageIndex + 1} / ${currentModalImages.length}`;
            }
        } else if (modalImageCounter) {
            modalImageCounter.textContent = '';
        }
    }

    function updateNavButtons() {
        if (modalPrevButton && modalNextButton) {
            const hasMultipleImages = currentModalImages && currentModalImages.length > 1;
            modalPrevButton.style.display = hasMultipleImages ? 'block' : 'none';
            modalNextButton.style.display = hasMultipleImages ? 'block' : 'none';
        }
    }

    function closeModal() {
        if (modalContainer) {
            modalContainer.classList.remove('active');
        }
    }

    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) closeModal();
        });
    }
    if (modalPrevButton) {
        modalPrevButton.addEventListener('click', () => {
            if (currentModalImages && currentModalImages.length > 0) {
                currentImageIndex = (currentImageIndex - 1 + currentModalImages.length) % currentModalImages.length;
                updateModalImage();
            }
        });
    }
    if (modalNextButton) {
        modalNextButton.addEventListener('click', () => {
            if (currentModalImages && currentModalImages.length > 0) {
                currentImageIndex = (currentImageIndex + 1) % currentModalImages.length;
                updateModalImage();
            }
        });
    }
    document.addEventListener('keydown', (e) => {
        if (modalContainer && modalContainer.classList.contains('active')) {
            if (e.key === 'Escape') closeModal();
            else if (e.key === 'ArrowLeft' && modalPrevButton) modalPrevButton.click();
            else if (e.key === 'ArrowRight' && modalNextButton) modalNextButton.click();
        }
    });

    // --- Functions from experience1.js (Hero, Scroll, Stage Management) ---
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
                heroVideo.addEventListener('error', () => { onVideoReady(); }, { once: true });
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
            heroBg.style.transition = heroBgZoomInTransition;
            heroBg.style.transform = `scale(${HERO_ZOOM_SCALE_FACTOR})`;
            zoomState = 'zoomIn';
            if (navHeader) navHeader.classList.add('experience-header-hidden-override');
            showScrollDownButton();
        }
    }

    function heroZoomOut() {
        if (heroBg && zoomState === 'zoomIn') {
            heroBg.style.transition = heroBgZoomOutTransition;
            heroBg.style.transform = 'scale(0.9)';
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
        let scrollTargetElement;
        if (targetStage && targetStage.row) {
            scrollTargetElement = targetStage.row.closest('.timeline-entry') || targetStage.row;
        } else {
            scrollTargetElement = document.getElementById('work-experience-section-refactored');
        }

        if (scrollTargetElement && window.smoothScrollToElement) {
            window.smoothScrollToElement(scrollTargetElement, 'start', () => {
                playVineLoadAnimationThenActivateFirstStage(() => {
                    activateStage(workExpHeaderStageIdx, false, true);
                    isAutoScrollingToWorkExp = false;
                });
            });
        } else {
            playVineLoadAnimationThenActivateFirstStage(() => {
                activateStage(workExpHeaderStageIdx, true, true);
                isAutoScrollingToWorkExp = false;
            });
        }
        userInteractedDuringAnimation = false;
    }

    if (heroSection) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isHeroAreaDominant = entry.isIntersecting;
                 
                if (isHeroAreaDominant && window.scrollY < window.innerHeight / 2 && hasInitialHeroAnimationPlayed && zoomState === 'zoomOut' && !isAutoScrollingToWorkExp) {
                    heroZoomIn();
                }
            });
            updateFixedElementsDisplay();
        }, { threshold: [0, 0.5, 1.0] });
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
        if (navHeader && !navHeader.classList.contains('experience-header-hidden-override')) {
            if (currentScrollY > lastScrollYGlobal && currentScrollY > navHeader.offsetHeight) {
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
        updateFixedElementsDisplay();
    }, { passive: true });

    function updateFixedElementsDisplay() {
        // Control for the fixed image container is now separate from the gauge.
        const showFixedImage = isTimelineAreaVisible && !isHeroAreaDominant && !isFooterAreaDominant;
        
        if (fixedGrapeImageContainer) {
            fixedGrapeImageContainer.classList.toggle('visible', showFixedImage);
            updateFixedImagePosition();
        }
        alignWorkIntro();
    }
    
    // NEW: Observer specifically for the vine gauge container visibility
    if (experienceContentWrapper) {
        const gaugeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (fixedVineGaugeContainer) {
                    fixedVineGaugeContainer.classList.toggle('visible', entry.isIntersecting);
                }
            });
        }, { threshold: 0.01, rootMargin: "-600px 0px -100px 0px" }); // Appears when the wrapper is 100px into view
        gaugeObserver.observe(experienceContentWrapper);
    }

    function updateFixedImagePosition() {
        const dragger = document.getElementById('timeline-dragger');
        const resizableArea = document.querySelector('.resizable-timeline-area');
        if (fixedGrapeImageContainer && dragger && resizableArea) {
            const draggerRect = dragger.getBoundingClientRect();
            const resizableAreaRect = resizableArea.getBoundingClientRect();
            const draggerRight = draggerRect.right - resizableAreaRect.left;
            fixedGrapeImageContainer.style.left = `${draggerRight+280}px`;
            fixedGrapeImageContainer.style.right = `${draggerRight-80}px`;
            fixedGrapeImageContainer.style.bottom = '20px';
        }
    }

    if (resizableTimelineArea) {
        const timelineAreaObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                isTimelineAreaVisible = entry.isIntersecting;
                if (entry.isIntersecting && heroSection) {
                    const heroRect = heroSection.getBoundingClientRect();
                    if (zoomState === 'zoomIn' && heroRect.bottom < (window.innerHeight * 0.85) && 
                        !isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) {
                        triggerHeroToWorkExpSequence();
                    }
                }
                updateFixedElementsDisplay();
            });
        }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
        timelineAreaObserver.observe(resizableTimelineArea);
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
            if (userInteractedDuringAnimation) {
                vineAnimationCurrentlyPlaying = false;
                window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
                if (typeof cb === 'function') cb();
                return;
            }
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
            if (grapeImgElement && !vineAnimationCurrentlyPlaying) grapeImgElement.style.opacity = '0';
            return;
        }

        const stageToDisplay = stageMapping[displayStageIndex];
        if (!stageToDisplay) return;

        if (grapeImgElement) grapeImgElement.style.opacity = '0.85';

        grapeTexts.forEach((textEl, idx) => {
            const isActive = stageToDisplay.visualTextIndex !== -1 && idx === stageToDisplay.visualTextIndex;
            textEl.classList.toggle('active', isActive);
            if (isActive && fixedVineGaugeContainer && fixedVineGaugeContainer.classList.contains('visible')) {
                const listParent = textEl.closest('.fade-in-list');
                if (listParent && listParent.scrollHeight > listParent.clientHeight) {
                    textEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        });

        if (grapeImgElement && stageToDisplay.imgRange) {
            const [start, end] = stageToDisplay.imgRange;
            let imagesInLoop = [];
            if (stageToDisplay.name === "Intro") imagesInLoop.push(stageToDisplay.imgRange[0] || 25);
            else if (stageToDisplay.name === "Ripening" || stageToDisplay.name === "Fruit Set") imagesInLoop.push(end, start);
            else if (["Vine Flowering", "Keep Growing", "Bud break", "Plant rootstock"].includes(stageToDisplay.name)) {
                for (let i = end; i >= start; i--) imagesInLoop.push(i);
            } else if (stageToDisplay.isHeader) imagesInLoop.push(stageToDisplay.imgRange[0] || 25);
            else imagesInLoop.push(start);

            if (imagesInLoop.length === 0 && stageToDisplay.imgRange && stageToDisplay.imgRange.length > 0) imagesInLoop.push(stageToDisplay.imgRange[0]);
            else if (imagesInLoop.length === 0) imagesInLoop.push(1);

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
            document.querySelectorAll('.masonry-card.active-stage-highlight, .timeline-entry.active-timeline-item').forEach(el =>
                el.classList.remove('active-stage-highlight', 'active-timeline-item')
            );
            if (stageToDisplay.row) {
                const parentEntry = stageToDisplay.row.closest('.timeline-entry');
                if (parentEntry) parentEntry.classList.add('active-timeline-item');
                if (!stageToDisplay.isHeader && stageToDisplay.row.classList.contains('masonry-card')) {
                    stageToDisplay.row.classList.add('active-stage-highlight');
                }
            }
        }
    }

    function activateStage(idx, autoScrollToStage = false, isInitialHeroTransition = false) {
        if (idx < 0 || idx >= stageMapping.length || !stageMapping[idx]) {
            if (_globalActiveStageIndex !== -1) {
                _globalActiveStageIndex = -1;
                if (_hoveredStageIndex === -1) setActiveStageVisuals(-1, false);
            }
            return;
        }

        _globalActiveStageIndex = idx;
        const currentStageDetails = stageMapping[_globalActiveStageIndex];

        plantRootstockStageActive = (currentStageDetails.name === "Plant rootstock");

        if (zoomState === 'zoomIn' && !currentStageDetails.isIntro && !isInitialHeroTransition) {
            heroZoomOut();
        }

        if (_hoveredStageIndex === -1) {
            setActiveStageVisuals(_globalActiveStageIndex, false);
        } else {
            document.querySelectorAll('.masonry-card.active-stage-highlight, .timeline-entry.active-timeline-item').forEach(el =>
                el.classList.remove('active-stage-highlight', 'active-timeline-item')
            );
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
                let scrollPosition = 'center';
                if (currentStageDetails.name === "WorkExpHeader" && isInitialHeroTransition) scrollPosition = 'start';
                else if (currentStageDetails.isHeader) scrollPosition = 'center';
                else scrollPosition = 'center';
                if (window.smoothScrollToElement) {
                    const scrollDelay = (isInitialHeroTransition || vineAnimationCurrentlyPlaying) ? 300 : 100;
                    setTimeout(() => {
                        window.smoothScrollToElement(elementToActuallyScroll, scrollPosition);
                    }, scrollDelay);
                }
            }
        }

        ignoreIntersection = true;
        setTimeout(() => { ignoreIntersection = false; }, 800);
    }

    window.activateStageByCardId = function(cardId, autoScroll = false) {
        const stageIndex = stageMapping.findIndex(s => s.rowKey === cardId);
        if (stageIndex !== -1) {
            userInteractedDuringAnimation = false;
            activateStage(stageIndex, autoScroll);
        }
    };

    function alignWorkIntro() {
        const intro = workExperienceIntro;
        const timelineColumn = document.getElementById('timeline-left-pane');
        const resizableArea = document.querySelector('.resizable-timeline-area');

        if (intro && timelineColumn && resizableArea) {
            const timelineColumnRect = timelineColumn.getBoundingClientRect();
            const introContainerRect = intro.parentElement.getBoundingClientRect();

            const timelineColumnCenterX_viewport = timelineColumnRect.left + timelineColumnRect.width / 2;
            const introWidth = intro.offsetWidth;
            let desiredIntroLeft_viewport = timelineColumnCenterX_viewport - (introWidth / 2);
            let newMarginLeft = desiredIntroLeft_viewport - introContainerRect.left;
            newMarginLeft = Math.max(0, newMarginLeft);
            intro.style.marginLeft = `${newMarginLeft}px`;
        }
    }

    window.smoothScrollToElement = function(element, position = 'center', callback) {
        if (!element) {
            if (typeof callback === 'function') callback();
            return;
        }

        let yOffset;
        const elementRect = element.getBoundingClientRect();
        const elementHeight = elementRect.height;
        const viewportHeight = window.innerHeight;
        const isNavVisible = navHeader && getComputedStyle(navHeader).visibility !== 'hidden' && getComputedStyle(navHeader).opacity !== '0' && !navHeader.classList.contains('experience-header-hidden-override');
        const navHeightCurrent = isNavVisible ? navHeader.offsetHeight : 0;

        if (position === 'bottom') yOffset = viewportHeight * 0.75 - elementHeight;
        else if (position === 'top' || position === 'start') yOffset = viewportHeight * 0.20;
        else yOffset = (viewportHeight - elementHeight) / 2;

        let scrollToY = elementRect.top + window.scrollY - yOffset;
        
        if (position === 'start' && navHeightCurrent > 0) {
            scrollToY -= navHeightCurrent;
        }
        
        scrollToY = Math.max(0, scrollToY);

        if (Math.abs(window.scrollY - scrollToY) < 1) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        let scrollEndTime = 0;
        const handleScrollEnd = () => {
            window.removeEventListener('scroll', handleScrollActivity);
            if ('onscrollend' in window) {
                window.removeEventListener('scrollend', handleScrollEnd);
            }
            clearTimeout(scrollEndTime);
            if (typeof callback === 'function') {
                callback();
            }
        };

        const handleScrollActivity = () => {
            clearTimeout(scrollEndTime);
            scrollEndTime = setTimeout(handleScrollEnd, 150);
        };

        if ('onscrollend' in window) {
            window.addEventListener('scrollend', handleScrollEnd, { once: true });
        } else {
            window.addEventListener('scroll', handleScrollActivity);
            scrollEndTime = setTimeout(handleScrollEnd, 600);
        }

        window.scrollTo({ top: scrollToY, behavior: 'smooth' });
    };

    window.scrollElementToCenterPromise = function(element) {
        return new Promise((resolve, reject) => {
            if (!element) {
                reject(new Error("No element provided to scrollElementToCenterPromise"));
                return;
            }
            const scrollTarget = element.closest('.timeline-entry') || element;
            window.smoothScrollToElement(scrollTarget, 'center', resolve);
        });
    };

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

        function animateFooterLoop() {
            clearTimeout(footerAnimationTimeoutId);
            let currentFooterImageFrame = 1;
            function nextFooterStep() {
                if (!footerImgEl || !footerTextEl || !footerZoomedIn) {
                    clearTimeout(footerAnimationTimeoutId); return;
                }
                footerImgEl.src = `images/footer${Math.min(currentFooterImageFrame, totalFooterImageFrames)}.png`;
                let currentText = "";
                for (const step of footerSteps) {
                    if (currentFooterImageFrame >= step.start && currentFooterImageFrame <= step.end) {
                        currentText = step.text; break;
                    }
                }
                footerTextEl.innerHTML = currentText;
                currentFooterImageFrame++;
                if (currentFooterImageFrame <= totalFooterImageFrames) {
                    footerAnimationTimeoutId = setTimeout(nextFooterStep, showTimePerStep);
                } else {
                    if (footerSteps.length > 0) footerTextEl.innerHTML = footerSteps[footerSteps.length - 1].text;
                    footerImgEl.src = `images/footer${totalFooterImageFrames}.png`;
                    footerAnimationTimeoutId = setTimeout(animateFooterLoop, pauseTimeAtEnd);
                }
            }
            nextFooterStep();
        }
        
        const footerImgObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (zoomState === 'zoomIn' || !footerImgEl) return;
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.5 && !footerZoomedIn) {
                    footerZoomedIn = true;
                    if (!footerImgEl.classList.contains('zoomed-in')) {
                        scrollFooterImgToCenter();
                        footerImgEl.classList.add('zoomed-in');
                        animateFooterLoop();
                    }
                } else if (!entry.isIntersecting && footerZoomedIn) {
                    clearTimeout(footerAnimationTimeoutId);
                    footerZoomedIn = false;
                    footerImgEl.classList.remove('zoomed-in');
                }
            });
        }, { threshold: [0.5, 0.55] });
        if (footerImgEl) footerImgObserver.observe(footerImgEl);
    }

    let initialLeftPaneWidthForDragger = 0;
    function initResizablePanes() {
        const leftPane = document.getElementById('timeline-left-pane');
        const rightPane = document.getElementById('timeline-right-pane');
        const dragger = document.getElementById('timeline-dragger');
        const resizableArea = document.querySelector('.resizable-timeline-area');
        if (!leftPane || !rightPane || !dragger || !resizableArea) return;
        let isDragging = false, startX, startY, startLeftSize, startRightSize, isVerticalDrag = false;

        dragger.addEventListener('mousedown', (e) => {
            e.preventDefault(); isDragging = true;
            isVerticalDrag = getComputedStyle(resizableArea).flexDirection === 'column';
            if (initialLeftPaneWidthForDragger === 0 && leftPane.offsetWidth > 0) {
                initialLeftPaneWidthForDragger = leftPane.offsetWidth;
            } else if (leftPane.offsetWidth > 0) {
                initialLeftPaneWidthForDragger = leftPane.offsetWidth;
            }
            if (isVerticalDrag) { startY = e.clientY; startLeftSize = leftPane.offsetHeight; startRightSize = rightPane.offsetHeight; }
            else { startX = e.clientX; startLeftSize = leftPane.offsetWidth; startRightSize = rightPane.offsetWidth; }
            document.body.style.cursor = isVerticalDrag ? 'row-resize' : 'col-resize';
            leftPane.style.transition = 'none'; rightPane.style.transition = 'none';
            if (dragger) dragger.style.backgroundColor = '#aaa';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return; e.preventDefault();
            let newLeftPaneSize;
            if (isVerticalDrag) {
                // Vertical drag logic (not primary for this layout)
            } else {
                const dx = e.clientX - startX;
                newLeftPaneSize = startLeftSize + dx;
                let newRightPaneSize = startRightSize - dx;
                const minLeft = parseFloat(getComputedStyle(leftPane).minWidth) || 50;
                const minRight = parseFloat(getComputedStyle(rightPane).minWidth) || 20;
                const totalWidth = resizableArea.offsetWidth - dragger.offsetWidth;
                if (newLeftPaneSize < minLeft) { newLeftPaneSize = minLeft; newRightPaneSize = totalWidth - newLeftPaneSize; }
                else if (newRightPaneSize < minRight) { newRightPaneSize = minRight; newLeftPaneSize = totalWidth - newRightPaneSize; }
                leftPane.style.flexBasis = `${newLeftPaneSize}px`; rightPane.style.flexBasis = `${newRightPaneSize}px`;
            }

            if (!isVerticalDrag && fixedGrapeImageContainer && initialLeftPaneWidthForDragger > 0) {
                const currentLeftPaneWidth = newLeftPaneSize;
                const basePaneWidth = initialLeftPaneWidthForDragger;
                const minPaneAllowedWidth = parseFloat(getComputedStyle(leftPane).minWidth) || 600;

                const maxImageSize = 800;
                const minImageSize = 150;
                let targetImageSize;
                if (currentLeftPaneWidth <= minPaneAllowedWidth) {
                    targetImageSize = maxImageSize;
                } else if (currentLeftPaneWidth >= basePaneWidth) {
                    targetImageSize = minImageSize;
                } else {
                    const shrinkProgress = (basePaneWidth - currentLeftPaneWidth) / (basePaneWidth - minPaneAllowedWidth);
                    targetImageSize = minImageSize + shrinkProgress * (maxImageSize - minImageSize);
                }
                targetImageSize = Math.max(minImageSize, Math.min(targetImageSize, maxImageSize));
                fixedGrapeImageContainer.style.width = `${targetImageSize}px`;
                fixedGrapeImageContainer.style.height = `${targetImageSize}px`;
                updateFixedImagePosition();
            }
            alignWorkIntro();
        }

        function onMouseUp() {
            if (!isDragging) return; isDragging = false;
            document.body.style.cursor = 'default';
            leftPane.style.transition = ''; rightPane.style.transition = '';
            if (dragger) dragger.style.backgroundColor = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            alignWorkIntro();
            initialLeftPaneWidthForDragger = leftPane.offsetWidth;
            updateFixedImagePosition();
        }
    }

    let scalableElementsStore = [];
    let initialLeftPaneWidthForScaling = 0;
    let initialCardImageHeightVarValue = 0;
    function initResponsiveCardScaling() {
        const leftPane = document.getElementById('timeline-left-pane');
        if (!leftPane || typeof ResizeObserver === 'undefined') return;
        const cards = document.querySelectorAll('.masonry-card'); scalableElementsStore = [];
        function debounce(func, delay) { let timeout; return function(...args) { const context = this; clearTimeout(timeout); timeout = setTimeout(() => func.apply(context, args), delay); }; }
        if (initialLeftPaneWidthForScaling === 0 && leftPane.offsetWidth > 0) initialLeftPaneWidthForScaling = leftPane.offsetWidth;
        if (scalableElementsStore.length === 0 && cards.length > 0) {
            cards.forEach(card => {
                [...card.querySelectorAll('.card-title, .card-company, .card-date, .card-tags span')].forEach(el => {
                    const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                    if (!isNaN(fontSize)) scalableElementsStore.push({ element: el, initialFontSize: fontSize });
                });
            });
            const root = document.documentElement; const cardImageHeightString = getComputedStyle(root).getPropertyValue('--card-image-height').trim();
            if (cardImageHeightString) initialCardImageHeightVarValue = parseFloat(cardImageHeightString);
            if (isNaN(initialCardImageHeightVarValue)) initialCardImageHeightVarValue = 180;
        }
        const debouncedResizeHandler = debounce((currentWidth) => {
            if (initialLeftPaneWidthForScaling === 0 && currentWidth > 0) {
                initialLeftPaneWidthForScaling = currentWidth;
            }
            if (initialLeftPaneWidthForScaling === 0) return;
            const scaleFactor = currentWidth / initialLeftPaneWidthForScaling;
            scalableElementsStore.forEach(item => {
                if (item.element && typeof item.initialFontSize === 'number' && !isNaN(item.initialFontSize)) {
                    let newSize = item.initialFontSize * scaleFactor;
                    newSize = Math.max(14, Math.min(newSize, item.initialFontSize * 1.5));
                    item.element.style.fontSize = newSize + 'px';
                }
            });
    
            updateFixedImagePosition();
        }, 50);
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) if (entry.target === leftPane) debouncedResizeHandler(entry.contentRect.width);
        });
        resizeObserver.observe(leftPane);
        if (leftPane.offsetWidth > 0) debouncedResizeHandler(leftPane.offsetWidth);
    }

    function adjustTimelineLineStart() {
        const timelineColumn = document.querySelector('.timeline-items-column'); if (!timelineColumn) return;
        let firstActualItemEntry = null;
        const potentialEntries = timelineColumn.querySelectorAll('.timeline-section .timeline-entry');
        for (let entry of potentialEntries) if (entry.querySelector('.masonry-card')) { firstActualItemEntry = entry; break; }
        if (firstActualItemEntry) {
            const dotElement = firstActualItemEntry.querySelector('.timeline-dot-new');
            let dotTopOffsetWithinEntry = dotElement ? dotElement.offsetTop + (dotElement.offsetHeight / 2) : 10;
            const lineStartOffset = firstActualItemEntry.offsetTop + dotTopOffsetWithinEntry;
            timelineColumn.style.setProperty('--timeline-line-start-offset', `${lineStartOffset}px`);
        } else timelineColumn.style.setProperty('--timeline-line-start-offset', `50px`);
    }

    function finalizePageSetup() {
        stageMapping.forEach(stage => {
            if (stage.rowKey) {
                stage.row = document.getElementById(stage.rowKey);
                if (!stage.row) {
                    console.warn(`finalizePageSetup: Row not found for stage: ${stage.name}, rowKey: ${stage.rowKey}`);
                }
            }
        });
    
        if ('IntersectionObserver' in window && stageMapping.some(s => s.row && !s.isHeader && !s.isIntro)) {
            const obsCallback = (entries) => {
                if (ignoreIntersection || vineAnimationCurrentlyPlaying || zoomState === 'zoomIn' || autoScrollLock || isAutoScrollingToWorkExp) return;
                let bestEntry = null; let minDistToCenter = Infinity;
                const viewportCenterY = window.innerHeight / 2; const centerZoneThreshold = window.innerHeight * 0.25;
                entries.forEach(entry => {
                    const targetCard = entry.target; const rect = targetCard.getBoundingClientRect();
                    const cardCenterY = rect.top + rect.height / 2;
                    const isInCenterZone = cardCenterY > centerZoneThreshold && cardCenterY < (window.innerHeight - centerZoneThreshold);
                    if (entry.isIntersecting && isInCenterZone) {
                        const dist = Math.abs(cardCenterY - viewportCenterY);
                        if (dist < minDistToCenter) { minDistToCenter = dist; bestEntry = targetCard; }
                    }
                });
                if (bestEntry) {
                    const idx = stageMapping.findIndex(m => m.row === bestEntry);
                    if (idx !== -1 && stageMapping[idx] && !stageMapping[idx].isIntro && _globalActiveStageIndex !== idx) {
                        activateStage(idx, false); autoScrollLock = true;
                        if (autoScrollTimeoutId) clearTimeout(autoScrollTimeoutId);
                        autoScrollTimeoutId = setTimeout(() => autoScrollLock = false, 1000);
                    }
                }
            };
            const cardObserver = new IntersectionObserver(obsCallback, { threshold: Array.from({ length: 21 }, (_, i) => i * 0.05), rootMargin: "-20% 0px -20% 0px" });
            stageMapping.forEach(m => { if (m.row && m.rowKey && !m.isHeader && !m.isIntro && m.row.classList.contains('masonry-card')) cardObserver.observe(m.row); });
        }
    
        grapeTexts.forEach((textEl, visualIndexInList) => {
            const stageIndex = stageMapping.findIndex(s => s.visualTextIndex === visualIndexInList);
            if (stageIndex !== -1 && stageMapping[stageIndex]) {
                textEl.style.cursor = 'pointer';
                textEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const clickedStage = stageMapping[stageIndex];
                    if (!clickedStage.isIntro && !isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) {
                        userInteractedDuringAnimation = false;
                        _hoveredStageIndex = -1;
                        activateStage(stageIndex, true);
                    }
                });
            }
        });
    
        const hoverableElements = [];
        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1 && stageMapping[workExpHeaderStageIdx]) hoverableElements.push({ element: workExpHeaderFullEl_refactored, stageIndex: workExpHeaderStageIdx });
        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1 && stageMapping[eduIntroStageMapIndex]) hoverableElements.push({ element: eduHeaderContainerEl_refactored, stageIndex: eduIntroStageMapIndex });
        stageMapping.forEach((stage, index) => { if (stage.row && !stage.isHeader && !stage.isIntro && stage.row.classList.contains('masonry-card')) hoverableElements.push({ element: stage.row, stageIndex: index }); });
        hoverableElements.forEach(item => {
            if (item.element) {
                item.element.addEventListener('mouseenter', () => {
                    if (isAutoScrollingToWorkExp || vineAnimationCurrentlyPlaying) return;
                    _hoveredStageIndex = item.stageIndex; setActiveStageVisuals(_hoveredStageIndex, true);
                });
                item.element.addEventListener('mouseleave', () => {
                    if (isAutoScrollingToWorkExp || vineAnimationCurrentlyPlaying) return;
                    _hoveredStageIndex = -1; setActiveStageVisuals(_globalActiveStageIndex, false);
                });
            }
        });
    
        // [수정됨] workExpHeaderFullEl_refactored 클릭 리스너
        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1) {
            workExpHeaderFullEl_refactored.style.cursor = 'pointer';
            workExpHeaderFullEl_refactored.addEventListener('click', (e) => {
                // 클릭된 대상이 .meaning-chunk이면 아무것도 하지 않고 이벤트를 상위로 보냅니다.
                if (e.target.closest('.meaning-chunk')) {
                    return;
                }
                e.stopPropagation(); // .meaning-chunk가 아닐 때만 이벤트 전파를 막습니다.
                _hoveredStageIndex = -1;
                if (!isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) {
                    if (zoomState === 'zoomIn') triggerHeroToWorkExpSequence();
                    else { userInteractedDuringAnimation = false; activateStage(workExpHeaderStageIdx, true); }
                }
            });
        }
    
        // [수정됨] eduHeaderContainerEl_refactored 클릭 리스너
        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1) {
            eduHeaderContainerEl_refactored.style.cursor = 'pointer';
            eduHeaderContainerEl_refactored.addEventListener('click', (e) => {
                // 클릭된 대상이 .meaning-chunk이면 아무것도 하지 않고 이벤트를 상위로 보냅니다.
                if (e.target.closest('.meaning-chunk')) {
                    return;
                }
                e.stopPropagation(); // .meaning-chunk가 아닐 때만 이벤트 전파를 막습니다.
                _hoveredStageIndex = -1;
                if (zoomState === 'zoomIn' && !isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) heroZoomOut();
                userInteractedDuringAnimation = false;
                if (!isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) activateStage(eduIntroStageMapIndex, true);
            });
        }
    
        initResizablePanes();
        setTimeout(() => {
            initResponsiveCardScaling();
            adjustTimelineLineStart();
            alignWorkIntro();
            const introStageIdx = stageMapping.findIndex(s => s.isIntro);
            if (introStageIdx !== -1 && _globalActiveStageIndex === -1 && !isAutoScrollingToWorkExp && !vineAnimationCurrentlyPlaying) {
                activateStage(introStageIdx, false);
            }
            updateFixedElementsDisplay();
        }, 150);
    }

    // --- Lottie Animation ---
    const lottieContainer = document.getElementById('lottie-footer');
    if(lottieContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'experiencelottie.json' 
        });
    }

    // --- Initializations ---
    populateTimeline();
    finalizePageSetup();
    if (heroBg) initialHeroSetup();
});