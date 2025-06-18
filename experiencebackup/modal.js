import { globalState, setGlobalState } from './experience.js'; // Import global state

let modalContainer;
let modalImageElement;
let modalImageCounter;
let modalTitle;
let modalCompany;
let modalDurationDisplay;
let modalDurationPeriod;
let modalFieldLabel;
let modalField;
let modalLocation;
let modalDescription;
let modalTagsContainer;
let modalCloseButton;
let modalPrevButton;
let modalNextButton;
let modalCardNavContainer;
let _lastCardElement; // Store the last card element for closing animation

// `currentModalImages` and `currentImageIndex` are now part of globalState.
// `allCardsData` is also part of globalState.

let _parseDateRangeFunc; // Utility function to be passed during initialization

/**
 * Initializes the modal module with necessary DOM elements.
 * This function should be called once, typically on DOMContentLoaded.
 * @param {object} elements - DOM elements for the modal.
 * @param {object} initialData - Optional: data to open modal with initially.
 */
export function initModalModule(elements, initialData = null) {
    modalContainer = elements.modalContainer;
    modalImageElement = elements.modalImageElement;
    modalImageCounter = elements.modalImageCounter;
    modalTitle = elements.modalTitle;
    modalCompany = elements.modalCompany;
    modalDurationDisplay = elements.modalDurationDisplay;
    modalDurationPeriod = elements.modalDurationPeriod;
    modalFieldLabel = elements.modalFieldLabel;
    modalField = elements.modalField;
    modalLocation = elements.modalLocation;
    modalDescription = elements.modalDescription;
    modalTagsContainer = elements.modalTagsContainer;
    modalCloseButton = elements.modalCloseButton;
    modalPrevButton = elements.modalPrevButton;
    modalNextButton = elements.modalNextButton;
    modalCardNavContainer = elements.modalCardNavContainer;

    // Set _parseDateRangeFunc
    _parseDateRangeFunc = (dateRange) => {
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

        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;

        let displayValue;
        if (monthsDiff < 6) {
            displayValue = `${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''}`;
        } else {
            const years = monthsDiff / 12;
            displayValue = `${Math.round(years)} Year${Math.round(years) !== 1 ? 's' : ''}`;
        }

        return { display: displayValue, period: dateRange };
    };

    // Setup event listeners for modal
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal);
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) closeModal();
        });
    }
    if (modalPrevButton) {
        modalPrevButton.addEventListener('click', () => {
            if (globalState.currentModalImages && globalState.currentModalImages.length > 0) {
                setGlobalState({ currentImageIndex: (globalState.currentImageIndex - 1 + globalState.currentModalImages.length) % globalState.currentModalImages.length });
                updateModalImage();
            }
        });
    }
    if (modalNextButton) {
        modalNextButton.addEventListener('click', () => {
            if (globalState.currentModalImages && globalState.currentModalImages.length > 0) {
                setGlobalState({ currentImageIndex: (globalState.currentImageIndex + 1) % globalState.currentModalImages.length });
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

    if (initialData) {
        openModal(elements, initialData);
    }
}

/**
 * Opens the experience modal with the provided card data.
 * @param {object} elements - DOM elements for the modal.
 * @param {object} data - The data object for the card to display in the modal.
 * @param {HTMLElement} cardElement - The card element that triggered the modal.
 */
export function openModal(elements, data, cardElement = null) {
    modalContainer = elements.modalContainer;
    modalImageElement = elements.modalImageElement;
    modalImageCounter = elements.modalImageCounter;
    modalTitle = elements.modalTitle;
    modalCompany = elements.modalCompany;
    modalDurationDisplay = elements.modalDurationDisplay;
    modalDurationPeriod = elements.modalDurationPeriod;
    modalFieldLabel = elements.modalFieldLabel;
    modalField = elements.modalField;
    modalLocation = elements.modalLocation;
    modalDescription = elements.modalDescription;
    modalTagsContainer = elements.modalTagsContainer;
    modalCloseButton = elements.modalCloseButton;
    modalPrevButton = elements.modalPrevButton;
    modalNextButton = elements.modalNextButton;
    modalCardNavContainer = elements.modalCardNavContainer;

    if (!modalContainer) {
        console.error("Modal container not found!");
        return;
    }

    setGlobalState({ currentModalIndex: globalState.allCardsData.findIndex(item => item.id === data.id) });
    if (globalState.currentModalIndex === -1) {
        console.warn("Card data not found in allCardsData for ID:", data.id);
        return;
    }

    // Store the card element for closing animation
    _lastCardElement = cardElement;

    // If a card element is provided, trigger its exit animation and position modal
    if (cardElement && modalContainer.querySelector('.experience-modal-content')) {
        cardElement.classList.add('exiting');
        const cardRect = cardElement.getBoundingClientRect();
        const modalContent = modalContainer.querySelector('.experience-modal-content');
        
        // Set initial modal position and size to match card
        modalContent.style.width = `${cardRect.width}px`;
        modalContent.style.height = `${cardRect.height}px`;
        modalContent.style.position = 'absolute';
        modalContent.style.left = `${cardRect.left + window.scrollX}px`;
        modalContent.style.top = `${cardRect.top + window.scrollY}px`;
        modalContent.style.transform = 'scale(0.93) translateY(10px)';

        // Delay modal appearance
        setTimeout(() => {
            updateModalContents(data);
            populateModalCardNav();
            modalContainer.classList.add('active');
            // Reset card after modal is shown
            setTimeout(() => {
                cardElement.classList.remove('exiting');
                cardElement.classList.add('hidden');
                modalContent.style.position = ''; // Reset position to allow centering
                modalContent.style.width = '';
                modalContent.style.height = '';
                modalContent.style.left = '';
                modalContent.style.top = '';
                modalContent.style.transform = ''; // Let CSS handle scale
            }, 650); // Match total animation duration (0.35s + 0.3s)
        }, 350); // Match card exit animation duration
    } else {
        updateModalContents(data);
        populateModalCardNav();
        modalContainer.classList.add('active');
    }

    // Add click listeners to "meaning-chunk" elements in description
    const descChunks = modalDescription.querySelectorAll('.meaning-chunk');
    descChunks.forEach((chunk, index) => {
        chunk.setAttribute('data-chunk-index', String(index));
        chunk.addEventListener('click', () => {
            const chunkIndex = parseInt(chunk.getAttribute('data-chunk-index') || '0', 10);
            if (!isNaN(chunkIndex) && chunkIndex >= 0 && chunkIndex < globalState.currentModalImages.length) {
                setGlobalState({ currentImageIndex: chunkIndex });
                updateModalImage();
                updateNavButtons();
            }
        });
    });
}

/**
 * Updates the content of the modal with the provided data.
 * @param {object} data - The data object for the current modal content.
 */
export function updateModalContents(data) {
    if (!data) return;

    modalTitle.innerHTML = data.title.replace(/\//g, '/ ');
    modalCompany.textContent = data.company;

    const { display, period } = _parseDateRangeFunc(data.date);
    if (modalDurationDisplay) modalDurationDisplay.textContent = display;
    if (modalDurationPeriod) modalDurationPeriod.textContent = period;

    if (modalFieldLabel) modalFieldLabel.textContent = data.type === 'edu' ? 'Role' : 'Field';
    if (modalField) modalField.textContent = data.field || 'N/A';

    if (modalLocation) modalLocation.textContent = data.location || 'Seoul, Korea';

    if (modalDescription) modalDescription.innerHTML = data.descriptionHTML;

    if (modalTagsContainer) {
        modalTagsContainer.innerHTML = data.tags.map(tag => {
            let spanClass = tag.class;
            let gridSpan = tag.text.length > 16 ? 'style="grid-column: span 2;"' : '';
            return `<span class="${spanClass}" ${gridSpan} data-highlight-id="${tag.highlightId}">${tag.text}</span>`;
        }).join('');
    }

    setGlobalState({ currentModalImages: data.images || [] });
    setGlobalState({ currentImageIndex: 0 });
    updateModalImage();
    updateNavButtons();
}

/**
 * Populates the navigation dots within the modal for switching between cards.
 */
export function populateModalCardNav() {
    if (!modalCardNavContainer) {
        console.warn("Modal card navigation container not found!");
        return;
    }
    modalCardNavContainer.innerHTML = '';
    if (!globalState.allCardsData || globalState.allCardsData.length === 0) {
        console.warn("No card data available for navigation dots!");
        return;
    }
    globalState.allCardsData.forEach((item, index) => {
        const dot = document.createElement('div');
        dot.classList.add('modal-nav-dot');
        if (index === globalState.currentModalIndex) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            switchToModalCard(index);
        });
        modalCardNavContainer.appendChild(dot);
    });
}

/**
 * Switches the modal content to display data for a new card.
 * @param {number} newIndex - The index of the card to switch to.
 */
export function switchToModalCard(newIndex) {
    if (newIndex >= 0 && newIndex < globalState.allCardsData.length) {
        setGlobalState({ currentModalIndex: newIndex });
        const newData = globalState.allCardsData[newIndex];
        updateModalContents(newData);
        populateModalCardNav();

        if (newData && newData.id) {
            const targetCardElement = document.getElementById(newData.id);
            if (targetCardElement && window.scrollElementToCenterPromise) {
                const scrollTarget = targetCardElement.closest('.timeline-entry') || targetCardElement;
                window.scrollElementToCenterPromise(scrollTarget, 466);
                // Update _lastCardElement for closing animation
                _lastCardElement = targetCardElement;
            }
        }
    } else {
        console.warn("Invalid card index for switching:", newIndex);
    }
}

/**
 * Updates the image displayed within the modal.
 */
export function updateModalImage() {
    if (modalImageElement && globalState.currentModalImages && globalState.currentModalImages.length > 0) {
        modalImageElement.src = globalState.currentModalImages[globalState.currentImageIndex];
        modalImageElement.alt = `Image ${globalState.currentImageIndex + 1} for ${modalTitle.textContent}`;
        if (modalImageCounter) {
            modalImageCounter.textContent = `${globalState.currentImageIndex + 1} / ${globalState.currentModalImages.length}`;
        }
    } else if (modalImageCounter) {
        modalImageCounter.textContent = '';
    }
}

/**
 * Updates the visibility of the modal navigation buttons (previous/next image).
 */
export function updateNavButtons() {
    if (modalPrevButton && modalNextButton) {
        const hasMultipleImages = globalState.currentModalImages && globalState.currentModalImages.length > 1;
        modalPrevButton.style.display = hasMultipleImages ? 'block' : 'none';
        modalNextButton.style.display = hasMultipleImages ? 'block' : 'none';
    }
}

/**
 * Closes the experience modal with animation.
 */
export function closeModal() {
    if (modalContainer) {
        modalContainer.classList.add('closing');
        modalContainer.classList.remove('active');

        // If there's a last card, animate it back
        if (_lastCardElement) {
            const cardRect = _lastCardElement.getBoundingClientRect();
            const modalContent = modalContainer.querySelector('.experience-modal-content');
            modalContent.style.width = `${cardRect.width}px`;
            modalContent.style.height = `${cardRect.height}px`;
            modalContent.style.left = `${cardRect.left + window.scrollX}px`;
            modalContent.style.top = `${cardRect.top + window.scrollY}px`;
            modalContent.style.transform = 'scale(0.93) translateY(10px)';

            _lastCardElement.classList.add('returning');
            setTimeout(() => {
                modalContainer.classList.remove('closing');
                _lastCardElement.classList.remove('hidden', 'returning');
                modalContent.style.width = '';
                modalContent.style.height = '';
                modalContent.style.left = '';
                modalContent.style.top = '';
                modalContent.style.transform = '';
            }, 350); // Match closing animation duration (0.35s)
        } else {
            setTimeout(() => {
                modalContainer.classList.remove('closing');
            }, 350);
        }
    }
}