// timeline.js
// Responsible for generating the timeline structure, managing stages,
// grape vine visuals, and the dragger/resizer for the timeline panes.
// It also handles intersection observers for stage activation.

import { initCardResizeHandles, getNextImageSet, setCardDescriptionSummary } from './card.js';
import { updateFixedElementsDisplay, updateFixedImagePosition } from './fixedGrapeImage.js';
import { smoothScrollToElement, debounce } from './utils.js';
import { globalState, setGlobalState } from './experience.js';

// DOM elements that will be initialized during initTimelineModule
let _grapeImgElement;
let _grapeTexts;
let _fixedVineGaugeContainer;
let _workExperienceIntro;
let _leftPane;
let _rightPane;
let _draggerRight;
let _leftDragger;
let _resizableTimelineArea;
let _experienceContentWrapper;
let _fixedGrapeImageContainer;
let _dragInstructionElement;
let _navHeader;
let _heroSection;
let _heroBg;
let _heroZoomOut;
let _heroBgZoomOutTransition;

let _stageMapping;
let _parseDateRangeFunc;

let _DRAGGER_WIDTH;
let _MIN_IMAGE_SIZE_FIXED;
let _MAX_IMAGE_SIZE_FIXED;

/**
 * Initializes this module with necessary DOM elements, global state references, and callbacks.
 * @param {object} elements - DOM elements needed.
 * @param {Array} stageMapData - The static stage mapping data.
 * @param {object} utils - Utility functions like parseDateRange.
 */
export function initTimelineModule(elements, stageMapData, utils) {
    _grapeImgElement = elements.grapeImgElement;
    _grapeTexts = elements.grapeTexts;
    _fixedVineGaugeContainer = elements.fixedVineGaugeContainer;
    _workExperienceIntro = elements.workExperienceIntro;
    _leftPane = elements.leftPane;
    _rightPane = elements.rightPane;
    _draggerRight = elements.draggerRight;
    _leftDragger = elements.leftDragger;
    _resizableTimelineArea = elements.resizableTimelineArea;
    _experienceContentWrapper = elements.experienceContentWrapper;
    _fixedGrapeImageContainer = elements.fixedGrapeImageContainer;
    _dragInstructionElement = elements.dragInstructionElement;
    _navHeader = elements.navHeader;
    _heroSection = elements.heroSection;
    _heroBg = elements.heroBg;
    _heroZoomOut = elements.heroZoomOut;
    _heroBgZoomOutTransition = elements.heroBgZoomOutTransition;

    _stageMapping = stageMapData;
    _parseDateRangeFunc = utils.parseDateRange;

    _DRAGGER_WIDTH = elements.DRAGGER_WIDTH;
    _MIN_IMAGE_SIZE_FIXED = elements.MIN_IMAGE_SIZE_FIXED;
    _MAX_IMAGE_SIZE_FIXED = elements.MAX_IMAGE_SIZE_FIXED;

    // Observer for the vine gauge container visibility
    if (_experienceContentWrapper) {
        const gaugeObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (_fixedVineGaugeContainer) {
                    _fixedVineGaugeContainer.classList.toggle('visible', entry.isIntersecting);
                }
            });
        }, { threshold: 0.01, rootMargin: "-600px 0px -100px 0px" });
        gaugeObserver.observe(_experienceContentWrapper);
    }
}

/**
 * Populates the timeline with work and education experience cards.
 * @param {object} elements - DOM elements needed: workCardsContainer, educationCardsContainer.
 * @param {function} getNextImageSet - Function to get the next set of placeholder images from card.js.
 * @param {function} createMasonryCard - Function to create a masonry card from card.js.
 * @returns {Promise<Array>} A promise that resolves with an array of all card data.
 */
export async function populateTimeline({ workCardsContainer, educationCardsContainer, getNextImageSet, createMasonryCard }) {
    const allCardsData = [];

    const workDataSource = document.querySelector('#original-work-exp-items');
    if (workDataSource && workCardsContainer) {
        const workItemsOriginal = workDataSource.querySelectorAll('.timeline-row');
        workItemsOriginal.forEach((item, index) => {
            const cardData = extractCardData(item, false, index);
            cardData.id = `work-card-${index}`;
            cardData.images = getNextImageSet();
            const timelineEntryElement = createTimelineEntry(cardData, createMasonryCard);
            workCardsContainer.appendChild(timelineEntryElement);
            allCardsData.push(cardData);
        });
    }

    const eduDataContainer = document.querySelector('#original-edu-exp-items');
    if (eduDataContainer && educationCardsContainer) {
        const educationItems = eduDataContainer.querySelectorAll('.edu-row');
        educationItems.forEach((element, index) => {
            const cardData = extractCardData(element, true, index);
            cardData.id = `edu-card-${index}`;
            cardData.images = getNextImageSet();
            const timelineEntryElement = createTimelineEntry(cardData, createMasonryCard);
            educationCardsContainer.appendChild(timelineEntryElement);
            allCardsData.push(cardData);
        });
    }
    return allCardsData;
}

/**
 * Extracts data from a given HTML element to create a card data object.
 * @param {HTMLElement} itemData - The HTML element containing the card's data.
 * @param {boolean} isEducation - True if the card is for education, false for work experience.
 * @param {number} index - The original index of the item, used for unique IDs.
 * @returns {object} An object containing the extracted card data.
 */
function extractCardData(itemData, isEducation, index) {
    const title = itemData.querySelector(isEducation ? '.edu-title' : '.timeline-title')?.textContent || 'N/A';
    const company = itemData.querySelector(isEducation ? '.edu-org' : '.company')?.textContent || 'N/A';
    const date = itemData.querySelector(isEducation ? '.edu-date' : '.timeline-date')?.textContent || 'N/A';
    const field = itemData.querySelector(isEducation ? '.edu-role' : '.timeline-field')?.textContent || '';
    const descriptionHTML = itemData.querySelector(isEducation ? '.edu-desc' : '.timeline-desc')?.innerHTML || '';
    const descriptionText = itemData.querySelector(isEducation ? '.edu-desc' : '.timeline-desc')?.textContent || '';

    const location = isEducation ? '' : 'Seoul, Korea';

    const tagsSource = itemData.querySelector(isEducation ? '.edu-tags' : '.timeline-tags');
    const tags = tagsSource ? Array.from(tagsSource.querySelectorAll('span')).map(span => ({
        text: span.textContent,
        class: span.className,
        highlightId: span.dataset.highlightId || `${itemData.id}-tag-${Array.from(tagsSource.children).indexOf(span)}`
    })) : [];

    return { title, company, date, field, descriptionHTML, descriptionText, tags, type: isEducation ? 'edu' : 'work', originalIndex: index, id: '', images: [], location };
}

/**
 * Creates a timeline entry DOM element, consisting of a dot and a masonry card.
 * @param {object} data - The data object for the card.
 * @param {function} createMasonryCardFunc - The function to create the actual masonry card element from card.js.
 * @returns {HTMLElement} The created timeline entry div.
 */
function createTimelineEntry(data, createMasonryCardFunc) {
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('timeline-entry');
    const dotDiv = document.createElement('div');
    dotDiv.classList.add('timeline-dot-new');
    entryDiv.appendChild(dotDiv);
    const cardElement = createMasonryCardFunc(data);
    if (cardElement instanceof Node) {
        entryDiv.appendChild(cardElement);
    } else {
        console.error("createMasonryCardFunc did not return a valid DOM Node:", cardElement);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = "Error loading card.";
        entryDiv.appendChild(errorDiv);
    }
    return entryDiv;
}

/**
 * Sets the source and opacity of the grape image.
 * @param {number} num - The image number to display.
 * @param {HTMLElement} imgElement - The grape image DOM element.
 */
export function setGrapeImage(num, imgElement) {
    if (imgElement) {
        imgElement.src = `images/${num}.png`;
        imgElement.style.opacity = '0.85';
    }
}

/**
 * Clears any active image loop interval.
 */
export function stopAllImageLoops() {
    if (globalState._activeImageLoopIntervalId) {
        clearInterval(globalState._activeImageLoopIntervalId);
        setGlobalState({ _activeImageLoopIntervalId: null });
    }
}

/**
 * Plays the vine loading animation sequentially and then activates the first stage.
 * @param {function} cb - Callback function to execute after animation.
 */
export function playVineLoadAnimationThenActivateFirstStage(cb) {
    setGlobalState({ vineAnimationCurrentlyPlaying: true });
    setGlobalState({ ignoreIntersection: true });
    setGlobalState({ userInteractedDuringAnimation: false });
    window.addEventListener('scroll', tempScrollListenerDuringAnimation, { once: true });
    stopAllImageLoops();
    let currentVineImgIdx = 1;

    function showNext() {
        if (globalState.userInteractedDuringAnimation) {
            setGlobalState({ vineAnimationCurrentlyPlaying: false });
            window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
            if (typeof cb === 'function') cb();
            return;
        }
        if (currentVineImgIdx <= 25) {
            setGrapeImage(currentVineImgIdx++, _grapeImgElement);
            setTimeout(showNext, 70);
        } else {
            setGlobalState({ vineAnimationCurrentlyPlaying: false });
            window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
            if (typeof cb === 'function') cb();
        }
    }
    showNext();
}

/**
 * Temporary scroll listener to detect user interaction during an animation.
 */
function tempScrollListenerDuringAnimation() {
    setGlobalState({ userInteractedDuringAnimation: true });
    window.removeEventListener('scroll', tempScrollListenerDuringAnimation);
}

/**
 * Sets the visual active state for the current timeline stage (grape image and text).
 * @param {number} stageIndex - The index of the stage to activate/display.
 * @param {boolean} isHoverEffect - True if this is for a hover effect, false for global active state.
 * @param {object} elements - DOM elements needed: grapeTexts, grapeImgElement, fixedVineGaugeContainer.
 */
export function setActiveStageVisuals(stageIndex, isHoverEffect, elements) {
    stopAllImageLoops();

    const displayStageIndex = (isHoverEffect && stageIndex !== -1) ? stageIndex : globalState._globalActiveStageIndex;

    if (displayStageIndex < 0 || displayStageIndex >= _stageMapping.length) {
        elements.grapeTexts.forEach(el => el.classList.remove('active'));
        if (elements.grapeImgElement && !globalState.vineAnimationCurrentlyPlaying) elements.grapeImgElement.style.opacity = '0';
        return;
    }

    const stageToDisplay = _stageMapping[displayStageIndex];
    if (!stageToDisplay) return;

    if (elements.grapeImgElement) elements.grapeImgElement.style.opacity = '0.85';

    elements.grapeTexts.forEach((textEl, idx) => {
        const isActive = stageToDisplay.visualTextIndex !== -1 && idx === stageToDisplay.visualTextIndex;
        textEl.classList.toggle('active', isActive);
        if (isActive && elements.fixedVineGaugeContainer && elements.fixedVineGaugeContainer.classList.contains('visible')) {
            const listParent = textEl.closest('.fade-in-list');
            if (listParent && listParent.scrollHeight > listParent.clientHeight) {
                textEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    });

    if (elements.grapeImgElement && stageToDisplay.imgRange) {
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
        setGrapeImage(imagesInLoop[currentImgIdx], elements.grapeImgElement);
        if (imagesInLoop.length > 1) {
            setGlobalState({
                _activeImageLoopIntervalId: setInterval(() => {
                    currentImgIdx = (currentImgIdx + 1) % imagesInLoop.length;
                    setGrapeImage(imagesInLoop[currentImgIdx], elements.grapeImgElement);
                }, 1000)
            });
        }
    }

    if (!isHoverEffect && stageIndex === globalState._globalActiveStageIndex) {
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

/**
 * Activates a specific stage in the timeline, updating visuals and potentially auto-scrolling.
 * @param {number} idx - The index of the stage to activate.
 * @param {boolean} autoScrollToStage - True if the page should auto-scroll to this stage.
 * @param {boolean} isInitialHeroTransition - True if this is part of the initial hero transition.
 * @param {object} elements - DOM elements needed: grapeTexts, grapeImgElement, fixedVineGaugeContainer.
 * @param {Array} stageMapping - The stage mapping array.
 */
export function activateStage(idx, autoScrollToStage = false, isInitialHeroTransition = false, elements, stageMapping) {
    if (idx < 0 || idx >= stageMapping.length || !stageMapping[idx]) {
        if (globalState._globalActiveStageIndex !== -1) {
            setGlobalState({ _globalActiveStageIndex: -1 });
            if (globalState._hoveredStageIndex === -1) {
                setActiveStageVisuals(-1, false, elements);
            }
        }
        return;
    }

    setGlobalState({ _globalActiveStageIndex: idx });
    const currentStageDetails = stageMapping[globalState._globalActiveStageIndex];

    setGlobalState({ plantRootstockStageActive: (currentStageDetails.name === "Plant rootstock") });

    if (globalState.zoomState === 'zoomIn' && !currentStageDetails.isIntro && !isInitialHeroTransition && elements.heroBg && elements.heroZoomOut) {
        elements.heroZoomOut({ heroBg: elements.heroBg, navHeader: elements.navHeader, scrollDownBtn: elements.scrollDownBtn, heroBgZoomOutTransition: elements.heroBgZoomOutTransition });
    }

    if (globalState._hoveredStageIndex === -1) {
        setActiveStageVisuals(globalState._globalActiveStageIndex, false, elements);
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

    const shouldReallyAutoScroll = autoScrollToStage && (!globalState.userInteractedDuringAnimation || globalState.isAutoScrollingToWorkExp || isInitialHeroTransition);

    if (shouldReallyAutoScroll) {
        let targetElementToScroll = currentStageDetails.row;
        if (targetElementToScroll && !currentStageDetails.isIntro) {
            const elementToActuallyScroll = targetElementToScroll.closest('.timeline-entry') || targetElementToScroll;
            let scrollPosition = 'center';
            if (currentStageDetails.name === "WorkExpHeader" && isInitialHeroTransition) scrollPosition = 'start';
            else if (currentStageDetails.isHeader) scrollPosition = 'center';
            else scrollPosition = 'center';

            if (window.smoothScrollToElement) {
                const scrollDelay = (isInitialHeroTransition || globalState.vineAnimationCurrentlyPlaying) ? 300 : 100;
                const scrollDuration = (isInitialHeroTransition) ? 233 : 466;
                setTimeout(() => {
                    window.smoothScrollToElement(elementToActuallyScroll, scrollPosition, null, scrollDuration);
                }, scrollDelay);
            }
        }
    }

    setGlobalState({ ignoreIntersection: true });
    setTimeout(() => { setGlobalState({ ignoreIntersection: false }); }, 800);
}

/**
 * Aligns the work experience introduction text to the center of the timeline column.
 * @param {object} elements - DOM elements needed: workExperienceIntro, leftPane, resizableTimelineArea.
 */
export function alignWorkIntro({ workExperienceIntro, leftPane, resizableTimelineArea }) {
    if (workExperienceIntro && leftPane && resizableTimelineArea) {
        const timelineColumnRect = leftPane.getBoundingClientRect();
        const introContainerRect = workExperienceIntro.parentElement.getBoundingClientRect();

        const timelineColumnCenterX_viewport = timelineColumnRect.left + timelineColumnRect.width / 2;
        const introWidth = workExperienceIntro.offsetWidth;
        let desiredIntroLeft_viewport = timelineColumnCenterX_viewport - (introWidth / 2);
        let newMarginLeft = desiredIntroLeft_viewport - introContainerRect.left;
        newMarginLeft = Math.max(0, newMarginLeft);
        workExperienceIntro.style.marginLeft = `${newMarginLeft}px`;
    }
}

/**
 * Initializes the drag-to-resize functionality for the timeline panes.
 * @param {object} elements - DOM elements for panes and draggers.
 * @param {number} DRAGGER_WIDTH_CONST - The width of the dragger.
 * @param {function} updateFixedImageSizeBasedOnLeftPane - Callback to update fixed image size.
 * @param {function} alignWorkIntro - Callback to align work intro.
 * @param {function} updateFixedImagePosition - Callback to update fixed image position.
 */
export function initResizablePanes({
    leftPane, rightPane, draggerRight, leftDragger, resizableTimelineArea,
    DRAGGER_WIDTH: DRAGGER_WIDTH_CONST,
    updateFixedImageSizeBasedOnLeftPane, alignWorkIntro, updateFixedImagePosition
}) {
    if (!leftPane || !rightPane || !draggerRight || !leftDragger || !resizableTimelineArea) return;

    let startX, startLeftPaneWidth, startRightPaneWidth, startResizableLeft;

    draggerRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        setGlobalState({ isDraggingRight: true });
        startX = e.clientX;
        startLeftPaneWidth = leftPane.offsetWidth;
        startRightPaneWidth = rightPane.offsetWidth;
        document.body.style.cursor = 'col-resize';
        leftPane.style.transition = 'none';
        rightPane.style.transition = 'none';
        draggerRight.style.backgroundColor = '#aaa';
        document.addEventListener('mousemove', onRightDraggerMouseMove);
        document.addEventListener('mouseup', onDraggerMouseUp);
    });

    function onRightDraggerMouseMove(e) {
        if (!globalState.isDraggingRight) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        let newLeftPaneSize = startLeftPaneWidth + dx;
        let newRightPaneSize = startRightPaneWidth - dx;

        const minLeft = parseFloat(getComputedStyle(leftPane).minWidth) || 50;
        const minRight = parseFloat(getComputedStyle(rightPane).minWidth) || 20;

        const totalContentWidth = resizableTimelineArea.offsetWidth - (2 * DRAGGER_WIDTH_CONST);

        if (newLeftPaneSize < minLeft) {
            newLeftPaneSize = minLeft;
            newRightPaneSize = totalContentWidth - newLeftPaneSize;
        } else if (newRightPaneSize < minRight) {
            newRightPaneSize = minRight;
            newLeftPaneSize = totalContentWidth - newRightPaneSize;
        }

        leftPane.style.flexBasis = `${newLeftPaneSize}px`;
        rightPane.style.flexBasis = `${newRightPaneSize}px`;

        if (_fixedGrapeImageContainer && _fixedGrapeImageContainer.dataset.isDragged !== 'true') {
            updateFixedImageSizeBasedOnLeftPane({
                fixedGrapeImageContainer: _fixedGrapeImageContainer, dragInstructionElement: _dragInstructionElement, DRAGGER_WIDTH: _DRAGGER_WIDTH,
                currentLeftPaneWidth: newLeftPaneSize,
                initialLeftPaneWidthForDragger: globalState.initialLeftPaneWidthForDragger
            });
        }
        alignWorkIntro();
    }

    leftDragger.addEventListener('mousedown', (e) => {
        e.preventDefault();
        setGlobalState({ isDraggingLeft: true });
        startX = e.clientX;
        startLeftPaneWidth = leftPane.offsetWidth;
        startResizableLeft = resizableTimelineArea.getBoundingClientRect().left + window.scrollX;
        document.body.style.cursor = 'col-resize';
        leftPane.style.transition = 'none';
        rightPane.style.transition = 'none';
        leftDragger.style.backgroundColor = '#aaa';
        document.addEventListener('mousemove', onLeftDraggerMouseMove);
        document.addEventListener('mouseup', onDraggerMouseUp);
    });

    function onLeftDraggerMouseMove(e) {
        if (!globalState.isDraggingLeft) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        let newLeftPaneSize = startLeftPaneWidth - dx;
        let newResizableAreaLeft = startResizableLeft + dx;

        const minLeft = parseFloat(getComputedStyle(leftPane).minWidth) || 50;
        const maxAllowedLeftPaneWidth = resizableTimelineArea.offsetWidth - (rightPane.offsetWidth + (2 * DRAGGER_WIDTH_CONST));

        if (newLeftPaneSize < minLeft) {
            newLeftPaneSize = minLeft;
        } else if (newLeftPaneSize > maxAllowedLeftPaneWidth) {
            newLeftPaneSize = maxAllowedLeftPaneWidth;
        }

        leftPane.style.flexBasis = `${newLeftPaneSize}px`;
        resizableTimelineArea.style.marginLeft = `${newResizableAreaLeft}px`;

        if (_fixedGrapeImageContainer && _fixedGrapeImageContainer.dataset.isDragged !== 'true') {
            updateFixedImageSizeBasedOnLeftPane({
                fixedGrapeImageContainer: _fixedGrapeImageContainer, dragInstructionElement: _dragInstructionElement, DRAGGER_WIDTH: _DRAGGER_WIDTH,
                currentLeftPaneWidth: newLeftPaneSize,
                initialLeftPaneWidthForDragger: globalState.initialLeftPaneWidthForDragger
            });
        }
        alignWorkIntro();
    }

    function onDraggerMouseUp() {
        if (globalState.isDraggingRight) {
            setGlobalState({ isDraggingRight: false });
            draggerRight.style.backgroundColor = '';
            document.removeEventListener('mousemove', onRightDraggerMouseMove);
        }
        if (globalState.isDraggingLeft) {
            setGlobalState({ isDraggingLeft: false });
            leftDragger.style.backgroundColor = '';
            document.removeEventListener('mousemove', onLeftDraggerMouseMove);
        }

        document.body.style.cursor = 'default';
        leftPane.style.transition = '';
        rightPane.style.transition = '';

        document.removeEventListener('mouseup', onDraggerMouseUp);

        alignWorkIntro();
        setGlobalState({ initialLeftPaneWidthForDragger: leftPane.offsetWidth });
        updateFixedImagePosition({ fixedGrapeImageContainer: _fixedGrapeImageContainer, dragInstructionElement: _dragInstructionElement, DRAGGER_WIDTH: _DRAGGER_WIDTH });
    }
}

/**
 * Adjusts the size of the fixed grape image based on the current left pane width.
 * @param {object} opts - Options including elements, constants, and state values.
 */
export function updateFixedImageSizeBasedOnLeftPane(opts) {
    const { fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH: DRAGGER_WIDTH_CONST, currentLeftPaneWidth, initialLeftPaneWidthForDragger } = opts;

    const basePaneWidth = initialLeftPaneWidthForDragger || _leftPane.offsetWidth;
    const minPaneAllowedWidth = parseFloat(getComputedStyle(_leftPane).minWidth) || 600;

    const maxImageSize = 250;
    const minImageSize = 150;
    let targetImageSize;

    if (currentLeftPaneWidth <= minPaneAllowedWidth) {
        targetImageSize = maxImageSize;
    } else if (currentLeftPaneWidth >= basePaneWidth) {
        targetImageSize = minImageSize;
    } else {
        const progress = (currentLeftPaneWidth - minPaneAllowedWidth) / (basePaneWidth - minPaneAllowedWidth);
        targetImageSize = maxImageSize - progress * (maxImageSize - minImageSize);
    }

    targetImageSize = Math.max(minImageSize, Math.min(targetImageSize, maxImageSize));
    fixedGrapeImageContainer.style.width = `${targetImageSize}px`;
    fixedGrapeImageContainer.style.height = `${targetImageSize}px`;
    updateFixedImagePosition({ fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH: DRAGGER_WIDTH_CONST });
}

/**
 * Initializes responsive scaling for card text elements based on left pane width.
 * @param {object} elements - DOM elements.
 * @param {function} updateFixedImageSizeBasedOnLeftPane - Callback to update fixed image size.
 */
export function initResponsiveCardScaling({ leftPane, fixedGrapeImageContainer, updateFixedImageSizeBasedOnLeftPane }) {
    if (!leftPane || typeof ResizeObserver === 'undefined') return;

    const cards = document.querySelectorAll('.masonry-card');
    setGlobalState({ scalableElementsStore: [] });

    const debouncedResizeHandler = debounce((currentWidth) => {
        if (globalState.initialLeftPaneWidthForScaling === 0 && currentWidth > 0) {
            setGlobalState({ initialLeftPaneWidthForScaling: currentWidth });
        }
        if (globalState.initialLeftPaneWidthForScaling === 0) return;

        const scaleFactor = currentWidth / globalState.initialLeftPaneWidthForScaling;

        globalState.scalableElementsStore.forEach(item => {
            if (item.element && typeof item.initialFontSize === 'number' && !isNaN(item.initialFontSize)) {
                let newSize = item.initialFontSize * scaleFactor;
                newSize = Math.max(14, Math.min(newSize, item.initialFontSize * 1.5));

                if (item.type === 'summary') {
                    newSize = Math.max(10, newSize - 2);
                }
                item.element.style.fontSize = newSize + 'px';
            }
        });

        if (fixedGrapeImageContainer.dataset.isDragged !== 'true') {
            updateFixedImageSizeBasedOnLeftPane({
                fixedGrapeImageContainer, dragInstructionElement: _dragInstructionElement, DRAGGER_WIDTH: _DRAGGER_WIDTH,
                currentLeftPaneWidth: currentWidth,
                initialLeftPaneWidthForDragger: globalState.initialLeftPaneWidthForDragger
            });
        }
    }, 50);

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === leftPane) {
                debouncedResizeHandler(entry.contentRect.width);
            }
        }
    });
    resizeObserver.observe(leftPane);
    if (leftPane.offsetWidth > 0) debouncedResizeHandler(leftPane.offsetWidth);

    if (globalState.scalableElementsStore.length === 0 && cards.length > 0) {
        const tempStore = [];
        cards.forEach(card => {
            [...card.querySelectorAll('.card-title, .card-company, .card-date, .card-tags span')].forEach(el => {
                const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (!isNaN(fontSize)) tempStore.push({ element: el, initialFontSize: fontSize, type: 'normal' });
            });
            const summaryEl = card.querySelector('.card-description-summary');
            if (summaryEl) {
                const fontSize = parseFloat(window.getComputedStyle(summaryEl).fontSize);
                if (!isNaN(fontSize)) tempStore.push({ element: summaryEl, initialFontSize: fontSize, type: 'summary' });
            }
        });
        setGlobalState({ scalableElementsStore: tempStore });
        const root = document.documentElement;
        const cardImageHeightString = getComputedStyle(root).getPropertyValue('--card-image-height').trim();
        let initialHeight = 180;
        if (cardImageHeightString) initialHeight = parseFloat(cardImageHeightString);
        if (isNaN(initialHeight)) initialHeight = 180;
        setGlobalState({ initialCardImageHeightVarValue: initialHeight });
    }
}

/**
 * Adjusts the starting point of the vertical timeline line to align with the first card's dot.
 */
export function adjustTimelineLineStart() {
    const timelineColumn = document.querySelector('.timeline-items-column');
    if (!timelineColumn) return;

    let firstActualItemEntry = null;
    const potentialEntries = timelineColumn.querySelectorAll('.timeline-section .timeline-entry');
    for (let entry of potentialEntries) {
        if (entry.querySelector('.masonry-card')) {
            firstActualItemEntry = entry;
            break;
        }
    }

    if (firstActualItemEntry) {
        const dotElement = firstActualItemEntry.querySelector('.timeline-dot-new');
        let dotTopOffsetWithinEntry = dotElement ? dotElement.offsetTop + (dotElement.offsetHeight / 2) : 10;
        const lineStartOffset = firstActualItemEntry.offsetTop + dotTopOffsetWithinEntry;
        timelineColumn.style.setProperty('--timeline-line-start-offset', `${lineStartOffset}px`);
    } else {
        timelineColumn.style.setProperty('--timeline-line-start-offset', '50px');
    }
}