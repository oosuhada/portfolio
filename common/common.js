// Global flag to track if AI scripts have been loaded
let aiScriptsLoaded = false;
let aiLoadingOverlayTimeout = null;
// Promise to track the ongoing AI script loading process
let aiScriptsLoadPromise = null;

// --- Core Utility Functions ---

/**
 * Validates a form field and displays an error message if invalid.
 * @param {HTMLElement} field - The form field to validate.
 * @returns {boolean} True if the field is valid, false otherwise.
 */
window.validateField = (field) => {
    field.reportValidity();
    const isValid = !field.validity.valueMissing && !field.validity.typeMismatch;
    field.classList.toggle('invalid', !isValid);
    const errorMessageElement = field.nextElementSibling;
    if(errorMessageElement && errorMessageElement.classList.contains('error-message')) {
        if(!isValid) {
            errorMessageElement.textContent = field.validationMessage || "This field is required.";
            errorMessageElement.classList.add('visible');
        } else {
            errorMessageElement.classList.remove('visible');
        }
    }
    return isValid;
};

/**
 * Dynamically adds a temporary style tag to disable all CSS transitions for immediate changes.
 * This is useful for preventing animation delays when navigating between pages.
 */
function disableAllTransitions() {
    const style = document.createElement('style');
    style.id = 'no-transition-on-exit'; // Unique ID
    style.textContent = `
        * {
            transition: none !important;
        }
        body::before { /* For elements like background transitions */
            transition: none !important;
        }
    `;
    document.head.appendChild(style);

    // Remove the style tag after a very short delay to re-enable transitions
    // This ensures styles are applied before the page visually loads, then removed.
    setTimeout(() => {
        const tempStyle = document.getElementById('no-transition-on-exit');
        if (tempStyle) {
            tempStyle.remove();
        }
    }, 100);
}

/**
 * Global helper function to check the expanded state of the navigation header.
 * Used by header scroll logic.
 * @returns {boolean} True if the menu is expanded, false otherwise.
 */
window.getNavHeaderExpandedState = function() {
    const accordionNavMenu = document.getElementById('accordionNavMenu');
    return accordionNavMenu ? accordionNavMenu.classList.contains('expanded') : false;
};

// Expose functions to the global scope for other modules to access
window.disableAllTransitions = disableAllTransitions;


// --- AI Chat Lazy Loading Logic ---

/**
 * Helper function to dynamically load a script and return a Promise that resolves when loaded.
 * Handles both classic and module scripts. Ensures idempotency.
 * @param {string} url - The URL of the script to load.
 * @param {boolean} isModule - True if it's an ES module (type="module").
 * @returns {Promise<void>} A Promise that resolves when the script is loaded, or rejects on error.
 */
function loadScript(url, isModule = false) {
    return new Promise((resolve, reject) => {
        // Check if the script is already in the DOM
        let existingScript = document.head.querySelector(`script[src="${url}"]`);

        if (existingScript) {
            // If it's a module and already has the correct type, just ensure we wait for it to load
            if (isModule && existingScript.type === 'module' && existingScript.dataset.loaded === 'true') {
                console.log(`[CommonJS] Module script already loaded: ${url}`);
                resolve();
                return;
            } else if (existingScript.dataset.loading === 'true') {
                 // If it's still loading, attach new listeners and wait
                 console.log(`[CommonJS] Script already loading, attaching to existing promise: ${url}`);
                 const onLoadWrapper = () => {
                     existingScript.removeEventListener('load', onLoadWrapper);
                     existingScript.removeEventListener('error', onErrorWrapper);
                     resolve();
                 };
                 const onErrorWrapper = (e) => {
                     existingScript.removeEventListener('load', onLoadWrapper);
                     existingScript.removeEventListener('error', onErrorWrapper);
                     reject(new Error(`Failed to load script (already existed): ${url}, ${e.message}`));
                 };
                 existingScript.addEventListener('load', onLoadWrapper);
                 existingScript.addEventListener('error', onErrorWrapper);
                 return;
            } else if (!isModule || existingScript.type !== 'module') {
                // If it exists but isn't a module when it should be, or vice-versa, re-add (might be an error case)
                console.warn(`[CommonJS] Script present but type mismatch or not fully loaded: ${url}. Re-adding.`);
                existingScript.remove(); // Remove existing to add correctly
                existingScript = null;
            }
        }

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = url;
            if (isModule) {
                script.type = 'module';
            }
            script.async = true; // Load asynchronously to not block parsing
            script.dataset.loading = 'true'; // Mark as currently loading

            script.onload = () => {
                console.log(`[CommonJS] Script loaded successfully: ${url}`);
                script.dataset.loaded = 'true'; // Mark as loaded
                script.dataset.loading = 'false'; // Mark as not loading
                resolve();
            };

            script.onerror = (e) => {
                console.error(`[CommonJS] Error loading script: ${url}`, e);
                script.dataset.loading = 'false'; // Mark as not loading
                reject(new Error(`Failed to load script: ${url}, ${e.message}`));
            };

            document.head.appendChild(script);
        }
    });
}

/**
 * Displays the full-screen loading overlay for AI assistant.
 */
function showAiLoadingOverlay() {
    const overlay = document.getElementById('ai-loading-overlay');
    const lottieContainer = document.getElementById('ai-loading-lottie-overlay');
    const textElement = document.getElementById('ai-loading-text-overlay');
    const steps = document.querySelectorAll('#ai-loading-overlay .ai-loading-progress-overlay .step');

    if (overlay) {
        overlay.classList.add('active');
        // Initialize Lottie for the overlay if not already
        if (lottieContainer && typeof lottie !== 'undefined' && !window.aiOverlayLottieAnimation) {
            window.aiOverlayLottieAnimation = lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: false, // Control autoplay manually
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
        }
        if (window.aiOverlayLottieAnimation) {
            window.aiOverlayLottieAnimation.play();
        }

        // Reset progress steps
        steps.forEach((step, index) => {
            step.setAttribute('data-status', '');
            // Update text based on initial message and current language
            const messages = [
                { text_en: "Loading AI libraries", text_ko: "AI 라이브러리 로드 중" },
                { text_en: "Initializing AI models", text_ko: "AI 모델 초기화 중" },
                { text_en: "Generating a tailored response", text_ko: "맞춤형 답변 생성 중" }
            ];
            const currentLang = navigator.language.startsWith('ko') ? 'ko' : 'en';
            step.innerHTML = `<span class="circle">${index + 1}</span> ${messages[index][`text_${currentLang}`]}`;
        });

        // Initial text
        if (textElement) {
            textElement.textContent = navigator.language.startsWith('ko') ? "AI 어시스턴트 준비 중..." : "AI Assistant preparing...";
        }

        // Simulate progress for the overlay itself (separate from chat modal's internal progress)
        let currentStep = 0;
        const overlayMessages = [
            { text_en: "Loading AI libraries...", text_ko: "AI 라이브러리 로드 중...", delay: 500 },
            { text_en: "Initializing AI models...", text_ko: "AI 모델 초기화 중...", delay: 1000 },
            { text_en: "Almost ready...", text_ko: "거의 준비 완료...", delay: 1000 }
        ];

        // Clear existing timeouts to prevent interference from previous calls
        if (aiLoadingOverlayTimeout) {
            clearTimeout(aiLoadingOverlayTimeout);
        }
        loadingTimeouts = []; // Reset array for the overlay

        let cumulativeDelay = 0;
        overlayMessages.forEach((msg, index) => {
            cumulativeDelay += msg.delay;
            const timeoutId = setTimeout(() => {
                if (textElement) {
                    textElement.textContent = msg[`text_${navigator.language.startsWith('ko') ? 'ko' : 'en'}`];
                }
                if (steps[index]) { // Use index directly for updating steps
                    steps[index].setAttribute('data-status', 'done');
                }
                if (steps[index + 1]) {
                    steps[index + 1].setAttribute('data-status', 'active');
                }
            }, cumulativeDelay);
            loadingTimeouts.push(timeoutId); // Store timeout IDs for clearing
        });
    }
}

/**
 * Hides the full-screen loading overlay for AI assistant.
 */
function hideAiLoadingOverlay() {
    const overlay = document.getElementById('ai-loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        if (window.aiOverlayLottieAnimation) {
            window.aiOverlayLottieAnimation.stop();
        }
        // Clear any pending timeouts for the overlay messages
        loadingTimeouts.forEach(clearTimeout);
        loadingTimeouts = []; // Reset the array
    }
}


/**
 * Dynamically loads all AI chat related assets (JS libraries and local scripts).
 * This function returns a Promise that resolves when all scripts are loaded.
 * It also manages the global loading overlay.
 */
async function backgroundLoadAiChatAssets() {
    // If a load is already in progress, return that promise
    if (aiScriptsLoadPromise) {
        console.log("[CommonJS] AI script load already initiated. Returning existing promise.");
        return aiScriptsLoadPromise;
    }

    // Create a new promise for the loading process
    aiScriptsLoadPromise = new Promise(async (resolve, reject) => {
        console.log("[CommonJS] Starting background loading of AI chat assets...");
        showAiLoadingOverlay(); // Show the full-screen overlay immediately

        try {
            // Load CDN Libraries sequentially for dependency order
            await loadScript('https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js');
            await loadScript('https://unpkg.com/compromise');
            // Transformers.js needs to be loaded as a module to make `pipeline` available.
            await loadScript('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1', true);

            // Load local AI scripts as modules
            await loadScript('../common/ai_chat_logic.js', true); // ai_chat_logic.js is a module
            await loadScript('../common/ai_chat_ui.js', true); // ai_chat_ui.js is also a module


            // After all scripts are loaded, initialize UI
            // The `window.initializeAiChatModalUI` will now be safely available if ai_chat_ui.js loaded as module.
            if (typeof window.initializeAiChatModalUI === 'function') {
                await window.initializeAiChatModalUI(); // Call the main initialization function from ai_chat_ui.js and await its completion
            } else {
                console.error("[CommonJS] window.initializeAiChatModalUI is not defined after loading ai_chat_ui.js.");
                throw new Error("AI Chat UI initialization function missing.");
            }

            aiScriptsLoaded = true; // Mark as loaded successfully
            hideAiLoadingOverlay(); // Hide the overlay
            console.log("[CommonJS] All AI chat assets loaded and initialized.");
            resolve(); // Resolve the promise on success

        } catch (error) {
            console.error("[CommonJS] Failed to load AI chat assets:", error);
            hideAiLoadingOverlay(); // Hide the overlay even on error
            if (typeof window.addPortfolioChatMessage === 'function') {
                window.addPortfolioChatMessage(navigator.language.startsWith('ko') ? "AI 어시스턴트를 로드하는 데 실패했습니다. 잠시 후 다시 시도해주세요." : "Failed to load AI assistant. Please try again later.", 'bot');
            }
            aiScriptsLoadPromise = null; // Reset promise on failure so it can be re-attempted
            reject(error); // Reject the promise on error
        }
    });

    return aiScriptsLoadPromise; // Return the promise
}


// --- Main Initialization Logic ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired: Starting page initialization.');

    // ThemeManager initialization (assuming window.themeManager is defined elsewhere)
    if (window.themeManager) window.themeManager.initialize();

    // Initialize other core modules
    if (window.initializePreloader) window.initializePreloader(); // Preloader (UI components)
    if (window.initializeAIAssistantButton) window.initializeAIAssistantButton(); // AI FAB (UI components)
    if (window.updateCursorVarsByTheme) window.updateCursorVarsByTheme(); // Initial cursor settings (UI components)
    if (window.updateAIAssistantAskImage) window.updateAIAssistantAskImage(); // Initial AI FAB image settings (UI components)
    if (window.initializeVisualEffects) window.initializeVisualEffects(); // Visual effects initialization
    if (window.initializeNavigation) window.initializeNavigation(); // Navigation (depends on utils, visual-effects)
    if (window.initializeFooterImageShake) window.initializeFooterImageShake(); // Footer image shake (UI components)

    // AI Assistant FAB click listener
    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
    if (aiAssistantFAB) {
        aiAssistantFAB.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevent immediate bubbling to document click listener
            console.log("[CommonJS] AI Assistant FAB clicked. Triggering lazy load.");
            try {
                // Await backgroundLoadAiChatAssets() ensures only one load process
                // It will either start a new load or return an existing promise.
                await backgroundLoadAiChatAssets();
                // Open modal after scripts are guaranteed to be loaded and initialized
                // window.openPortfolioChatModal is now available and defined in ai_chat_ui.js
                if (typeof window.openPortfolioChatModal === 'function') {
                    window.openPortfolioChatModal();
                }
            } catch (error) {
                console.error("[CommonJS] Error during FAB click handler:", error);
                // Additional error handling for FAB click if loading fails (e.g., show a user message)
            }
        });
    } else {
        console.warn("[CommonJS] AI Assistant FAB element not found.");
    }

    // Passive lazy loading (preload during idle time)
    // If AI scripts are not loaded after 2 seconds, start preloading in the background.
    setTimeout(() => {
        // Only start idle preload if no load is already in progress AND not already loaded
        if (!aiScriptsLoaded && !aiScriptsLoadPromise) {
            console.log("[CommonJS] Idle time detected. Initiating background AI script preload.");
            backgroundLoadAiChatAssets().catch(error => {
                console.error("[CommonJS] Idle preload failed:", error);
            });
        }
    }, 2000); // 2 seconds delay

    console.log('Page initialization complete, AI scripts will lazy load on interaction or idle time.');
});