// card.js
import { globalState, setGlobalState } from './experience.js';

/**
 * Placeholder image sets for cards.
 * @type {string[][]}
 */
const placeholderImages = [
    ['images/1-1.png', 'images/1-2.png', 'images/1-3.png', 'images/1-4.png', 'images/1-5.png'],
    ['images/exp_placeholder_2.jpg', 'images/exp_placeholder_2_b.jpg'],
    ['images/exp_placeholder_3.jpg', 'images/exp_placeholder_3_b.jpg'],
    ['images/exp_placeholder_4.jpg', 'images/exp_placeholder_4_b.jpg'],
    ['images/exp_placeholder_5.jpg', 'images/exp_placeholder_5_b.jpg'],
    ['images/exp_placeholder_6.jpg', 'images/exp_placeholder_6_b.jpg']
];

/**
 * Counter for cycling through placeholder image sets.
 * @type {number}
 */
let imageCounter = 0;

/**
 * Configuration options for card module.
 * @type {Object}
 */
let config = {
    setCardDescriptionSummary: null,
    openModal: null,
    activateStageByCardId: null,
    MIN_IMAGE_WIDTH_CARD: 150,
    MAX_IMAGE_WIDTH_CARD: 400,
    hasTouch: 'ontouchstart' in window
};

/**
 * Initializes the card module with event listeners and configuration.
 * @param {Object} options - Configuration options including callbacks and constants.
 */
export function initCardResizeHandles(options) {
    config = { ...config, ...options };

    // Set initial CSS variable for card image width
    let cardImageWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-image-width')) || 200;
    if (isNaN(cardImageWidth)) {
        cardImageWidth = 200;
    }
    document.documentElement.style.setProperty('--card-image-width', `${cardImageWidth}px`);
    document.documentElement.style.setProperty('--card-image-height', `${cardImageWidth}px`);

    // Attach resize event listeners to all cards
    document.querySelectorAll('.masonry-card').forEach(card => {
        const resizeHandle = card.querySelector('.card-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', e => startCardResize(e, card));
            if (config.hasTouch) {
                resizeHandle.addEventListener('touchstart', e => startCardResize(e, card), { passive: false });
            }
        }
        updateCardContentFontSize(card); // Initial font size setup for each card
    });
}

/**
 * Retrieves the next set of placeholder images for a card.
 * @returns {string[]} Array of image URLs.
 */
export function getNextImageSet() {
    const images = placeholderImages[imageCounter % placeholderImages.length] || [placeholderImages[0][0]];
    imageCounter++;
    return images;
}

/**
 * Sets up the card description summary with dynamic line clamping and a "more" button.
 * @param {HTMLElement} cardContentEl - The .card-content element.
 * @param {string} desc - The full description text.
 */
export function setCardDescriptionSummary(cardContentEl, desc) {
    const summaryEl = cardContentEl.querySelector('.card-description-summary');
    summaryEl.textContent = desc;

    let maxLines = 2;
    let expanded = false;

    const updateLineClamp = () => {
        const cardWidth = cardContentEl.offsetWidth;
        maxLines = cardWidth > 420 ? 4 : cardWidth > 350 ? 3 : 2;

        if (!expanded) {
            summaryEl.style.webkitLineClamp = maxLines;
            summaryEl.style.display = '-webkit-box';
            summaryEl.style.maxHeight = `${1.5 * maxLines}em`;
            summaryEl.classList.remove('expanded');
        }
        updateMoreButton();
    };

    const updateMoreButton = () => {
        const moreBtn = summaryEl.querySelector('.more-text');
        if (!expanded && summaryEl.scrollHeight > summaryEl.offsetHeight + 2) {
            if (!moreBtn) {
                const moreBtn = document.createElement('span');
                moreBtn.className = 'more-text';
                moreBtn.textContent = ' ...더보기';
                moreBtn.onclick = () => expandSummary();
                summaryEl.appendChild(moreBtn);
            }
        } else if (moreBtn) {
            moreBtn.remove();
        }
    };

    const expandSummary = () => {
        expanded = true;
        summaryEl.classList.add('expanded');
        summaryEl.style.webkitLineClamp = 'unset';
        summaryEl.style.maxHeight = '1000px';
        summaryEl.querySelector('.more-text')?.remove();
        summaryEl.textContent = desc;
    };

    const resizeObserver = new ResizeObserver(updateLineClamp);
    resizeObserver.observe(cardContentEl);
    setTimeout(updateMoreButton, 100);
}

/**
 * Creates a masonry card element with image, title, company, date, and tags.
 * @param {Object} data - Card data object.
 * @param {Object} options - Options including callbacks.
 * @returns {HTMLElement} The created card element.
 */
export function createMasonryCard(data, options) {
    const card = document.createElement('div');
    card.classList.add('masonry-card');
    card.id = data.id;
    card.tabIndex = 0;

    card.innerHTML = `
        <div class="image-and-handle-wrapper">
            <div class="card-image-container">
                <img src="${data.images[0]}" alt="${data.title}" class="card-image" onerror="this.style.display='none'; this.parentElement.style.backgroundColor='#ddd';">
                <button class="experience-modal-nav-btn card-image-prev" aria-label="Previous Image"><</button>
                <button class="experience-modal-nav-btn card-image-next" aria-label="Next Image">></button>
                <div class="experience-modal-image-index card-image-index"></div>
            </div>
            <div class="card-resize-handle"></div>
        </div>
        <div class="card-content">
            <div class="card-content-group">
                <h3 class="card-title">${data.title}</h3>
                <p class="card-company">${data.company}</p>
            </div>
            <p class="card-date">${data.date}</p>
            <div class="card-description-summary"></div>
            <div class="card-tags">
                ${data.tags.map(tag => `<span class="${tag.class}">${tag.text}</span>`).join('')}
            </div>
        </div>
    `;

    options.setCardDescriptionSummary(card.querySelector('.card-content'), data.descriptionText);

    let currentImageIndex = 0;
    const images = data.images;
    const imageElement = card.querySelector('.card-image');
    const prevButton = card.querySelector('.card-image-prev');
    const nextButton = card.querySelector('.card-image-next');
    const imageIndexDisplay = card.querySelector('.card-image-index');

    /**
     * Updates the card's image and navigation display.
     */
    const updateImageDisplay = () => {
        if (images?.length > 0) {
            imageElement.src = images[currentImageIndex];
            imageElement.alt = `Image ${currentImageIndex + 1} for ${data.title}`;
            imageIndexDisplay.textContent = `${currentImageIndex + 1} / ${images.length}`;
            prevButton.disabled = false;
            nextButton.disabled = false;
            const showNav = images.length > 1;
            prevButton.style.display = showNav ? 'block' : 'none';
            nextButton.style.display = showNav ? 'block' : 'none';
            imageIndexDisplay.style.display = showNav ? 'block' : 'none';
        } else {
            imageElement.src = 'https://placehold.co/400x300/cccccc/333333?text=No+Image';
            imageIndexDisplay.textContent = '';
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        }
    };

    prevButton.addEventListener('click', e => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateImageDisplay();
    });

    nextButton.addEventListener('click', e => {
        e.stopPropagation();
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateImageDisplay();
    });

    updateImageDisplay();

    card.addEventListener('click', e => {
        if (e.target.classList.contains('card-resize-handle') || 
            e.target.classList.contains('experience-modal-nav-btn') || 
            e.target.classList.contains('more-text')) {
            return;
        }

        const scrollTarget = card.closest('.timeline-entry') || card;
        window.scrollElementToCenterPromise(scrollTarget, 466)
            .then(() => {
                options.openModal(data, card);
                options.activateStageByCardId(data.id, false);
            })
            .catch(error => {
                console.error('Scroll promise failed:', error);
                options.openModal(data, card);
                options.activateStageByCardId(data.id, false);
            });
    });

    card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });

    return card;
}

/**
 * Starts the card image resizing process.
 * @param {Event} event - Mouse or touch event.
 * @param {HTMLElement} card - The card being resized.
 */
function startCardResize(event, card) {
    event.preventDefault();
    setGlobalState({ isResizingCard: true, startX: event.touches ? event.touches[0].clientX : event.clientX });
    const imageContainer = card.querySelector('.card-image-container');
    setGlobalState({ 
        startImageWidth: imageContainer.offsetWidth, 
        startCardWidth: card.offsetWidth 
    });
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', onCardResizeMove);
    document.addEventListener('mouseup', onCardResizeEnd);
    if (config.hasTouch) {
        document.addEventListener('touchmove', onCardResizeMoveTouch, { passive: false });
        document.addEventListener('touchend', onCardResizeEndTouch);
    }
}

/**
 * Updates the font size of card content based on its width.
 * @param {HTMLElement} card - The card element.
 */
function updateCardContentFontSize(card) {
    const content = card.querySelector('.card-content');
    if (!content) return;

    const width = content.offsetWidth;
    const newFontSize = Math.max(13, Math.min(18, width / 13));

    // Apply new font size to general text elements
    content.querySelectorAll('.card-company, .card-date, .card-tags span')
        .forEach(el => el.style.fontSize = `${newFontSize}px`);

    // Apply larger font size to card-title
    const titleEl = card.querySelector('.card-title');
    if (titleEl) {
        titleEl.style.fontSize = `${newFontSize + 5}px`;
    }

    const summaryEl = card.querySelector('.card-description-summary');
    if (summaryEl) {
        summaryEl.style.fontSize = `${Math.max(10, newFontSize - 2)}px`;
    }
}

/**
 * Handles mouse move during card image resizing.
 * @param {MouseEvent} event - The mouse event.
 */
function onCardResizeMove(event) {
    if (!globalState.isResizingCard) return;
    event.preventDefault();
    const dx = event.clientX - globalState.startX;
    
    const card = event.target.closest('.masonry-card');
    if (!card) return;

    // Calculate dynamic min/max based on the parent card's width
    const parentWidth = card.offsetWidth;
    const minImageWidthBasedOnParent = parentWidth * 0.35;
    const maxImageWidthBasedOnParent = parentWidth * 0.70;

    // Apply overall fixed min/max from config AND dynamic min/max based on parent
    let newImageWidth = globalState.startImageWidth + dx;
    newImageWidth = Math.max(config.MIN_IMAGE_WIDTH_CARD, Math.min(newImageWidth, config.MAX_IMAGE_WIDTH_CARD));
    newImageWidth = Math.max(minImageWidthBasedOnParent, Math.min(newImageWidth, maxImageWidthBasedOnParent));
    
    // Set the CSS variable for the image width
    document.documentElement.style.setProperty('--card-image-width', `${newImageWidth}px`);
    document.documentElement.style.setProperty('--card-image-height', `${newImageWidth}px`);

    // Update font sizes for ALL cards
    document.querySelectorAll('.masonry-card').forEach(c => updateCardContentFontSize(c));
}

/**
 * Ends card image resizing for mouse events.
 */
function onCardResizeEnd() {
    if (!globalState.isResizingCard) return;
    setGlobalState({ isResizingCard: false });
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', onCardResizeMove);
    document.removeEventListener('mouseup', onCardResizeEnd);

    // Ensure all card fonts are updated after resize ends
    document.querySelectorAll('.masonry-card').forEach(c => updateCardContentFontSize(c));
}

/**
 * Handles touch move during card image resizing.
 * @param {TouchEvent} event - The touch event.
 */
function onCardResizeMoveTouch(event) {
    if (!globalState.isResizingCard) return;
    event.preventDefault();
    const touchX = event.touches[0].clientX;
    const dx = touchX - globalState.startX;

    const card = event.target.closest('.masonry-card');
    if (!card) return;

    // Calculate dynamic min/max based on the parent card's width
    const parentWidth = card.offsetWidth;
    const minImageWidthBasedOnParent = parentWidth * 0.35;
    const maxImageWidthBasedOnParent = parentWidth * 0.70;

    // Apply overall fixed min/max from config AND dynamic min/max based on parent
    let newImageWidth = globalState.startImageWidth + dx;
    newImageWidth = Math.max(config.MIN_IMAGE_WIDTH_CARD, Math.min(newImageWidth, config.MAX_IMAGE_WIDTH_CARD));
    newImageWidth = Math.max(minImageWidthBasedOnParent, Math.min(newImageWidth, maxImageWidthBasedOnParent));

    // Set the CSS variable for the image width
    document.documentElement.style.setProperty('--card-image-width', `${newImageWidth}px`);
    document.documentElement.style.setProperty('--card-image-height', `${newImageWidth}px`);

    // Update font sizes for ALL cards
    document.querySelectorAll('.masonry-card').forEach(c => updateCardContentFontSize(c));
}

/**
 * Ends card image resizing for touch events.
 */
function onCardResizeEndTouch() {
    if (!globalState.isResizingCard) return;
    setGlobalState({ isResizingCard: false });
    document.removeEventListener('touchmove', onCardResizeMoveTouch);
    document.removeEventListener('touchend', onCardResizeEndTouch);

    // Ensure all card fonts are updated after resize ends
    document.querySelectorAll('.masonry-card').forEach(c => updateCardContentFontSize(c));
}