// highlight-hub.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 선택 ---
    const hubTabs = document.querySelector('.hub-tabs');
    const cardsContainer = document.getElementById('highlight-cards-container');
    const draftTextarea = document.getElementById('postcard-draft-textarea');
    const goToPostcardBtn = document.getElementById('go-to-postcard-btn');
    const aiSummarizeBtn = document.getElementById('ai-summarize-btn');
    const aiDraftPostcardBtn = document.getElementById('ai-draft-postcard-btn');
    const aiOutput = document.getElementById('ai-output');

    // --- 2. 상태 변수 ---
    let currentView = 'active'; // 'active' 또는 'archived'
    let currentLang = localStorage.getItem('oosuPortfolioLang') || 'en';

    // --- 3. 핵심 렌더링 함수 ---
    function renderCards() {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';
        
        // common.js에 있는 전역 함수를 호출합니다.
        const data = (currentView === 'active') ? getHighlightData() : getUnhighlightData();

        if (Object.keys(data).length === 0) {
            let message = '';
            if (currentView === 'active') {
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
            if (currentView === 'active') {
                card.draggable = true;
                actionButtons = `<button class="unhighlight-card-btn" title="Archive">✕</button>`;
            } else {
                card.draggable = false; // 보관된 카드는 드래그 불가
                actionButtons = `
                    <div class="card-actions">
                        <button class="restore-btn" data-id="${id}">Restore</button>
                        <button class="delete-btn" data-id="${id}">Delete</button>
                    </div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-page-source">${item.page || 'Portfolio'}</span>
                    ${currentView === 'active' ? actionButtons : ''}
                </div>
                <p class="card-text">${item.text}</p>
                ${currentView === 'archived' ? actionButtons : ''}
            `;
            cardsContainer.appendChild(card);
        }
    }

    // --- 4. 이벤트 리스너 설정 ---

    // 탭 클릭 이벤트
    if (hubTabs) {
        hubTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('hub-tab-btn')) {
                currentView = e.target.dataset.view;
                document.querySelectorAll('.hub-tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderCards();
            }
        });
    }

    // 카드 컨테이너 이벤트 (이벤트 위임 방식)
    if (cardsContainer) {
        cardsContainer.addEventListener('click', e => {
            const button = e.target;
            const card = button.closest('.highlight-card');
            if (!card) return;

            const id = card.dataset.id;

            // 보관 버튼 (활성 탭)
            if (button.classList.contains('unhighlight-card-btn')) {
                unHighlightElement(null, id); // 전역 함수 호출
                renderCards();
            }
            // 복구 버튼 (보관 탭)
            else if (button.classList.contains('restore-btn')) {
                restoreHighlight(id); // 전역 함수 호출
                renderCards();
            }
            // 영구 삭제 버튼 (보관 탭)
            else if (button.classList.contains('delete-btn')) {
                if (confirm(currentLang === 'en' ? 'Are you sure you want to permanently delete this item?' : '이 항목을 영구적으로 삭제하시겠습니까?')) {
                    deleteUnhighlightPermanently(id); // 전역 함수 호출
                    renderCards();
                }
            }
        });

        // 드래그 앤 드롭
        cardsContainer.addEventListener('dragstart', e => {
            if (currentView === 'active' && e.target.classList.contains('highlight-card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.style.opacity = '0.5';
            } else {
                e.preventDefault(); // 보관된 카드는 드래그 방지
            }
        });
        cardsContainer.addEventListener('dragend', e => {
            if (e.target.classList.contains('highlight-card')) e.target.style.opacity = '1';
        });
    }

    // 드래그 드롭 영역
    if (draftTextarea) {
        draftTextarea.addEventListener('dragover', e => { e.preventDefault(); if (currentView === 'active') draftTextarea.classList.add('drag-over'); });
        draftTextarea.addEventListener('dragleave', () => draftTextarea.classList.remove('drag-over'));
        draftTextarea.addEventListener('drop', e => {
            e.preventDefault();
            draftTextarea.classList.remove('drag-over');
            const id = e.dataTransfer.getData('text/plain');
            const highlights = getHighlightData();
            if (highlights[id]) {
                const currentText = draftTextarea.value;
                const newText = `\n- ${highlights[id].text} (from: ${highlights[id].page})\n`;
                draftTextarea.value = currentText ? `${currentText}${newText}` : newText.trim();
            }
        });
    }

    // "엽서에 쓰기" 버튼 클릭 시 스크롤 및 내용 복사
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
    
    // AI 기능 (시뮬레이션)
    if (aiSummarizeBtn) {
        aiSummarizeBtn.addEventListener('click', () => {
            const highlights = getHighlightData();
            const allText = Object.values(highlights).map(item => item.text).join('\n');
            if (!allText) {
                aiOutput.textContent = currentLang === 'en' ? 'Please highlight items first.' : '먼저 하이라이트할 항목을 선택해주세요.';
                return;
            }
            aiOutput.textContent = "AI가 요약 중...";
            setTimeout(() => {
                aiOutput.innerHTML = `<strong>분석된 주요 관심사:</strong><ul><li>프론트엔드 기술과 사용자 경험(UX)</li><li>프로젝트 협업 및 경력 관련 내용</li><li>디자인과 기술의 접점 탐구</li></ul>`;
            }, 1200);
        });
    }

    if (aiDraftPostcardBtn) {
        aiDraftPostcardBtn.addEventListener('click', () => {
            const draftText = draftTextarea.value;
            if (!draftText.trim()) {
                aiOutput.textContent = currentLang === 'en' ? 'Drag highlights to the draft box first.' : '먼저 하이라이트를 드래그하여 초안을 작성해주세요.';
                return;
            }
            aiOutput.textContent = "AI가 엽서 초안 작성 중...";
            setTimeout(() => {
                const draftForAI = currentLang === 'en' ? 'Hello, I was very impressed with your portfolio...' : '안녕하세요, Oosu님의 포트폴리오를 흥미롭게 보았습니다...';
                aiOutput.textContent = `${draftForAI}\n\n[관심 내용]\n${draftText}`;
            }, 1200);
        });
    }

    // connect.js에서 보낸 언어 변경 이벤트를 수신하여 UI 업데이트
    document.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        renderCards();
    });

    // --- 5. 초기화 ---
    renderCards();
});