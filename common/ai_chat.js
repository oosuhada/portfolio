// common/ai_chat.js

// ai_chat_logic.js 모듈에서 AIPortfolioLogic 객체를 임포트합니다.
import { AIPortfolioLogic } from './ai_chat_logic.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log("[AI_Portfolio_Chat] DOM content loaded. Initializing AI portfolio chat modal.");

    // --- DOM Element References ---
    const aiPortfolioChatModal = document.getElementById('ai-portfolio-chat-modal');
    const closePortfolioChatModalBtn = aiPortfolioChatModal.querySelector('.close-button');
    const portfolioChatMessagesContainer = document.getElementById('portfolioChatMessages');
    const aiPortfolioChatInput = document.getElementById('aiPortfolioChatInput');
    const aiPortfolioChatSendBtn = document.getElementById('aiPortfolioChatSendBtn');

    // AI Result Display Areas (Loading, Final Results)
    const portfolioLoadingStatus = document.getElementById('portfolioLoadingStatus');
    const portfolioLoadingLottieContainer = document.getElementById('portfolioLoadingLottie');
    const portfolioLoadingText = document.getElementById('portfolioLoadingText');
    const aiPortfolioResults = document.getElementById('aiPortfolioResults');
    const portfolioInsightText = document.getElementById('portfolioInsightText');
    const portfolioResultCardsContainer = document.getElementById('portfolioResultCards');
    const portfolioFollowUpActions = document.getElementById('portfolioFollowUpActions');
    const portfolioFollowUpButtons = document.getElementById('portfolioFollowUpButtons');

    let portfolioLottieAnimation;
    let isLoading = false;
    let loadingTimeouts = []; // Stores loading sequence timeouts

    // --- Language Setting Variable (Default: English) ---
    let currentLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en';

    // AI 로직 파일에 현재 언어 설정 전달
    AIPortfolioLogic.setLanguage(currentLanguage);

    // AI 데이터 로드 (초기 로드 또는 필요 시).
    AIPortfolioLogic.loadKnowledgeBase().then(() => {
        console.log("[AI_Portfolio_Chat] AI logic data ready.");
        resetPortfolioChatModal(); // 데이터 로드 후 초기 봇 메시지를 다시 설정하여 언어 반영
    }).catch(error => {
        console.error("Failed to load AI data for logic:", error);
        addPortfolioChatMessage(currentLanguage === 'ko' ?
            "죄송합니다. AI 어시스턴트 데이터 로딩에 실패했습니다. 관리자에게 문의해주세요." :
            "Sorry, failed to load AI assistant data. Please contact the administrator.", 'bot');
    });

    // --- Lottie Animation Initialization (Modal Loading) ---
    function initializePortfolioLottie() {
        if (portfolioLoadingLottieContainer && !portfolioLottieAnimation) {
            portfolioLottieAnimation = lottie.loadAnimation({
                container: portfolioLoadingLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: false,
                path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
            });
            portfolioLottieAnimation.addEventListener('DOMLoaded', () => {
                portfolioLottieAnimation.playSegments([61, 89], true);
            });
        }
    }

    // --- Modal Open/Close Functions ---
    function openPortfolioChatModal() {
        aiPortfolioChatModal.style.display = 'flex';
        setTimeout(() => {
            aiPortfolioChatModal.classList.add('show');
            aiPortfolioChatInput.focus();
            portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
        }, 10);
    }

    function closePortfolioChatModal() {
        aiPortfolioChatModal.classList.remove('show');
        setTimeout(() => {
            aiPortfolioChatModal.style.display = 'none';
            resetPortfolioChatModal();
        }, 300);
    }

    function resetPortfolioChatModal() {
        // Hide all dynamic content
        portfolioLoadingStatus.style.display = 'none';
        aiPortfolioResults.style.display = 'none';

        // Reset chat messages (keep only initial bot message)
        // JSON 데이터의 initial_suggestions를 직접 사용하도록 변경
        const initialSuggestions = AIPortfolioLogic.getInitialSuggestions(currentLanguage);

        let suggestionButtonsHtml = '';
        if (initialSuggestions && initialSuggestions.length > 0) {
            suggestionButtonsHtml = initialSuggestions.map(s => `
                <button class="ai-action-btn suggestion-btn" data-query="${s.query}">${s.label}</button>
            `).join('');
        }

        portfolioChatMessagesContainer.innerHTML = `
            <div class="chat-message bot-message">
                ${currentLanguage === 'ko' ? "안녕하세요! Oosu님의 AI 포트폴리오 어시스턴트입니다. 무엇을 도와드릴까요?" : "Hello! I'm Oosu's AI Portfolio Assistant. How can I help you today?"}
            </div>
            <div class="chat-message bot-message initial-suggestion">
                <p>${currentLanguage === 'ko' ? "예시 질문:" : "Example questions:"}</p>
                ${suggestionButtonsHtml}
            </div>
        `;

        aiPortfolioChatInput.value = '';

        // Reset loading steps
        document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step').forEach(step => {
            step.setAttribute('data-status', '');
        });

        // Stop and reset Lottie animation
        if (portfolioLottieAnimation) {
            portfolioLottieAnimation.stop();
        }

        // Clear result area content
        portfolioInsightText.textContent = '';
        portfolioResultCardsContainer.innerHTML = '';
        portfolioFollowUpButtons.innerHTML = '';
        portfolioFollowUpActions.style.display = 'none';

        // Show only chat interface again
        aiPortfolioChatInput.style.display = 'block';
        aiPortfolioChatSendBtn.style.display = 'block';
        portfolioChatMessagesContainer.style.display = 'flex';

        // Remove confetti container (if it was created from previous search)
        const confettiContainer = aiPortfolioChatModal.querySelector('.confetti-container');
        if (confettiContainer) {
            confettiContainer.remove();
        }
    }

    // --- Add Chat Message Function ---
    function addPortfolioChatMessage(message, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${type}-message`);
        messageElement.innerHTML = message;
        portfolioChatMessagesContainer.appendChild(messageElement);
        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;
    }

    // --- Set Loading State Function ---
    function setLoadingState(loading) {
        isLoading = loading;
        aiPortfolioChatInput.disabled = loading;
        aiPortfolioChatSendBtn.disabled = loading;
        aiPortfolioChatSendBtn.classList.toggle('loading', loading);

        if (loading) {
            portfolioLoadingStatus.style.display = 'flex';
            aiPortfolioResults.style.display = 'none';
            portfolioChatMessagesContainer.style.display = 'none';
            aiPortfolioChatInput.style.display = 'none';
            aiPortfolioChatSendBtn.style.display = 'none';
            if (portfolioLottieAnimation) portfolioLottieAnimation.play();
        } else {
            portfolioLoadingStatus.style.display = 'none';
            if (portfolioLottieAnimation) portfolioLottieAnimation.stop();
        }
    }

    // --- Update Loading Step Function ---
    function updateLoadingStep(index, status) {
        const steps = document.querySelectorAll('#portfolioLoadingStatus .ai-loading-progress .step');
        if (steps[index]) {
            steps[index].setAttribute('data-status', status);
            gsap.fromTo(steps[index],
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }
            );
        }
    }

    // --- Run Loading Sequence Function ---
    function runLoadingSequence() {
        loadingTimeouts.forEach(clearTimeout);
        loadingTimeouts = [];
        const messages = [
            { text_en: "Analyzing your question...", text_ko: "사용자님의 질문을 분석 중입니다...", delay: 1500, step_text_en: "Analyzing your question", step_text_ko: "질문 분석 중" },
            { text_en: "Searching portfolio data...", text_ko: "포트폴리오에서 관련 정보를 탐색 중입니다...", delay: 2000, step_text_en: "Searching portfolio data", step_text_ko: "포트폴리오 데이터 탐색 중" },
            { text_en: "Generating a tailored response...", text_ko: "가장 적합한 답변을 생성하고 있습니다...", delay: 2000, step_text_en: "Generating a tailored response", step_text_ko: "맞춤 답변 생성 중" }
        ];

        let cumulativeDelay = 0;
        const step1Text = document.querySelector('#portfolioLoadingStatus .ai-loading-progress .step:nth-child(1)');
        const step2Text = document.querySelector('#portfolioLoadingStatus .ai-loading-progress .step:nth-child(2)');
        const step3Text = document.querySelector('#portfolioLoadingStatus .ai-loading-progress .step:nth-child(3)');

        step1Text.innerHTML = `<span class="circle">1</span> ${messages[0][`step_text_${currentLanguage}`]}`;
        step2Text.innerHTML = `<span class="circle">2</span> ${messages[1][`step_text_${currentLanguage}`]}`;
        step3Text.innerHTML = `<span class="circle">3</span> ${messages[2][`step_text_${currentLanguage}`]}`;

        updateLoadingStep(0, 'active');

        const updateText = (text) => {
            gsap.to(portfolioLoadingText, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    portfolioLoadingText.innerHTML = text;
                    gsap.to(portfolioLoadingText, { opacity: 1, duration: 0.2 });
                }
            });
        };

        updateText(currentLanguage === 'ko' ? "AI 어시스턴트가 답변을 준비 중입니다..." : "AI assistant is preparing its response...");

        messages.forEach((message, index) => {
            cumulativeDelay += message.delay;
            const timeout = setTimeout(() => {
                updateText(message[`text_${currentLanguage}`]);
                updateLoadingStep(index, 'done');
                if (index < messages.length - 1) {
                    updateLoadingStep(index + 1, 'active');
                }
            }, cumulativeDelay);
            loadingTimeouts.push(timeout);
        });
    }

    // --- AI Response Fetching Function (delegates to ai_chat_logic.js) ---
    async function fetchAIResponseFromLogic(query) {
        console.log(`[AI Portfolio Chat] Delegating query to AI Logic: "${query}"`);

        await new Promise(res => setTimeout(res, 2000));

        try {
            const responseData = AIPortfolioLogic.getAIResponse(query, currentLanguage);
            if (!responseData) {
                throw new Error('AI logic module did not return a valid response.');
            }
            return responseData;
        } catch (error) {
            console.error('Error getting response from AI logic module:', error);
            return {
                aiInsight: {
                    en: 'Sorry, an error occurred while processing your request. Please try again.',
                    ko: '죄송합니다, 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.'
                },
                results: [],
                followUpActions: []
            };
        }
    }

    // --- Function to Create Portfolio Card HTML ---
    function createPortfolioCardHTML(item) {
        const title = item.title;
        const description = item.description;
        const buttonText = currentLanguage === 'ko' ? '자세히 보기' : 'View Details';

        if (item.type === 'project') {
            return `
                <div class="portfolio-card">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <div class="tags">
                        ${(item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <button class="card-action-btn" ${item.link ? `onclick="window.open('${item.link}', '_blank')"` : 'disabled'}>${buttonText}</button>
                </div>
            `;
        } else if (item.type === 'skill') {
            return `
                <div class="portfolio-card">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <div class="tags">
                        ${(item.keywords || []).map(kw => `<span class="tag">${kw}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        return '';
    }

    // --- Function to Render Portfolio Results in Modal ---
    function renderPortfolioResults(data) {
        setLoadingState(false);

        const insightText = typeof data.aiInsight === 'object' && data.aiInsight !== null ?
                            data.aiInsight[currentLanguage] || data.aiInsight['en'] :
                            data.aiInsight || '';

        addPortfolioChatMessage(insightText, 'bot');

        aiPortfolioResults.style.display = 'flex';
        portfolioInsightText.innerHTML = insightText;

        portfolioResultCardsContainer.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                portfolioResultCardsContainer.innerHTML += createPortfolioCardHTML(item);
            });
        } else if (data.response_type !== 'text_only' && data.response_type !== 'list_and_text' && data.response_type !== 'text_and_link') {
            portfolioResultCardsContainer.innerHTML = currentLanguage === 'ko' ?
                '<p style="text-align:center; color:var(--gray500);">관련 정보를 찾을 수 없습니다. 다른 질문을 해주세요.</p>' :
                '<p style="text-align:center; color:var(--gray500);">No relevant information found. Please ask another question.</p>';
        }

        portfolioFollowUpButtons.innerHTML = '';
        if (data.followUpActions && data.followUpActions.length > 0) {
            portfolioFollowUpActions.querySelector('.ai-chat-bubble').textContent = currentLanguage === 'ko' ? "💡 이런 것도 궁금하신가요?" : "💡 Curious about anything else?";
            data.followUpActions.forEach(action => {
                const btn = document.createElement('button');
                btn.classList.add('ai-action-btn');
                btn.dataset.query = typeof action.query === 'object' ? action.query['en'] : action.query;
                btn.innerHTML = `<span class="icon">🤔</span> ${typeof action.label === 'object' ? action.label[currentLanguage] || action.label['en'] : action.label}`;
                if (action.action) btn.dataset.action = action.action;
                if (action.target_page) btn.dataset.targetPage = action.target_page;
                if (action.target_id) btn.dataset.targetId = action.target_id;
                if (action.url_fragment) btn.dataset.urlFragment = action.url_fragment;

                portfolioFollowUpButtons.appendChild(btn);
            });
            portfolioFollowUpActions.style.display = 'block';
        } else {
            portfolioFollowUpActions.style.display = 'none';
        }

        if (data.additionalInfo) {
            const additionalInfoText = typeof data.additionalInfo === 'object' && data.additionalInfo !== null ?
                                       data.additionalInfo[currentLanguage] || data.additionalInfo['en'] :
                                       data.additionalInfo || '';
            if (additionalInfoText) {
                addPortfolioChatMessage(additionalInfoText, 'bot');
            }
        }

        gsap.fromTo(aiPortfolioResults,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
        gsap.fromTo(".portfolio-card",
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.3 }
        );

        aiPortfolioChatInput.style.display = 'block';
        aiPortfolioChatSendBtn.style.display = 'block';
        portfolioChatMessagesContainer.style.display = 'flex';

        portfolioChatMessagesContainer.scrollTop = portfolioChatMessagesContainer.scrollHeight;

        if (data.results && data.results.length > 0) {
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            aiPortfolioChatModal.appendChild(confettiContainer);
            lottie.loadAnimation({
                container: confettiContainer,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: 'https://lottie.host/81a94207-6f8d-4f1a-b605-2436893dd0ce/Y7v1z0e7vV.json'
            });
            setTimeout(() => confettiContainer.remove(), 3000);
        }

        if (data.action === 'navigate' && data.target_page) {
            let targetUrl = `../${data.target_page}/${data.target_page}.html`;
            if (data.url_fragment) {
                targetUrl += `#${data.url_fragment}`;
            }
            setTimeout(() => {
                window.location.href = targetUrl;
                closePortfolioChatModal();
            }, 1000);
        }
    }


    // --- AI Search Handling Function ---
    async function handlePortfolioSearch(query) {
        if (isLoading) return;

        addPortfolioChatMessage(query, 'user');
        setLoadingState(true);
        runLoadingSequence();

        try {
            const data = await fetchAIResponseFromLogic(query);
            renderPortfolioResults(data);
        } catch (error) {
            console.error("[AI Portfolio Search Error]", error);
            addPortfolioChatMessage(currentLanguage === 'ko' ?
                `죄송합니다. 오류가 발생했습니다: ${error.message}<br>잠시 후 다시 시도해주세요.` :
                `Sorry, an error occurred: ${error.message}<br>Please try again shortly.`, 'bot');
            setLoadingState(false);
            aiPortfolioChatInput.style.display = 'block';
            aiPortfolioChatSendBtn.style.display = 'block';
            portfolioChatMessagesContainer.style.display = 'flex';
        } finally {
            loadingTimeouts.forEach(clearTimeout);
        }
    }

    // --- Send Button/Enter Key Handling Function ---
    function handlePortfolioChatSend() {
        const query = aiPortfolioChatInput.value.trim();
        if (!query) return;

        aiPortfolioChatInput.value = '';
        handlePortfolioSearch(query);
    }

    // --- Event Listeners ---
    document.addEventListener('openAIPortfolioChatModal', openPortfolioChatModal);
    closePortfolioChatModalBtn.addEventListener('click', closePortfolioChatModal);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target == aiPortfolioChatModal) {
            closePortfolioChatModal();
        }
    });

    // Input field Enter key event
    aiPortfolioChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isLoading) {
            handlePortfolioChatSend();
        }
    });

    // Send button click event
    aiPortfolioChatSendBtn.addEventListener('click', () => {
        if (!isLoading) {
            handlePortfolioChatSend();
        }
    });

    // Initial example question button click event (event delegation)
    portfolioChatMessagesContainer.addEventListener('click', (e) => {
        const suggestionBtn = e.target.closest('.suggestion-btn');
        if (suggestionBtn) {
            const query = suggestionBtn.dataset.query;
            aiPortfolioChatInput.value = query;
            handlePortfolioChatSend();
        }
    });

    // Follow-up buttons click event (delegation for dynamically added buttons)
    portfolioFollowUpButtons.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.ai-action-btn');
        if (!targetBtn) return;

        const action = targetBtn.dataset.action;
        const query = targetBtn.dataset.query;

        if (action === 'navigate') {
            const targetPage = targetBtn.dataset.targetPage;
            const urlFragment = targetBtn.dataset.urlFragment || '';
            const pageName = targetBtn.textContent.replace('🤔', '').trim();

            closePortfolioChatModal();
            let targetUrl = `../${targetPage}/${targetPage}.html`;
            if (urlFragment) {
                targetUrl += `#${urlFragment}`;
            }
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 300);
        } else if (action === 'show_specific_item_details') {
            aiPortfolioChatInput.value = query;
            handlePortfolioChatSend();
        } else {
            aiPortfolioChatInput.value = query;
            handlePortfolioChatSend();
        }
    });

    // Handle input field placeholder text
    aiPortfolioChatInput.placeholder = currentLanguage === 'ko' ?
        "질문이나 궁금한 점을 입력해주세요 (예: AI 관련 프로젝트 있나요?)" :
        "Ask me anything (e.g., Do you have AI-related projects?)";

    // Initial Lottie animation load (on DOMContentLoaded)
    initializePortfolioLottie();
}); 