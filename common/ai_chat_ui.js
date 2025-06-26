/*
 * AI Portfolio Chat - UI Controller (Lazy Loaded)
 * This script handles all client-side UI logic for the AI chat modal,
 * including state transitions, event handling, DOM manipulation,
 * and content rendering. It's designed to be loaded dynamically.
 */

// Ensure Lottie is available globally before this script runs, as it's loaded in HTML.
// If Lottie were also lazy-loaded, its loading would need to be coordinated in common.js.

// Wrap the module content in an IIFE to ensure proper scoping and prevent direct global variable pollution,
// while still exposing the necessary initialization function.
(async () => { // Make the whole module async to allow top-level await for imports if needed, though not strictly required here.

    console.log("[AI_Chat_UI] ai_chat_ui.js loaded.");

    // --- DOM Element References ---
    const aiPortfolioChatModal = document.getElementById('ai-portfolio-chat-modal');
    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');
    const closePortfolioChatModalBtn = aiPortfolioChatModal ? aiPortfolioChatModal.querySelector('.close-button') : null;
    const portfolioChatMessagesContainer = document.getElementById('portfolioChatMessages');
    const aiPortfolioChatInput = document.getElementById('aiPortfolioChatInput');
    const aiPortfolioChatSendBtn = document.getElementById('aiPortfolioChatSendBtn');
    const portfolioLoadingStatus = document.getElementById('portfolioLoadingStatus'); // Original loading status inside modal
    const portfolioLoadingLottieContainer = document.getElementById('portfolioLoadingLottie');
    const portfolioLoadingText = document.getElementById('portfolioLoadingText');
    const aiPortfolioResults = document.getElementById('aiPortfolioResults');
    const portfolioInsightText = document.getElementById('portfolioInsightText'); // Not directly used in this version but kept for consistency
    const portfolioResultCardsContainer = document.getElementById('portfolioResultCards'); // Not directly used but kept for consistency
    const portfolioFollowUpActions = document.getElementById('portfolioFollowUpActions'); // Not directly used but kept for consistency
    const portfolioFollowUpButtons = document.getElementById('portfolioFollowUpButtons'); // Not directly used but kept for consistency
    const aiAssistantHeaderLottieContainer = document.getElementById('aiAssistantHeaderLottie');


    // Full-screen loading overlay elements (these are managed by common.js, but referenced here for completeness)
    const aiLoadingOverlay = document.getElementById('ai-loading-overlay'); // eslint-disable-line no-unused-vars
    const aiLoadingLottieOverlay = document.getElementById('ai-loading-lottie-overlay'); // eslint-disable-line no-unused-vars
    const aiLoadingTextOverlay = document.getElementById('ai-loading-text-overlay'); // eslint-disable-line no-unused-vars
    const aiLoadingProgressOverlaySteps = document.querySelectorAll('#ai-loading-overlay .ai-loading-progress-overlay .step'); // eslint-disable-line no-unused-vars


    let portfolioLottieAnimation;
    let aiAssistantHeaderLottieAnimation;
    let sendButtonLottieAnimation;
    let isLoading = false; // Tracks if the chat bot is currently processing a request
    let loadingTimeouts = []; // Stores timeouts for loading message sequence
    let currentLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en';

    // State persistence keys
    const CHAT_HISTORY_KEY = 'aiPortfolioChatHistory';
    const MODAL_STAGE_KEY = 'aiPortfolioModalStage';

    // Session context object (for remembering conversation state)
    let sessionContext = {
        conversationHistory: [],
        inferredRole: null, // e.g., 'recruiter', 'student'
        currentPage: 'unknown', // Default, should be set by actual page logic
        highlightedTopic: null // e.g., 'Nomad Market' if user lingers there
    };

    /**
     * Helper function to get localized text from objects.
     * This is crucial as it depends on AIPortfolioLogic being loaded.
     * @param {string|object} field - Multi-language object or a single string.
     * @returns {string} Text in the current language or fallback to English/empty string.
     */
    function getLocalizedText(field) {
        // Check if AIPortfolioLogic and its getLocalizedText is available
        if (typeof window.AIPortfolioLogic?.getLocalizedText === 'function') {
            return window.AIPortfolioLogic.getLocalizedText(field);
        }
        // Fallback if AIPortfolioLogic is not yet loaded or getLocalizedText is missing
        if (typeof field === 'object' && field !== null) {
            return field[currentLanguage] || field['en'] || '';
        }
        return field || '';
    }


    /**
     * Initializes AI logic, loads knowledge base, and sets up placeholder text.
     * Retries if AIPortfolioLogic is not immediately available (due to async loading).
     */
    async function initializeAILogicAndUI() {
        // Wait for AIPortfolioLogic to be available globally
        let attempts = 0;
        const maxAttempts = 100; // Try for up to 5 seconds (100 * 50ms)
        while (typeof window.AIPortfolioLogic === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }

        if (typeof window.AIPortfolioLogic?.loadKnowledgeBase === 'function') {
            window.AIPortfolioLogic.setLanguage(currentLanguage);
            try {
                // Wait for knowledge base to load completely before proceeding
                await window.AIPortfolioLogic.loadKnowledgeBase();
                console.log("[AI_Chat_UI] AI logic data ready. Restoring chat state.");
                loadChatState(); // Now it's safe to load chat state which might use AIPortfolioLogic
                if (aiPortfolioChatInput) {
                    aiPortfolioChatInput.placeholder = getLocalizedText({
                        ko: "궁금한 점을 입력해주세요",
                        en: "Ask me anything"
                    });
                }
            } catch (error) {
                console.error("[AI_Chat_UI] Failed to load AI data for logic:", error);
                addPortfolioChatMessage(getLocalizedText({
                    ko: "AI 어시스턴트 데이터 로딩에 실패했습니다. 다시 시도해 주세요.",
                    en: "Failed to load AI assistant data. Please try again."
                }), 'bot');
            }
        } else {
            console.error("[AI_Chat_UI] AIPortfolioLogic object not available after multiple retries. AI features may not work.");
            addPortfolioChatMessage(getLocalizedText({
                ko: "AI 어시스턴트 초기화에 실패했습니다. 페이지를 새로고침해 주세요.",
                en: "Failed to initialize AI assistant. Please refresh the page."
            }), 'bot');
        }
    }

    /**
     * Initializes Lottie animations for various UI elements.
     */
    function initializeLottieAnimations() {
        if (typeof lottie === 'undefined') {
            console.warn("[AI_Chat_UI] Lottie library not available. Skipping Lottie animations initialization.");
            return;
        }

        // Lottie for loading status inside the modal
        if (portfolioLoadingLottieContainer && !portfolioLottieAnimation) {
            portfolioLottieAnimation = lottie.loadAnimation({
                container: portfolioLoadingLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: false, // Start autoplay only when needed
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
            // Play a specific segment when loaded
            portfolioLottieAnimation.addEventListener('DOMLoaded', () => {
                // Ensure the animation only plays if its container is visible (modal is open/loading)
                if (portfolioLoadingLottieContainer.offsetParent !== null) {
                    portfolioLottieAnimation.playSegments([61, 89], true);
                }
            });
        }

        // Lottie for header icon in modal
        if (aiAssistantHeaderLottieContainer && !aiAssistantHeaderLottieAnimation) {
            aiAssistantHeaderLottieAnimation = lottie.loadAnimation({
                container: aiAssistantHeaderLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
        }

        // Lottie for send button
        if (aiPortfolioChatSendBtn && !sendButtonLottieAnimation) {
            const lottieDiv = document.createElement('div');
            lottieDiv.classList.add('lottie-animation');
            // Remove existing content to prevent duplicates if init is called multiple times
            aiPortfolioChatSendBtn.innerHTML = '';
            aiPortfolioChatSendBtn.appendChild(lottieDiv);
            sendButtonLottieAnimation = lottie.loadAnimation({
                container: lottieDiv,
                renderer: 'svg',
                loop: true,
                autoplay: true, // Auto play on load
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
            sendButtonLottieAnimation.addEventListener('DOMLoaded', () => {
                if (!isLoading) { // Only play if not in loading state
                    sendButtonLottieAnimation.playSegments([61, 89], true);
                }
            });
        }

        // Lottie for overlay loading screen (controlled by common.js, but available here)
        // This part is typically managed by common.js, so we just ensure it's loaded if not already.
        if (aiLoadingLottieOverlay && !window.aiOverlayLottieAnimation) {
            window.aiOverlayLottieAnimation = lottie.loadAnimation({
                container: aiLoadingLottieOverlay,
                renderer: 'svg',
                loop: true,
                autoplay: false, // Start autoplay only when needed
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
        }
    }


    /**
     * Saves the current chat state (messages and modal stage) to sessionStorage.
     * Includes current sessionContext.
     */
    function saveChatState() {
        if (!portfolioChatMessagesContainer || !aiPortfolioChatModal) return;

        // Save chat history HTML
        sessionStorage.setItem(CHAT_HISTORY_KEY, portfolioChatMessagesContainer.innerHTML);

        // Save modal stage (stage-1 or stage-2)
        let stage = '';
        if (aiPortfolioChatModal.classList.contains('stage-1')) {
            stage = 'stage-1';
        } else if (aiPortfolioChatModal.classList.contains('stage-2')) {
            stage = 'stage-2';
        }
        sessionStorage.setItem(MODAL_STAGE_KEY, stage);

        // Save sessionContext
        sessionStorage.setItem('aiPortfolioSessionContext', JSON.stringify(sessionContext));

        console.log(`[AI_Chat_UI] Chat state saved. Stage: ${stage}, Context:`, sessionContext);
    }

    /**
     * Loads the chat state from sessionStorage and restores the UI.
     * Restores sessionContext.
     */
    async function loadChatState() {
        if (!portfolioChatMessagesContainer || !aiPortfolioChatModal) return;

        const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
        const savedStage = sessionStorage.getItem(MODAL_STAGE_KEY);
        const savedContext = sessionStorage.getItem('aiPortfolioSessionContext');

        // Ensure AIPortfolioLogic's knowledge base is loaded before getting initial suggestions
        if (typeof window.AIPortfolioLogic?.loadKnowledgeBase === 'function') {
            try {
                await window.AIPortfolioLogic.loadKnowledgeBase(); // Await to ensure readiness
            } catch (error) {
                console.error("[AI_Chat_UI] Failed to load AIPortfolioLogic knowledge base during loadChatState:", error);
                // Fallback to reset if knowledge base load fails
                resetPortfolioChatModal();
                return;
            }
        } else {
            console.warn("[AI_Chat_UI] AIPortfolioLogic is not available for initial suggestions during loadChatState.");
            // Reset to initial state if logic not available, as we can't function correctly.
            resetPortfolioChatModal();
            return;
        }

        if (savedContext) {
            try {
                sessionContext = JSON.parse(savedContext);
                console.log("[AI_Chat_UI] Session context restored:", sessionContext);
            } catch (e) {
                console.error("[AI_Chat_UI] Failed to parse saved session context:", e);
                sessionContext = { conversationHistory: [], inferredRole: null, currentPage: 'unknown', highlightedTopic: null }; // Reset to default
            }
        }

        if (savedHistory) {
            portfolioChatMessagesContainer.innerHTML = savedHistory;
            console.log("[AI_Chat_UI] Chat history restored from session storage.");
        } else {
            // If no history, reset to initial state
            resetPortfolioChatModal();
        }

        if (savedStage) {
            aiPortfolioChatModal.classList.add(savedStage);
            aiPortfolioChatModal.classList.remove(savedStage === 'stage-1' ? 'stage-2' : 'stage-1');
            console.log(`[AI_Chat_UI] Modal stage restored to: ${savedStage}`);
        } else {
            // Default to stage-1 if no saved stage
            aiPortfolioChatModal.classList.add('stage-1');
            aiPortfolioChatModal.classList.remove('stage-2');
        }
        // Ensure scroll to bottom after restoring
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
    }


    /**
     * Shows the main AI portfolio chat modal.
     * This function is globally exposed via `window.openPortfolioChatModal`.
     */
    window.openPortfolioChatModal = function() {
        if (!aiPortfolioChatModal) {
            console.error("[AI_Chat_UI] Modal element not found. Cannot open.");
            return;
        }

        if (aiAssistantFAB) {
            aiAssistantFAB.classList.add('hidden');
        }
        aiPortfolioChatModal.classList.add('show');

        // Determine if it should open to stage-1 or stage-2 based on saved state
        const savedStage = sessionStorage.getItem(MODAL_STAGE_KEY);
        if (savedStage === 'stage-2') {
            aiPortfolioChatModal.classList.add('stage-2');
            aiPortfolioChatModal.classList.remove('stage-1'); // Ensure stage-1 is removed
        } else {
            // If no saved stage, or it was stage-1, always start at stage-1
            aiPortfolioChatModal.classList.add('stage-1');
            aiPortfolioChatModal.classList.remove('stage-2');
        }

        initializeLottieAnimations(); // Ensure Lottie animations are ready when modal opens
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight; // Scroll to bottom
    };


    /**
     * Hides the main AI portfolio chat modal.
     * This function is globally exposed via `window.closePortfolioChatModal`.
     */
    window.closePortfolioChatModal = function() {
        if (!aiPortfolioChatModal) return;

        aiPortfolioChatModal.classList.remove('show', 'stage-1', 'stage-2');
        if (aiAssistantFAB) {
            aiAssistantFAB.classList.remove('hidden');
        }
        // Save state on close
        saveChatState();
        // Give a brief moment for transition before potentially resetting for next open
        setTimeout(() => {
            // For persistence, we only reset if no history was found on load, not on close
        }, 400); // Duration of the CSS transition
    };


    /**
     * Resets the chat modal to its initial empty state with default messages.
     * Used when no session history is found or explicitly needed.
     */
    async function resetPortfolioChatModal() {
        if (!portfolioChatMessagesContainer || !aiPortfolioChatModal) {
            console.warn("[AI_Chat_UI] Required elements for resetPortfolioChatModal not found.");
            return;
        }

        // Reset session context
        sessionContext = { conversationHistory: [], inferredRole: null, currentPage: 'unknown', highlightedTopic: null };
        sessionStorage.removeItem('aiPortfolioSessionContext');


        // Ensure the loading status element is hidden and not appended to messages
        if (portfolioLoadingStatus && portfolioLoadingStatus.parentNode) {
            portfolioLoadingStatus.style.display = 'none'; // Hide it first
        }
        if (aiPortfolioResults) aiPortfolioResults.classList.remove('show');
        if (portfolioFollowUpActions) portfolioFollowUpActions.classList.remove('show');

        // Ensure AIPortfolioLogic's knowledge base is loaded before getting initial suggestions
        let initialSuggestions = [];
        if (typeof window.AIPortfolioLogic?.getInitialSuggestions === 'function') {
            try {
                // Ensure knowledge base is loaded before attempting to get suggestions
                await window.AIPortfolioLogic.loadKnowledgeBase();
                initialSuggestions = window.AIPortfolioLogic.getInitialSuggestions() || [];
            } catch (error) {
                console.error("[AI_Chat_UI] Failed to load AIPortfolioLogic knowledge base during resetPortfolioChatModal:", error);
                initialSuggestions = [{label: getLocalizedText({ko: "제안 로딩 오류", en: "Error loading suggestions."}), query: "Error"}];
            }
        } else {
            console.warn("[AI_Chat_UI] AIPortfolioLogic is not available for initial suggestions during reset.");
            initialSuggestions = [{label: getLocalizedText({ko: "AI 어시스턴트 로딩 중...", en: "AI Assistant loading..."}), query: ""}];
        }

        let suggestionButtonsHtml = initialSuggestions.map(s => `<button class="ai-action-btn suggestion-btn" data-query="${s.query}">${s.label}</button>`).join('');

        portfolioChatMessagesContainer.innerHTML = `
            <div class="chat-message bot-message">
                ${getLocalizedText(window.AIPortfolioLogic?.knowledgeBase?.assistant_info?.default_intro_message || {ko: "안녕하세요! Oosu님의 AI 포트폴리오 어시스턴트입니다. 무엇을 도와드릴까요?", en: "Hello! I'm Oosu's AI Portfolio Assistant. How can I help you today?"})}
            </div>
            <div class="chat-message bot-message initial-suggestion">
                <p>${getLocalizedText({ko: "예시 질문:", en: "Example questions:"})}</p>
                ${suggestionButtonsHtml}
            </div>
        `;
        if (aiPortfolioChatInput) aiPortfolioChatInput.value = '';
        // Reset loading progress bar steps
        document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step').forEach(step => step.setAttribute('data-status', ''));
        if (portfolioLottieAnimation) portfolioLottieAnimation.stop();
        const confettiContainer = aiPortfolioChatModal.querySelector('.confetti-container');
        if (confettiContainer) confettiContainer.remove();

        // Reset stage to stage-1 when fully resetting
        aiPortfolioChatModal.classList.add('stage-1');
        aiPortfolioChatModal.classList.remove('stage-2');
    }


    /**
     * Adds a chat message to the messages container.
     * @param {string} message - The HTML content of the message.
     * @param {'user'|'bot'} type - Type of message ('user' or 'bot').
     * @param {string[]} additionalClasses - Optional array of additional CSS classes.
     */
    window.addPortfolioChatMessage = function(message, type, ...additionalClasses) { // Made global for common.js error messages
        if (!portfolioChatMessagesContainer) {
            console.error("[AI_Chat_UI] Cannot add message: portfolioChatMessagesContainer is null.");
            return;
        }
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${type}-message`, ...additionalClasses);
        messageElement.innerHTML = message;
        portfolioChatMessagesContainer.appendChild(messageElement);
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;

        // Add message to session context history
        sessionContext.conversationHistory.push({ type: type, text: message });
    }


    /**
     * Transitions the modal from stage-1 (initial suggestions) to stage-2 (conversation view).
     */
    function transitionToStage2() {
        if (!aiPortfolioChatModal) {
            console.warn("[AI_Chat_UI] transitionToStage2 aborted: aiPortfolioChatModal is null.");
            return;
        }
        if (aiPortfolioChatModal.classList.contains('stage-1')) {
            console.log('[AI_Chat_UI] Transitioning from Stage 1 to Stage 2.');
            aiPortfolioChatModal.classList.remove('stage-1');
            aiPortfolioChatModal.classList.add('stage-2');
        }
    }


    /**
     * Controls the loading state of the UI (disabling input, showing/hiding loading indicators).
     * @param {boolean} loading - True to show loading state, false to hide.
     */
    function setLoadingState(loading) {
        isLoading = loading;
        if (aiPortfolioChatInput) aiPortfolioChatInput.disabled = loading;
        if (aiPortfolioChatSendBtn) {
            aiPortfolioChatSendBtn.disabled = loading;
            if (sendButtonLottieAnimation) {
                if (loading) {
                    sendButtonLottieAnimation.stop(); // Stop animation when loading
                } else {
                    sendButtonLottieAnimation.playSegments([61, 89], true); // Resume when not loading
                }
            }
        }
        // Move loading status into the chat message area if it's not already there
        if (loading) {
            if (portfolioLoadingStatus && portfolioChatMessagesContainer && portfolioLoadingStatus.parentNode !== portfolioChatMessagesContainer) { // Check parent node
                portfolioChatMessagesContainer.appendChild(portfolioLoadingStatus);
                portfolioLoadingStatus.style.display = 'block'; // Ensure it's displayed
            }
            if (portfolioLoadingStatus) {
                portfolioLoadingStatus.classList.add('active');
                portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
            }
            if (portfolioLottieAnimation) portfolioLottieAnimation.play(); // Play modal Lottie
        } else {
            if (portfolioLoadingStatus && portfolioLoadingStatus.parentNode) {
                portfolioLoadingStatus.style.display = 'none'; // Hide it first
            }
            if (portfolioLoadingStatus) portfolioLoadingStatus.classList.remove('active');
            if (portfolioLottieAnimation) portfolioLottieAnimation.stop(); // Stop modal Lottie
        }
    }


    /**
     * Runs the sequence of loading text messages and updates the progress bar.
     * This is for the loading *inside* the chat modal.
     */
    function runLoadingSequence() {
        loadingTimeouts.forEach(clearTimeout);
        loadingTimeouts = [];

        // Fetch messages from knowledgeBase
        // Ensure knowledgeBase is loaded before accessing its properties
        if (!window.AIPortfolioLogic || !window.AIPortfolioLogic.knowledgeBase || !window.AIPortfolioLogic.knowledgeBase.interactive_phrases || !window.AIPortfolioLogic.knowledgeBase.interactive_phrases.thinking || !window.AIPortfolioLogic.knowledgeBase.interactive_phrases.thinking.prompts) {
            console.error("[AI_Chat_UI] Cannot run loading sequence: Missing interactive_phrases in knowledgeBase.");
            const fallbackText = getLocalizedText({ko: "AI가 응답을 준비합니다...", en: "AI is preparing a response..."});
            if (portfolioLoadingText) portfolioLoadingText.textContent = fallbackText;
            return;
        }

        const thinkingPrompts = window.AIPortfolioLogic.knowledgeBase.interactive_phrases.thinking.prompts;
        // Construct messages array, using only the first few for steps for brevity
        // Ensure that thinkingPrompts array has enough elements or handle undefined access
        const messages = [
            { text: getLocalizedText(thinkingPrompts[0] || {en: "Analyzing...", ko: "분석 중..."}), delay: 1500 },
            { text: getLocalizedText(thinkingPrompts[1] || {en: "Searching...", ko: "탐색 중..."}), delay: 2000 },
            { text: getLocalizedText(thinkingPrompts[2] || {en: "Generating...", ko: "생성 중..."}), delay: 2000 }
        ];

        let cumulativeDelay = 0;
        const steps = document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step');

        // Set initial text for all steps
        steps.forEach((step, index) => {
            // Use fallback text if messages array is shorter than steps
            const stepText = messages[index] ? messages[index].text : getLocalizedText({ko: `단계 ${index+1}`, en: `Step ${index+1}`});
            step.innerHTML = `<span class="circle">${index + 1}</span> ${stepText}`;
            // Initially set all steps to pending
            step.setAttribute('data-status', '');
        });

        // The first step is active immediately
        updateLoadingStep(0, 'active');

        const updateText = (text) => {
            if (portfolioLoadingText) {
                gsap.to(portfolioLoadingText, { opacity: 0, duration: 0.2, onComplete: () => {
                    portfolioLoadingText.textContent = text;
                    gsap.to(portfolioLoadingText, { opacity: 1, duration: 0.2 });
                }});
            }
        };

        // Initial loading text (e.g., "AI is preparing its response...")
        updateText(getLocalizedText({ko: "AI가 답변을 준비합니다...", en: "AI is preparing its response..."}));

        messages.forEach((message, index) => {
            cumulativeDelay += message.delay;
            const timeout = setTimeout(() => {
                updateText(message.text); // Use the pre-localized text
                updateLoadingStep(index, 'done');
                if (index < messages.length - 1) updateLoadingStep(index + 1, 'active');
            }, cumulativeDelay);
            loadingTimeouts.push(timeout);
        });
    }

    /**
     * Updates the status of a specific loading step.
     * @param {number} index - The index of the step to update.
     * @param {'active'|'done'|''} status - The status to set.
     */
    function updateLoadingStep(index, status) {
        const steps = document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step');
        if (steps[index]) {
            steps[index].setAttribute('data-status', status);
            // Only animate if the status is changing to active/done
            if (status === 'active' || status === 'done') {
                gsap.fromTo(steps[index], { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
            }
        }
    }


    /**
     * Generates the HTML for a portfolio card based on item data.
     * @param {object} item - The data for the portfolio item.
     * @returns {string} HTML string for the card.
     */
    function createPortfolioCardHTML(item) {
        // Ensure item properties are localized
        const title = getLocalizedText(item.title);
        const description = getLocalizedText(item.description);
        const buttonText = getLocalizedText({ko: '자세히 보기', en: 'View Details'});
        let linkHtml = '';

        if (item.type === 'project' && item.id) {
            linkHtml = `<button class="card-action-btn view-project-via-modal" data-project-id="${item.id}">${buttonText}</button>`;
        } else if (item.link) {
            linkHtml = `<button class="card-action-btn" onclick="window.open('${item.link}', '_blank')">${buttonText}</button>`;
        }

        if (item.type === 'project') {
            return `<div class="portfolio-card"><h4>${title}</h4><p>${description}</p><div class="tags">${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>${linkHtml}</div>`;
        } else if (item.type === 'skill') {
            return `<div class="portfolio-card"><h4>${title}</h4><p>${description}</p><div class="tags">${(item.keywords || []).map(kw => `<span class="tag">${getLocalizedText(kw)}</span>`).join('')}</div>${linkHtml}</div>`;
        }
        return '';
    }

    /**
     * Prompts the user before navigating to another page.
     * @param {string} query - The original query that triggered navigation (used for logging or potential AI re-query).
     * @param {string} targetPage - The target page key (e.g., 'portfolio').
     * @param {string} urlFragment - Optional URL fragment (e.g., 'about-values').
     * @param {string} pageName - Localized name of the target page to display in the prompt.
     */
    function promptAndNavigate(query, targetPage, urlFragment, pageName) {
        const confirmationMessage = getLocalizedText({
            en: `Would you like to move to the <strong>${pageName}</strong> page?`,
            ko: `<strong>${pageName}</strong> 페이지로 이동하시겠어요?`
        });

        const yesLabel = getLocalizedText({en: "Yes, move me!", ko: "네, 이동할게요!"});
        const noLabel = getLocalizedText({en: "No, stay here.", ko: "아니요, 여기에 있을게요."});

        addPortfolioChatMessage(`
            <div class="ai-chat-bubble">${confirmationMessage}</div>
            <div class="follow-up-buttons navigation-confirmation-buttons">
                <button class="ai-action-btn confirm-navigation-btn" data-action="confirm_navigate"
                        data-target-page="${targetPage}" data-url-fragment="${urlFragment || ''}">${yesLabel}</button>
                <button class="ai-action-btn cancel-navigation-btn">${noLabel}</button>
            </div>
        `, 'bot', 'navigation-prompt-message');
    }


    /**
     * Renders the AI response data (insight, results, follow-up actions) into the UI.
     * @param {object} data - The structured response data from AIPortfolioLogic.
     */
    function renderPortfolioResults(data) {
        setLoadingState(false); // Hide loading indicator

        // Display AI Insight message
        const insightText = data.aiInsight || '';
        if(insightText) addPortfolioChatMessage(insightText, 'bot');

        // Display result cards (projects, skills etc.)
        if (data.results?.length > 0) {
            let resultsHtml = data.results.map(createPortfolioCardHTML).join('');
            addPortfolioChatMessage(resultsHtml, 'bot', 'result-cards-message');
            // Animate cards if present
            if (portfolioChatMessagesContainer) {
                gsap.fromTo(portfolioChatMessagesContainer.querySelectorAll(".portfolio-card"), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.1 });
            }
            // Show confetti for successful results (optional, can be removed)
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            if (aiPortfolioChatModal) {
                aiPortfolioChatModal.appendChild(confettiContainer);
                if (typeof lottie !== 'undefined') {
                    lottie.loadAnimation({ container: confettiContainer, renderer: 'svg', loop: false, autoplay: true, path: 'https://lottie.host/81a94207-6f8d-4f1a-b605-2436893dd0ce/Y7v1z0e7vV.json' });
                }
                setTimeout(() => confettiContainer.remove(), 3000);
            }
        } else if (data.response_type === 'text_only' || data.response_type === 'list_and_text' || data.response_type === 'text_and_link') {
            // Do nothing if it's purely text based and no results were expected or provided.
            // Avoid showing "No relevant information found" for purely textual responses.
        } else {
            // Only show "No info" if response type isn't text-only but results array is empty
            addPortfolioChatMessage(getLocalizedText({ko: '관련 정보를 찾지 못했습니다.', en: 'No relevant information found.'}), 'bot');
        }

        // Display follow-up actions
        if (data.followUpActions?.length > 0) {
            const bubbleText = getLocalizedText({ko: "💡 이런 것도 궁금하신가요?", en: "💡 Curious about anything else?"});
            let buttonsHtml = data.followUpActions.map(action => {
                // Ensure labels and queries are localized correctly
                const label = getLocalizedText(action.label);
                // Query should typically be in English for logic processing, but data-query needs to be string
                const query = typeof action.query === 'object' ? (action.query['en'] || action.query['ko'] || '') : action.query; 
                if (!query) {
                    console.warn("[AI_Chat_UI] Follow-up action has no valid query string:", action);
                    return ''; // Skip invalid buttons
                }

                // If the action is 'navigate_direct', convert it into a 'navigate_confirm_prompt' for UI
                if (action.action === 'navigate_direct' && window.AIPortfolioLogic?.knowledgeBase?.navigation_map?.[action.target_page]) {
                    const pageData = window.AIPortfolioLogic.knowledgeBase.navigation_map[action.target_page];
                    return `<button class="ai-action-btn navigate-action-btn"
                                data-action="navigate_confirm_prompt"
                                data-target-page="${action.target_page}"
                                data-url-fragment="${action.url_fragment || ''}"
                                data-page-name="${getLocalizedText(pageData.name)}"
                                data-query="${query}"
                            ><span class="icon">🤔</span> ${label}</button>`;
                } else {
                    return `<button class="ai-action-btn" data-query="${query}" data-action="${action.action || ''}" data-target-page="${action.target_page || ''}" data-url-fragment="${action.url_fragment || ''}" data-target-id="${action.target_id || ''}" data-category="${action.category || ''}" data-intent="${action.intent || ''}" data-subsection="${action.subSection || ''}"><span class="icon">🤔</span> ${label}</button>`;
                }
            }).join('');
            addPortfolioChatMessage(`<div class="ai-chat-bubble">${bubbleText}</div><div class="follow-up-buttons">${buttonsHtml}</div>`, 'bot', 'follow-up-suggestion-message');
        }

        // Display additional info (e.g., clarification prompts)
        const additionalInfoText = data.additionalInfo || '';
        if (additionalInfoText) addPortfolioChatMessage(additionalInfoText, 'bot');

        // Note: The direct navigation from `data.action === 'navigate'` is removed from here.
        // It's now handled by the promptAndNavigate function via button click.
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
    }


    /**
     * Handles the AI search process: shows loading, calls AI logic, and renders results.
     * @param {string} query - The user's query.
     */
    async function handlePortfolioSearch(query) {
        if (isLoading) return; // Prevent multiple requests
        setLoadingState(true);
        runLoadingSequence(); // Start the loading text animation

        try {
            // Ensure AIPortfolioLogic is available before calling
            if (typeof window.AIPortfolioLogic?.getAIResponse !== 'function') {
                throw new Error("AI Logic (window.AIPortfolioLogic) is not initialized.");
            }
            // Pass the current session context to the AI logic
            const data = await window.AIPortfolioLogic.getAIResponse(query, sessionContext);
            renderPortfolioResults(data);
        } catch (error) {
            console.error("[AI_Chat_UI] Portfolio search error:", error);
            addPortfolioChatMessage(getLocalizedText({ko: "요청 처리 중 심각한 문제가 발생했습니다. 개발자에게 문의하거나 페이지를 새로고침해 주세요.", en: "A critical error occurred while processing your request. Please contact the developer or refresh the page."}), 'bot');
            setLoadingState(false); // Hide loading on error
        } finally {
            loadingTimeouts.forEach(clearTimeout); // Clear any pending loading text timeouts
        }
    }


    /**
     * Handles sending a chat message, including handling stage transitions.
     * @param {string} queryOverride - Optional query to send, overrides input field value.
     */
    function handlePortfolioChatSend(queryOverride = '') {
        if (!aiPortfolioChatInput || !portfolioChatMessagesContainer) return;

        const query = queryOverride || aiPortfolioChatInput.value.trim();
        if (!query || isLoading) return; // Don't send empty queries or if already loading

        const isStage1 = aiPortfolioChatModal.classList.contains('stage-1');

        aiPortfolioChatInput.value = ''; // Clear input field immediately
        addPortfolioChatMessage(query, 'user'); // Add user message to UI

        if (isStage1) {
            transitionToStage2(); // Animate modal to conversation stage
        }
        // Start AI processing regardless of stage transition.
        handlePortfolioSearch(query);
    }


    /**
     * Attaches all necessary event listeners to modal elements.
     */
    function attachEventListeners() {
        if (closePortfolioChatModalBtn) {
            closePortfolioChatModalBtn.addEventListener('click', window.closePortfolioChatModal);
        }

        // FIX: Consolidate and improve outside-click-to-close logic
        // This listener covers clicks anywhere outside the modal content to close it.
        // Use a flag to prevent immediate re-closing if the modal was just opened via FAB.
        let isModalOpening = false;
        if (aiAssistantFAB) {
            aiAssistantFAB.addEventListener('click', (event) => {
                isModalOpening = true;
                setTimeout(() => { isModalOpening = false; }, 300); // Reset flag after a short delay (longer than modal opening animation)
            });
        }

        document.addEventListener('click', (event) => {
            if (!aiPortfolioChatModal || !aiPortfolioChatModal.classList.contains('show') || isModalOpening) {
                return;
            }

            // Check if the click originated from within the FAB itself
            if (aiAssistantFAB && aiAssistantFAB.contains(event.target)) {
                return;
            }

            const modalContent = aiPortfolioChatModal.querySelector('.ai-portfolio-chat-modal-content');

            // If the clicked target is outside the modal content, close the modal.
            if (modalContent && !modalContent.contains(event.target)) {
                window.closePortfolioChatModal();
            }
        });


        if (aiPortfolioChatInput) {
            aiPortfolioChatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !isLoading) {
                    e.preventDefault(); // Prevent default form submission behavior
                    handlePortfolioChatSend();
                }
            });
        }

        if (aiPortfolioChatSendBtn) {
            aiPortfolioChatSendBtn.addEventListener('click', () => {
                if (!isLoading) {
                    handlePortfolioChatSend();
                }
            });
        }

        // Event delegation for suggestion and action buttons within chat messages
        if (portfolioChatMessagesContainer) {
            portfolioChatMessagesContainer.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.suggestion-btn, .view-project-via-modal, .follow-up-buttons .ai-action-btn');
                if (!targetBtn) return;

                // Handle navigation confirmation buttons (Yes/No)
                if (targetBtn.matches('.confirm-navigation-btn')) {
                    const { targetPage, urlFragment } = targetBtn.dataset;
                    const pageData = window.AIPortfolioLogic?.knowledgeBase?.navigation_map?.[targetPage];
                    if (pageData?.page) {
                        let actualUrl = pageData.page;
                        if (urlFragment && !actualUrl.includes('#')) {
                            actualUrl += `#${urlFragment}`;
                        } else if (urlFragment) {
                            actualUrl = actualUrl.split('#')[0] + `#${urlFragment}`;
                        }
                        addPortfolioChatMessage(getLocalizedText({en: "Alright! Heading there now.", ko: "알겠습니다! 지금 바로 이동할게요."}), 'user'); // User's 'Yes' confirmation
                        window.closePortfolioChatModal();
                        setTimeout(() => { window.location.href = actualUrl; }, 300);
                    } else {
                        addPortfolioChatMessage(getLocalizedText({en: "Sorry, I can't find that page.", ko: "죄송합니다, 해당 페이지를 찾을 수 없습니다."}), 'bot');
                    }
                    // Remove the navigation prompt buttons after interaction
                    const parentButtonsDiv = targetBtn.closest('.navigation-confirmation-buttons');
                    if(parentButtonsDiv) parentButtonsDiv.remove();
                    return; // Stop further processing
                }
                if (targetBtn.matches('.cancel-navigation-btn')) {
                    addPortfolioChatMessage(getLocalizedText({en: "Understood! Staying on this page then.", ko: "알겠습니다! 이 페이지에 머무를게요."}), 'user'); // User's 'No' confirmation
                    // Remove the navigation prompt buttons
                    const parentButtonsDiv = targetBtn.closest('.navigation-confirmation-buttons');
                    if(parentButtonsDiv) parentButtonsDiv.remove();
                    return; // Stop further processing
                }


                const query = targetBtn.dataset.query;
                if (!query) {
                    console.warn("[AI_Chat_UI] Clicked button has no data-query attribute.", targetBtn);
                    return;
                }

                // Handle regular suggestion/action buttons
                if (targetBtn.matches('.suggestion-btn')) {
                    handlePortfolioChatSend(query);
                } else if (targetBtn.matches('.view-project-via-modal')) {
                    document.dispatchEvent(new CustomEvent('openProjectModalFromChat', { detail: { projectId: targetBtn.dataset.projectId } }));
                    window.closePortfolioChatModal();
                } else if (targetBtn.matches('.follow-up-buttons .ai-action-btn')) {
                    const { action, targetPage, urlFragment, pageName, targetId, category, intent, subsection } = targetBtn.dataset;

                    if (action === 'navigate_confirm_prompt') { // New action to trigger confirmation
                        promptAndNavigate(query, targetPage, urlFragment, pageName);
                    } else if (action === 'show_specific_item_details' && targetId && category) {
                        handlePortfolioChatSend(query);
                    } else {
                        handlePortfolioChatSend(query);
                    }
                }
            });
        }
        console.log("[AI_Chat_UI] All event listeners attached.");
    }

    // --- Initialization Sequence for ai_chat_ui.js ---
    window.initializeAiChatModalUI = async function() {
        console.log("[AI_Chat_UI] initializeAiChatModalUI called. Initializing UI components.");
        initializeLottieAnimations();
        attachEventListeners();
        await initializeAILogicAndUI();
        console.log("[AI_Chat_UI] AI Chat UI initialized and ready.");
    };

})(); // End of IIFE