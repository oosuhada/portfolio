document.addEventListener('DOMContentLoaded', () => {
  // (1) 드래그 정렬
  if (window.Sortable) {
    const grid = document.querySelector('.about-process-cols');
    if (grid) {
      Sortable.create(grid, {
        animation: 200,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-dragging',
        direction: 'vertical',
        forceFallback: true,
        draggable: '.process-card',
        onEnd: () => {
          // 필요시 드래그 후 인덱스 동기화 처리
        }
      });
    }
  }

  // (2) 등장 애니메이션
  const processCards = document.querySelectorAll('.process-card');
  processCards.forEach((card, idx) => {
    setTimeout(() => {
      card.classList.add('in-view');
    }, 200 + idx * 120);
  });

  // (3) 카드-원 완전 연동 클릭 이벤트
  const stepCircles = document.querySelectorAll('#process-svg .step-circle');

  function toggleProcess(idx) {
    const card = processCards[idx];
    const circle = stepCircles[idx];
    if (!card || !circle) return;
    const isActive = card.classList.contains('tilt-effect');
    if (isActive) {
      card.classList.remove('tilt-effect', 'highlight');
      circle.classList.remove('active');
    } else {
      card.classList.add('tilt-effect', 'highlight');
      circle.classList.add('active');
    }
  }

  // 카드 클릭/키보드
  processCards.forEach((card, idx) => {
    card.addEventListener('click', function () {
      toggleProcess(idx);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProcess(idx);
      }
    });
  });

  // 원 클릭
  stepCircles.forEach((circle, idx) => {
    circle.addEventListener('click', () => {
      toggleProcess(idx);
    });
  });

  // 카드 hover/포커스시 해당 SVG 원에 only hover-active (active와는 별개)
  processCards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => {
      if (!stepCircles[idx].classList.contains('active')) {
        stepCircles[idx].classList.add('hover-active');
      }
    });
    card.addEventListener('mouseleave', () => {
      stepCircles[idx].classList.remove('hover-active');
    });
    card.addEventListener('focus', () => {
      if (!stepCircles[idx].classList.contains('active')) {
        stepCircles[idx].classList.add('hover-active');
      }
    });
    card.addEventListener('blur', () => {
      stepCircles[idx].classList.remove('hover-active');
    });
  });

  // hover-active를 스타일로 구분 (about-process.css에 아래 추가하면 됨)
  // .step-circle.hover-active { filter: drop-shadow(0 0 10px #ffa4d3bb); }
});
