/*
* AI Portfolio Chat - JS Final Logic (2025 Trend Edition)
* This script handles all client-side logic for the AI chat modal,
* including state transitions, event handling, and dynamic content rendering.
*/
document.addEventListener('DOMContentLoaded', function() {
    console.log("[AI_Portfolio_Chat] DOM content loaded. Initializing AI portfolio chat modal.");

    // --- DOM Element References ---
    const aiPortfolioChatModal = document.getElementById('ai-portfolio-chat-modal');
    const aiAssistantFAB = document.getElementById('ai-assistant-FAB');

    if (!aiPortfolioChatModal) {
        console.warn("[AI_Portfolio_Chat] AI Portfolio Chat Modal element not found. Chat functionality will be disabled.");
        return;
    }

    const closePortfolioChatModalBtn = aiPortfolioChatModal.querySelector('.close-button');
    const portfolioChatMessagesContainer = document.getElementById('portfolioChatMessages');
    const aiPortfolioChatInput = document.getElementById('aiPortfolioChatInput');
    const aiPortfolioChatSendBtn = document.getElementById('aiPortfolioChatSendBtn');
    const portfolioLoadingStatus = document.getElementById('portfolioLoadingStatus');
    const portfolioLoadingLottieContainer = document.getElementById('portfolioLoadingLottie');
    const portfolioLoadingText = document.getElementById('portfolioLoadingText');
    const aiPortfolioResults = document.getElementById('aiPortfolioResults');
    const portfolioInsightText = document.getElementById('portfolioInsightText');
    const portfolioResultCardsContainer = document.getElementById('portfolioResultCards');
    const portfolioFollowUpActions = document.getElementById('portfolioFollowUpActions');
    const portfolioFollowUpButtons = document.getElementById('portfolioFollowUpButtons');

    let portfolioLottieAnimation;
    let aiAssistantHeaderLottieAnimation;
    let sendButtonLottieAnimation;
    let isLoading = false;
    let loadingTimeouts = [];
    let currentLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en';

    function initializeAILogic() {
        if (typeof window.AIPortfolioLogic?.loadKnowledgeBase === 'function') {
            window.AIPortfolioLogic.setLanguage(currentLanguage);
            window.AIPortfolioLogic.loadKnowledgeBase().then(() => {
                console.log("[AI_Portfolio_Chat] AI logic data ready.");
                resetPortfolioChatModal();
                aiPortfolioChatInput.placeholder = currentLanguage === 'ko' ?
                    "궁금한 점을 입력해주세요" :
                    "Ask me anything";
            }).catch(error => {
                console.error("Failed to load AI data for logic:", error);
                addPortfolioChatMessage(currentLanguage === 'ko' ? "AI 어시스턴트 데이터 로딩에 실패했습니다." : "Failed to load AI assistant data.", 'bot');
            });
        } else {
            console.log("[AI_Portfolio_Chat] AIPortfolioLogic not yet available, retrying...");
            setTimeout(initializeAILogic, 50);
        }
    }

    function initializePortfolioLottie() {
        if (portfolioLoadingLottieContainer && !portfolioLottieAnimation) {
            portfolioLottieAnimation = lottie.loadAnimation({
                container: portfolioLoadingLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: false,
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
            portfolioLottieAnimation.addEventListener('DOMLoaded', () => portfolioLottieAnimation.playSegments([61, 89], true));
        }
        const aiAssistantHeaderLottieContainer = document.getElementById('aiAssistantHeaderLottie');
        if (aiAssistantHeaderLottieContainer && !aiAssistantHeaderLottieAnimation) {
            aiAssistantHeaderLottieAnimation = lottie.loadAnimation({
                container: aiAssistantHeaderLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
        }

        if (aiPortfolioChatSendBtn && !sendButtonLottieAnimation) {
            const lottieDiv = document.createElement('div');
            lottieDiv.classList.add('lottie-animation');
            aiPortfolioChatSendBtn.appendChild(lottieDiv);
            sendButtonLottieAnimation = lottie.loadAnimation({
                container: lottieDiv,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
            sendButtonLottieAnimation.addEventListener('DOMLoaded', () => sendButtonLottieAnimation.playSegments([61, 89], true));
        }
    }

    function openPortfolioChatModal() {
        if (aiAssistantFAB) {
            aiAssistantFAB.classList.add('hidden');
        }
        aiPortfolioChatModal.classList.add('show', 'stage-1');
    }

    function closePortfolioChatModal() {
        aiPortfolioChatModal.classList.remove('show', 'stage-1', 'stage-2');
        if (aiAssistantFAB) {
            aiAssistantFAB.classList.remove('hidden');
        }
        setTimeout(resetPortfolioChatModal, 400);
    }

    function resetPortfolioChatModal() {
        if (portfolioLoadingStatus && portfolioLoadingStatus.parentNode) {
            portfolioLoadingStatus.parentNode.removeChild(portfolioLoadingStatus);
        }
        if (aiPortfolioResults) aiPortfolioResults.classList.remove('show');
        if (portfolioFollowUpActions) portfolioFollowUpActions.classList.remove('show');
        let initialSuggestions = window.AIPortfolioLogic?.getInitialSuggestions() || [];
        let suggestionButtonsHtml = initialSuggestions.map(s => `<button class="ai-action-btn suggestion-btn" data-query="${s.query}">${s.label}</button>`).join('');
        if (portfolioChatMessagesContainer) {
            portfolioChatMessagesContainer.innerHTML = `
<div class="chat-message bot-message">
${currentLanguage === 'ko' ? "안녕하세요! Oosu님의 AI 포트폴리오 어시스턴트입니다. 무엇을 도와드릴까요?" : "Hello! I'm Oosu's AI Portfolio Assistant. How can I help you today?"}
</div>
<div class="chat-message bot-message initial-suggestion">
<p>${currentLanguage === 'ko' ? "예시 질문:" : "Example questions:"}</p>
${suggestionButtonsHtml}
</div>
`;
        } else {
            console.warn("[AI_Portfolio_Chat] portfolioChatMessagesContainer not found during reset. Initial messages might not appear.");
        }
        if (aiPortfolioChatInput) aiPortfolioChatInput.value = '';
        document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step').forEach(step => step.setAttribute('data-status', ''));
        if (portfolioLottieAnimation) portfolioLottieAnimation.stop();
        const confettiContainer = aiPortfolioChatModal.querySelector('.confetti-container');
        if (confettiContainer) confettiContainer.remove();
    }

    function addPortfolioChatMessage(message, type, ...additionalClasses) {
        if (!portfolioChatMessagesContainer) {
            console.error("[AI_Portfolio_Chat] Cannot add message: portfolioChatMessagesContainer is null.");
            return;
        }
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${type}-message`, ...additionalClasses);
        messageElement.innerHTML = message;
        portfolioChatMessagesContainer.appendChild(messageElement);
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
    }

    // =========================================================================
    // MODIFIED FUNCTION: transitionToStage2
    // 콜백 로직을 제거하고 UI 전환 역할만 수행하도록 단순화합니다.
    // =========================================================================
    function transitionToStage2() {
        if (!aiPortfolioChatModal) {
            console.warn("[AI_Portfolio_Chat] transitionToStage2 aborted: aiPortfolioChatModal is null.");
            return;
        }
        if (aiPortfolioChatModal.classList.contains('stage-1')) {
            console.log('Transitioning from Stage 1 to Stage 2.');
            aiPortfolioChatModal.classList.remove('stage-1');
            aiPortfolioChatModal.classList.add('stage-2');
        }
    }

    function setLoadingState(loading) {
        isLoading = loading;
        if (aiPortfolioChatInput) aiPortfolioChatInput.disabled = loading;
        if (aiPortfolioChatSendBtn) {
            aiPortfolioChatSendBtn.disabled = loading;
            if (sendButtonLottieAnimation) {
                if (loading) {
                    sendButtonLottieAnimation.stop();
                } else {
                    sendButtonLottieAnimation.playSegments([61, 89], true);
                }
            }
        }
        if (loading) {
            if (portfolioLoadingStatus) {
                portfolioLoadingStatus.classList.add('active');
                if (portfolioChatMessagesContainer) {
                    portfolioChatMessagesContainer.appendChild(portfolioLoadingStatus);
                    portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
                }
            }
            if (portfolioLottieAnimation) portfolioLottieAnimation.play();
        } else {
            if (portfolioLoadingStatus && portfolioLoadingStatus.parentNode) {
                portfolioLoadingStatus.parentNode.removeChild(portfolioLoadingStatus);
            }
            if (portfolioLoadingStatus) portfolioLoadingStatus.classList.remove('active');
            if (portfolioLottieAnimation) portfolioLottieAnimation.stop();
        }
    }

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
        steps.forEach((step, index) => step.innerHTML = `<span class="circle">${index + 1}</span> ${messages[index][`text_${currentLanguage}`]}`);
        updateLoadingStep(0, 'active');
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

    function updateLoadingStep(index, status) {
        const steps = document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step');
        if (steps[index]) {
            steps[index].setAttribute('data-status', status);
            gsap.fromTo(steps[index], { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
        }
    }

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

    function renderPortfolioResults(data) {
        setLoadingState(false);
        const insightText = data.aiInsight?.[currentLanguage] || data.aiInsight?.['en'] || data.aiInsight || '';
        if(insightText) addPortfolioChatMessage(insightText, 'bot');

        if (data.results?.length > 0) {
            let resultsHtml = data.results.map(createPortfolioCardHTML).join('');
            addPortfolioChatMessage(resultsHtml, 'bot', 'result-cards-message');
            if (portfolioChatMessagesContainer) {
                gsap.fromTo(portfolioChatMessagesContainer.querySelectorAll(".portfolio-card"), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.1 });
            }
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            if (aiPortfolioChatModal) {
                aiPortfolioChatModal.appendChild(confettiContainer);
                lottie.loadAnimation({ container: confettiContainer, renderer: 'svg', loop: false, autoplay: true, path: 'https://lottie.host/81a94207-6f8d-4f1a-b605-2436893dd0ce/Y7v1z0e7vV.json' });
                setTimeout(() => confettiContainer.remove(), 3000);
            }
        } else if (!['text_only', 'list_and_text', 'text_and_link'].includes(data.response_type)) {
            addPortfolioChatMessage(currentLanguage === 'ko' ? '관련 정보를 찾지 못했습니다.' : 'No relevant information found.', 'bot');
        }

        if (data.followUpActions?.length > 0) {
            const bubbleText = currentLanguage === 'ko' ? "💡 이런 것도 궁금하신가요?" : "💡 Curious about anything else?";
            let buttonsHtml = data.followUpActions.map(action => {
                const label = action.label?.[currentLanguage] || action.label?.['en'] || action.label;
                const query = action.query?.['en'] || action.query;
                return `<button class="ai-action-btn" data-query="${query}" data-action="${action.action || ''}" data-target-page="${action.target_page || ''}" data-url-fragment="${action.url_fragment || ''}"><span class="icon">🤔</span> ${label}</button>`;
            }).join('');
            addPortfolioChatMessage(`<div class="ai-chat-bubble">${bubbleText}</div><div class="follow-up-buttons">${buttonsHtml}</div>`, 'bot', 'follow-up-suggestion-message');
        }

        const additionalInfoText = data.additionalInfo?.[currentLanguage] || data.additionalInfo?.['en'] || data.additionalInfo || '';
        if (additionalInfoText) addPortfolioChatMessage(additionalInfoText, 'bot');

        if (data.action === 'navigate' && data.target_page && window.AIPortfolioLogic?.knowledgeBase?.navigation_map) {
            const pageData = window.AIPortfolioLogic.knowledgeBase.navigation_map[data.target_page];
            if (pageData?.page) {
                let targetUrl = data.url_fragment ? `${pageData.page.split('#')[0]}#${data.url_fragment}` : pageData.page;
                setTimeout(() => { window.location.href = targetUrl; closePortfolioChatModal(); }, 1000);
            }
        }
    }

    async function handlePortfolioSearch(query) {
        if (isLoading) return;
        setLoadingState(true);
        runLoadingSequence();
        try {
            const data = await window.AIPortfolioLogic.getAIResponse(query);
            renderPortfolioResults(data);
        } catch (error) {
            console.error("[AI Portfolio Search Error]", error);
            addPortfolioChatMessage(currentLanguage === 'ko' ? "요청 처리 중 문제가 발생했습니다." : "An error occurred while processing your request.", 'bot');
            setLoadingState(false);
        } finally {
            loadingTimeouts.forEach(clearTimeout);
        }
    }
    
    // =========================================================================
    // MODIFIED FUNCTION: handlePortfolioChatSend
    // Stage 1일 경우, 콜백 없이 transitionToStage2()를 먼저 호출한 후,
    // 곧바로 handlePortfolioSearch()를 실행하여 동시 진행을 유도합니다.
    // =========================================================================
    function handlePortfolioChatSend(queryOverride = '') {
        if (!aiPortfolioChatInput || !portfolioChatMessagesContainer) return;
        const query = queryOverride || aiPortfolioChatInput.value.trim();
        if (!query || isLoading) return;
        const isStage1 = aiPortfolioChatModal.classList.contains('stage-1');
        aiPortfolioChatInput.value = '';
        addPortfolioChatMessage(query, 'user');
        if (isStage1) {
            transitionToStage2(); // 1. 애니메이션 전환 시작
            handlePortfolioSearch(query); // 2. AI 검색 즉시 동시 시작
        } else {
            handlePortfolioSearch(query);
        }
    }

    // --- Event Listeners ---
    if (closePortfolioChatModalBtn) {
        closePortfolioChatModalBtn.addEventListener('click', closePortfolioChatModal);
    }
    if (aiAssistantFAB) {
        aiAssistantFAB.addEventListener('click', openPortfolioChatModal);
    }
    if (aiPortfolioChatModal) {
        aiPortfolioChatModal.addEventListener('click', (event) => {
            if (event.target === aiPortfolioChatModal && aiPortfolioChatModal.classList.contains('stage-2')) {
                closePortfolioChatModal();
            }
        });
    }
    document.addEventListener('click', (event) => {
        if (!aiPortfolioChatModal || !aiPortfolioChatModal.classList.contains('stage-1')) return;
        const modalContent = aiPortfolioChatModal.querySelector('.ai-portfolio-chat-modal-content');
        const fabButton = document.getElementById('ai-assistant-FAB');
        if (modalContent && fabButton && !modalContent.contains(event.target) && !fabButton.contains(event.target)) {
            closePortfolioChatModal();
        }
    });
    if (aiPortfolioChatInput) {
        aiPortfolioChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handlePortfolioChatSend();
            }
        });
    }
    if (aiPortfolioChatSendBtn) {
        aiPortfolioChatSendBtn.addEventListener('click', () => {
            if (!isLoading) handlePortfolioChatSend();
        });
    }
    if (portfolioChatMessagesContainer) {
        portfolioChatMessagesContainer.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.suggestion-btn, .view-project-via-modal, .follow-up-suggestion-message .ai-action-btn');
            if (!targetBtn) return;
            if (targetBtn.matches('.suggestion-btn')) {
                handlePortfolioChatSend(targetBtn.dataset.query);
            } else if (targetBtn.matches('.view-project-via-modal')) {
                document.dispatchEvent(new CustomEvent('openProjectModalFromChat', { detail: { projectId: targetBtn.dataset.projectId } }));
                closePortfolioChatModal();
            } else if (targetBtn.matches('.follow-up-suggestion-message .ai-action-btn')) {
                const { query, action, targetPage, urlFragment } = targetBtn.dataset;
                if (action === 'navigate') {
                    const pageData = window.AIPortfolioLogic?.knowledgeBase?.navigation_map?.[targetPage];
                    if (pageData?.page) {
                        let targetUrl = urlFragment ? `${pageData.page.split('#')[0]}#${urlFragment}` : pageData.page;
                        closePortfolioChatModal();
                        setTimeout(() => { window.location.href = targetUrl; }, 300);
                    }
                } else {
                    handlePortfolioChatSend(query);
                }
            }
        });
    }

    // --- Initialization ---
    initializeAILogic();
    initializePortfolioLottie();
});