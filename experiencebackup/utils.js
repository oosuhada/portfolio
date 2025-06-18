// utils.js
// Provides common utility functions such as debouncing, custom scrolling,
// and promise-based scroll helpers.

/**
 * Debounce function to limit how often a function runs.
 * @param {function} func - The function to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {function} The debounced function.
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Custom scroll animation function using requestAnimationFrame.
 * @param {number} to - The target Y position to scroll to.
 * @param {number} duration - The animation duration in milliseconds.
 * @param {function} callback - Callback function to execute upon completion.
 */
export function customScrollTo(to, duration, callback) {
    const start = window.scrollY;
    const change = to - start;
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 0.5 * (1 - Math.cos(Math.PI * progress)); // easeInOut
        window.scrollTo(0, start + change * ease);

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        } else {
            if (typeof callback === 'function') callback();
        }
    }
    requestAnimationFrame(animateScroll);
}

/**
 * Smoothly scrolls the window to a specified element.
 * @param {HTMLElement} element - The DOM element to scroll to.
 * @param {string} position - The desired vertical position ('center', 'start', 'end', 'top', 'bottom').
 * @param {function} callback - Callback function to execute after scrolling completes.
 * @param {number} duration - The duration of the scroll animation in milliseconds.
 */
export function smoothScrollToElement(element, position = 'center', callback, duration = 700) {
    if (!element) {
        if (typeof callback === 'function') callback();
        return;
    }

    let yOffset;
    const elementRect = element.getBoundingClientRect();
    const elementHeight = elementRect.height;
    const viewportHeight = window.innerHeight;

    const navHeader = document.querySelector('.nav-header');
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

    customScrollTo(scrollToY, duration, callback);
}

/**
 * Returns a Promise that resolves when the given element is scrolled to the center of the viewport.
 * @param {HTMLElement} element - The DOM element to scroll to.
 * @param {number} duration - The duration of the scroll animation in milliseconds.
 * @returns {Promise<void>} A Promise that resolves when scrolling is complete.
 */
export function scrollElementToCenterPromise(element, duration = 466) {
    return new Promise((resolve, reject) => {
        if (!element) {
            reject(new Error("No element provided to scrollElementToCenterPromise"));
            return;
        }
        const scrollTarget = element.closest('.timeline-entry') || element;
        smoothScrollToElement(scrollTarget, 'center', resolve, duration);
    });
}