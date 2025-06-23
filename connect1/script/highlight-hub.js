document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 선택 (Elements Selection) ---
    const hubGreeting = document.getElementById('hub-greeting');
    const topInterestPlaceholder = document.getElementById('top-interest-placeholder');
    const hubTabs = document.querySelector('.hub-tabs');
    const cardsContainer = document.getElementById('highlight-cards-container');
    const timelineContainer = document.getElementById('timeline-container');
    const draftTextarea = document.getElementById('postcard-draft-textarea');
    const goToPostcardBtn = document.getElementById('go-to-postcard-btn');
    
    // AI Assistant Elements
    const aiInsightsOutput = document.getElementById('ai-insights-output');
    const aiTemplateButtons = document.querySelectorAll('.ai-template-btn');
    const aiToneButtons = document.querySelectorAll('.ai-tone-btn');
    const aiDraftPostcardBtn = document.getElementById('ai-draft-postcard-btn');
    const aiOutput = document.getElementById('ai-output');

    // --- 2. 상태 변수 (State Variables) ---
    let currentView = 'timeline'; // 'timeline', 'active', 'archived'
    let currentLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    let aiState = {
        template: 'general',
        tone: 'professional'
    };
    // 가상의 사용자 이름 (실제로는 hero.js 등에서 가져와야 함)
    const userName = localStorage.getItem('GREETING_KEY') || (currentLang === 'en' ? 'Visitor' : '방문자');


    // --- 3. 핵심 렌더링 함수 (Core Rendering Functions) ---

    /**
     * 현재 뷰에 따라 적절한 렌더링 함수를 호출하는 메인 함수
     */
    function renderContent() {
        switch (currentView) {
            case 'timeline':
                cardsContainer.classList.add('hidden');
                timelineContainer.classList.remove('hidden');
                renderTimeline();
                break;
            case 'active':
                timelineContainer.classList.add('hidden');
                cardsContainer.classList.remove('hidden');
                renderCards('active');
                break;
            case 'archived':
                timelineContainer.classList.add('hidden');
                cardsContainer.classList.remove('hidden');
                renderCards('archived');
                break;
        }
    }

    /**
     * 타임라인 뷰를 렌더링
     */
    function renderTimeline() {
        if (!timelineContainer) return;
        timelineContainer.innerHTML = '';
        const data = getHighlightData(); // common.js의 전역 함수
        
        if (Object.keys(data).length === 0) {
            const message = currentLang === 'en'
                ? 'Your journey will be displayed here as you highlight items.'
                : '포트폴리오를 둘러보며 하이라이트하면 당신의 여정이 이곳에 표시됩니다.';
            timelineContainer.innerHTML = `<p class="no-highlights">${message}</p>`;
            return;
        }

        // 타임스탬프가 있다면 시간순으로 정렬 (없다면 추가된 순서대로)
        const sortedItems = Object.entries(data).sort(([,a], [,b]) => (a.timestamp || 0) - (b.timestamp || 0));

        sortedItems.forEach(([id, item]) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            // 타임스탬프를 날짜 형식으로 변환 (없으면 기본값)
            const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent';

            timelineItem.innerHTML = `
                <div class="timeline-dot" style="border-color: var(--highlight-${item.color})"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${date}</span>
                    <h4 class="timeline-page" data-lang-en="From page: " data-lang-ko="페이지: ">From page: <strong>${item.page || 'Portfolio'}</strong></h4>
                    <p class="timeline-text">"${item.text}"</p>
                </div>
            `;
            timelineContainer.appendChild(timelineItem);
        });
    }

    /**
     * 활성/보관된 하이라이트 카드를 렌더링
     * @param {'active' | 'archived'} viewType - 렌더링할 뷰 타입
     */
    function renderCards(viewType) {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';
        const data = (viewType === 'active') ? getHighlightData() : getUnhighlightData();

        if (Object.keys(data).length === 0) {
            let message = '';
            if (viewType === 'active') {
                message = currentLang === 'en'
                    ? 'No active highlights. Explore the portfolio!'
                    : '활성화된 하이라이트가 없습니다. 포트폴리오를 둘러보세요!';
            } else {
                message = currentLang === 'en'
                    ? 'The archive is empty.'
                    : '보관함이 비어있습니다.';
            }
            cardsContainer.innerHTML = `<p class="no-highlights">${message}</p>`;
            return;
        }

        for (const id in data) {
            const item = data[id];
            const card = document.createElement('div');
            card.className = 'highlight-card';
            card.dataset.id = id;
            card.style.borderColor = `var(--highlight-${item.color})`;
            
            let actionButtons = '';
            if (viewType === 'active') {
                card.draggable = true;
                actionButtons = `<button class="unhighlight-card-btn" title="Archive">✕</button>`;
            } else {
                card.draggable = false;
                actionButtons = `
                    <div class="card-actions">
                        <button class="restore-btn" data-id="${id}">${currentLang === 'en' ? 'Restore' : '복원'}</button>
                        <button class="delete-btn" data-id="${id}">${currentLang === 'en' ? 'Delete' : '삭제'}</button>
                    </div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-page-source">${item.page || 'Portfolio'}</span>
                    ${viewType === 'active' ? actionButtons : ''}
                </div>
                <p class="card-text">${item.text}</p>
                ${viewType === 'archived' ? actionButtons : ''}
            `;
            cardsContainer.appendChild(card);
        }
    }


    // --- 4. AI 및 데이터 분석 함수 (AI & Data Analysis Functions) ---
    
    /**
     * 하이라이트 데이터를 분석하여 인사이트 생성
     */
    function generateAndDisplayInsights() {
        const highlights = getHighlightData();
        const itemCount = Object.keys(highlights).length;

        if (itemCount === 0) {
            aiInsightsOutput.textContent = currentLang === 'en'
                ? 'Highlight items from the portfolio to see your interest analysis.'
                : '포트폴리오에서 항목을 하이라이트하면 관심사 분석 결과를 볼 수 있습니다.';
            if (topInterestPlaceholder) topInterestPlaceholder.textContent = currentLang === 'en' ? 'various topics' : '다양한 주제들';
            return;
        }

        // 1. 페이지별 빈도수 계산
        const pageCounts = Object.values(highlights).reduce((acc, { page }) => {
            page = page || 'General';
            acc[page] = (acc[page] || 0) + 1;
            return acc;
        }, {});
        const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

        // 2. 키워드 추출 및 빈도수 계산
        const stopWords = {
            en: ['a', 'an', 'the', 'in', 'on', 'with', 'and', 'or', 'to', 'of', 'is', 'i', 'you', 'it'],
            ko: ['은', '는', '이', '가', '을', '를', '의', '에', '과', '와', '도', '으로', '로', '에서']
        };
        const wordCounts = Object.values(highlights).reduce((acc, { text }) => {
            const words = text.toLowerCase().split(/\s+/);
            words.forEach(word => {
                word = word.replace(/[.,!?"'()]/g, ''); // 간단한 구두점 제거
                if (word && !(stopWords[currentLang] || []).includes(word)) {
                    acc[word] = (acc[word] || 0) + 1;
                }
            });
            return acc;
        }, {});
        const topKeywords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        // 3. 개인화 메시지 업데이트
        if (topInterestPlaceholder && topPages.length > 0) {
            topInterestPlaceholder.textContent = topPages.map(p => p[0]).join(', ');
        }
        if (hubGreeting) {
            hubGreeting.textContent = currentLang === 'en'
                ? `Welcome, ${userName}! Here is your journey.`
                : `${userName}님, 반갑습니다! 당신의 여정을 확인해보세요.`;
        }

        // 4. 결과 출력
        let insightsHTML = ``;
        if (currentLang === 'en') {
            insightsHTML += `<strong>Top Interest Areas:</strong><ul>${topPages.map(([page, count]) => `<li>${page} (${count} items)</li>`).join('')}</ul>`;
            insightsHTML += `<br><strong>Key Keywords:</strong><p>${topKeywords.map(([word]) => `<span class="keyword-tag">${word}</span>`).join(' ')}</p>`;
            insightsHTML += `<br><p>You've highlighted a total of <strong>${itemCount}</strong> items. Based on this, I can recommend some questions for you!</p>`;
        } else {
            insightsHTML += `<strong>주요 관심 분야:</strong><ul>${topPages.map(([page, count]) => `<li>${page} (${count}개)</li>`).join('')}</ul>`;
            insightsHTML += `<br><strong>주요 키워드:</strong><p>${topKeywords.map(([word]) => `<span class="keyword-tag">${word}</span>`).join(' ')}</p>`;
            insightsHTML += `<br><p>총 <strong>${itemCount}</strong>개의 항목을 하이라이트 하셨네요. 이를 바탕으로 맞춤 질문을 추천해드릴 수 있습니다!</p>`;
        }
        aiInsightsOutput.innerHTML = insightsHTML;
    }

    /**
     * AI를 사용해 엽서 초안을 생성 (시뮬레이션)
     */
    function draftPostcardWithAI() {
        const highlights = getHighlightData();
        const highlightsText = Object.values(highlights).map(item => `- ${item.text} (from: ${item.page})`).join('\n');
        
        if (Object.keys(highlights).length === 0) {
            aiOutput.textContent = currentLang === 'en'
                ? "There are no highlights to base a draft on. Please select some items you're interested in first."
                : "초안을 작성할 하이라이트가 없습니다. 먼저 관심 있는 항목을 선택해주세요.";
            return;
        }

        aiOutput.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentLang === 'en' ? 'AI is crafting a message based on your interests...' : 'AI가 관심사를 바탕으로 메시지를 작성 중입니다...'}`;
        
        setTimeout(() => {
            let greeting, body, closing;
            
            // 톤 & 매너에 따른 문구 변화
            switch (aiState.tone) {
                case 'friendly':
                    greeting = currentLang === 'en' ? `Hi Oosu,\n\nI really enjoyed looking through your portfolio!` : `안녕하세요, Oosu님!\n\n포트폴리오를 정말 즐겁게 둘러봤습니다!`;
                    closing = currentLang === 'en' ? `Best,\n${userName}` : `그럼 좋은 하루 되세요,\n${userName} 드림`;
                    break;
                case 'direct':
                    greeting = currentLang === 'en' ? `Hello Oosu,` : `안녕하세요, Oosu님.`;
                    closing = currentLang === 'en' ? `Regards,\n${userName}` : `감사합니다,\n${userName}`;
                    break;
                default: // professional
                    greeting = currentLang === 'en' ? `Dear Oosu Jang,\n\nI am writing to you after reviewing your impressive portfolio.` : `장우수님께,\n\n인상적인 포트폴리오를 검토한 후 연락드립니다.`;
                    closing = currentLang === 'en' ? `Sincerely,\n${userName}` : `진심을 담아,\n${userName} 드림`;
                    break;
            }

            // 문의 유형에 따른 본문 변화
            switch (aiState.template) {
                case 'collaboration':
                    body = currentLang === 'en' ? 'I was particularly interested in your work and would like to discuss a potential project collaboration. The following points caught my eye:\n' : '특히 인상 깊었던 작업들을 바탕으로 프로젝트 협업에 대해 논의하고 싶습니다. 아래 내용들에 관심이 많습니다.\n';
                    break;
                case 'recruiting':
                    body = currentLang === 'en' ? 'My team is currently looking for talented individuals, and your profile stood out. I was especially drawn to these aspects of your work:\n' : '저희 팀에서 현재 인재를 찾고 있는데, Oosu님의 이력이 눈에 띄었습니다. 특히 아래와 같은 작업에 깊은 인상을 받았습니다.\n';
                    break;
                case 'technical':
                    body = currentLang === 'en' ? 'I have a few technical questions regarding your projects. I was curious about the following highlighted items:\n' : '진행하신 프로젝트에 대해 몇 가지 기술적인 질문이 있습니다. 아래 하이라이트한 내용들이 궁금합니다.\n';
                    break;
                default: // general
                    body = currentLang === 'en' ? 'I found your work very inspiring, especially the items I\'ve highlighted below:\n' : '당신의 작업에서 많은 영감을 받았습니다. 특히 아래 하이라이트한 내용들이 인상 깊었습니다.\n';
                    break;
            }

            const fullDraft = `${greeting}\n\n${body}\n${highlightsText}\n\n${closing}`;
            aiOutput.textContent = fullDraft;
            
            // 실시간 미리보기: 생성된 초안을 메시지 드래프트 영역에 바로 복사
            draftTextarea.value = fullDraft;
        }, 1500);
    }


    // --- 5. 이벤트 리스너 설정 (Event Listeners) ---

    // 탭 클릭 이벤트
    if (hubTabs) {
        hubTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('hub-tab-btn')) {
                currentView = e.target.dataset.view;
                document.querySelectorAll('.hub-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderContent();
            }
        });
    }

    // 카드 컨테이너 이벤트 (이벤트 위임)
    if (cardsContainer) {
        // 클릭 이벤트
        cardsContainer.addEventListener('click', e => {
            const button = e.target.closest('button');
            if (!button) return;

            const card = button.closest('.highlight-card');
            if (!card) return;
            
            const id = card.dataset.id;

            if (button.classList.contains('unhighlight-card-btn')) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    unHighlightElement(null, id); // 전역 함수 호출
                    renderCards('active');
                    generateAndDisplayInsights();
                }, 300);
            } else if (button.classList.contains('restore-btn')) {
                restoreHighlight(id);
                renderCards('archived');
            } else if (button.classList.contains('delete-btn')) {
                const confirmation = currentLang === 'en' ? 'Are you sure you want to permanently delete this item?' : '이 항목을 영구적으로 삭제하시겠습니까?';
                if (confirm(confirmation)) {
                    deleteUnhighlightPermanently(id);
                    renderCards('archived');
                }
            }
        });

        // 드래그 앤 드롭 이벤트
        cardsContainer.addEventListener('dragstart', e => {
            if (currentView === 'active' && e.target.classList.contains('highlight-card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                setTimeout(() => e.target.style.opacity = '0.5', 0);
            } else {
                e.preventDefault();
            }
        });

        cardsContainer.addEventListener('dragend', e => {
            if (e.target.classList.contains('highlight-card')) e.target.style.opacity = '1';
        });
    }
    
    // 드롭 영역 이벤트
    if (draftTextarea) {
        draftTextarea.addEventListener('dragover', e => {
            e.preventDefault();
            if (currentView === 'active') draftTextarea.classList.add('drag-over');
        });
        draftTextarea.addEventListener('dragleave', () => draftTextarea.classList.remove('drag-over'));
        draftTextarea.addEventListener('drop', e => {
            e.preventDefault();
            draftTextarea.classList.remove('drag-over');
            const id = e.dataTransfer.getData('text/plain');
            const highlights = getHighlightData();
            if (highlights[id]) {
                const currentText = draftTextarea.value;
                const newText = `\n- ${highlights[id].text} (from: ${highlights[id].page})\n`;
                draftTextarea.value = currentText ? `${currentText.trim()}${newText}` : newText.trim();
                draftTextarea.focus();
            }
        });
    }

    // "엽서에 쓰기" 버튼
    if (goToPostcardBtn) {
        goToPostcardBtn.addEventListener('click', () => {
            const postcardSection = document.querySelector('.postcard-section');
            const messageTextareaInForm = document.getElementById('message');
            if (messageTextareaInForm) {
                messageTextareaInForm.value = draftTextarea.value;
            }
            if (postcardSection) {
                postcardSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    if (messageTextareaInForm) messageTextareaInForm.focus();
                }, 500);
            }
        });
    }

    // AI 버튼 이벤트
    aiTemplateButtons.forEach(button => {
        button.addEventListener('click', () => {
            aiTemplateButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            aiState.template = button.dataset.template;
        });
    });

    aiToneButtons.forEach(button => {
        button.addEventListener('click', () => {
            aiToneButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            aiState.tone = button.dataset.tone;
        });
    });

    if (aiDraftPostcardBtn) {
        aiDraftPostcardBtn.addEventListener('click', draftPostcardWithAI);
    }
    
    // 언어 변경 이벤트 수신
    document.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        // 모든 UI 텍스트 업데이트 후 다시 렌더링
        renderContent();
        generateAndDisplayInsights();
        // 버튼 텍스트 등도 여기서 변경할 수 있음
    });


    // --- 6. 초기화 (Initialization) ---
    function initialize() {
        // 기본 활성화된 버튼 설정
        document.querySelector(`.ai-template-btn[data-template="${aiState.template}"]`).classList.add('active');
        document.querySelector(`.ai-tone-btn[data-tone="${aiState.tone}"]`).classList.add('active');

        renderContent();
        generateAndDisplayInsights();
    }
    
    initialize();
});