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
        textWrapper.textContent = a.dataset.originalText; // Reset to original on updates
    }

    if (a.dataset.nav === activePageKey) {
      a.classList.add('truly-active');
      a.classList.remove('active'); 
    } else {
      a.classList.remove('truly-active');
      a.classList.remove('active');
    }
  });
}

// ==== footer 이미지 흔들림 ====
function footerImgShake() {
  document.querySelectorAll('.footer-image').forEach(img => { if (!img.classList.contains('shake-x')) img.classList.add('shake-x'); });
}

// ==== "먹물" Confetti 효과 함수 ==== (Commented out)
/* function triggerInkConfetti(originX, originY) { ... } */

// ==== 화면 클릭 시 잉크 번짐 효과 함수 ====
function createScreenInkSplash(clickX, clickY, targetElement = document.body, scaleFactor = 1.0) {
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
    
    const baseMinSize = 60; // Current base min size for scaleFactor 1.0
    const baseRangeSize = 20; // Current base additional random size for scaleFactor 1.0
    
    const splashBaseSize = (Math.random() * baseRangeSize + baseMinSize) * scaleFactor;
    
    splash.style.width = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`; 
    splash.style.height = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`;

    splash.style.position = 'fixed';
    splash.style.left = `${clickX}px`;
    splash.style.top = `${clickY}px`;
    splash.style.transform = 'translate(-50%, -50%) scale(0)'; 
    targetElement.appendChild(splash);
    setTimeout(() => { if (splash.parentElement) splash.remove(); }, 700);
}

// ==== 헤더 메뉴 hover 및 click 처리 ====
function navActiveHoverControl() {
  const navMenuLinks = document.querySelectorAll('.nav-menu a');
  const navMenuContainer = document.querySelector('.nav-menu.nav-center'); 

  navMenuLinks.forEach(link => {
    const textWrapper = link.querySelector('.nav-text-wrapper');
    if (!textWrapper) return;

    link.addEventListener('mouseenter', function(event) {
      if (this.classList.contains('truly-active') && this.dataset.skipHoverOnce === "true") {
        return;
      }
      document.querySelectorAll('.nav-menu a.truly-active').forEach(activeLink => {
        if (activeLink !== this) {
            activeLink.classList.remove('truly-active');
            activeLink.classList.add('was-truly-active');
        }
      });
      this.classList.add('is-splashed');
      const navKey = this.dataset.nav;
      const originalText = this.dataset.originalText;
      if (hanjaMap[navKey] && originalText) {
        const symbolPart = originalText.substring(0, originalText.indexOf(' ') + 1);
        textWrapper.textContent = symbolPart + hanjaMap[navKey];
      }
      // MODIFIED: Hover splash size reduced to 1/3 of its previous (SF 1.0 -> SF 1/3)
      createScreenInkSplash(event.clientX, event.clientY, document.body, 1/3); 
    });

    link.addEventListener('mouseleave', function() {
      if (this.dataset.originalText) {
        textWrapper.textContent = this.dataset.originalText;
      }
      this.classList.remove('is-splashed');
      document.querySelectorAll('.nav-menu a.was-truly-active').forEach(wasActiveLink => {
        wasActiveLink.classList.add('truly-active');
        wasActiveLink.classList.remove('was-truly-active');
      });
      const currentPathKey = getCurrentPathKey();
      if (this.dataset.nav === currentPathKey && !this.classList.contains('truly-active')) {
          if (!this.classList.contains('was-truly-active')) { 
             this.classList.add('truly-active');
          }
      }
    });

    link.addEventListener('click', function(event) {
        // MODIFIED: Click splash size reduced (SF 1/2 -> SF 1/6)
        createScreenInkSplash(event.clientX, event.clientY, document.body, 1/6);
        document.querySelectorAll('.nav-menu a').forEach(l => delete l.dataset.skipHoverOnce);
        this.dataset.skipHoverOnce = "true";
    });
  });

  if (navMenuContainer) {
    navMenuContainer.addEventListener('mouseleave', () => {
        const activeSkippingLink = document.querySelector('.nav-menu a.truly-active[data-skip-hover-once="true"]');
        if (activeSkippingLink) {
            delete activeSkippingLink.dataset.skipHoverOnce;
        }
    });
  }
}

function getCurrentPathKey() {
    const path = location.pathname;
    if (path.includes('about')) return 'about';
    if (path.includes('experience')) return 'experience';
    if (path.includes('hobby')) return 'hobby';
    if (path.includes('connect')) return 'connect';
    return 'portfolio'; // Default
}

// ===== HEADER AND MENU SCROLL LOGIC =====
let isInHeroArea = true; 
// MODIFIED: This class will now be applied to .nav-header
const HEADER_HIDE_CLASS = 'hidden'; // Changed from MENU_HIDE_CLASS and value from 'hide'

const headerScrollLogic = { // Renamed from navMenuScrollLogic for clarity
    lastScrollY: 0,
    delta: 8, 
    ticking: false,
    headerElement: null, // Renamed from navMenuElement

    init: function() {
        // MODIFIED: Target the entire .nav-header
        this.headerElement = document.querySelector('.nav-header'); 
        if (!this.headerElement) {
            console.warn('headerScrollLogic: .nav-header not found.');
            return;
        }
        this.lastScrollY = window.scrollY;
        // Initial check, especially if page loads scrolled past hero
        this.handleScroll(); 

        window.addEventListener('scroll', () => this.requestTick());
        window.addEventListener('resize', () => this.requestTick()); 
    },

    requestTick: function() {
        if (!this.ticking) {
            window.requestAnimationFrame(this.handleScroll.bind(this));
            this.ticking = true;
        }
    },

    handleScroll: function() {
        if (!this.headerElement) {
            this.ticking = false;
            return;
        }

        const currentScrollY = window.scrollY;
        // Use a fixed value or a small portion of header height for the threshold,
        // as headerHeight itself changes if it's part of the scrolled element (not in this setup).
        const scrollThreshold = this.headerElement.offsetHeight > 0 ? this.headerElement.offsetHeight : 60;


        if (isInHeroArea) {
            // If in hero area, observer ensures header is visible.
            this.headerElement.classList.remove(HEADER_HIDE_CLASS);
            this.lastScrollY = currentScrollY; // Update scrollY 
            this.ticking = false;
            return;
        }

        // Only apply scroll logic if NOT in hero area
        if (Math.abs(currentScrollY - this.lastScrollY) <= this.delta && currentScrollY > scrollThreshold) {
             this.ticking = false;
             return; // Not enough scroll
        }
        
        if (currentScrollY > this.lastScrollY && currentScrollY > scrollThreshold) { // Scrolled down
            this.headerElement.classList.add(HEADER_HIDE_CLASS);
        } else { // Scrolled up or near top (but still past hero)
            if (currentScrollY < this.lastScrollY || currentScrollY <= scrollThreshold) {
                 this.headerElement.classList.remove(HEADER_HIDE_CLASS);
            }
        }
        this.lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        this.ticking = false;
    }
};

function initSentinelObserver() {
    const sentinel = document.getElementById('top-sentinel');
    const mainHeaderBar = document.querySelector('.nav-header'); // This is the element to control

    if (!sentinel || !mainHeaderBar) {
        console.warn('Sentinel or mainHeaderBar not found for IntersectionObserver.');
        isInHeroArea = false; 
        headerScrollLogic.handleScroll(); 
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                const previousIsInHeroArea = isInHeroArea;
                isInHeroArea = entry.isIntersecting;

                if (previousIsInHeroArea !== isInHeroArea) { 
                    if (isInHeroArea) {
                        // Entered hero area (scrolled to top)
                        mainHeaderBar.classList.remove(HEADER_HIDE_CLASS); 
                    } else {
                        // Exited hero area (scrolled down past sentinel)
                        // Let headerScrollLogic decide immediately based on current scroll.
                        headerScrollLogic.lastScrollY = window.scrollY; 
                        headerScrollLogic.handleScroll(); 
                    }
                }
            });
        },
        { root: null, threshold: 0.1 } // Adjust threshold as needed
    );

    observer.observe(sentinel);

    // Initial check in case IntersectionObserver is slow or page loads scrolled
    const sentinelRect = sentinel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // A basic check if it's roughly outside viewport (sentinel is below header)
    // If sentinel's top is already above viewport top, we've scrolled past it.
     if (sentinelRect.top < 0) { 
         if (isInHeroArea) { // if default was true but it's actually not visible
            isInHeroArea = false;
            headerScrollLogic.lastScrollY = window.scrollY;
            headerScrollLogic.handleScroll();
         }
    } else { // Sentinel is in view or below viewport top (likely at page top)
        if (!isInHeroArea) { // If default was false but it should be true
            isInHeroArea = true;
            mainHeaderBar.classList.remove(HEADER_HIDE_CLASS);
        }
    }
}


// ==== DOMContentLoaded에서 각 기능 실행 ====
window.addEventListener('DOMContentLoaded', () => {
    initSentinelObserver(); 
    headerScrollLogic.init(); // MODIFIED to use renamed logic object

    if (document.querySelector('.nav-menu')) {
        setActiveNav(); 
        navActiveHoverControl(); 
    }
    footerImgShake();

    document.addEventListener('click', function(event) {
        if (event.target.closest('.nav-menu a, button, input[type="button"], input[type="submit"], .no-general-splash')) {
            return;
        }
        // Global click splash size remains 0.1
        createScreenInkSplash(event.clientX, event.clientY, document.body, 0.1);
    });
});