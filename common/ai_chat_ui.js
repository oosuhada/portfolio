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
                    aiPortfolioChatInput.placeholder = currentLanguage === 'ko' ?
                        "궁금한 점을 입력해주세요" :
                        "Ask me anything";
                }
            } catch (error) {
                console.error("[AI_Chat_UI] Failed to load AI data for logic:", error);
                addPortfolioChatMessage(currentLanguage === 'ko' ? "AI 어시스턴트 데이터 로딩에 실패했습니다." : "Failed to load AI assistant data.", 'bot');
            }
        } else {
            console.error("[AI_Chat_UI] AIPortfolioLogic object not available after multiple retries. AI features may not work.");
            addPortfolioChatMessage(currentLanguage === 'ko' ? "AI 어시스턴트 초기화에 실패했습니다." : "Failed to initialize AI assistant.", 'bot');
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
        console.log(`[AI_Chat_UI] Chat state saved. Stage: ${stage}`);
    }

    /**
     * Loads the chat state from sessionStorage and restores the UI.
     */
    async function loadChatState() {
        if (!portfolioChatMessagesContainer || !aiPortfolioChatModal) return;

        const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
        const savedStage = sessionStorage.getItem(MODAL_STAGE_KEY);

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

        // Ensure the loading status element is hidden and not appended to messages
        if (portfolioLoadingStatus && portfolioLoadingStatus.parentNode) {
            portfolioLoadingStatus.style.display = 'none'; // Hide it first
            // portfolioLoadingStatus.parentNode.removeChild(portfolioLoadingStatus); // Removed as it will be re-appended by setLoadingState
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
                initialSuggestions = [{label: currentLanguage === 'ko' ? "제안 로딩 오류" : "Error loading suggestions.", query: "Error"}];
            }
        } else {
            console.warn("[AI_Chat_UI] AIPortfolioLogic is not available for initial suggestions during reset.");
            initialSuggestions = [{label: currentLanguage === 'ko' ? "AI 어시스턴트 로딩 중..." : "AI Assistant loading...", query: ""}];
        }

        let suggestionButtonsHtml = initialSuggestions.map(s => `<button class="ai-action-btn suggestion-btn" data-query="${s.query}">${s.label}</button>`).join('');

        portfolioChatMessagesContainer.innerHTML = `
            <div class="chat-message bot-message">
                ${currentLanguage === 'ko' ? "안녕하세요! Oosu님의 AI 포트폴리오 어시스턴트입니다. 무엇을 도와드릴까요?" : "Hello! I'm Oosu's AI Portfolio Assistant. How can I help you today?"}
            </div>
            <div class="chat-message bot-message initial-suggestion">
                <p>${currentLanguage === 'ko' ? "예시 질문:" : "Example questions:"}</p>
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
                // portfolioLoadingStatus.parentNode.removeChild(portfolioLoadingStatus); // No longer remove, just hide
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
        const messages = [
            { text_en: "Analyzing your question...", text_ko: "질문 분석 중...", delay: 1500 },
            { text_en: "Searching portfolio data...", text_ko: "포트폴리오 탐색 중...", delay: 2000 },
            { text_en: "Generating a response...", text_ko: "답변 생성 중...", delay: 2000 }
        ];
        let cumulativeDelay = 0;
        const steps = document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step');

        // Set initial text for all steps
        steps.forEach((step, index) => {
            step.innerHTML = `<span class="circle">${index + 1}</span> ${messages[index][`text_${currentLanguage}`]}`;
            // Initially set all steps to pending
            step.setAttribute('data-status', '');
        });

        updateLoadingStep(0, 'active'); // Set first step to active immediately

        const updateText = (text) => {
            if (portfolioLoadingText) {
                gsap.to(portfolioLoadingText, { opacity: 0, duration: 0.2, onComplete: () => {
                    portfolioLoadingText.textContent = text;
                    gsap.to(portfolioLoadingText, { opacity: 1, duration: 0.2 });
                }});
            }
        };

        updateText(currentLanguage === 'ko' ? "AI가 답변을 준비합니다..." : "AI is preparing a response...");

        messages.forEach((message, index) => {
            cumulativeDelay += message.delay;
            const timeout = setTimeout(() => {
                updateText(message[`text_${currentLanguage}`]);
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
        const title = item.title;
        const description = item.description;
        const buttonText = currentLanguage === 'ko' ? '자세히 보기' : 'View Details';
        let linkHtml = '';

        if (item.type === 'project' && item.id) {
            linkHtml = `<button class="card-action-btn view-project-via-modal" data-project-id="${item.id}">${buttonText}</button>`;
        } else if (item.link) {
            linkHtml = `<button class="card-action-btn" onclick="window.open('${item.link}', '_blank')">${buttonText}</button>`;
        }

        if (item.type === 'project') {
            return `<div class="portfolio-card"><h4>${title}</h4><p>${description}</p><div class="tags">${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>${linkHtml}</div>`;
        } else if (item.type === 'skill') {
            return `<div class="portfolio-card"><h4>${title}</h4><p>${description}</p><div class="tags">${(item.keywords || []).map(kw => `<span class="tag">${kw}</span>`).join('')}</div>${linkHtml}</div>`;
        }
        return '';
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
            addPortfolioChatMessage(currentLanguage === 'ko' ? '관련 정보를 찾지 못했습니다.' : 'No relevant information found.', 'bot');
        }

        // Display follow-up actions
        if (data.followUpActions?.length > 0) {
            const bubbleText = currentLanguage === 'ko' ? "💡 이런 것도 궁금하신가요?" : "💡 Curious about anything else?";
            let buttonsHtml = data.followUpActions.map(action => {
                // Ensure labels and queries are localized correctly
                const label = typeof action.label === 'object' ? (action.label[currentLanguage] || action.label['en'] || '') : action.label;
                const query = typeof action.query === 'object' ? (action.query['en'] || '') : action.query; // Query should typically be in English for logic processing

                return `<button class="ai-action-btn" data-query="${query}" data-action="${action.action || ''}" data-target-page="${action.target_page || ''}" data-url-fragment="${action.url_fragment || ''}" data-target-id="${action.target_id || ''}" data-category="${action.category || ''}" data-intent="${action.intent || ''}"><span class="icon">🤔</span> ${label}</button>`;
            }).join('');
            addPortfolioChatMessage(`<div class="ai-chat-bubble">${bubbleText}</div><div class="follow-up-buttons">${buttonsHtml}</div>`, 'bot', 'follow-up-suggestion-message');
        }

        // Display additional info (e.g., clarification prompts)
        const additionalInfoText = data.additionalInfo || '';
        if (additionalInfoText) addPortfolioChatMessage(additionalInfoText, 'bot');

        // Handle navigation action if specified
        if (data.action === 'navigate' && data.target_page && window.AIPortfolioLogic?.knowledgeBase?.navigation_map) {
            const pageData = window.AIPortfolioLogic.knowledgeBase.navigation_map[data.target_page];
            if (pageData?.page) {
                let targetUrl = data.url_fragment ? `${pageData.page.split('#')[0] || ''}#${data.url_fragment}` : pageData.page;
                setTimeout(() => { window.location.href = targetUrl; window.closePortfolioChatModal(); }, 1000);
            }
        }
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
            const data = await window.AIPortfolioLogic.getAIResponse(query);
            renderPortfolioResults(data);
        } catch (error) {
            console.error("[AI_Chat_UI] Portfolio search error:", error);
            addPortfolioChatMessage(currentLanguage === 'ko' ? "요청 처리 중 문제가 발생했습니다." : "An error occurred while processing your request.", 'bot');
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
                const targetBtn = e.target.closest('.suggestion-btn, .view-project-via-modal, .follow-up-buttons .ai-action-btn'); // More specific selector
                if (!targetBtn) return;

                const query = targetBtn.dataset.query;
                if (!query) {
                    console.warn("[AI_Chat_UI] Clicked button has no data-query attribute.", targetBtn);
                    return;
                }

                if (targetBtn.matches('.suggestion-btn')) {
                    // Initial suggestions or general action buttons
                    handlePortfolioChatSend(query);
                } else if (targetBtn.matches('.view-project-via-modal')) {
                    // Open project modal (assuming this is handled globally)
                    document.dispatchEvent(new CustomEvent('openProjectModalFromChat', { detail: { projectId: targetBtn.dataset.projectId } }));
                    window.closePortfolioChatModal(); // Close chat modal when project modal opens
                } else if (targetBtn.matches('.follow-up-buttons .ai-action-btn')) {
                    // Follow-up actions
                    const { action, targetPage, urlFragment, targetId, category, intent } = targetBtn.dataset;

                    if (action === 'navigate') {
                        // Handle navigation to another page/section
                        const pageData = window.AIPortfolioLogic?.knowledgeBase?.navigation_map?.[targetPage];
                        if (pageData?.page) {
                            let actualUrl = pageData.page;
                            if (urlFragment && !actualUrl.includes('#')) {
                                actualUrl += `#${urlFragment}`; // Append fragment if not already present
                            } else if (urlFragment) {
                                actualUrl = actualUrl.split('#')[0] + `#${urlFragment}`; // Replace existing fragment
                            }
                            window.closePortfolioChatModal();
                            setTimeout(() => { window.location.href = actualUrl; }, 300); // Small delay for visual continuity
                        } else {
                            console.warn(`[AI_Chat_UI] Navigation target page '${targetPage}' not found in knowledge base.`);
                            handlePortfolioChatSend(query); // Fallback to asking AI
                        }
                    } else if (action === 'show_specific_item_details' && targetId && category) {
                        // Re-query AI with more specific intent (e.g., 'challenges of Project X')
                        // Construct a query that AIPortfolioLogic can understand for specific item details.
                        // The `query` from dataset should already be formatted for this (e.g., "nomad market project details")
                        handlePortfolioChatSend(query);
                    } else {
                        // Generic follow-up query
                        handlePortfolioChatSend(query);
                    }
                }
            });
        }
        console.log("[AI_Chat_UI] All event listeners attached.");
    }

    // --- Initialization Sequence for ai_chat_ui.js ---
    // This is the function called by common.js after all AI scripts are loaded.
    // Expose the initialization function globally.
    window.initializeAiChatModalUI = async function() {
        console.log("[AI_Chat_UI] initializeAiChatModalUI called. Initializing UI components.");
        initializeLottieAnimations(); // Initialize Lottie animations early
        attachEventListeners(); // Attach all event listeners
        await initializeAILogicAndUI(); // Kick off the AI logic and initial UI setup
        console.log("[AI_Chat_UI] AI Chat UI initialized and ready.");
    };

})(); // End of IIFE