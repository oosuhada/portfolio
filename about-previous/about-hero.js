document.addEventListener('DOMContentLoaded', function () {
  // [1] 묶음 hover (동일)
  for (let i = 1; i <= 5; i++) {
    const group = document.querySelectorAll('.purpose-section.section' + i);
    group.forEach(span => {
      span.addEventListener('mouseenter', () => {
        group.forEach(s => s.classList.add('hovered'));
      });
      span.addEventListener('mouseleave', () => {
        group.forEach(s => s.classList.remove('hovered'));
      });
    });
  }

  // [2] Divider, 폰트사이즈/손가락 제어
  const hero = document.querySelector('.about-hero');
  const purpose = document.querySelector('.about-purpose');
  const divider = document.querySelector('.about-divider');
  const hitzone = document.querySelector('.about-divider-hitzone'); // ★ 히트존
  const profile = document.querySelector('.about-profile');
  const iconLeft = document.getElementById('icon-left');
  const iconRight = document.getElementById('icon-right');
  let dragging = false;

  // DOM 준비 직후, divider 초기 위치 세팅. width를 명시적으로 2:1로 지정
  if (purpose && profile) {
    purpose.style.flex = 'none';
    profile.style.flex = 'none';
    purpose.style.width = `calc(55% - 2rem - 1.5px)`;
    profile.style.width = `calc(45% - 2rem - 1.5px)`;
  }

  let minPercent = 12;
  let maxPercent = 88;
  let handThreshold = 0.60;
  let centerTolerance = 0.01;

  function updatePurposeFont(purposeWidth) {
    const minW = 260, maxW = 1000, minF = 2.2, maxF = 4.3;
    let w = Math.max(minW, Math.min(maxW, purposeWidth));
    let val = minF + (maxF - minF) * ((w - minW) / (maxW - minW));
    document.documentElement.style.setProperty('--purpose-font', val + 'rem');
  }

  function setDividerIcons() {
    const purposeW = purpose.offsetWidth;
    const profileW = profile.offsetWidth;
    const totalW = purposeW + profileW;
    const purposeRatio = purposeW / totalW;
    const profileRatio = profileW / totalW;

    if (Math.abs(purposeRatio - 0.5) < centerTolerance) {
      iconLeft.classList.remove('hide');
      iconRight.classList.remove('hide');
    } else if (purposeRatio > handThreshold) {
      iconLeft.classList.remove('hide');
      iconRight.classList.add('hide');
    } else if (profileRatio > handThreshold) {
      iconLeft.classList.add('hide');
      iconRight.classList.remove('hide');
    } else if (purposeRatio > 0.5) {
      iconLeft.classList.remove('hide');
      iconRight.classList.add('hide');
    } else {
      iconLeft.classList.add('hide');
      iconRight.classList.remove('hide');
    }
  }

  // === [!!NEW!!] 좌측 purpose 투명도+블러 함수 ===
  function updateLeftSectionEffect(purposeWidth) {
    const purposeElem = document.querySelector('.about-purpose');
    // 구간 설정
    const minW = 140;   // 최소값 (최대로 줄였을 때)
    const maxW = 420;   // 원래/최대값 (넓게 펼쳤을 때)
    let ratio = (purposeWidth - minW) / (maxW - minW);
    ratio = Math.max(0, Math.min(1, ratio));
    // 값 조정
    const minOpacity = 0.36;
    const maxOpacity = 1;
    const minBlur = 3;
    const maxBlur = 0;
    const opacity = minOpacity + (maxOpacity - minOpacity) * ratio;
    const blur = minBlur + (maxBlur - minBlur) * ratio;
    // 적용
    purposeElem.style.opacity = opacity;
    purposeElem.style.filter = `blur(${blur}px)`;
  }

  // === 기존 우측 profile 효과 함수 ===
  function updateProfileOpacity() {
    const profile = document.querySelector('.about-profile');
    const photo = document.querySelector('.about-profile-photo');
    const desc = document.querySelector('.about-profile-desc');
    if (!profile || !photo || !desc) return;
    const minWidth = 180;
    const maxWidth = 600;
    const currentWidth = profile.offsetWidth;
    let ratio = (currentWidth - minWidth) / (maxWidth - minWidth);
    ratio = Math.max(0, Math.min(1, ratio));
    // 투명도 (0.3 ~ 1)
    const minOpacity = 0.3;
    const opacity = minOpacity + (1 - minOpacity) * ratio;
    photo.style.opacity = opacity;
    desc.style.opacity = opacity;
    // blur 효과 (최대 1.0px ~ 0px)
    const blurVal = 1.0 * (1 - ratio);
    photo.style.filter = `blur(${blurVal}px)`;
    desc.style.filter = `blur(${blurVal}px)`;
    // 텍스트 컬러: #9d9d9d(157,157,157) ~ #1a1a1a(26,26,26)
    const startC = 157, endC = 26;
    const currC = Math.round(startC + (endC - startC) * ratio);
    desc.style.color = `rgb(${currC},${currC},${currC})`;
  }

  function refreshLayout() {
    setDividerIcons();
    updatePurposeFont(purpose.offsetWidth);
    updateProfileOpacity(); // ★ 우측
    updateLeftSectionEffect(purpose.offsetWidth); // ★ 좌측
  }

  window.addEventListener('resize', refreshLayout);

  // === [히트존 또는 divider에서 드래그 시작] ===
  function onDragStart(e) {
    dragging = true;
    divider.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  }
  if (hitzone) {
    hitzone.addEventListener('mousedown', onDragStart);
  }
  divider.addEventListener('mousedown', onDragStart);

  // ==== requestAnimationFrame 방식으로 drag 처리 ====
  let dragPending = false;
  let lastMoveEvent = null;

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    lastMoveEvent = e;
    if (!dragPending) {
      dragPending = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const minLeft = rect.left + rect.width * (minPercent / 100);
        const maxRight = rect.left + rect.width * (maxPercent / 100);
        let x = Math.max(minLeft, Math.min(lastMoveEvent.clientX, maxRight));
        let percent = ((x - rect.left) / rect.width) * 100;
        percent = Math.max(minPercent, Math.min(percent, maxPercent));
        purpose.style.flex = 'none';
        profile.style.flex = 'none';
        purpose.style.width = `calc(${percent}% - 2rem - 1.5px)`;
        profile.style.width = `calc(${100 - percent}% - 2rem - 1.5px)`;
        // 강제 reflow (최신값 보장)
        profile.offsetHeight;
        refreshLayout();
        dragPending = false;
      });
    }
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = '';
      refreshLayout();
    }
  });

  setTimeout(refreshLayout, 250);
});

// === 별도 진입점에서도 실행(초기화, 리사이즈) ===
window.addEventListener('DOMContentLoaded', function () {
  // 이중 실행이지만, 안전하게 보장 (중복해도 문제없음)
  const event = new Event('resize');
  window.dispatchEvent(event);
});
