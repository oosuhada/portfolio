// ==== "먹물" Confetti 효과 함수 (이전에 제공된 수정된 버전) ====
function triggerInkConfetti(originX, originY) {
  const particleCount = 7; 
  
  const C_BLACK = getComputedStyle(document.documentElement).getPropertyValue('--black').trim() || '#000';
  const C_GRAY_DARK = getComputedStyle(document.documentElement).getPropertyValue('--gray-dark').trim() || '#222';
  const C_GRAY = getComputedStyle(document.documentElement).getPropertyValue('--gray').trim() || '#555';
  
  const inkColors = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#2C2C2C', '#0A0A0A'];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('confetti-particle');
    particle.style.backgroundColor = inkColors[Math.floor(Math.random() * inkColors.length)];
    particle.style.filter = 'blur(0.5px)';

    const type = Math.random();
    let size;

    if (type < 0.4) { 
      size = Math.random() * 10 + 6; 
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
    } else if (type < 0.75) { 
      const width = Math.random() * 18 + 7; 
      const height = Math.random() * 10 + 4; 
      particle.style.width = `${width}px`;
      particle.style.height = `${height}px`;
      particle.style.borderRadius = `${Math.random() * 40 + 30}%`;
       if (Math.random() > 0.5) { 
          particle.style.width = `${height}px`;
          particle.style.height = `${width}px`;
      }
    } else { 
      size = Math.random() * 4 + 2; 
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
      particle.style.opacity = Math.random() * 0.3 + 0.6;
    }

    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 70 + 50; 
    const duration = Math.random() * 1.0 + 1.5; 
    const initialRotation = Math.random() * 360;
    const finalRotation = initialRotation + (Math.random() * 180 - 90);

    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';

    particle.animate([
      { transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, opacity: parseFloat(particle.style.opacity || 1) },
      { 
        transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.05) rotate(${finalRotation}deg)`, 
        opacity: 0 
      }
    ], {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)', 
      fill: 'forwards'
    });

    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const processCards = document.querySelectorAll('.process-card');
  const stepCircles = document.querySelectorAll('#process-svg .step-circle');
  const paths = document.querySelectorAll('#process-svg path');
  const svgEl = document.querySelector('#process-svg');

  // (1) 드래그 정렬
  if (window.Sortable) {
    const grid = document.querySelector('.about-process-cols');
    if (grid) {
      Sortable.create(grid, {
        animation: 300,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-dragging',
        direction: 'vertical', 
        forceFallback: true,
        draggable: '.process-card',
        onEnd: () => {
          // Callback after drag
        }
      });
    }
  }

  // (2) Intersection Observer로 카드 등장 애니메이션 (기존 setTimeout 방식 대신)
  const cardObserver = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        // const idx = Array.from(processCards).indexOf(card); // Not needed for simple class add
        setTimeout(() => { // Apply a slight staggered delay based on observation if desired
             card.classList.add('in-view');
        }, Array.from(processCards).indexOf(card) * 100); // Stagger based on index
        observerInstance.unobserve(card); // Stop observing once animated
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% of the card is visible
    // rootMargin: '50px' // Optional: Adjust trigger area
  });

  processCards.forEach(card => cardObserver.observe(card));


  // (3) 카드-원 완전 연동 클릭 이벤트 & Confetti 통합
  function toggleProcess(idx, eventSourceElement) {
    const card = processCards[idx];
    const circle = stepCircles[idx];
    if (!card || !circle) return;
    
    const isActive = card.classList.contains('highlight'); // Use .highlight as the primary active state marker

    if (!isActive) { // If it's about to become active
      if (eventSourceElement && typeof triggerInkConfetti === 'function') {
        const rect = eventSourceElement.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        triggerInkConfetti(originX, originY); // ✨ Confetti!
      }
      card.classList.add('highlight', 'tilt-effect'); // Add both for combined effect
      circle.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
    } else { // If it's about to become inactive
      card.classList.remove('highlight', 'tilt-effect');
      circle.classList.remove('active');
      card.setAttribute('aria-pressed', 'false');
    }
  }

  processCards.forEach((card, idx) => {
    card.addEventListener('click', function () {
      toggleProcess(idx, this); // 'this' is the card
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProcess(idx, this); // 'this' is the card
      }
    });
  });

  stepCircles.forEach((circle, idx) => {
    circle.addEventListener('click', function() {
      toggleProcess(idx, this); // 'this' is the circle
    });
    // Keydown for circles is handled in section (8), ensure it also calls toggleProcess with 'this' or 'circle'
  });

  // (4) 카드 hover/포커스시 해당 SVG 원에 hover-active 효과
  processCards.forEach((card, idx) => {
    const circle = stepCircles[idx];
    if (!circle) return;

    card.addEventListener('mouseenter', () => {
      if (!circle.classList.contains('active')) {
        circle.classList.add('hover-active');
      }
    });
    card.addEventListener('mouseleave', () => {
      circle.classList.remove('hover-active');
    });
    card.addEventListener('focus', () => { // For keyboard accessibility
      if (!circle.classList.contains('active')) {
        circle.classList.add('hover-active');
      }
    });
    card.addEventListener('blur', () => {
      circle.classList.remove('hover-active');
    });
  });

  // (5) SVG 애니메이션 시퀀스
  const svgAnimationDelay = 200; // Initial delay for the first path
  const pathAnimationDuration = 1500; // Duration for each path to draw
  const pathStagger = 400; // Stagger between path animations
  const circleDelayAfterPath = 200; // Delay for circle after its path segment might be considered drawn

  paths.forEach((path, idx) => {
    // Animate stroke-dashoffset
    path.style.animation = `drawPath ${pathAnimationDuration / 1000}s ease-out forwards`;
    path.style.animationDelay = `${(svgAnimationDelay + idx * pathStagger) / 1000}s`;
    
    // Simulate textureInk properties via JS or rely on initial CSS + drawPath
    // For simplicity, drawPath is the main animation here. Opacity is set in CSS.
    // If 'textureInk' keyframes are complex, they might need separate handling or simplified CSS.
  });
  
  circles.forEach((circle, idx) => {
    setTimeout(() => {
      circle.style.opacity = '0.9'; // Match CSS target
      circle.style.transform = 'scale(1)';
    }, svgAnimationDelay + (paths.length -1) * pathStagger + pathAnimationDuration / 2 + idx * 100 + circleDelayAfterPath); // Appear after paths are mostly done
  });


  // (6) 먹 번짐 효과 - 원 주변에 확산 효과 추가
  const inkSpreads = [];
  if (svgEl && svgEl.parentElement) { // Ensure SVG and its parent exist
      stepCircles.forEach((circle) => {
        const spread = document.createElement('div');
        spread.className = 'ink-spread-effect';
        // Initial positioning will be done by JS in createOrUpdateInkSpread
        svgEl.parentElement.appendChild(spread); // Append to SVG's parent for correct positioning context
        inkSpreads.push(spread);
      });
  }
  
  function createOrUpdateInkSpread(circle, spreadElement) {
    if (!circle || !spreadElement || !svgEl || !svgEl.parentElement) return;

    const circleRect = circle.getBoundingClientRect();
    const svgParentRect = svgEl.parentElement.getBoundingClientRect(); // Position relative to SVG's parent

    // Calculate top/left relative to the SVG's offset parent
    const spreadSize = 80; // from CSS
    spreadElement.style.left = `${circleRect.left - svgParentRect.left + (circleRect.width / 2) - (spreadSize / 2)}px`;
    spreadElement.style.top = `${circleRect.top - svgParentRect.top + (circleRect.height / 2) - (spreadSize / 2)}px`;
  }


  stepCircles.forEach((circle, idx) => {
    const spread = inkSpreads[idx];
    if (!spread) return;

    createOrUpdateInkSpread(circle, spread); // Initial position

    const showSpread = () => {
      spread.style.opacity = '1';
      spread.style.transform = 'scale(1.5)';
    };
    
    const hideSpread = () => {
      if (!circle.classList.contains('active')) {
        spread.style.opacity = '0';
        spread.style.transform = 'scale(1)';
      }
    };
    
    circle.addEventListener('mouseenter', showSpread);
    circle.addEventListener('mouseleave', hideSpread);
    
    const card = processCards[idx];
    if (card) {
        card.addEventListener('mouseenter', showSpread);
        card.addEventListener('mouseleave', hideSpread);
        // Also trigger on focus for keyboard users
        card.addEventListener('focus', showSpread);
        card.addEventListener('blur', hideSpread);
        circle.addEventListener('focus', showSpread);
        circle.addEventListener('blur', hideSpread);

    }
  });

  // (7) 반응형 처리 - 화면 크기 변경 시 번짐 효과 위치 재조정
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      stepCircles.forEach((circle, idx) => {
        createOrUpdateInkSpread(circle, inkSpreads[idx]);
      });
    }, 250);
  });

  // (8) 접근성 개선 - 키보드 네비게이션 (Integrate Confetti trigger)
  processCards.forEach((card, idx) => {
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', 'false'); // Initial state
    // card.setAttribute('aria-describedby', `process-description-${idx + 1}`); // Assuming p has this id
    const pDesc = card.querySelector('.process-body');
    if (pDesc) {
        pDesc.id = `process-description-${idx + 1}`;
        card.setAttribute('aria-describedby', pDesc.id);
    }
  });

  stepCircles.forEach((circle, idx) => {
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', `프로세스 단계 ${idx + 1} 활성화/비활성화`); // More descriptive
    circle.setAttribute('tabindex', '0'); // Make it focusable
    
    circle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProcess(idx, e.currentTarget); // Pass the circle element
      }
    });
  });

  // (9) 성능 최적화 (Intersection Observer) is now (2)
});