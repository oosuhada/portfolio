// fixedGrapeImage.js
// Manages the draggable and resizable fixed grape image, including
// its position, size, border-radius changes, and resize handles.

import { globalState, setGlobalState } from './experience.js'; // Import global state

let _fixedGrapeImageContainer;
let _grapeImgElement;
let _dragInstructionElement;

let _hasTouch;
let _MIN_IMAGE_SIZE_FIXED;
let _MAX_IMAGE_SIZE_FIXED;
let _MOVE_THRESHOLD;
let _RESIZE_HANDLE_SIZE;
let _DRAGGER_WIDTH_CONST; // Need to pass DRAGGER_WIDTH

const borderRadiusStates = [
    '0',
    '50%',
];

/**
 * Initializes this module with necessary DOM elements and constants.
 */
export function initFixedGrapeImage({
    fixedGrapeImageContainer, grapeImgElement, dragInstructionElement,
    DRAGGER_WIDTH, MOVE_THRESHOLD, RESIZE_HANDLE_SIZE, MIN_IMAGE_SIZE_FIXED, MAX_IMAGE_SIZE_FIXED, hasTouch
}) {
    _fixedGrapeImageContainer = fixedGrapeImageContainer;
    _grapeImgElement = grapeImgElement;
    _dragInstructionElement = dragInstructionElement;

    _DRAGGER_WIDTH_CONST = DRAGGER_WIDTH; // Set constant for use in this module
    _MOVE_THRESHOLD = MOVE_THRESHOLD;
    _RESIZE_HANDLE_SIZE = RESIZE_HANDLE_SIZE;
    _MIN_IMAGE_SIZE_FIXED = MIN_IMAGE_SIZE_FIXED;
    _MAX_IMAGE_SIZE_FIXED = MAX_IMAGE_SIZE_FIXED;
    _hasTouch = hasTouch;

    // --- 1. Resize Handles creation ---
    _fixedGrapeImageContainer.querySelectorAll('.resize-handle').forEach(handle => handle.remove());

    const handlePositions = [
        'top-left', 'top', 'top-right',
        'right', 'bottom-right', 'bottom',
        'bottom-left', 'left'
    ];
    handlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.setAttribute('data-direction', pos);
        _fixedGrapeImageContainer.appendChild(handle);
    });

    applyBorderRadius(globalState.borderRadiusIndex); // Apply initial border radius from global state

    // Event listeners for resize handles (re-attached every time to ensure they point to correct current functions)
    _fixedGrapeImageContainer.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', onResizeStart);
        handle.addEventListener('touchstart', onResizeStart, { passive: false });
    });
    // Event listeners for main image for dragging
    _grapeImgElement.addEventListener('mousedown', onDragStart);
    _grapeImgElement.addEventListener('touchstart', onDragStart, { passive: false });

    // Event listeners for cursor changes on hover
    _fixedGrapeImageContainer.addEventListener('mousemove', onContainerMouseMove);
    _fixedGrapeImageContainer.addEventListener('mouseleave', onContainerMouseLeave);

    if (_dragInstructionElement && _fixedGrapeImageContainer.dataset.isDragged !== 'true') {
        _dragInstructionElement.classList.remove('hidden');
    }
}

/**
 * Updates the visibility and position of the fixed image container and drag instruction.
 * It checks if the image has been manually dragged to override auto-positioning.
 * @param {object} elements - DOM elements needed: fixedGrapeImageContainer, dragInstructionElement.
 */
export function updateFixedElementsDisplay({ fixedGrapeImageContainer, dragInstructionElement }) {
    const showFixedImage = globalState.isTimelineAreaVisible && !globalState.isHeroAreaVisible && !globalState.isFooterAreaDominant;

    if (fixedGrapeImageContainer) {
        const manuallyAdjusted = fixedGrapeImageContainer.dataset.isDragged === 'true';

        fixedGrapeImageContainer.classList.toggle('visible', showFixedImage);

        if (!manuallyAdjusted && showFixedImage) {
            updateFixedImagePosition({ fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH: _DRAGGER_WIDTH_CONST });
            if (dragInstructionElement) {
                dragInstructionElement.classList.remove('hidden');
            }
        } else if (manuallyAdjusted) {
            if (dragInstructionElement) {
                dragInstructionElement.classList.add('hidden');
            }
        } else {
            if (dragInstructionElement) {
                dragInstructionElement.classList.add('hidden');
            }
        }
    }
}

/**
 * Updates the position of the fixed grape image container relative to the timeline dragger.
 * This function is skipped if the user has manually dragged the image.
 * @param {object} elements - DOM elements for fixedGrapeImageContainer, dragInstructionElement.
 * @param {number} DRAGGER_WIDTH_CONST - Constant for dragger width.
 */
export function updateFixedImagePosition({ fixedGrapeImageContainer, dragInstructionElement, DRAGGER_WIDTH: DRAGGER_WIDTH_CONST }) {
    if (fixedGrapeImageContainer && fixedGrapeImageContainer.dataset.isDragged === 'true') {
        return;
    }

    const dragger = document.getElementById('timeline-dragger');
    if (fixedGrapeImageContainer && dragger && fixedGrapeImageContainer.classList.contains('visible')) {
        const draggerRect = dragger.getBoundingClientRect();
        const newLeftPosition = draggerRect.right + 20;

        fixedGrapeImageContainer.style.right = 'auto';
        fixedGrapeImageContainer.style.bottom = '20px';
        fixedGrapeImageContainer.style.left = `${newLeftPosition}px`;
        fixedGrapeImageContainer.style.top = 'auto';
    }
}

/**
 * Updates CSS variables for ellipse radii based on container dimensions.
 */
function updateEllipseRadiusVars() {
    const rx = _fixedGrapeImageContainer.offsetWidth / 2;
    const ry = _fixedGrapeImageContainer.offsetHeight / 2;
    _fixedGrapeImageContainer.style.setProperty('--resize-radius-x', `${rx}px`);
    _fixedGrapeImageContainer.style.setProperty('--resize-radius-y', `${ry}px`);
}

/**
 * Updates the visibility and event listeners for diagonal resize handles.
 */
function updateDiagonalResizeHandles() {
    _fixedGrapeImageContainer.querySelectorAll('.resize-handle-45, .resize-handle-135, .resize-handle-225, .resize-handle-315').forEach(h => h.remove());

    const currentBorder = _fixedGrapeImageContainer.style.borderRadius;
    const isEllipse = currentBorder === '50%';

    if (isEllipse) {
        updateEllipseRadiusVars();

        [
            { className: 'resize-handle-45', direction: 'diag-45' },
            { className: 'resize-handle-135', direction: 'diag-135' },
            { className: 'resize-handle-225', direction: 'diag-225' },
            { className: 'resize-handle-315', direction: 'diag-315' }
        ].forEach(({ className, direction }) => {
            const handle = document.createElement('div');
            handle.className = className;
            handle.setAttribute('data-direction', direction);
            _fixedGrapeImageContainer.appendChild(handle);

            handle.addEventListener('mousedown', onResizeStart);
            handle.addEventListener('touchstart', onResizeStart, { passive: false });
        });
    } else {
        _fixedGrapeImageContainer.style.removeProperty('--resize-radius-x');
        _fixedGrapeImageContainer.style.removeProperty('--resize-radius-y');
    }
}

/**
 * Adjusts the visibility of resize handles based on the container's shape.
 * For perfect circles, hides cardinal direction handles.
 * @param {HTMLElement} container - The element whose handles need adjustment.
 */
function updateResizeHandlesForShape(container) {
    const isPerfectCircle =
        container.style.borderRadius === '50%' &&
        Math.abs(container.offsetWidth - container.offsetHeight) < 2;

    container.querySelectorAll('.resize-handle').forEach(h => h.style.display = '');

    if (isPerfectCircle) {
        ['top', 'right', 'bottom', 'left'].forEach(dir => {
            const el = container.querySelector(`.resize-handle.${dir}`);
            if (el) el.style.display = 'none';
        });
    }
}

/**
 * Applies the specified border-radius state to the container.
 * @param {number} idx - The index of the border-radius state to apply.
 */
function applyBorderRadius(idx) {
    _fixedGrapeImageContainer.style.borderRadius = borderRadiusStates[idx % borderRadiusStates.length];
    updateDiagonalResizeHandles();
    updateResizeHandlesForShape(_fixedGrapeImageContainer);
}

/**
 * Handles resize start events (mousedown/touchstart).
 * @param {Event} e - The mouse or touch event.
 */
function onResizeStart(e) {
    e.stopPropagation();
    e.preventDefault();

    setGlobalState({ isResizingFixedImage: true });
    setGlobalState({ resizeDirection: e.target.dataset.direction });

    const rect = _fixedGrapeImageContainer.getBoundingClientRect();
    setGlobalState({ initialPointerX: e.touches ? e.touches[0].clientX : e.clientX });
    setGlobalState({ initialPointerY: e.touches ? e.touches[0].clientY : e.clientY });
    setGlobalState({ initialFixedImageLeft: rect.left });
    setGlobalState({ initialFixedImageTop: rect.top });
    setGlobalState({ initialFixedImageWidth: rect.width });
    setGlobalState({ initialFixedImageHeight: rect.height });

    document.body.style.cursor = ['left', 'right'].includes(globalState.resizeDirection) ? 'ew-resize' :
        ['top', 'bottom'].includes(globalState.resizeDirection) ? 'ns-resize' :
        ['top-left', 'bottom-right'].includes(globalState.resizeDirection) ? 'nwse-resize' :
        ['top-right', 'bottom-left'].includes(globalState.resizeDirection) ? 'nesw-resize' : 'default';

    addGlobalPointerListeners();
    _fixedGrapeImageContainer.dataset.isDragged = 'true';
    if (_dragInstructionElement) _dragInstructionElement.classList.add('hidden');
}

/**
 * Handles drag start events (mousedown/touchstart).
 * @param {Event} e - The mouse or touch event.
 */
function onDragStart(e) {
    if (e.target.classList.contains('resize-handle')) {
        return;
    }
    e.preventDefault();

    setGlobalState({ isDraggingFixedImage: true });
    setGlobalState({ isClickEvent: true });

    setGlobalState({ initialPointerX: e.touches ? e.touches[0].clientX : e.clientX });
    setGlobalState({ initialPointerY: e.touches ? e.touches[0].clientY : e.clientY });

    const rect = _fixedGrapeImageContainer.getBoundingClientRect();
    setGlobalState({ initialFixedImageLeft: rect.left });
    setGlobalState({ initialFixedImageTop: rect.top });

    addGlobalPointerListeners();
}

/**
 * Handles mouse/touch move events for both dragging and resizing the fixed image.
 * @param {Event} e - The mouse or touch event object.
 */
function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const distMoved = Math.sqrt(
        Math.pow(clientX - globalState.initialPointerX, 2) +
        Math.pow(clientY - globalState.initialPointerY, 2)
    );
    if (distMoved > _MOVE_THRESHOLD) {
        setGlobalState({ isClickEvent: false });
        if (globalState.isDraggingFixedImage && _fixedGrapeImageContainer.dataset.isDragged !== 'true') { // Check if already marked as dragged
            _fixedGrapeImageContainer.dataset.isDragged = 'true';
            if (_dragInstructionElement) _dragInstructionElement.classList.add('hidden');
            document.body.style.cursor = 'grabbing';
        }
    }

    if (globalState.isResizingFixedImage) {
        let dx = clientX - globalState.initialPointerX;
        let dy = clientY - globalState.initialPointerY;
        let newWidth = globalState.initialFixedImageWidth, newHeight = globalState.initialFixedImageHeight;
        let newLeft = globalState.initialFixedImageLeft, newTop = globalState.initialFixedImageTop;

        const isPerfectCircle = _fixedGrapeImageContainer.style.borderRadius === '50%';

        if (
            isPerfectCircle &&
            ['diag-45', 'diag-135', 'diag-225', 'diag-315'].includes(globalState.resizeDirection)
        ) {
            let diagDelta = 0;
            if (globalState.resizeDirection === 'diag-45') diagDelta = (dx - dy) / 2;
            if (globalState.resizeDirection === 'diag-135') diagDelta = (-dx - dy) / 2;
            if (globalState.resizeDirection === 'diag-225') diagDelta = (-dx + dy) / 2;
            if (globalState.resizeDirection === 'diag-315') diagDelta = (dx + dy) / 2;

            newWidth = Math.max(_MIN_IMAGE_SIZE_FIXED, Math.min(globalState.initialFixedImageWidth + diagDelta, _MAX_IMAGE_SIZE_FIXED));
            newHeight = Math.max(_MIN_IMAGE_SIZE_FIXED, Math.min(globalState.initialFixedImageHeight + diagDelta, _MAX_IMAGE_SIZE_FIXED));

            if (['diag-135', 'diag-225'].includes(globalState.resizeDirection)) {
                newLeft = globalState.initialFixedImageLeft + (globalState.initialFixedImageWidth - newWidth);
            }
            if (['diag-135', 'diag-45'].includes(globalState.resizeDirection)) {
                newTop = globalState.initialFixedImageTop + (globalState.initialFixedImageHeight - newHeight);
            }

            _fixedGrapeImageContainer.style.width = newWidth + 'px';
            _fixedGrapeImageContainer.style.height = newHeight + 'px';
            _fixedGrapeImageContainer.style.left = newLeft + 'px';
            _fixedGrapeImageContainer.style.top = newTop + 'px';

            updateEllipseRadiusVars();
            return;
        }

        if (globalState.resizeDirection.includes('right')) newWidth = Math.max(_MIN_IMAGE_SIZE_FIXED, globalState.initialFixedImageWidth + dx);
        if (globalState.resizeDirection.includes('left')) {
            newWidth = Math.max(_MIN_IMAGE_SIZE_FIXED, globalState.initialFixedImageWidth - dx);
            newLeft = globalState.initialFixedImageLeft + (globalState.initialFixedImageWidth - newWidth);
        }
        if (globalState.resizeDirection.includes('bottom')) newHeight = Math.max(_MIN_IMAGE_SIZE_FIXED, globalState.initialFixedImageHeight + dy);
        if (globalState.resizeDirection.includes('top')) {
            newHeight = Math.max(_MIN_IMAGE_SIZE_FIXED, globalState.initialFixedImageHeight - dy);
            newTop = globalState.initialFixedImageTop + (globalState.initialFixedImageHeight - newHeight);
        }

        if (isPerfectCircle && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(globalState.resizeDirection)) {
            const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
            const ratio = (globalState.resizeDirection.includes('left') || globalState.resizeDirection.includes('top')) ? -1 : 1;
            newWidth = globalState.initialFixedImageWidth + (maxDelta * ratio);
            newHeight = globalState.initialFixedImageHeight + (maxDelta * ratio);
            newWidth = Math.max(_MIN_IMAGE_SIZE_FIXED, Math.min(newWidth, _MAX_IMAGE_SIZE_FIXED));
            newHeight = Math.max(_MIN_IMAGE_SIZE_FIXED, Math.min(newHeight, _MAX_IMAGE_SIZE_FIXED));
            if (globalState.resizeDirection.includes('left')) newLeft = globalState.initialFixedImageLeft + (globalState.initialFixedImageWidth - newWidth);
            if (globalState.resizeDirection.includes('top')) newTop = globalState.initialFixedImageTop + (globalState.initialFixedImageHeight - newHeight);
        }

        newWidth = Math.min(newWidth, _MAX_IMAGE_SIZE_FIXED);
        newHeight = Math.min(newHeight, _MAX_IMAGE_SIZE_FIXED);
        newWidth = Math.max(newWidth, _MIN_IMAGE_SIZE_FIXED);
        newHeight = Math.max(newHeight, _MIN_IMAGE_SIZE_FIXED);

        _fixedGrapeImageContainer.style.width = newWidth + 'px';
        _fixedGrapeImageContainer.style.height = newHeight + 'px';
        _fixedGrapeImageContainer.style.left = newLeft + 'px';
        _fixedGrapeImageContainer.style.top = newTop + 'px';

        if (borderRadiusStates[globalState.borderRadiusIndex % borderRadiusStates.length] === '50%') {
            _fixedGrapeImageContainer.style.borderRadius = '50%';
            const size = Math.min(newWidth, newHeight);
            _fixedGrapeImageContainer.style.setProperty('--resize-radius', `${size / 2}px`);
            updateEllipseRadiusVars();
        }

    } else if (globalState.isDraggingFixedImage) {
        if (globalState.isClickEvent) return;
        let dx = clientX - globalState.initialPointerX;
        let dy = clientY - globalState.initialPointerY;
        let newLeft = globalState.initialFixedImageLeft + dx;
        let newTop = globalState.initialFixedImageTop + dy;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const elementWidth = _fixedGrapeImageContainer.offsetWidth;
        const elementHeight = _fixedGrapeImageContainer.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - elementWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - elementHeight));

        _fixedGrapeImageContainer.style.left = newLeft + 'px';
        _fixedGrapeImageContainer.style.top = newTop + 'px';
    }
}

/**
 * Handles mouse/touch up events to stop dragging/resizing.
 */
function onPointerUp() {
    setGlobalState({ isDraggingFixedImage: false });
    setGlobalState({ isResizingFixedImage: false });
    document.body.style.cursor = 'default';
    removeGlobalPointerListeners();

    if (globalState.isClickEvent) {
        setGlobalState({ borderRadiusIndex: (globalState.borderRadiusIndex + 1) % borderRadiusStates.length });
        applyBorderRadius(globalState.borderRadiusIndex);

        if (borderRadiusStates[globalState.borderRadiusIndex % borderRadiusStates.length] === '50%') {
            const currentSize = Math.min(_fixedGrapeImageContainer.offsetWidth, _fixedGrapeImageContainer.offsetHeight);
            _fixedGrapeImageContainer.style.width = `${currentSize}px`;
            _fixedGrapeImageContainer.style.height = `${currentSize}px`;
            const rect = _fixedGrapeImageContainer.getBoundingClientRect();
            _fixedGrapeImageContainer.style.left = `${rect.left + (rect.width - currentSize) / 2}px`;
            _fixedGrapeImageContainer.style.top = `${rect.top + (rect.height - currentSize) / 2}px`;
        }
    }
    setGlobalState({ isClickEvent: true });
}

/**
 * Adds global mouse/touch event listeners for dragging/resizing.
 */
function addGlobalPointerListeners() {
    if (_hasTouch) {
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);
    } else {
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
    }
}

/**
 * Removes global mouse/touch event listeners.
 */
function removeGlobalPointerListeners() {
    if (_hasTouch) {
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);
    } else {
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
    }
}

/**
 * Handles mousemove on the container to change cursor for resize.
 * @param {MouseEvent} e - The mouse event.
 */
function onContainerMouseMove(e) {
    if (globalState.isDraggingFixedImage || globalState.isResizingFixedImage) return;

    const rect = _fixedGrapeImageContainer.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    let cursor = 'grab';
    const checkDir = getResizeDirection(clientX, clientY, rect);
    if (checkDir) {
        cursor = checkDir === 'top-left' || checkDir === 'bottom-right' ? 'nwse-resize' :
            checkDir === 'top-right' || checkDir === 'bottom-left' ? 'nesw-resize' :
            ['left', 'right'].includes(checkDir) ? 'ew-resize' :
            ['top', 'bottom'].includes(checkDir) ? 'ns-resize' : 'default';
    }
    _fixedGrapeImageContainer.style.cursor = cursor;
}

/**
 * Handles mouseleave on the container to reset cursor.
 */
function onContainerMouseLeave() {
    if (!globalState.isDraggingFixedImage && !globalState.isResizingFixedImage) {
        _fixedGrapeImageContainer.style.cursor = 'default';
    }
}

/**
 * Helper to determine resize direction for cursor on hover.
 * @param {number} x - ClientX coordinate.
 * @param {number} y - ClientY coordinate.
 * @param {DOMRect} rect - Bounding rectangle of the container.
 * @returns {string} The resize direction or empty string.
 */
function getResizeDirection(x, y, rect) {
    const left = x - rect.left;
    const top = y - rect.top;
    const right = rect.width - left;
    const bottom = rect.height - top;
    const handleSize = _RESIZE_HANDLE_SIZE;

    if (left <= handleSize && top <= handleSize) return 'top-left';
    if (right <= handleSize && top <= handleSize) return 'top-right';
    if (left <= handleSize && bottom <= handleSize) return 'bottom-left';
    if (right <= handleSize && bottom <= handleSize) return 'bottom-right';
    if (top <= handleSize) return 'top';
    if (bottom <= handleSize) return 'bottom';
    if (left <= handleSize) return 'left';
    if (right <= handleSize) return 'right';
    return '';
}
