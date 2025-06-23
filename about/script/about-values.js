document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger is not loaded for about-values.js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const valueCards = document.querySelectorAll('.about-values-cols .value-card');

  // 새로운 붓 자국 형태의 border-radius 값들 (더 거친 느낌)
  const brushStrokeShapes = [
    // 긴 가로 붓 자국 느낌
    '70% 30% 60% 40% / 30% 70% 40% 60%',
    '40% 60% 30% 70% / 60% 40% 70% 30%',
    '65% 35% 45% 55% / 35% 65% 55% 45%',
    '30% 70% 50% 50% / 70% 30% 60% 40%'
  ];

  valueCards.forEach((card, index) => {
    const inkShape = card.querySelector('.value-ink-shape');
    const inkBlot = card.querySelector('.value-ink-blot');
    const valueIcon = card.querySelector('.value-icon');
    const valueHanja = card.querySelector('.value-hanja');

    if (inkShape) {
      inkShape.style.borderRadius = brushStrokeShapes[index % brushStrokeShapes.length];
      // 각 붓 자국에 무작위적인 회전과 비틀림을 주어 더 자연스러운 느낌
      inkShape.style.transform = `
        rotate(${Math.random() * 10 - 5}deg)   /* -5도 ~ 5도 사이 무작위 회전 */
        skewX(${Math.random() * 8 - 4}deg)     /* -4도 ~ 4도 사이 무작위 X축 비틀림 */
        scaleY(${Math.random() * 0.2 + 0.85})  /* Y축으로 0.85 ~ 1.05 사이로 스케일 (더 납작하거나 약간 통통하게) */
      `;
      // 붓 자국의 컨테이너 (value-ink-blot)에 맞춰 inkShape의 크기 및 위치 조정
      inkShape.style.width = '120%'; // 컨테이너보다 넓게
      inkShape.style.height = '150%'; // 컨테이너보다 높게
      inkShape.style.top = '-25%'; // 위로 당겨서 중앙 정렬
      inkShape.style.left = '-10%'; // 왼쪽으로 당겨서 중앙 정렬
    }
    
    // value-ink-shape::before 에 대한 스타일도 JS에서 동적으로 설정 (선택 사항)
    // ::before 의사 요소를 JS에서 직접 제어하는 것은 CSS보다 복잡할 수 있습니다.
    // CSS에서 정의한 ::before 스타일이 우선적으로 작동하도록 이 부분은 건드리지 않는 것이 좋습니다.
    // 만약 ::before의 모양도 카드마다 다르게 하고 싶다면 유사한 방식으로 추가 로직 필요.

    // 아이콘/한자 토글 기능
    if (inkBlot) {
      inkBlot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        card.classList.toggle('show-hanja');

        // Optional: Add a subtle pulse effect on toggle (still on inkBlot)
        if (gsap) {
          gsap.fromTo(inkBlot,
            { scale: 1 },
            {
              scale: 1.05,
              duration: 0.15,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut"
            }
          );
        }
      });

      // Ink splash on hover (not click) - still triggered by inkBlot
      inkBlot.addEventListener('mouseenter', () => {
        if (!inkBlot.classList.contains('is-splashing')) {
          createValueInkSplash(inkBlot);
          inkBlot.classList.add('is-splashing');
          setTimeout(() => {
            inkBlot.classList.remove('is-splashing');
          }, 700);
        }
      });
    }
  });

  // ScrollTrigger animation for card entrance
  if (valueCards.length > 0) {
    ScrollTrigger.create({
      trigger: valueCards[0].closest('.about-values-cols'),
      start: "top 80%",
      once: true,
      onEnter: () => {
        valueCards.forEach((card, index) => {
          gsap.fromTo(card,
            { opacity: 0, y: 50, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              delay: index * 0.12,
              ease: "power2.out",
              onComplete: () => {
                card.classList.add('in-view');
              }
            }
          );
        });
      }
    });
  }

  // Sortable functionality (if available)
  if (typeof Sortable !== 'undefined') {
    const grid = document.querySelector('.about-values-cols');
    if (grid) {
      Sortable.create(grid, {
        animation: 250,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-dragging',
        draggable: '.value-card',
      });
    }
  }

  // Enhanced hover effects for the entire card
  valueCards.forEach((card) => {
    const icon = card.querySelector('.value-icon i');
    const title = card.querySelector('.value-title');

    if (icon && gsap) {
      const originalIconColor = "#d9d9d9"; // 아이콘 기본 색상 다시 정의 (CSS에서 가져올 수도 있음)
      const hoverIconColor = "#C84131"; // 호버 시 아이콘 색상 (타이틀과 통일)

      card.addEventListener('mouseenter', () => {
        // 아이콘이 보일 때만 색상 변경 (show-hanja 클래스 없을 때)
        if (!card.classList.contains('show-hanja')) {
          gsap.to(icon, {
            color: hoverIconColor,
            duration: 0.25,
            ease: "power1.out"
          });
        }
        if (title) {
          gsap.to(title, {
            textShadow: "0 0 8px rgba(173, 52, 62, 0.3)",
            duration: 0.25,
            ease: "power1.out"
          });
        }
      });

      card.addEventListener('mouseleave', () => {
        // 아이콘이 보일 때만 색상 복구
        if (!card.classList.contains('show-hanja')) {
          gsap.to(icon, {
            color: originalIconColor,
            duration: 0.25,
            ease: "power1.inOut"
          });
        }
        if (title) {
          gsap.to(title, {
            textShadow: "none",
            duration: 0.25,
            ease: "power1.inOut"
          });
        }
      });
    }
  });
});

function createValueInkSplash(inkBlotElement) {
  let splashContainer = inkBlotElement.querySelector('.ink-splash-container');
  if (!splashContainer) {
    splashContainer = document.createElement('div');
    splashContainer.className = 'ink-splash-container';
    inkBlotElement.appendChild(splashContainer);
  }

  const numberOfDrops = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < numberOfDrops; i++) {
    const drop = document.createElement('div');
    drop.className = 'ink-splash-drop';

    const size = Math.random() * 20 + 10;
    drop.style.width = `${size}px`;
    drop.style.height = `${size * (Math.random() * 0.3 + 0.75)}px`;

    const blotWidth = inkBlotElement.offsetWidth;
    const blotHeight = inkBlotElement.offsetHeight;

    drop.style.left = `calc(${(Math.random() * 0.4 + 0.3) * 100}% - ${size/2}px)`;
    drop.style.top = `calc(${(Math.random() * 0.4 + 0.3) * 100}% - ${size/2}px)`;

    drop.style.animationDelay = `${Math.random() * 0.1}s`;
    const baseShade = Math.floor(Math.random() * 10) + 5;
    drop.style.backgroundColor = `rgb(${baseShade}, ${baseShade}, ${baseShade})`;

    splashContainer.appendChild(drop);
    drop.addEventListener('animationend', () => {
      drop.remove();
    });
  }
}