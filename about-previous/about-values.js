document.addEventListener('DOMContentLoaded', () => {
  // 등장 애니메이션 (GSAP + in-view 클래스)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const cards = document.querySelectorAll('.about-values-cols .value-card');
    cards.forEach(el => {
      gsap.set(el, { opacity: 0, y: 40 });
      el.classList.remove('in-view');
    });
    if (cards.length) {
      ScrollTrigger.create({
        trigger: cards[0],
        start: "top 90%",
        once: true,
        onEnter: () => {
          cards.forEach((el, idx) => {
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: idx * 0.07,
              ease: "power2.out",
              onStart: () => el.classList.add('in-view')
            });
          });
        }
      });
    }
  }

  // 드래그 정렬 (Sortable.js)
  if (window.Sortable) {
    const grid = document.querySelector('.about-values-cols');
    if (grid) {
      Sortable.create(grid, {
        animation: 200,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-dragging',
        direction: 'vertical',
        forceFallback: true,
        draggable: '.value-card'
      });
    }
  }

  // 카드 hover/클릭 효과
  document.querySelectorAll('.value-card').forEach((card) => {
    // Hover: Glass 효과 + Light sweep
    card.addEventListener('mouseenter', () => {
      card.classList.add('glass-effect');
      // light sweep
      let slot = card.querySelector('.light-sweep-slot');
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'light-sweep-slot';
        card.appendChild(slot);
      }
      let sweep = document.createElement('div');
      sweep.className = 'light-sweep-anim';
      slot.appendChild(sweep);
      if (window.gsap) {
        gsap.fromTo(sweep, { left: '-60px' }, {
          left: "120%",
          duration: 0.9,
          ease: "power2.inOut",
          onComplete: () => sweep.remove()
        });
      }
      const icon = card.querySelector('.value-icon');
      if (icon && window.gsap) {
        gsap.to(icon, { scale: 1.15, color: "#FFA4D3", filter: "drop-shadow(0 2px 10px #ffa4d366)", duration: 0.34 });
      }
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('glass-effect');
      const icon = card.querySelector('.value-icon');
      if (icon && window.gsap) {
        gsap.to(icon, { scale: 1, color: "var(--main-pink)", filter: "drop-shadow(0 1px 5px #ffa4d355)", duration: 0.32 });
      }
    });

    // Click: 그라데이션 효과 (한 번에 하나만)
    card.addEventListener('click', () => {
      document.querySelectorAll('.value-card').forEach(c => c.classList.remove('gradient-effect'));
      card.classList.add('gradient-effect');
    });
  });
});
