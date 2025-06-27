document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
    const hubGreetingMain = document.getElementById('hub-greeting-main');
    const hubGreetingSub = document.getElementById('hub-greeting-sub');
    const hubTabs = document.querySelector('.hub-tabs');
    const cardsContainer = document.getElementById('highlight-cards-container');
    const timelineContainer = document.getElementById('timeline-container');
    let currentView = 'timeline';
    // [REMOVED] currentLang check is simplified as we only use English now.
    let userName = localStorage.getItem('currentUser') || 'Visitor';

    // --- [MODIFIED] Function to update the hub greeting ---
    function updateHubGreeting() {
        if (!hubGreetingMain || !hubGreetingSub) return;
        
        // Always get the latest name from localStorage
        userName = localStorage.getItem('currentUser') || 'Visitor';
        
        hubGreetingMain.textContent = `Welcome, ${userName}!`;
        hubGreetingSub.textContent = `Here is your journey.`;
    }

    // --- 2. UTILITIES ---
    function formatRelativeTime(timestamp) {
        if (!timestamp) return 'Recent';
        const numericTimestamp = Number(timestamp);
        if (isNaN(numericTimestamp)) {
            console.error(`[formatRelativeTime] Invalid timestamp: ${timestamp}`);
            return 'Recent';
        }
        const now = new Date();
        const past = new Date(numericTimestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);
        if (diffInSeconds < 1) return 'Just now';
        
        // Use 'en' locale directly
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const intervals = [
            { unit: 'year', seconds: 31536000 },
            { unit: 'month', seconds: 2592000 },
            { unit: 'day', seconds: 86400 },
            { unit: 'hour', seconds: 3600 },
            { unit: 'minute', seconds: 60 }
        ];
        for (const interval of intervals) {
            if (diffInSeconds >= interval.seconds) {
                const count = Math.floor(diffInSeconds / interval.seconds);
                return rtf.format(-count, interval.unit);
            }
        }
        return rtf.format(-diffInSeconds, 'second');
    }

    // --- 3. RENDERING LOGIC (Korean text removed) ---
    function renderTimeline() {
        if (!timelineContainer) return;
        timelineContainer.innerHTML = '';
        const data = getHighlightData();
        const sortedItems = Object.entries(data).sort(([, a], [, b]) => (a.timestamp || 0) - (b.timestamp || 0));
        if (sortedItems.length === 0) {
            timelineContainer.innerHTML = `<p class="no-highlights">Your journey will be displayed here as you highlight items.</p>`;
            return;
        }
        sortedItems.forEach(([id, item]) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            const date = formatRelativeTime(item.timestamp);
            timelineItem.innerHTML = `
                <div class="timeline-dot" style="border-color: var(--highlight-${item.color})"></div>
                <div class="timeline-content">
                    <span class="timeline-date">${date}</span>
                    <h4 class="timeline-page">From page: <strong>${item.page || 'Portfolio'}</strong></h4>
                    <p class="timeline-text">"${item.text}"</p>
                </div>`;
            timelineContainer.appendChild(timelineItem);
        });
        const farewellItem = document.createElement('div');
        farewellItem.className = 'timeline-item farewell-timeline-item';
        farewellItem.innerHTML = `<div class="timeline-content"><div class="farewell-message"><i class="fas fa-star" style="color: #ffc107;"></i><p>Every highlight you've collected is a star that lights up our conversation.</p></div></div>`;
        timelineContainer.appendChild(farewellItem);
        gsap.to('.timeline-item', { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
    }

    function renderCards(viewType) {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';
        const data = (viewType === 'active') ? getHighlightData() : getUnhighlightData();
        if (Object.keys(data).length === 0) {
            const message = viewType === 'active' ? 'No active highlights. Explore the portfolio!' : 'The archive is empty.';
            cardsContainer.innerHTML = `<p class="no-highlights">${message}</p>`;
            return;
        }
        Object.keys(data).forEach(id => {
            const item = data[id];
            const card = document.createElement('div');
            card.className = 'highlight-card';
            card.dataset.id = id;
            card.style.borderColor = `var(--highlight-${item.color})`;
            let actionButtonsHTML = viewType === 'active' ? `<button class="unhighlight-card-btn" title="Archive">✕</button>` : `<div class="card-actions"><button class="restore-btn" data-id="${id}">Restore</button><button class="delete-btn" data-id="${id}">Delete</button></div>`;
            card.innerHTML = `<div class="card-header"><span class="card-page-source">${item.page || 'Portfolio'}</span>${viewType === 'active' ? actionButtonsHTML : ''}</div><p class="card-text">${item.text}</p>${viewType === 'archived' ? actionButtonsHTML : ''}`;
            cardsContainer.appendChild(card);
        });
        gsap.to('.highlight-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
    }
    
    function renderContent() {
        switch (currentView) {
            case 'timeline':
                cardsContainer.classList.add('hidden');
                timelineContainer.classList.remove('hidden');
                renderTimeline();
                break;
            case 'active': case 'archived':
                timelineContainer.classList.add('hidden');
                cardsContainer.classList.remove('hidden');
                renderCards(currentView);
                break;
        }
    }

    // --- 4. EVENT LISTENERS ---

    // [FIXED] The listener now just triggers the update function.
    document.addEventListener('userLoggedIn', () => { 
        updateHubGreeting();
        renderContent(); // You might want to re-render if content depends on the user too.
    });

    // [MODIFIED] Simplified language change handler
    document.addEventListener('languageChanged', (e) => { 
        // Although Korean is removed, this keeps the system flexible
        // and ensures the greeting updates if the name is 'Visitor'
        updateHubGreeting();
        renderContent(); 
    });
    
    document.addEventListener('highlightDataChanged', () => { renderContent(); });
    
    hubTabs.addEventListener('click', (e) => { 
        if (e.target.classList.contains('hub-tab-btn')) { 
            currentView = e.target.dataset.view; 
            hubTabs.querySelectorAll('.hub-tab-btn').forEach(btn => btn.classList.remove('active')); 
            e.target.classList.add('active'); 
            renderContent(); 
        } 
    });
    
    // [MODIFIED] Card actions with English confirmation
    cardsContainer.addEventListener('click', e => { 
        const button = e.target.closest('button'); 
        if (!button) return; 
        const card = button.closest('.highlight-card'); 
        const id = card?.dataset.id; 
        if (!id) return; 
        if (button.classList.contains('unhighlight-card-btn')) { 
            unHighlightElement(null, id); 
        } else if (button.classList.contains('restore-btn')) { 
            restoreHighlight(id); 
        } else if (button.classList.contains('delete-btn')) { 
            if (confirm('Delete permanently?')) { 
                deleteUnhighlightPermanently(id); 
            } 
        } 
    });

    // --- 5. DRAG AND DROP LOGIC (Unchanged) ---
    cardsContainer.addEventListener('mousedown', e => {
        const card = e.target.closest('.highlight-card');
        if (card) {
            card.setAttribute('draggable', 'true');
        }
    });

    cardsContainer.addEventListener('dragstart', e => {
        const card = e.target.closest('.highlight-card');
        if (card) {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            const ghost = document.createElement('div');
            ghost.className = 'drag-ghost';
            const pageSource = card.querySelector('.card-page-source')?.textContent.trim() || 'Item';
            ghost.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Moving: ${pageSource}`;
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 20, 20);
            setTimeout(() => {
                card.classList.add('dragging-source');
            }, 0);
        }
    });

    cardsContainer.addEventListener('dragend', e => {
        const ghost = document.querySelector('.drag-ghost');
        if (ghost) ghost.remove();
        const card = e.target.closest('.highlight-card');
        if (card) {
            card.classList.remove('dragging-source');
            card.removeAttribute('draggable');
        }
        hubTabs.querySelectorAll('.hub-tab-btn').forEach(btn => btn.classList.remove('drag-over'));
    });

    hubTabs.addEventListener('dragover', e => {
        e.preventDefault(); 
        const tab = e.target.closest('.hub-tab-btn');
        if (tab && (tab.dataset.view === 'active' || tab.dataset.view === 'archived') && tab.dataset.view !== currentView) {
            tab.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'move';
        }
    });

    hubTabs.addEventListener('dragleave', e => {
        const tab = e.target.closest('.hub-tab-btn');
        if (tab) tab.classList.remove('drag-over');
    });

    hubTabs.addEventListener('drop', e => {
        e.preventDefault();
        const tab = e.target.closest('.hub-tab-btn');
        if (tab) {
            tab.classList.remove('drag-over');
            const targetView = tab.dataset.view;
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId && targetView !== currentView) {
                if (targetView === 'archived' && currentView === 'active') {
                    unHighlightElement(null, draggedId);
                } else if (targetView === 'active' && currentView === 'archived') {
                    restoreHighlight(draggedId);
                }
            }
        }
    });

    // --- 6. INITIALIZATION ---
    updateHubGreeting();
    renderContent();
});