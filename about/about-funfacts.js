// about-funfacts.js
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') {
    console.error('GSAP is not loaded. Animations will be simplified or may not work as expected.');
  }

  const cardDisplayArea = document.querySelector('.funfacts-card-display-area');
  const cardsContainer = document.querySelector('.about-funfacts-cols');
  const mountainContainer = document.querySelector('.mountain-interactive-container');
  const allFunFactCards = cardsContainer ? Array.from(cardsContainer.querySelectorAll('.funfact-card')) : [];

  let currentVisibleCardId = null;
  let cardAreaAnimation = null; // To store GSAP animation instance for cardDisplayArea

  const cardFactIds = [
    "name-path", "sensory-player", "piano-precision",
    "holistic-experience", "curiosity-journey", "resilient-creative"
  ];

  function getCardElementById(id) {
    return allFunFactCards.find(card => card.dataset.factId === id);
  }

  function showCard(targetCardId) {
    if (!cardDisplayArea || !cardsContainer || !gsap) return;

    const targetCardElement = getCardElementById(targetCardId);
    if (!targetCardElement) {
      console.warn(`Card with ID ${targetCardId} not found.`);
      return;
    }

    let oldCardHidingAnimation;
    const animationsTimeline = gsap.timeline();

    // 1. Hide currently active card if different
    if (currentVisibleCardId && currentVisibleCardId !== targetCardId) {
      const currentCardElement = getCardElementById(currentVisibleCardId);
      if (currentCardElement) {
        oldCardHidingAnimation = gsap.to(currentCardElement, {
          opacity: 0,
          y: 20, // Move down
          duration: 0.3,
          ease: 'power1.in',
          onComplete: () => {
            currentCardElement.classList.remove('is-active-fact'); // Hide it via CSS (display:none)
            currentCardElement.classList.remove('is-revealed', 'active-ink-state');
            const textContent = currentCardElement.querySelector('.fact-text-content');
            const clickMsg = currentCardElement.querySelector('.click-me-msg');
            if (textContent) textContent.classList.add('hidden');
            if (clickMsg) clickMsg.classList.remove('hidden');
          }
        });
        animationsTimeline.add(oldCardHidingAnimation);
      }
    }
    
    // Ensure only target card will be active
    allFunFactCards.forEach(card => {
      if(card.dataset.factId !== targetCardId) card.classList.remove('is-active-fact');
    });
    
    // 2. Calculate target height for cardDisplayArea
    // Temporarily make card visible to measure its height correctly
    targetCardElement.classList.add('is-active-fact'); // display:flex
    targetCardElement.style.visibility = 'hidden'; // Keep it invisible during measurement
    targetCardElement.style.opacity = '0'; // Keep it invisible
    
    const targetCardHeight = targetCardElement.offsetHeight;
    const cardsContainerPaddingTop = parseFloat(getComputedStyle(cardsContainer).paddingTop) || 0;
    const cardsContainerPaddingBottom = parseFloat(getComputedStyle(cardsContainer).paddingBottom) || 0;
    const finalAreaHeight = targetCardHeight + cardsContainerPaddingTop + cardsContainerPaddingBottom;

    targetCardElement.style.visibility = ''; // Restore visibility
    // .is-active-fact is already added, opacity will be animated by GSAP

    // 3. Animate cardDisplayArea height and show the new card
    if (cardAreaAnimation) cardAreaAnimation.kill(); // Kill previous height animation

    animationsTimeline.to(cardDisplayArea, {
        height: finalAreaHeight,
        duration: 0.6,
        ease: 'elastic.out(1, 0.65)' // Elastic expansion
      }, oldCardHidingAnimation ? "-=0.1" : 0) // Overlap slightly if old card was hiding
      .to(cardsContainer, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.3,
        ease: 'power1.out'
      }, "<0.1") // Start shortly after or with height animation
      .fromTo(targetCardElement,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power1.out',
        },
        "-=0.2" // Overlap with cardsContainer fade in
      );
    
    cardAreaAnimation = animationsTimeline;
    currentVisibleCardId = targetCardId;
  }

  function hideCardArea() {
    if (!cardDisplayArea || !cardsContainer || !currentVisibleCardId || !gsap) return;

    const currentCardElement = getCardElementById(currentVisibleCardId);
    if (cardAreaAnimation) cardAreaAnimation.kill();

    const tl = gsap.timeline();
    if (currentCardElement) {
      tl.to(currentCardElement, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power1.in',
        onComplete: () => {
          currentCardElement.classList.remove('is-active-fact');
          currentCardElement.classList.remove('is-revealed', 'active-ink-state');
            const textContent = currentCardElement.querySelector('.fact-text-content');
            const clickMsg = currentCardElement.querySelector('.click-me-msg');
            if (textContent) textContent.classList.add('hidden');
            if (clickMsg) clickMsg.classList.remove('hidden');
        }
      });
    }
    tl.to(cardsContainer, {
        opacity: 0,
        visibility: 'hidden',
        duration: 0.2,
        ease: 'power1.in'
      }, currentCardElement ? "-=0.1" : "0")
      .to(cardDisplayArea, {
        height: 0,
        duration: 0.5,
        ease: 'power2.inOut' // Smooth collapse
      });
    
    cardAreaAnimation = tl;
    currentVisibleCardId = null;
  }

  if (mountainContainer && allFunFactCards.length > 0) {
    const sparkleDotPositions = [
        { top: '25%', left: '11%', targetCardId: cardFactIds[0] }, 
        { top: '7%', left: '24%', targetCardId: cardFactIds[1] }, 
        { top: '26%', left: '45%', targetCardId: cardFactIds[2] }, 
        { top: '20%', left: '62%', targetCardId: cardFactIds[3] }, 
        { top: '30%', left: '76%', targetCardId: cardFactIds[4] },
        { top: '44%', left: '88%', targetCardId: cardFactIds[5] },
    ];

    sparkleDotPositions.forEach((pos, index) => {
      const dot = document.createElement('div');
      dot.classList.add('sparkle-dot');
      dot.style.top = pos.top;
      dot.style.left = pos.left;
      dot.style.animationDelay = `${index * 0.18}s`;
      dot.dataset.targetCardId = pos.targetCardId;

      dot.addEventListener('click', () => {
        const targetId = dot.dataset.targetCardId;
        if (currentVisibleCardId === targetId) {
          hideCardArea();
        } else {
          showCard(targetId);
        }
      });
      mountainContainer.appendChild(dot);
    });
  } else {
    console.warn('Mountain container or fun fact cards not found. Fun facts section might not work as expected.');
  }

  allFunFactCards.forEach(card => {
    const p = card.querySelector('p');
    let textContentWrapper = card.querySelector('.fact-text-content');
    if (p && !textContentWrapper) {
        textContentWrapper = document.createElement('div');
        textContentWrapper.className = 'fact-text-content';
        p.parentNode.insertBefore(textContentWrapper, p);
        textContentWrapper.appendChild(p);
    }
    if (textContentWrapper) textContentWrapper.classList.add('hidden');

    if (!card.querySelector('.click-me-msg')) {
        const h3Title = card.querySelector('h3');
        const msg = document.createElement('div');
        msg.className = 'click-me-msg';
        msg.innerText = 'Click to reveal.';
        if (h3Title) h3Title.insertAdjacentElement('afterend', msg);
        else card.appendChild(msg);
    }

    card.addEventListener('click', function(e) {
      if (e.target.closest('.click-me-msg')) return;
      if (!this.classList.contains('is-active-fact')) return;

      const clickMsg = this.querySelector('.click-me-msg');
      const textContent = this.querySelector('.fact-text-content');
      const isRevealed = this.classList.contains('is-revealed');

      if (!isRevealed) {
        this.classList.add('is-revealed');
        if (clickMsg) clickMsg.classList.add('hidden');
        if (textContent) {
          textContent.classList.remove('hidden');
          if (typeof animateCardContent === 'function') animateCardContent(this, 'reveal');
        }
        if (typeof createInkBlotSplash === 'function') createInkBlotSplash(this);
        if (typeof triggerInkConfetti === 'function') {
            const cardRect = this.getBoundingClientRect();
            triggerInkConfetti(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2);
        }
        this.classList.add('active-ink-state');
      } else {
        this.classList.remove('is-revealed');
        if (clickMsg) clickMsg.classList.remove('hidden');
        if (textContent) {
          if (typeof animateCardContent === 'function') animateCardContent(this, 'hide');
        }
        this.classList.remove('active-ink-state');
      }
    });

    const clickMsgElement = card.querySelector('.click-me-msg');
    if (clickMsgElement) {
      clickMsgElement.addEventListener('click', function(e) {
        e.stopPropagation();
        const parentCard = this.closest('.funfact-card');
        if (parentCard && parentCard.classList.contains('is-active-fact') && !parentCard.classList.contains('is-revealed')) {
            parentCard.classList.add('is-revealed');
            this.classList.add('hidden');
            const textContent = parentCard.querySelector('.fact-text-content');
            if (textContent) {
                textContent.classList.remove('hidden');
                if (typeof animateCardContent === 'function') animateCardContent(parentCard, 'reveal');
            }
            if (typeof createInkBlotSplash === 'function') createInkBlotSplash(parentCard);
            if (typeof triggerInkConfetti === 'function') {
                const cardRect = parentCard.getBoundingClientRect();
                triggerInkConfetti(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2);
            }
            parentCard.classList.add('active-ink-state');
        }
      });
    }
    
    // Card hover effects (only if GSAP is available and card is active)
    if (gsap) {
        card.addEventListener('mouseenter', function() {
          if (this.classList.contains('is-active-fact') && !this.classList.contains('active-ink-state')) {
            // CSS :hover rule for transform: translateY(-3px) will apply.
            // GSAP for boxShadow:
            gsap.to(this, {
              boxShadow: '0 8px 25px rgba(0,0,0,0.12), 0 3px 12px rgba(0,0,0,0.08)',
              duration: 0.3,
            });
          }
        });
        card.addEventListener('mouseleave', function() {
          if (this.classList.contains('is-active-fact') && !this.classList.contains('active-ink-state')) {
            gsap.to(this, {
              boxShadow: '0 5px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)', 
              duration: 0.4,
            });
          }
        });
    }
  });

  // --- Helper Function Definitions ---

  function animateCardContent(card, action = 'reveal') {
    if (!gsap) return; 

    const icon = card.querySelector('.fact-icon');
    const h3 = card.querySelector('h3');
    const textContent = card.querySelector('.fact-text-content');
    const tl = gsap.timeline();

    if (action === 'reveal') {
      if (icon) tl.fromTo(icon, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power1.out" }, 0);
      if (h3) tl.fromTo(h3, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power1.out" }, (icon ? "-=0.3" : "0"));
      
      const childElements = textContent && textContent.children.length > 0 ? Array.from(textContent.children) : (textContent ? [textContent] : []);
      if (childElements.length > 0) {
        tl.fromTo(childElements, 
            { opacity: 0, y: 10 }, 
            { opacity: 1, y: 0, duration: 0.5, stagger: childElements.length > 1 ? 0.04 : 0, ease: "power1.out" }, 
            (h3 ? "-=0.3" : (icon ? "-=0.3" : "0"))
        );
      }
    } else if (action === 'hide') {
      const elementsToHide = [icon, h3, textContent].filter(el => el);
      tl.to(elementsToHide, { 
          opacity: 0, 
          y: (el) => (el === textContent ? 10 : -5), // text content moves down, icon/h3 up
          duration: 0.3, 
          ease: "power1.in",
          stagger: 0.05,
          onComplete: () => {
            if (textContent) textContent.classList.add('hidden');
            // Reset transforms for next reveal
            elementsToHide.forEach(el => gsap.set(el, {clearProps: "transform,opacity"}));
          }
      });
    }
  }
  
  function createInkBlotSplash(card) {
    let splashContainer = card.querySelector('.ink-splash-container');
    if (!splashContainer) {
      splashContainer = document.createElement('div');
      splashContainer.className = 'ink-splash-container';
      // Insert before the first content element (like icon) if possible, to be visually behind.
      // CSS z-index should primarily handle layering.
      const firstContentChild = card.querySelector('.fact-icon') || card.firstChild;
      if (firstContentChild) {
        card.insertBefore(splashContainer, firstContentChild);
      } else {
        card.appendChild(splashContainer);
      }
    }
    splashContainer.innerHTML = ''; 

    const numberOfDrops = Math.floor(Math.random() * 3) + 3; 
    for (let i = 0; i < numberOfDrops; i++) {
      const drop = document.createElement('div');
      drop.className = 'ink-blot-drop';
      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;
      const dropBaseSize = Math.random() * Math.min(cardWidth, cardHeight) * 0.15 + Math.min(cardWidth, cardHeight) * 0.1;
      const dropHeightFactor = Math.random() * 0.4 + 0.8; // Skewed ellipse
      drop.style.width = `${dropBaseSize}px`;
      drop.style.height = `${dropBaseSize * dropHeightFactor}px`;
      // Position within the card
      drop.style.left = `${Math.random() * (cardWidth - dropBaseSize)}px`;
      drop.style.top = `${Math.random() * (cardHeight - (dropBaseSize * dropHeightFactor))}px`;
      drop.style.transform = `rotate(${Math.random() * 360}deg) scale(0.1)`; 
      drop.style.animationDelay = `${Math.random() * 0.2}s`; 
      drop.style.backgroundColor = `rgba(${Math.floor(Math.random() * 25 + 10)}, ${Math.floor(Math.random() * 25 + 10)}, ${Math.floor(Math.random() * 25 + 10)}, ${Math.random() * 0.25 + 0.5})`; 
      splashContainer.appendChild(drop);
      drop.addEventListener('animationend', () => { drop.remove(); });
    }
  }

  function triggerInkConfetti(originX, originY) {
    const particleCount = 7;
    const C_BLACK = getComputedStyle(document.documentElement).getPropertyValue('--black').trim() || '#000000';
    const C_GRAY_DARK = getComputedStyle(document.documentElement).getPropertyValue('--gray-dark').trim() || '#222222';
    const C_GRAY = getComputedStyle(document.documentElement).getPropertyValue('--gray').trim() || '#555555';
    const inkColors = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#2C2C2C', '#0A0A0A'];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('confetti-particle');
      particle.style.backgroundColor = inkColors[Math.floor(Math.random() * inkColors.length)];
      particle.style.filter = 'blur(0.3px)';
      const type = Math.random();
      let size, width, height;

      if (type < 0.4) { 
        size = Math.random() * 8 + 5; 
        particle.style.width = `${size}px`; particle.style.height = `${size}px`; particle.style.borderRadius = '50%';
      } else if (type < 0.75) { 
        width = Math.random() * 15 + 6; height = Math.random() * 8 + 4; 
        particle.style.width = `${width}px`; particle.style.height = `${height}px`; 
        particle.style.borderRadius = `${Math.random() * 35 + 25}% / ${Math.random() * 35 + 25}%`; // more irregular shape
        if (Math.random() > 0.5) { particle.style.width = `${height}px`; particle.style.height = `${width}px`;}
      } else { 
        size = Math.random() * 3 + 2; 
        particle.style.width = `${size}px`; particle.style.height = `${size}px`; particle.style.borderRadius = '50%'; 
        particle.style.opacity = (Math.random() * 0.3 + 0.6).toString();
      }
      document.body.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 60 + 40; 
      const duration = Math.random() * 0.8 + 1.2; 
      const initialRotation = Math.random() * 360;
      const finalRotation = initialRotation + (Math.random() * 180 - 90);
      const initialOpacity = parseFloat(particle.style.opacity || 1);

      if (gsap) {
        gsap.fromTo(particle, 
          { x: originX, y: originY, scale: 1, rotation: initialRotation, opacity: initialOpacity, transformOrigin: "center center" },
          { 
            x: originX + Math.cos(angle) * distance, 
            y: originY + Math.sin(angle) * distance, 
            scale: 0.1, 
            rotation: finalRotation, 
            opacity: 0, 
            duration: duration, 
            ease: 'cubic-bezier(0.12, 0.88, 0.32, 1)', // Custom ease out
            onComplete: () => particle.remove() 
          }
        );
      } else { // Fallback if GSAP is not available
        particle.style.left = `${originX}px`; particle.style.top = `${originY}px`; // Set initial for non-GSAP
        setTimeout(() => particle.remove(), duration * 1000);
      }
    }
  }
  
  // SortableJS - 현재 단일 카드 표시 방식에서는 직접적인 시각적 효과는 없으나,
  // 사용자가 나중에 여러 카드를 동시에 표시하는 레이아웃으로 변경할 경우를 대비해 유지할 수 있습니다.
  // 또는, 현재 사용되지 않으므로 제거해도 무방합니다.
  if (typeof Sortable !== 'undefined') {
    const grid = document.querySelector('.about-funfacts-cols');
    if (grid && allFunFactCards.length > 1) { // 카드가 여러 개 있을 때만 의미가 있음
      new Sortable(grid, {
        animation: 250,
        ghostClass: 'drag-ghost', 
        chosenClass: 'drag-chosen', 
        draggable: '.funfact-card.is-active-fact', // 현재 보이는 카드만 드래그 가능하도록 (단일표시에는 의미X)
                                                // 또는 '.funfact-card'로 하고 JS로 드래그 가능 여부 제어
      });
    }
  }
});