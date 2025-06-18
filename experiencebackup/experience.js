// experience.js
// This file serves as the main entry point, orchestrating the initialization
// and coordination of all other modules. It declares global state variables
// and DOM element references that need to be shared across different parts
// of the application.

import { initHeroSection, heroZoomIn, heroZoomOut, triggerHeroToWorkExpSequence, forceHeroSectionSync } from './hero.js';
import { populateTimeline, initResizablePanes, initResponsiveCardScaling, adjustTimelineLineStart, alignWorkIntro, activateStage, setActiveStageVisuals, setGrapeImage, stopAllImageLoops, playVineLoadAnimationThenActivateFirstStage, initTimelineModule, updateFixedImageSizeBasedOnLeftPane } from './timeline.js';
import { initCardResizeHandles, getNextImageSet, setCardDescriptionSummary, createMasonryCard } from './card.js';
import { openModal, closeModal, updateModalContents, updateModalImage, updateNavButtons, populateModalCardNav, switchToModalCard, initModalModule } from './modal.js';
import { initFixedGrapeImage, updateFixedElementsDisplay, updateFixedImagePosition } from './fixedGrapeImage.js';
import { initFooterAnimation } from './footer.js';
import { smoothScrollToElement, scrollElementToCenterPromise, debounce } from './utils.js';


// --- Global State Variables (Managed centrally) ---
// These are directly exported and will be imported by other modules.
export const globalState = {
    zoomState: 'zoomOut',
    vineAnimationCurrentlyPlaying: false,
    ignoreIntersection: false,
    autoScrollLock: false,
    autoScrollTimeoutId: null,
    hasInitialHeroAnimationPlayed: false,
    userInteractedDuringAnimation: false,
    isAutoScrollingToWorkExp: false,
    isTimelineAreaVisible: false,
    isHeroAreaVisible: true, // This flag is for the hero section's *general* visibility, not for triggering transition
    isFooterAreaDominant: false,
    plantRootstockStageActive: false,
    footerZoomedIn: false,
    _globalActiveStageIndex: -1,
    _hoveredStageIndex: -1,
    _activeImageLoopIntervalId: null,
    allCardsData: [], // Stores all card data for modal navigation
    currentModalIndex: -1,
    currentModalImages: [],
    currentImageIndex: 0,
    initialLeftPaneWidthForDragger: 0,
    isDraggingRight: false,
    isDraggingLeft: false,
    isDraggingFixedImage: false,
    isResizingFixedImage: false,
    resizeDirection: '',
    initialPointerX: 0, initialPointerY: 0,
    initialFixedImageLeft: 0, initialFixedImageTop: 0,
    initialFixedImageWidth: 0, initialFixedImageHeight: 0,
    isClickEvent: true,
    borderRadiusIndex: 0,
    isResizingCard: false,
    startX: 0, startImageWidth: 0, startCardWidth: 0,
    scalableElementsStore: [],
    initialLeftPaneWidthForScaling: 0,
    initialCardImageHeightVarValue: 0,
};

// Helper to update global state properties
export const setGlobalState = (updates) => {
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(globalState, key)) {
            globalState[key] = updates[key];
        } else {
            console.warn(`Attempted to set non-existent global state property: ${key}`);
        }
    }
};


document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements (Shared globally or passed as needed) ---
    const heroBg = document.querySelector('.hero-winery-bg');
    const heroSection = document.querySelector('.hero-section-winery');
    const scrollDownBtn = document.querySelector('.scroll-down-btn');
    const heroVideo = document.getElementById('heroVideo');
    const navHeader = document.querySelector('.nav-header');
    const resizableTimelineArea = document.querySelector('.resizable-timeline-area');
    const grapeImgElement = document.getElementById('central-timeline-image');
    const grapeTexts = document.querySelectorAll('#fixed-vine-gauge-container #vineStageList > div');
    const workExpHeaderFullEl_refactored = document.getElementById('work-exp-header-refactored');
    const eduHeaderContainerEl_refactored = document.getElementById('edu-header-refactored');
    const fixedVineGaugeContainer = document.getElementById('fixed-vine-gauge-container');
    const fixedGrapeImageContainer = document.querySelector('.fixed-image-container');
    const grapeFooterQuoteSection = document.querySelector('.grape-footer-quote');
    const workExperienceIntro = document.querySelector('.work-experience-intro.center');
    const experienceContentWrapper = document.querySelector('.experience-content-wrapper');

    // Dragger elements for timeline
    const leftPane = document.getElementById('timeline-left-pane');
    const rightPane = document.getElementById('timeline-right-pane');
    const draggerRight = document.getElementById('timeline-dragger');
    const leftDragger = document.getElementById('timeline-dragger-left');

    // Modal Elements
    const modalContainer = document.getElementById('experience-modal-container');
    const modalImageElement = document.getElementById('modal-image-element');
    const modalImageCounter = document.getElementById('modal-image-index');
    const modalTitle = document.getElementById('modal-title');
    const modalCompany = document.getElementById('modal-company');
    const modalDurationDisplay = document.getElementById('modal-duration-display');
    const modalDurationPeriod = document.getElementById('modal-duration-period');
    const modalFieldLabel = document.getElementById('modal-field-label');
    const modalField = document.getElementById('modal-field');
    const modalLocation = document.getElementById('modal-location');
    const modalDescription = document.getElementById('modal-description');
    const modalTagsContainer = document.getElementById('modal-tags');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalPrevButton = document.getElementById('modal-prev-button');
    const modalNextButton = document.getElementById('modal-next-button');
    const modalCardNavContainer = document.getElementById('modal-card-nav');

    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');

    const dragInstructionElement = document.getElementById('drag-instruction');

    // --- Constants ---
    const HERO_ZOOM_SCALE_FACTOR = 1.2;
    const DRAGGER_WIDTH = 12;
    const MOVE_THRESHOLD = 5;
    const RESIZE_HANDLE_SIZE = 15;
    const MIN_IMAGE_SIZE_FIXED = 100;
    const MAX_IMAGE_SIZE_FIXED = 500;
    const MIN_IMAGE_WIDTH_CARD = 100;
    const MAX_IMAGE_WIDTH_CARD = 800;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const heroBgZoomInTransition = 'transform 5.0s cubic-bezier(.25,1,.5,1)';
    const heroBgZoomOutTransition = 'transform 2.5s cubic-bezier(.25,1,.5,1)';

    const stageMapping = [
        { name: "Intro", visualTextIndex: 0, rowKey: null, imgRange: [25, 25], isHeader: false, isIntro: true, row: null },
        { name: "WorkExpHeader", visualTextIndex: 1, rowKey: "work-exp-header-refactored", imgRange: [25, 25], isHeader: true, row: null },
        { name: "Ripening", visualTextIndex: 2, rowKey: "work-card-0", imgRange: [23, 24], isHeader: false, row: null },
        { name: "Fruit Set", visualTextIndex: 3, rowKey: "work-card-1", imgRange: [21, 22], isHeader: false, row: null },
        { name: "Vine Flowering", visualTextIndex: 4, rowKey: "work-card-2", imgRange: [18, 20], isHeader: false, row: null },
        { name: "Education Intro", visualTextIndex: 5, rowKey: "edu-header-refactored", imgRange: [17, 17], isHeader: true, row: null },
        { name: "Keep Growing", visualTextIndex: 6, rowKey: "edu-card-0", imgRange: [12, 17], isHeader: false, row: null },
        { name: "Bud break", visualTextIndex: 7, rowKey: "edu-card-1", imgRange: [5, 11], isHeader: false, row: null },
        { name: "Plant rootstock", visualTextIndex: 8, rowKey: "edu-card-2", imgRange: [1, 4], isHeader: false, row: null }
    ];
    const workExpHeaderStageIdx = stageMapping.findIndex(s => s.name === "WorkExpHeader");
    const eduIntroStageMapIndex = stageMapping.findIndex(s => s.name === "Education Intro");


    // --- Global functions exposed to window or passed down ---
    window.smoothScrollToElement = smoothScrollToElement;
    window.scrollElementToCenterPromise = scrollElementToCenterPromise;
    window.activateStageByCardId = (cardId, autoScroll = false) => {
        const stageIndex = stageMapping.findIndex(s => s.rowKey === cardId);
        if (stageIndex !== -1) {
            setGlobalState({ userInteractedDuringAnimation: false });
            activateStage(stageIndex, autoScroll, false, {
                grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition // heroZoomOut 및 heroBgZoomOutTransition 전달
            }, stageMapping);
        }
    };


    // --- Module Initializations ---
    // Pass necessary DOM elements and the global state object/setters to each module
    initHeroSection({
        heroBg, heroSection, scrollDownBtn, heroVideo, navHeader,
        HERO_ZOOM_SCALE_FACTOR, heroBgZoomInTransition, heroBgZoomOutTransition,
        triggerHeroToWorkExpSequence: (opts) => triggerHeroToWorkExpSequence(opts, {
            stageMapping, workExpHeaderStageIdx, heroBg, navHeader, scrollDownBtn,
            heroBgZoomOutTransition,
            grapeImgElement, grapeTexts, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader
        }),
        updateFixedElementsDisplay: () => updateFixedElementsDisplay({ fixedGrapeImageContainer, dragInstructionElement }),
    });

    // Initialize timeline module with DOM elements and state management
    initTimelineModule({
        grapeImgElement, grapeTexts, fixedVineGaugeContainer, workExperienceIntro, leftPane, rightPane, draggerRight, leftDragger, resizableTimelineArea,
        experienceContentWrapper, fixedGrapeImageContainer, dragInstructionElement, navHeader, heroSection, // Pass heroSection here for timeline's observer
        heroBg, // heroBg 전달
        heroZoomOut, // heroZoomOut 함수 전달
        heroBgZoomOutTransition, // heroBgZoomOutTransition 문자열 전달
        DRAGGER_WIDTH, MIN_IMAGE_SIZE_FIXED, MAX_IMAGE_SIZE_FIXED // Pass constants for timeline module
    }, stageMapping, {
        parseDateRange: parseDateRange // Pass utility function for card data
    });

    // Populate timeline and retrieve allCardsData
    globalState.allCardsData = await populateTimeline({
        workCardsContainer: document.getElementById('work-experience-cards-container'),
        educationCardsContainer: document.getElementById('education-cards-container'),
        getNextImageSet,
        createMasonryCard: (data) => createMasonryCard(data, {
            openModal: (modalData) => openModal({
                modalContainer, modalImageElement, modalImageCounter, modalTitle, modalCompany,
                modalDurationDisplay, modalDurationPeriod, modalFieldLabel, modalField, modalLocation,
                modalDescription, modalTagsContainer, modalCloseButton, modalPrevButton, modalNextButton,
                modalCardNavContainer,
            }, modalData),
            activateStageByCardId: window.activateStageByCardId,
            setCardDescriptionSummary,
            MIN_IMAGE_WIDTH_CARD, MAX_IMAGE_WIDTH_CARD, hasTouch
        })
    });

    // Initialize modal after allCardsData is populated
    initModalModule({
        modalContainer, modalImageElement, modalImageCounter, modalTitle, modalCompany,
        modalDurationDisplay, modalDurationPeriod, modalFieldLabel, modalField, modalLocation,
        modalDescription, modalTagsContainer, modalCloseButton, modalPrevButton, modalNextButton,
        modalCardNavContainer,
    });
    closeModal(); // Ensure it's closed initially

    // Initialize fixed grape image drag/resize functionality
    initFixedGrapeImage({
        fixedGrapeImageContainer, grapeImgElement, dragInstructionElement,
        DRAGGER_WIDTH, MOVE_THRESHOLD, RESIZE_HANDLE_SIZE, MIN_IMAGE_SIZE_FIXED, MAX_IMAGE_SIZE_FIXED, hasTouch
    });

    // Initialize footer animation
    initFooterAnimation({
        grapeFooterQuoteSection, footerImgEl, footerTextEl,
    });


    // Global scroll listener for header visibility and fixed element updates
    let lastScrollYGlobal = window.scrollY;
    let scrollSyncTimeout = null;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        // Logic to hide/show navigation header on scroll
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
        updateFixedElementsDisplay({ fixedGrapeImageContainer, dragInstructionElement });

        if (scrollSyncTimeout) clearTimeout(scrollSyncTimeout);
        scrollSyncTimeout = setTimeout(() => forceHeroSectionSync({
            heroSection, heroBg, navHeader, scrollDownBtn
        }), 100);
    }, { passive: true });


    // Gauge container collapse/expand logic
    const toggleBtn = document.getElementById('gauge-toggle-btn');
    const bodyEl = document.body;

    if (toggleBtn && fixedVineGaugeContainer && bodyEl) {
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = fixedVineGaugeContainer.classList.toggle('collapsed');
            bodyEl.classList.toggle('gauge-collapsed', isCollapsed);
            toggleBtn.textContent = isCollapsed ? '+' : '-';
            toggleBtn.setAttribute('aria-label', 'Expand Menu');
            toggleBtn.setAttribute('title', 'Expand Menu');

            setTimeout(() => {
                alignWorkIntro({ workExperienceIntro, leftPane, resizableTimelineArea });
                if (globalState.isDraggingFixedImage !== true && !isCollapsed) {
                    updateFixedImagePosition({ fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH });
                }
                window.dispatchEvent(new Event('resize'));
            }, 450);
        });
    }

    // Helper for date parsing - remains in main experience.js as it's used by modal module
    function parseDateRange(dateRange) {
        const parts = dateRange.split(' - ');
        if (parts.length !== 2) {
            return { display: 'N/A', period: dateRange };
        }

        const startDateStr = parts[0];
        const endDateStr = parts[1];

        function parseMonthYear(dateString) {
            const [monthAbbr, yearStr] = dateString.split(' ');
            const monthMap = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            const month = monthMap[monthAbbr];
            const year = parseInt(yearStr, 10);
            return new Date(year, month);
        }

        const startDate = parseMonthYear(startDateStr);
        const endDate = parseMonthYear(endDateStr);

        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

        let displayValue;
        if (monthsDiff < 6) {
            displayValue = `${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''}`;
        } else {
            const years = monthsDiff / 12;
            displayValue = `${Math.round(years)} Year${Math.round(years) !== 1 ? 's' : ''}`;
        }

        return { display: displayValue, period: dateRange };
    }


    // Final setup function called after all modules are initialized
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
                if (globalState.ignoreIntersection || globalState.vineAnimationCurrentlyPlaying || globalState.zoomState === 'zoomIn' || globalState.autoScrollLock || globalState.isAutoScrollingToWorkExp) return;

                let bestEntry = null;
                let minDistToCenter = Infinity;
                const viewportCenterY = window.innerHeight / 2;
                const centerZoneThreshold = window.innerHeight * 0.25;

                entries.forEach(entry => {
                    const targetCard = entry.target;
                    const rect = targetCard.getBoundingClientRect();
                    const cardCenterY = rect.top + rect.height / 2;
                    const isInCenterZone = cardCenterY > centerZoneThreshold && cardCenterY < (window.innerHeight - centerZoneThreshold);

                    if (entry.isIntersecting && isInCenterZone) {
                        const dist = Math.abs(cardCenterY - viewportCenterY);
                        if (dist < minDistToCenter) {
                            minDistToCenter = dist;
                            bestEntry = targetCard;
                        }
                    }
                });

                if (bestEntry) {
                    const idx = stageMapping.findIndex(m => m.row === bestEntry);
                    if (idx !== -1 && stageMapping[idx] && !stageMapping[idx].isIntro && globalState._globalActiveStageIndex !== idx) {
                        activateStage(idx, false, false, {
                            grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition // heroZoomOut 및 heroBgZoomOutTransition 전달
                        }, stageMapping);
                        setGlobalState({ autoScrollLock: true });
                        if (globalState.autoScrollTimeoutId) clearTimeout(globalState.autoScrollTimeoutId);
                        setGlobalState({ autoScrollTimeoutId: setTimeout(() => setGlobalState({ autoScrollLock: false }), 1000) });
                    }
                }
            };

            const cardObserver = new IntersectionObserver(obsCallback, {
                threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
                rootMargin: "-20% 0px -20% 0px"
            });
            stageMapping.forEach(m => {
                if (m.row && m.rowKey && !m.isHeader && !m.isIntro && m.row.classList.contains('masonry-card')) {
                    cardObserver.observe(m.row);
                }
            });
        }

        grapeTexts.forEach((textEl, visualIndexInList) => {
            const stageIndex = stageMapping.findIndex(s => s.visualTextIndex === visualIndexInList);
            if (stageIndex !== -1 && stageMapping[stageIndex]) {
                textEl.style.cursor = 'pointer';
                textEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const clickedStage = stageMapping[stageIndex];
                    if (!clickedStage.isIntro && !globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                        setGlobalState({ userInteractedDuringAnimation: false });
                        setGlobalState({ _hoveredStageIndex: -1 });
                        activateStage(stageIndex, true, false, {
                            grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition // heroZoomOut 및 heroBgZoomOutTransition 전달
                        }, stageMapping);
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
            if (stage.row && !stage.isHeader && !stage.isIntro && stage.row.classList.contains('masonry-card')) {
                hoverableElements.push({ element: stage.row, stageIndex: index });
            }
        });

        hoverableElements.forEach(item => {
            if (item.element) {
                item.element.addEventListener('mouseenter', () => {
                    if (globalState.isAutoScrollingToWorkExp || globalState.vineAnimationCurrentlyPlaying) return;
                    setGlobalState({ _hoveredStageIndex: item.stageIndex });
                    setActiveStageVisuals(globalState._hoveredStageIndex, true, { grapeTexts, grapeImgElement, fixedVineGaugeContainer });
                });
                item.element.addEventListener('mouseleave', () => {
                    if (globalState.isAutoScrollingToWorkExp || globalState.vineAnimationCurrentlyPlaying) return;
                    setGlobalState({ _hoveredStageIndex: -1 });
                    setActiveStageVisuals(globalState._globalActiveStageIndex, false, { grapeTexts, grapeImgElement, fixedVineGaugeContainer });
                });
            }
        });

        if (workExpHeaderFullEl_refactored && workExpHeaderStageIdx !== -1) {
            workExpHeaderFullEl_refactored.style.cursor = 'pointer';
            workExpHeaderFullEl_refactored.addEventListener('click', (e) => {
                if (e.target.closest('.meaning-chunk')) {
                    return;
                }
                e.stopPropagation();
                setGlobalState({ _hoveredStageIndex: -1 });
                if (!globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                    if (globalState.zoomState === 'zoomIn') {
                        triggerHeroToWorkExpSequence({
                            heroBg, navHeader, scrollDownBtn
                        }, {
                            stageMapping, workExpHeaderStageIdx, heroBg, navHeader, scrollDownBtn,
                            heroBgZoomOutTransition,
                            grapeImgElement, grapeTexts, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader
                        });
                    } else {
                        setGlobalState({ userInteractedDuringAnimation: false });
                        activateStage(workExpHeaderStageIdx, true, false, {
                            grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition
                        }, stageMapping);
                    }
                }
            });
        }

        if (eduHeaderContainerEl_refactored && eduIntroStageMapIndex !== -1) {
            eduHeaderContainerEl_refactored.style.cursor = 'pointer';
            eduHeaderContainerEl_refactored.addEventListener('click', (e) => {
                if (e.target.closest('.meaning-chunk')) {
                    return;
                }
                e.stopPropagation();
                setGlobalState({ _hoveredStageIndex: -1 });
                if (globalState.zoomState === 'zoomIn' && !globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                    heroZoomOut({ heroBg, navHeader, scrollDownBtn, heroBgZoomOutTransition });
                }
                setGlobalState({ userInteractedDuringAnimation: false });
                if (!globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                    activateStage(eduIntroStageMapIndex, true, false, {
                        grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition
                    }, stageMapping);
                }
            });
        }

        initResizablePanes({
            leftPane, rightPane, draggerRight, leftDragger, resizableTimelineArea,
            DRAGGER_WIDTH,
            updateFixedImageSizeBasedOnLeftPane: (width) => updateFixedImageSizeBasedOnLeftPane({
                fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH,
                currentLeftPaneWidth: width,
                initialLeftPaneWidthForDragger: globalState.initialLeftPaneWidthForDragger
            }),
            alignWorkIntro: () => alignWorkIntro({ workExperienceIntro, leftPane, resizableTimelineArea }),
            updateFixedImagePosition: () => updateFixedImagePosition({ fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH })
        });

        // Delayed initializations to ensure all elements are rendered and positioned correctly
        setTimeout(() => {
            // Call initCardResizeHandles here after cards are in DOM
            initCardResizeHandles({
                MIN_IMAGE_WIDTH_CARD, MAX_IMAGE_WIDTH_CARD, hasTouch,
                setCardDescriptionSummary, // Pass setCardDescriptionSummary
                openModal: (modalData) => openModal({
                    modalContainer, modalImageElement, modalImageCounter, modalTitle, modalCompany,
                    modalDurationDisplay, modalDurationPeriod, modalFieldLabel, modalField, modalLocation,
                    modalDescription, modalTagsContainer, modalCloseButton, modalPrevButton, modalNextButton,
                    modalCardNavContainer,
                }, modalData),
                activateStageByCardId: window.activateStageByCardId // Pass activateStageByCardId
            });

            initResponsiveCardScaling({
                leftPane, fixedGrapeImageContainer,
                updateFixedImageSizeBasedOnLeftPane: (width) => updateFixedImageSizeBasedOnLeftPane({
                    fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH,
                    currentLeftPaneWidth: width,
                    initialLeftPaneWidthForDragger: globalState.initialLeftPaneWidthForDragger
                })
            });

            adjustTimelineLineStart();
            alignWorkIntro({ workExperienceIntro, leftPane, resizableTimelineArea });

            // Activate initial intro stage if no other stage is active
            const introStageIdx = stageMapping.findIndex(s => s.isIntro);
            if (introStageIdx !== -1 && globalState._globalActiveStageIndex === -1 && !globalState.isAutoScrollingToWorkExp && !globalState.vineAnimationCurrentlyPlaying) {
                activateStage(introStageIdx, false, false, {
                    grapeTexts, grapeImgElement, fixedVineGaugeContainer, workExperienceIntro, leftPane, resizableTimelineArea, navHeader, heroBg, heroZoomOut, heroBgZoomOutTransition
                }, stageMapping);
            }
            updateFixedElementsDisplay({ fixedGrapeImageContainer, dragInstructionElement });
        }, 150);
    }

    finalizePageSetup(); // Call the main setup function
});
