document.addEventListener('DOMContentLoaded', () => {
  // 1. 카드 초기화 (click-me-msg 자동 생성 + <p> 숨김)
  document.querySelectorAll('.funfact-card').forEach(card => {
    const p = card.querySelector('p');
    if (p) p.classList.add('hidden');

    // click-me-msg 없으면 생성 (h3 바로 뒤에)
    if (!card.querySelector('.click-me-msg')) {
      const h3 = card.querySelector('h3');
      if (h3) {
        const msg = document.createElement('div');
        msg.className = 'click-me-msg';
        msg.innerText = 'Click me!';
        h3.insertAdjacentElement('afterend', msg);
      }
    }
  });

  // 2. 카드 클릭 인터랙션
  document.querySelectorAll('.funfact-card').forEach(card => {
    card.addEventListener('click', function(e) {
      const clickMsg = this.querySelector('.click-me-msg');
      const p = this.querySelector('p');

      // click-me-msg 클릭도 card 클릭으로 처리되게 보장
      // 단, 클릭 이벤트 중복 실행 방지(즉, 이미 열려있으면 중복 방지)
      if (clickMsg && !clickMsg.classList.contains('hidden')) {
        clickMsg.classList.add('hidden');
        if (p) p.classList.remove('hidden');
      }

      animateCardText(this);
      triggerWobble(this, 400);
      confettiBurst(this);
    });

    // click-me-msg 직접 클릭해도 카드 효과 실행(이벤트 버블링 방지X, 위의 이벤트에 위임)
    const clickMsg = card.querySelector('.click-me-msg');
    if (clickMsg) {
      clickMsg.addEventListener('click', function(e) {
        // 반드시 카드의 클릭 이벤트가 먼저 호출됨(이벤트 버블링)
        // 중복 실행되거나, 클릭 한 번에 안 먹는 경우 방지
        e.stopPropagation(); // 추가 중복 방지 (선택 사항)
      });
    }

    card.addEventListener('mouseenter', function() {
      this.classList.add('colorful');
    });
    card.addEventListener('mouseleave', function() {
      this.classList.remove('colorful');
    });
  });

  // 나머지 함수들은 동일
  function animateCardText(card) {
    const elements = card.querySelectorAll('h3, p:not(.hidden), b, .fact-icon, li, span, ul');
    elements.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: (i % 2 === 0 ? -80 : 80), y: (i % 2 === 0 ? -50 : 50) },
        { opacity: 1, x: 0, y: 0, duration: 0.7, ease: "power3.out", delay: i * 0.05 }
      );
    });
  }
  function confettiBurst(card) {
    let confettiSlot = card.querySelector('.confetti-slot');
    if (!confettiSlot) {
      confettiSlot = document.createElement('div');
      confettiSlot.className = 'confetti-slot';
      card.appendChild(confettiSlot);
    }
    for (let i = 0; i < 12; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 80 + 10}%`;
      piece.style.top = `${Math.random() * 20 + 30}%`;
      piece.style.background = `hsl(${Math.floor(Math.random()*360)},85%,70%)`;
      piece.style.transform = `rotate(${Math.random()*360}deg) scale(${Math.random()*0.7+0.7})`;
      confettiSlot.appendChild(piece);
      setTimeout(() => piece.remove(), 1000);
    }
  }
  function triggerWobble(card, duration = 400) {
    card.classList.add('wobble-effect');
    setTimeout(() => card.classList.remove('wobble-effect'), duration);
  }
});
