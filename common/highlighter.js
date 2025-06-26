// highlighter.js

// --- Global Highlight Data Management Functions ---
/**
 * Fetches highlight data from localStorage.
 * @returns {object} The highlight data object.
 */
function getHighlightData() {
    const data = localStorage.getItem('userHighlights');
    return data ? JSON.parse(data) : {};
}

/**
 * Saves highlight data to localStorage.
 * @param {object} data - The highlight data object to save.
 */
function saveHighlightData(data) {
    localStorage.setItem('userHighlights', JSON.stringify(data));
    document.dispatchEvent(new Event('highlightDataChanged'));
}

/**
 * Fetches unhighlighted (archived) data from localStorage.
 * @returns {object} The unhighlighted data object.
 */
function getUnhighlightData() {
    const data = localStorage.getItem('userUnhighlights');
    return data ? JSON.parse(data) : {};
}

/**
 * Saves unhighlighted (archived) data to localStorage.
 * @param {object} data - The unhighlighted data object to save.
 */
function saveUnhighlightData(data) {
    localStorage.setItem('userUnhighlights', JSON.stringify(data));
    document.dispatchEvent(new Event('highlightDataChanged'));
}

/**
 * Applies a highlight to an element and saves the data.
 * @param {HTMLElement} element - The DOM element to apply the highlight to.
 * @param {string} color - The color to apply.
 */
function applyHighlight(element, color) {
    const id = element.dataset.highlightId;
    if (!id) return;

    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    element.classList.add(`highlight-${color}`);

    const highlights = getHighlightData();
    const timestamp = Date.now();

    console.log(`[applyHighlight] ID: ${id}, Timestamp: ${timestamp} (Type: ${typeof timestamp})`);

    highlights[id] = {
        color: color,
        text: element.textContent.trim(),
        page: document.title || location.pathname,
        timestamp: timestamp
    };
    saveHighlightData(highlights);
}

/**
 * Deactivates a highlight and moves it to the 'unhighlights' (trash) archive.
 * @param {HTMLElement|null} element - The DOM element (or null if not available).
 * @param {string} highlightId - The ID of the highlight.
 */
function unHighlightElement(element, highlightId) {
    const id = highlightId || (element ? element.dataset.highlightId : null);
    if (!id) return;

    if (element) {
        const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
        highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    }

    const highlights = getHighlightData();
    const unhighlights = getUnhighlightData();

    if (highlights[id]) {
        unhighlights[id] = highlights[id];
        delete highlights[id];
        saveHighlightData(highlights);
        saveUnhighlightData(unhighlights);
    }
}

/**
 * Restores an archived highlight, making it active again.
 * @param {string} id - The ID of the highlight to restore.
 */
function restoreHighlight(id) {
    const highlights = getHighlightData();
    const unhighlights = getUnhighlightData();

    if (unhighlights[id]) {
        highlights[id] = unhighlights[id];
        delete unhighlights[id];
        saveHighlightData(highlights);
        saveUnhighlightData(unhighlights);
    }
}

/**
 * Permanently deletes an archived highlight.
 * @param {string} id - The ID of the highlight to permanently delete.
 */
function deleteUnhighlightPermanently(id) {
    const unhighlights = getUnhighlightData();
    if (unhighlights[id]) {
        delete unhighlights[id];
        saveUnhighlightData(unhighlights);
    }
}

// --- Highlighter UI and Event Logic ---
let currentlyAssociatedMenuElement = null;
let highlightMenu = null;
const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
let isDragging = false;
let startX = 0;
let startY = 0;
const DRAG_THRESHOLD = 5;

/**
 * Creates and appends the highlight menu to the body.
 */
function createHighlightMenu() {
    if (document.getElementById('highlight-menu')) return;

    const menu = document.createElement('div');
    menu.id = 'highlight-menu';
    menu.innerHTML = `
        <div class="drag-handle" title="Drag to move">::</div>
        <div class="color-palette">
            ${highlightColors.map(color => `<div class="color-swatch" data-color="${color}" title="${color}"></div>`).join('')}
        </div>
    `;
    document.body.appendChild(menu);
    highlightMenu = menu;

    menu.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch && currentlyAssociatedMenuElement) {
            const newColor = swatch.dataset.color;
            applyHighlight(currentlyAssociatedMenuElement, newColor);
            updateActiveColor(currentlyAssociatedMenuElement);
        }
    });

    makeMenuDraggable(menu);
}

/**
 * Makes the highlight menu draggable.
 * @param {HTMLElement} menuElement - The menu element to make draggable.
 */
function makeMenuDraggable(menuElement) {
    const dragHandle = menuElement.querySelector('.drag-handle');
    let offsetX, offsetY;

    dragHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        offsetX = e.clientX - menuElement.getBoundingClientRect().left;
        offsetY = e.clientY - menuElement.getBoundingClientRect().top;
        menuElement.style.transition = 'none'; // Disable transition during drag

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        e.preventDefault();
        const x = e.clientX + window.scrollX - offsetX;
        const y = e.clientY + window.scrollY - offsetY;
        menuElement.style.left = `${x}px`;
        menuElement.style.top = `${y}px`;
    }

    function onMouseUp(e) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const diffX = Math.abs(e.clientX - startX);
        const diffY = Math.abs(e.clientY - startY);

        if (diffX < DRAG_THRESHOLD && diffY < DRAG_THRESHOLD) {
            isDragging = false; // It was a click, not a drag
        } else {
            // Give a small delay to prevent immediate click actions after dragging
            setTimeout(() => {
                isDragging = false;
            }, 200);
        }
        
        // Re-enable transition after dragging
        if (menuElement.style.transition === 'none') {
            menuElement.style.transition = '';
        }
    }
}

/**
 * Hides the highlight menu.
 */
function hideMenu() {
    if (highlightMenu) {
        highlightMenu.style.display = 'none';
    }
}

/**
 * Updates the active color swatch in the highlight menu based on the target element's highlight.
 * @param {HTMLElement} targetElement - The element whose highlight color determines the active swatch.
 */
function updateActiveColor(targetElement) {
    if (!highlightMenu || !targetElement) return;

    const currentColor = highlightColors.find(c => targetElement.classList.contains(`highlight-${c}`)) || 'yellow';

    highlightMenu.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    const activeSwatch = highlightMenu.querySelector(`.color-swatch[data-color="${currentColor}"]`);
    if (activeSwatch) activeSwatch.classList.add('active');
}

/**
 * Shows the highlight menu near the clicked element.
 * @param {HTMLElement} targetElement - The element to associate the menu with.
 * @param {MouseEvent} clickEvent - The click event object to get coordinates.
 */
function showMenu(targetElement, clickEvent) {
    if (!highlightMenu || !clickEvent || isDragging) return;

    // Check if menu is already visible and associated with the same element
    const menuRect = highlightMenu.getBoundingClientRect();
    const isMenuVisibleOnScreen = 
        highlightMenu.style.display === 'flex' &&
        menuRect.top < window.innerHeight && menuRect.bottom > 0 &&
        menuRect.left < window.innerWidth && menuRect.right > 0;

    if (isMenuVisibleOnScreen && currentlyAssociatedMenuElement === targetElement) {
        updateActiveColor(targetElement); // Just update active color if already open for same element
        return;
    }

    const menuLeft = window.scrollX + clickEvent.clientX - (highlightMenu.offsetWidth / 2);
    const menuTop = window.scrollY + clickEvent.clientY - 100; // Position above the click

    highlightMenu.style.left = `${Math.max(5, menuLeft)}px`; // Ensure it's not off-screen left
    highlightMenu.style.top = `${menuTop}px`;
    highlightMenu.style.display = 'flex';
    updateActiveColor(targetElement);
}

/**
 * Applies saved highlights from localStorage to the corresponding elements on the page.
 */
function applySavedHighlights() {
    const highlights = getHighlightData();
    for (const id in highlights) {
        const element = document.querySelector(`[data-highlight-id="${id}"]`);
        if (element) {
            const savedColor = highlights[id].color;
            element.classList.add(`highlight-${savedColor}`);
        }
    }
}

/**
 * Inserts CSS to change cursor for highlightable elements.
 */
function setHighlighterCursorStyle() {
    if (document.getElementById('highlighter-cursor-style')) return;

    const style = document.createElement('style');
    style.id = 'highlighter-cursor-style';
    style.textContent = `
        .meaning-chunk[data-highlight-id]:hover,
        .timeline-chunk[data-highlight-id]:hover,
        .skill-chunk[data-highlight-id]:hover,
        .timeline-tag-chunk1[data-highlight-id]:hover,
        .timeline-tag-chunk2[data-highlight-id]:hover {
            cursor: url('../img/highlighter.png') 20 20, auto !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Initializes the highlighter functionality: creates menu, applies saved highlights,
 * sets cursor style, and sets up click event listener for highlighting.
 */
function initializeHighlighter() {
    createHighlightMenu();
    applySavedHighlights();
    setHighlighterCursorStyle();

    const targetSelector = '.meaning-chunk[data-highlight-id], .timeline-chunk[data-highlight-id], .skill-chunk[data-highlight-id], .timeline-tag-chunk1[data-highlight-id], .timeline-tag-chunk2[data-highlight-id]';

    document.body.addEventListener('click', (e) => {
        // Prevent highlighting interaction if dragging the menu or clicking on the drag handle
        if (isDragging || e.target.closest('.drag-handle')) {
            return;
        }

        const highlightableTarget = e.target.closest(targetSelector);
        const menuClicked = e.target.closest('#highlight-menu');

        // If a click happened inside the menu but not on a color swatch, ignore it
        if (menuClicked && !e.target.closest('.color-swatch')) {
            return;
        }

        if (highlightableTarget) {
            const isAlreadyHighlighted = highlightColors.some(c => highlightableTarget.classList.contains(`highlight-${c}`));

            // If a different element is clicked, update associated element and show menu
            if (currentlyAssociatedMenuElement !== highlightableTarget) {
                currentlyAssociatedMenuElement = highlightableTarget;
                // If the new element isn't highlighted, apply default yellow
                if (!isAlreadyHighlighted) {
                    applyHighlight(highlightableTarget, 'yellow');
                }
                showMenu(highlightableTarget, e);
                return; // Prevent further processing if a highlightable target was just handled
            }

            // If the same element is clicked again
            if (isAlreadyHighlighted) {
                // Remove highlight if already highlighted
                unHighlightElement(highlightableTarget);
                // If it was the menu's associated element, hide the menu
                if (highlightableTarget === currentlyAssociatedMenuElement) {
                    hideMenu();
                    currentlyAssociatedMenuElement = null;
                }
            } else {
                // Apply default yellow highlight if not highlighted
                applyHighlight(highlightableTarget, 'yellow');
                currentlyAssociatedMenuElement = highlightableTarget;
                showMenu(highlightableTarget, e);
            }
        } else {
            // Clicked outside any highlightable element or menu, so hide menu
            hideMenu();
            currentlyAssociatedMenuElement = null;
        }
    });
}

// Initialize highlighter when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeHighlighter);