// ==== Hanja Mappings ====
const hanjaMap = {
  portfolio: '作品',
  about: '紹介',
  experience: '経歴',
  hobby: '趣味',
  connect: '連絡'
};

function setActiveNav() {
  const path = location.pathname;
  let activePageKey = 'portfolio'; // 기본값
  if (path.includes('about')) activePageKey = 'about';
  else if (path.includes('experience')) activePageKey = 'experience';
  else if (path.includes('hobby')) activePageKey = 'hobby';
  else if (path.includes('connect')) activePageKey = 'connect';

  document.querySelectorAll('.nav-menu a').forEach(a => {
    if (!a.dataset.originalText) {
      a.dataset.originalText = a.textContent;
      const textContent = a.textContent;
      a.innerHTML = ''; // Clear existing content
      const textWrapper = document.createElement('span');
      textWrapper.classList.add('nav-text-wrapper');
      textWrapper.textContent = textContent;
      a.appendChild(textWrapper);
    }

    const textWrapper = a.querySelector('.nav-text-wrapper');
    if (textWrapper && a.dataset.originalText) {
        textWrapper.textContent = a.dataset.originalText; // Always ensure original text is set initially
    }

    // Apply .truly-active for the current page
    if (a.dataset.nav === activePageKey) {
      a.classList.add('truly-active');
      a.classList.remove('active'); // Remove generic 'active' if it was there
    } else {
      a.classList.remove('truly-active');
      a.classList.remove('active');
    }
  });
}

// ==== 스크롤 방향 2초 지속 시 슬라이드 헤더 ====
function headerScrollEvent() {
  const header = document.querySelector('.nav-header');
  if (!header) return;
  let lastScrollY = window.scrollY;
  let scrollDir = null; let scrollDirStart = Date.now(); let delayTimer = null;
  let isHidden = header.classList.contains('hidden');
  const DELAY = 1200;
  function showHeader() { if (isHidden) { header.classList.remove('hidden'); isHidden = false; } }
  function hideHeader() { if (!isHidden) { header.classList.add('hidden'); isHidden = true; } }
  window.addEventListener('scroll', () => {
    const currY = window.scrollY; let newDir = null;
    if (currY > lastScrollY + 2) newDir = 'down'; else if (currY < lastScrollY - 2) newDir = 'up';
    if (currY <= 30) { if (delayTimer) clearTimeout(delayTimer); delayTimer = null; showHeader(); scrollDir = null; scrollDirStart = Date.now(); lastScrollY = currY; return; }
    if (newDir && newDir !== scrollDir) { if (delayTimer) clearTimeout(delayTimer); scrollDir = newDir; scrollDirStart = Date.now(); delayTimer = setTimeout(() => { if (scrollDir === 'down') hideHeader(); else if (scrollDir === 'up') showHeader(); delayTimer = null; }, DELAY); }
    else if (newDir && !delayTimer) { const elapsed = Date.now() - scrollDirStart; if (elapsed >= DELAY) { if (scrollDir === 'down') hideHeader(); else if (scrollDir === 'up') showHeader(); } else { delayTimer = setTimeout(() => { if (scrollDir === 'down') hideHeader(); else if (scrollDir === 'up') showHeader(); delayTimer = null; }, DELAY - elapsed); } }
    lastScrollY = currY;
  });
}

// ==== footer 이미지 흔들림 ====
function footerImgShake() {
  document.querySelectorAll('.footer-image').forEach(img => { if (!img.classList.contains('shake-x')) img.classList.add('shake-x'); });
}

// ==== "먹물" Confetti 효과 함수 (업데이트됨) ====
function triggerInkConfetti(originX, originY) {
  const particleCount = 5;
  const C_BLACK = getComputedStyle(document.documentElement).getPropertyValue('--black').trim() || '#000000';
  const C_GRAY_DARK = getComputedStyle(document.documentElement).getPropertyValue('--gray-dark').trim() || '#222222';
  const C_GRAY = getComputedStyle(document.documentElement).getPropertyValue('--gray').trim() || '#555555';
  const inkColors = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#2C2C2C', '#0A0A0A', '#111111', '#202020'];
  const irregularBorderRadii = [
      '45% 58% 62% 37% / 52% 38% 67% 49%', '62% 64% 58% 60% / 70% 50% 70% 50%',
      '54% 42% 62% 57% / 54% 42% 62% 47%', '62% 68% 60% 56% / 70% 60% 70% 50%',
      '63% 38% 70% 33% / 53% 62% 39% 46%', '65% 70% 65% 68% / 75% 54% 74% 50%',
      '48% 56% 35% 38% / 54% 42% 62% 47%', '66% 75% 65% 70% / 66% 55% 66% 60%',
      '30% 70% 70% 30% / 30% 30% 70% 70%', '50% 50% 30% 70% / 60% 40% 60% 40%',
      '35% 65% 45% 55% / 60% 30% 70% 40%', '70% 30% 80% 20% / 65% 35% 75% 25%'
  ];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('confetti-particle');
    particle.style.backgroundColor = inkColors[Math.floor(Math.random() * inkColors.length)];
    let width, height;
    const sizeMultiplier = Math.random() * 2.5 + 2;
    const type = Math.random();
    if (type < 0.35) {
        const baseSize = (Math.random() * 10 + 8) * sizeMultiplier * 0.5;
        width = baseSize * (0.8 + Math.random() * 0.4);
        height = baseSize * (0.8 + Math.random() * 0.4);
        particle.style.borderRadius = `${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% / ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}% ${Math.random() * 20 + 40}%`;
    } else if (type < 0.75) {
        const baseWidth = (Math.random() * 12 + 7) * sizeMultiplier * 0.6;
        const baseHeight = (Math.random() * 9 + 5) * sizeMultiplier * 0.6;
        width = baseWidth;
        height = baseHeight;
        particle.style.borderRadius = irregularBorderRadii[Math.floor(Math.random() * irregularBorderRadii.length)];
    } else {
        const dotSize = (Math.random() * 5 + 3) * sizeMultiplier * 0.4;
        width = dotSize;
        height = dotSize;
        particle.style.borderRadius = '50%';
        particle.style.opacity = (Math.random() * 0.3 + 0.65).toString();
    }
    particle.style.width = `${Math.max(2, width)}px`;
    particle.style.height = `${Math.max(2, height)}px`;
    document.body.appendChild(particle);
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 60;
    const duration = Math.random() * 1.2 + 1.8;
    const initialRotation = Math.random() * 360;
    const finalRotation = initialRotation + (Math.random() * 240 - 120);
    const initialOpacity = parseFloat(particle.style.opacity || '0.9');
    const maxBlur = 6 + Math.random() * 4;
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.transform = `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`;
    particle.style.filter = 'blur(0.5px)';
    particle.animate([
      { transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, opacity: initialOpacity, filter: 'blur(0.9px)' },
      { transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.03) rotate(${finalRotation}deg)`, opacity: 0, filter: `blur(${maxBlur}px)` }
    ], { duration: duration * 1000, easing: 'cubic-bezier(0.12, 0.75, 0.29, 0.99)', fill: 'forwards' });
    setTimeout(() => { particle.remove(); }, duration * 1000);
  }
}

// ==== 화면 클릭 시 잉크 번짐 효과 함수 (새로 추가) ====
function createScreenInkSplash(clickX, clickY, targetElement = document.body) {
    const splash = document.createElement('div');
    splash.classList.add('screen-click-splash-blob');
    const borderRadii = [
        "47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%",
        "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%",
        "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%",
        "54% 61% 67% 63% / 59% 27% 66% 65%", "30% 65% 60% 62% / 60% 39% 60% 68%",
        "61% 63% 35% 57% / 65% 26% 55% 62%",
    ];
    splash.style.borderRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)];
    const C_BLACK = getComputedStyle(document.documentElement).getPropertyValue('--black').trim() || '#000000';
    const C_GRAY_DARK = getComputedStyle(document.documentElement).getPropertyValue('--gray-dark').trim() || '#222222';
    const C_GRAY = getComputedStyle(document.documentElement).getPropertyValue('--gray').trim() || '#555555';
    const inkShades = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#101010'];
    splash.style.backgroundColor = inkShades[Math.floor(Math.random() * inkShades.length)];
    const splashBaseSize = Math.random() * 25 + 2;
    splash.style.width = `${splashBaseSize * (0.9 + Math.random() * 0.1)}px`;
    splash.style.height = `${splashBaseSize * (0.9 + Math.random() * 0.1)}px`;
    splash.style.position = 'fixed';
    splash.style.left = `${clickX}px`;
    splash.style.top = `${clickY}px`;
    splash.style.transform = 'translate(-50%, -50%) scale(0)';
    targetElement.appendChild(splash);
    setTimeout(() => { if (splash.parentElement) splash.remove(); }, 700);
}


// ==== 헤더 메뉴 hover 처리 (수정됨) ====
function navActiveHoverControl() {
  document.querySelectorAll('.nav-menu a').forEach(link => {
    const textWrapper = link.querySelector('.nav-text-wrapper');
    if (!textWrapper) return;

    link.addEventListener('mouseenter', function(event) {
      // If hovering over a link that isn't the truly active one,
      // mark the truly active one as 'was-truly-active' and temporarily remove 'truly-active'
      document.querySelectorAll('.nav-menu a.truly-active').forEach(activeLink => {
        if (activeLink !== this) {
            activeLink.classList.remove('truly-active');
            activeLink.classList.add('was-truly-active');
        }
      });

      this.classList.add('is-splashed'); // Apply hover-specific style

      const hanjaDelay = 200;
      if (this.dataset.hanjaTimeoutId) {
        clearTimeout(parseInt(this.dataset.hanjaTimeoutId));
      }
      // Hanja conversion only on hover
      this.dataset.hanjaTimeoutId = setTimeout(() => {
        const navKey = this.dataset.nav;
        const originalText = this.dataset.originalText;
        if (hanjaMap[navKey] && originalText) {
          const symbolPart = originalText.substring(0, originalText.indexOf(' ') + 1);
          textWrapper.textContent = symbolPart + hanjaMap[navKey];
        }
      }, hanjaDelay);

      const existingLinkSplash = this.querySelector('.ink-splash');
      if (existingLinkSplash) existingLinkSplash.remove();
      
      const linkSplash = document.createElement('span');
      linkSplash.classList.add('ink-splash');
      const rect = this.getBoundingClientRect();
      const linkSplashSize = rect.height * 1.5; 
      linkSplash.style.width = `${linkSplashSize}px`;
      linkSplash.style.height = `${linkSplashSize}px`;
      linkSplash.style.left = `${event.clientX - rect.left - linkSplashSize / 2}px`;
      linkSplash.style.top = `${event.clientY - rect.top - linkSplashSize / 2}px`;
      this.appendChild(linkSplash);
      setTimeout(() => { if(linkSplash.parentElement) linkSplash.remove(); }, 600);

      triggerInkConfetti(event.clientX, event.clientY);
    });

    link.addEventListener('mouseleave', function() {
      if (this.dataset.hanjaTimeoutId) {
        clearTimeout(parseInt(this.dataset.hanjaTimeoutId));
        this.dataset.hanjaTimeoutId = '';
      }
      
      // Always revert to original text when mouse leaves
      if (this.dataset.originalText) {
        textWrapper.textContent = this.dataset.originalText;
      }
      
      this.classList.remove('is-splashed'); // Remove hover-specific style

      // Restore 'truly-active' class to any link that had it temporarily removed
      document.querySelectorAll('.nav-menu a.was-truly-active').forEach(wasActiveLink => {
        wasActiveLink.classList.add('truly-active');
        wasActiveLink.classList.remove('was-truly-active');
      });
      // Ensure the current page link (if it was hovered) still has truly-active if it's the current path
      // This is mostly a fallback, setActiveNav should handle the initial state.
      const currentPathKey = getCurrentPathKey();
      if (this.dataset.nav === currentPathKey && !this.classList.contains('truly-active')) {
          // If it IS the current page and somehow lost truly-active (e.g. if it was hovered itself), re-add it.
          // However, if it's also 'was-truly-active', that logic above will handle it.
          // This check ensures that if the truly active item is hovered and then unhovered, it retains its truly-active state.
          if (!this.classList.contains('was-truly-active')) { // Avoid conflict if it was another item
             this.classList.add('truly-active');
          }
      }
    });
  });
}

// 현재 경로에 따른 네비게이션 키를 반환하는 헬퍼 함수
function getCurrentPathKey() {
    const path = location.pathname;
    if (path.includes('about')) return 'about';
    if (path.includes('experience')) return 'experience';
    if (path.includes('hobby')) return 'hobby';
    if (path.includes('connect')) return 'connect';
    return 'portfolio'; // Default
}


// ==== DOMContentLoaded에서 각 기능 실행 ====
window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.nav-menu')) {
    setActiveNav(); 
    navActiveHoverControl();
  }
  headerScrollEvent();
  footerImgShake();

  document.addEventListener('click', function(event) {
    if (event.target.closest('.nav-menu a, button, input[type="button"], input[type="submit"]')) {
      return;
    }
    createScreenInkSplash(event.clientX, event.clientY, document.body);
  });
});