// ======================= 한자 키워드 교체 데이터 =======================
const heroReplaceMap = [
  {
    section: 1,
    orig: 'PURPOSE',
    hanja: '<span class="swap-hanja">志</span>',
    hangul: '<span class="swap-hangul">지</span>',
    roma: '<span class="swap-roma">zhì</span>'
  },
  {
    section: 2,
    orig: 'LOVE',
    hanja: '<span class="swap-hanja">愛</span>',
    hangul: '<span class="swap-hangul">애</span>',
    roma: '<span class="swap-roma">ài</span>'
  },
  {
    section: 3,
    orig: 'GOOD',
    hanja: '<span class="swap-hanja">才</span>',
    hangul: '<span class="swap-hangul">재</span>',
    roma: '<span class="swap-roma">cái</span>'
  },
  {
    section: 4,
    orig: 'NEEDS',
    hanja: '<span class="swap-hanja">求</span>',
    hangul: '<span class="swap-hangul">구</span>',
    roma: '<span class="swap-roma">qiú</span>'
  },
  {
    section: 5,
    orig: 'LED',
    hanja: '<span class="swap-hanja">導</span>',
    hangul: '<span class="swap-hangul">도</span>',
    roma: '<span class="swap-roma">dǎo</span>'
  }
];

document.addEventListener('DOMContentLoaded', function () {
  // =======================
  // [1] 묶음 hover (동일)
  // =======================
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

  // =======================
  // [2] 섹션 전체 클릭시 swap-word 토글 (디졸브)
  // =======================
  let sectionStates = [false, false, false, false, false]; // 클릭 토글 상태
  for (let i = 1; i <= 5; i++) {
    const section = document.querySelector('.purpose-section.section' + i);
    const swapWord = section ? section.querySelector('.swap-word') : null;
    if (!section || !swapWord) continue;

    // swap-word transition 보장
    swapWord.style.transition = 'opacity 0.28s cubic-bezier(.4,1.2,.56,1)';

    section.addEventListener('click', function (e) {
      const idx = i - 1;
      const repData = heroReplaceMap[idx];
      if (!sectionStates[idx]) {
        // 페이드아웃 후 교체
        swapWord.style.opacity = 0;
        setTimeout(() => {
          swapWord.innerHTML = repData.hanja + " " + repData.hangul + " " + repData.roma;
          swapWord.style.opacity = 1;
          sectionStates[idx] = true;
        }, 210);
      } else {
        // 원래 영단어로 복구
        swapWord.style.opacity = 0;
        setTimeout(() => {
          swapWord.textContent = repData.orig;
          swapWord.style.opacity = 1;
          sectionStates[idx] = false;
        }, 210);
      }
      // 클릭 이벤트 버블링 방지(불필요시 삭제 가능)
      e.stopPropagation();
    });
  }

  // =======================
  // [3] flex-direction row 고정 (좌우 레이아웃 유지)
  // =======================
  const hero = document.querySelector('.about-hero');
  if (hero) {
    hero.style.display = 'flex';
    hero.style.flexDirection = 'row';
  }

  // =======================
  // [4] Profile Image Cycling and Hover Effect
  // =======================
  const profileImage = document.getElementById('profileImage');
  const profilePhotoContainer = document.getElementById('profilePhoto');
  const totalImages = 8;
  let currentImageIndex = 1; // Start with profile1.png

  if (profilePhotoContainer && profileImage) {
    profilePhotoContainer.addEventListener('click', function() {
      currentImageIndex = (currentImageIndex % totalImages) + 1;
      profileImage.src = `./img/profile${currentImageIndex}.png`;
      profileImage.alt = `Profile Photo of Oosu - Version ${currentImageIndex}`;
    });
  }

  // =======================
  // [5] 이하 기존 divider/drag/폰트/opacity 등 효과
  // =======================
  const purpose = document.querySelector('.about-purpose');
  const divider = document.querySelector('.about-divider');
  const hitzone = document.querySelector('.about-divider-hitzone');
  const profile = document.querySelector('.about-profile');
  const iconLeft = document.getElementById('icon-left');
  const iconRight = document.getElementById('icon-right');
  let dragging = false;

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

  function updateLeftSectionEffect(purposeWidth) {
    const purposeElem = document.querySelector('.about-purpose');
    const minW = 140;
    const maxW = 420;
    let ratio = (purposeWidth - minW) / (maxW - minW);
    ratio = Math.max(0, Math.min(1, ratio));
    const minOpacity = 0.36;
    const maxOpacity = 1;
    const minBlur = 3;
    const maxBlur = 0;
    const opacity = minOpacity + (maxOpacity - minOpacity) * ratio;
    const blur = minBlur + (maxBlur - minBlur) * ratio;
    purposeElem.style.opacity = opacity;
    purposeElem.style.filter = `blur(${blur}px)`;
  }

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
    const minOpacity = 0.3;
    const opacity = minOpacity + (1 - minOpacity) * ratio;
    photo.style.opacity = opacity;
    desc.style.opacity = opacity;
    const blurVal = 1.0 * (1 - ratio);
    photo.style.filter = `blur(${blurVal}px)`;
    desc.style.filter = `blur(${blurVal}px)`;
    const startC = 157, endC = 26;
    const currC = Math.round(startC + (endC - startC) * ratio);
    desc.style.color = `rgb(${currC},${currC},${currC})`;
  }

  function refreshLayout() {
    setDividerIcons();
    updatePurposeFont(purpose.offsetWidth);
    updateProfileOpacity();
    updateLeftSectionEffect(purpose.offsetWidth);
  }

  window.addEventListener('resize', refreshLayout);

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

// 안전하게 리사이즈
window.addEventListener('DOMContentLoaded', function () {
  const event = new Event('resize');
  window.dispatchEvent(event);
});