// about-skills.js
document.addEventListener('DOMContentLoaded', () => {
    // 드래그 정렬 (가로)
    const skillsSortable = document.getElementById('skills-sortable');
    if (skillsSortable) {
      Sortable.create(skillsSortable, {
        animation: 200,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-dragging',
        direction: 'horizontal',
        forceFallback: true,
      });
    }
  
    // flip-card-back에 Click me or drag me! 텍스트 추가
    document.querySelectorAll('.skill-card .flip-card-back').forEach(back => {
      if (!back.querySelector('.click-me-msg')) {
        let msg = document.createElement('div');
        msg.className = 'click-me-msg';
        msg.innerText = 'Click me or drag me!';
        back.appendChild(msg);
      }
    });
  
    // 오버레이(모달) 처리 (옵션: 실제 오버레이 마크업 필요)
    const overlay = document.getElementById('skill-overlay');
    const overlayContent = overlay?.querySelector('.skill-overlay-content');
    const closeBtn = overlay?.querySelector('.skill-overlay-close');
    document.querySelectorAll('.skill-card .flip-card-back').forEach(back => {
      back.addEventListener('click', function (e) {
        if (!overlayContent) return;
        const card = back.closest('.skill-card');
        if (!card) return;
        const title = card.querySelector('.skill-header h3').innerText;
        const icon = card.querySelector('.skill-icon').outerHTML;
        let liArr = Array.from(card.querySelector('.flip-card-front ul')?.children || []);
        let iconArr = Array.from(card.querySelector('.flip-card-back .only-icon-list li') || []);
        let html = `
          <div class="skill-header">${icon}<h3>${title}</h3></div>
          <ul>
            ${liArr.map((li, i) => {
              let ic = iconArr[i]?.querySelector('i')?.outerHTML || '';
              return `<li>${ic} ${li.textContent}</li>`;
            }).join('')}
          </ul>
        `;
        overlayContent.innerHTML = html;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
        e.stopPropagation();
      });
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        overlay.classList.remove('show');
        setTimeout(() => {
          overlay.classList.add('hidden');
          overlayContent.innerHTML = '';
          document.body.style.overflow = '';
        }, 400);
      });
    }
    if (overlay) {
      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('show');
          setTimeout(() => {
            overlay.classList.add('hidden');
            overlayContent.innerHTML = '';
            document.body.style.overflow = '';
          }, 400);
        }
      });
    }
  
    // 스킬카드: 클릭시 텍스트 날아오기, mouseleave 시 앞면 복귀
    function animateCardText(card) {
      const elements = card.querySelectorAll(
        'h3, p, b, .flip-hint, .skill-icon, .value-icon, .process-icon, .fact-icon, li, span, ul, .click-me-msg'
      );
      elements.forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, x: (i % 2 === 0 ? -80 : 80), y: (i % 2 === 0 ? -50 : 50) },
          { opacity: 1, x: 0, y: 0, duration: 0.7, ease: "power3.out", delay: i * 0.05 }
        );
      });
    }
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('click', function(e) {
        animateCardText(this);
      });
      card.addEventListener('mouseleave', function(e) {
        this.classList.remove('flipped');
      });
    });
  });
  