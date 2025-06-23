document.addEventListener('DOMContentLoaded', () => {
    // GSAP 라이브러리가 로드되었는지 확인합니다.
    if (typeof gsap === 'undefined') {
        console.error('GSAP is not loaded. Fun facts animations will not work.');
        return;
    }
    // Lottie 라이브러리가 로드되었는지 확인합니다.
    if (typeof lottie === 'undefined') {
        console.error('Lottie is not loaded. Fun facts animations will not work.');
        return;
    }
  
    // --- 초기 설정 ---
    const funfactsSection = document.querySelector('.about-funfacts');
    const mountainContainer = document.querySelector('.mountain-interactive-container');
    const allFunFactCards = funfactsSection ? Array.from(funfactsSection.querySelectorAll('.funfact-card')) : [];
    const sparkleDots = new Map();
    const spacer = document.querySelector('.funfact-spacer');
  
    // --- 상태 관리 변수 ---
    let zIndexCounter = 10;
    const activeCards = new Set();
  
    // --- 상수 정의 ---
    const CARD_BASE_WIDTH = 300;
    const LAST_CARD_OFFSET = 250;
  
    // [수정 3] 카드 높이와 활성화 시 공간 높이 재설정
    const CARD_BASE_HEIGHT = 220; // 카드의 min-height와 맞춤
    const initialSpacerHeight = CARD_BASE_HEIGHT * 0.7; // 초기 공간 높이
    const activeSpacerHeight = CARD_BASE_HEIGHT * 1.8; // 활성화 시 필요한 공간 높이 (값을 줄여 여백 감소)
  
    // 각 카드의 세로 위치 오프셋
    const cardYOffsets = [
        -20, // 1번째 카드
        -90, // 2번째 카드
        -30, // 3번째 카드
        -20, // 4번째 카드
        -70, // 5번째 카드
        20   // 6번째 카드
    ];
  
    if (!funfactsSection || !mountainContainer || allFunFactCards.length === 0 || !spacer) {
        console.warn('Fun facts 섹션 필수 요소를 찾을 수 없습니다. 인터랙션이 비활성화됩니다.');
        return;
    }
  
    gsap.set(spacer, { height: initialSpacerHeight });
  
    // --- DOT (점) 초기화 ---
    const sparkleDotPositions = [
        { top: '25%', left: '11%', targetCardId: 'name-path' }, { top: '7%', left: '24%', targetCardId: 'sensory-player' },
        { top: '26%', left: '45%', targetCardId: 'piano-precision' }, { top: '20%', left: '62%', targetCardId: 'holistic-experience' },
        { top: '30%', left: '76%', targetCardId: 'curiosity-journey' }, { top: '44%', left: '88%', targetCardId: 'resilient-creative' },
    ];
  
    sparkleDotPositions.forEach((pos, index) => {
        const dot = document.createElement('div');
        dot.className = 'sparkle-dot';
        dot.style.top = pos.top;
        dot.style.left = pos.left;
        dot.style.animationDelay = `${index * 0.18}s`;
        dot.dataset.targetCardId = pos.targetCardId;
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCard(pos.targetCardId, index);
        });
        mountainContainer.appendChild(dot);
        sparkleDots.set(pos.targetCardId, dot);
    });
  
    // --- 카드 초기화 ---
    allFunFactCards.forEach(card => {
        makeDraggable(card);
        card.addEventListener('click', handleCardClick);
    });
  
    // --- 핵심 로직 ---
    function toggleCard(cardId, index) {
        if (activeCards.has(cardId)) {
            hideCard(cardId);
        } else {
            showCard(cardId, index);
        }
    }
  
    function showCard(cardId, index) {
        if (activeCards.size === 0) {
            gsap.to(spacer, { height: activeSpacerHeight, duration: 0.6, ease: 'power3.out' });
        }
  
        const card = allFunFactCards.find(c => c.dataset.factId === cardId);
        const dot = sparkleDots.get(cardId);
  
        const lottieContainer = card.querySelector('.lottie-animation');
        if (lottieContainer && !lottieContainer.dataset.lottieInitialized) {
          const path = lottieContainer.dataset.lottiePath;
          if(path) {
            lottie.loadAnimation({
              container: lottieContainer,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              path: path
            });
            lottieContainer.dataset.lottieInitialized = 'true';
          }
        }
  
        activeCards.add(cardId);
        dot.classList.add('is-active');
        card.classList.add('is-active-fact', 'is-floating', 'blob-enter'); // Add blob-enter class
        card.style.animationDelay = `-${Math.random() * 18}s`;
  
        bringToFront(card);
  
        const totalCards = sparkleDotPositions.length;
  
        const firstDot = sparkleDots.get(sparkleDotPositions[0].targetCardId);
        const lastDot = sparkleDots.get(sparkleDotPositions[totalCards - 1].targetCardId);
  
        let targetX;
  
        if (firstDot && lastDot) {
            const startXAnchor = firstDot.offsetLeft;
            const endXAnchor = lastDot.offsetLeft - CARD_BASE_WIDTH + LAST_CARD_OFFSET;
            const travelWidth = endXAnchor - startXAnchor;
  
            if (totalCards > 1) {
                targetX = startXAnchor + (travelWidth / (totalCards - 1)) * index;
            } else {
                targetX = startXAnchor;
            }
        } else {
            console.warn("Dot elements not found, falling back to viewport-based positioning.");
            const sectionRect = funfactsSection.getBoundingClientRect();
            const fallbackTravelWidth = sectionRect.width - (20 * 2) - CARD_BASE_WIDTH;
            targetX = 20 + (fallbackTravelWidth / (totalCards - 1)) * index;
        }
  
        const verticalCenter = spacer.offsetTop + (activeSpacerHeight / 2);
        let baseTargetY = verticalCenter - (CARD_BASE_HEIGHT / 2);
        const yOffset = cardYOffsets[index] || 0;
        let targetY = baseTargetY + yOffset;
        targetY = Math.max(spacer.offsetTop, targetY);
  
        const randomRot = Math.random() * 10 - 5;
  
        // GSAP에서 scale과 위치, 회전을 제어합니다. opacity는 CSS 애니메이션에서 제어됩니다.
        gsap.fromTo(card,
          {
            scale: 0.5, // blob-enter 애니메이션 시작 시점에 맞춰 초기 scale 설정
            left: `${targetX}px`,
            top: `${targetY}px`,
            rotation: randomRot
          },
          {
            scale: 1, // 최종 scale
            duration: 0.7,
            ease: 'elastic.out(1, 0.7)',
            onComplete: () => {
                card.classList.remove('blob-enter'); // 애니메이션 완료 후 클래스 제거
            }
        });
  
        createInkBlotSplash(card);
        animateCardContent(card, 'reveal');
        const currentCardRect = card.getBoundingClientRect();
        triggerInkConfetti(currentCardRect.left + currentCardRect.width / 2, currentCardRect.top + currentCardRect.height / 2);
    }
  
    function hideCard(cardId) {
        const card = allFunFactCards.find(c => c.dataset.factId === cardId);
        if (!card) return;
  
        const wasLastCard = activeCards.size === 1;
        activeCards.delete(cardId);
  
        if (wasLastCard) {
            gsap.to(spacer, { height: initialSpacerHeight, duration: 0.6, ease: 'power3.inOut' });
        }
  
        const dot = sparkleDots.get(cardId);
        if (dot) dot.classList.remove('is-active');
        card.classList.remove('is-floating');
  
        // Add blob-exit class for animation
        card.classList.add('blob-exit');
  
        // GSAP에서 scale만 제어하고, opacity와 border-radius 애니메이션은 CSS에 맡깁니다.
        gsap.to(card, {
            scale: 0.5, // 퇴장 시 작아지도록 변경
            duration: 0.7, // 입장과 동일한 duration으로 맞춤
            ease: 'power2.in',
            onComplete: () => {
                card.classList.remove('is-active-fact', 'blob-exit'); // Remove both classes after animation
            }
        });
    }
  
    function bringToFront(card) {
        if (!card) return;
        card.style.zIndex = ++zIndexCounter;
    }
  
    function handleCardClick(event) {
        const card = event.currentTarget;
  
        if (event.target.closest('.meaning-chunk[data-highlight-id]')) {
            bringToFront(card);
            return;
        }
  
        if (event.currentTarget.classList.contains('is-dragging-for-click-check')) {
            return;
        }
  
        let maxZ = 0;
        document.querySelectorAll('.funfact-card.is-active-fact').forEach(c => {
            const z = parseInt(c.style.zIndex) || 0;
            if (z > maxZ) maxZ = z;
        });
  
        const isTopmost = (parseInt(card.style.zIndex) || 0) === maxZ;
  
        if (isTopmost) {
            hideCard(card.dataset.factId);
        } else {
            bringToFront(card);
        }
    }
  
    function makeDraggable(element) {
        let isDragging = false, hasMoved = false;
        let startX, startY;
  
        function onMouseDown(e) {
            if (e.target.closest('.meaning-chunk[data-highlight-id]')) {
                return;
            }
            e.preventDefault();
            hasMoved = false;
            element.classList.remove('is-dragging-for-click-check');
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
  
        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasMoved = true;
                element.classList.add('is-dragging', 'is-dragging-for-click-check');
                bringToFront(element);
            }
            if (hasMoved) {
                const parentRect = funfactsSection.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                let newX = element.offsetLeft + dx;
                let newY = element.offsetTop + dy;
                newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width));
                newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height));
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
                startX = e.clientX;
                startY = e.clientY;
            }
        }
  
        function onMouseUp() {
            if (isDragging) {
                element.classList.remove('is-dragging');
                setTimeout(() => {
                    element.classList.remove('is-dragging-for-click-check');
                }, 0);
            }
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
  
        element.addEventListener('mousedown', onMouseDown);
    }
  
    function animateCardContent(card, action = 'reveal') {
        const title = card.querySelector('h3');
        const textChunks = card.querySelectorAll('.fact-text-content .meaning-chunk');
  
        if (action === 'reveal') {
            gsap.fromTo([title, ...textChunks],
                { opacity: 0, y: 10 },
                {
                    opacity: 1, y: 0, duration: 0.6, stagger: 0.05,
                    ease: 'power2.out', delay: 0.3
                }
            );
        }
    }
  
    function createInkBlotSplash(card) {
        const container = card.querySelector('.ink-splash-container');
        if (!container) return;
  
        const numDrops = 3;
        for (let i = 0; i < numDrops; i++) {
            const drop = document.createElement('div');
            drop.className = 'ink-blot-drop';
  
            const size = Math.random() * 150 + 80;
            drop.style.width = `${size}px`;
            drop.style.height = `${size}px`;
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.top = `${Math.random() * 100}%`;
            drop.style.animationDelay = `${i * 0.15}s`;
  
            container.appendChild(drop);
  
            setTimeout(() => drop.remove(), 1200);
        }
    }
  
    function triggerInkConfetti(originX, originY) {
        const numParticles = 25;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';
            document.body.appendChild(particle);
  
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 80 + 40;
            const endX = originX + Math.cos(angle) * velocity;
            const endY = originY + Math.sin(angle) * velocity;
  
            gsap.fromTo(particle,
                { x: originX, y: originY, opacity: 1, scale: Math.random() * 0.8 + 0.4 },
                {
                    x: endX, y: endY, opacity: 0, scale: 0.1,
                    duration: Math.random() * 0.6 + 0.4,
                    ease: 'power1.out',
                    onComplete: () => particle.remove()
                }
            );
        }
    }
  });