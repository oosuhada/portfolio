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
  let activePageKey = 'portfolio';
  if (path.includes('about')) activePageKey = 'about';
  else if (path.includes('experience')) activePageKey = 'experience';
  else if (path.includes('hobby')) activePageKey = 'hobby';
  else if (path.includes('connect')) activePageKey = 'connect';

  document.querySelectorAll('.nav-menu a').forEach(a => {
    if (!a.dataset.originalText) {
      a.dataset.originalText = a.textContent;
      const textContent = a.textContent;
      a.innerHTML = '';
      const textWrapper = document.createElement('span');
      textWrapper.classList.add('nav-text-wrapper');
      textWrapper.textContent = textContent;
      a.appendChild(textWrapper);
    }
    const textWrapper = a.querySelector('.nav-text-wrapper');
    if (textWrapper && a.dataset.originalText) {
      textWrapper.textContent = a.dataset.originalText;
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

function footerImgShake() {
  document.querySelectorAll('.footer-image').forEach(img => {
    if (!img.classList.contains('shake-x')) img.classList.add('shake-x');
  });
}

function createScreenInkSplash(clickX, clickY, targetElement = document.body, scaleFactor = 1.0) {
    const splash = document.createElement('div');
    splash.classList.add('screen-click-splash-blob');
    const borderRadii = ["47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%", "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%", "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%", "54% 61% 67% 63% / 59% 27% 66% 65%", "30% 65% 60% 62% / 60% 39% 60% 68%", "61% 63% 35% 57% / 65% 26% 55% 62%", ];
    splash.style.borderRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)];
    const C_BLACK = getComputedStyle(document.documentElement).getPropertyValue('--black').trim() || '#000000';
    const C_GRAY_DARK = getComputedStyle(document.documentElement).getPropertyValue('--gray-dark').trim() || '#222222';
    const C_GRAY = getComputedStyle(document.documentElement).getPropertyValue('--gray').trim() || '#555555';
    const inkShades = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#101010'];
    splash.style.backgroundColor = inkShades[Math.floor(Math.random() * inkShades.length)];
    const baseMinSize = 60;
    const baseRangeSize = 20;
    const splashBaseSize = (Math.random() * baseRangeSize + baseMinSize) * scaleFactor;
    splash.style.width = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`;
    splash.style.height = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`;
    splash.style.position = 'fixed';
    splash.style.left = `${clickX}px`;
    splash.style.top = `${clickY}px`;
    splash.style.transform = 'translate(-50%, -50%) scale(0)';
    targetElement.appendChild(splash);
    setTimeout(() => {
      if (splash.parentElement) splash.remove();
    }, 700);
}

function navActiveHoverControl() {
    const navMenuLinks = document.querySelectorAll('.nav-menu a');
    const navMenuContainer = document.querySelector('.nav-menu.nav-center');
    navMenuLinks.forEach(link => {
        const textWrapper = link.querySelector('.nav-text-wrapper');
        if (!textWrapper) return;
        link.addEventListener('mouseenter', function(event) {
            if (this.classList.contains('truly-active') && this.dataset.skipHoverOnce === "true") return;
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
            createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 3);
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
            createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 6);
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
    return 'portfolio';
}

let isInHeroArea = true;
const HEADER_HIDE_CLASS = 'hidden';

const headerScrollLogic = {
    lastScrollY: 0,
    delta: 8,
    ticking: false,
    headerElement: null,
    init: function() {
        this.headerElement = document.querySelector('.nav-header');
        if (!this.headerElement) { return; }
        this.lastScrollY = window.scrollY;
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
        if (!this.headerElement) { this.ticking = false; return; }
        const currentScrollY = window.scrollY;
        const scrollThreshold = this.headerElement.offsetHeight > 0 ? this.headerElement.offsetHeight : 60;
        if (isInHeroArea) {
            this.headerElement.classList.remove(HEADER_HIDE_CLASS);
            this.lastScrollY = currentScrollY;
            this.ticking = false;
            return;
        }
        if (Math.abs(currentScrollY - this.lastScrollY) <= this.delta && currentScrollY > scrollThreshold) {
            this.ticking = false;
            return;
        }
        if (currentScrollY > this.lastScrollY && currentScrollY > scrollThreshold) {
            this.headerElement.classList.add(HEADER_HIDE_CLASS);
        } else {
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
  const mainHeaderBar = document.querySelector('.nav-header');
  if (!sentinel || !mainHeaderBar) {
      isInHeroArea = false;
      if (headerScrollLogic.init) headerScrollLogic.handleScroll();
      return;
  }
  const observer = new IntersectionObserver(
      (entries) => {
          entries.forEach(entry => {
              const previousIsInHeroArea = isInHeroArea;
              isInHeroArea = entry.isIntersecting;
              if (previousIsInHeroArea !== isInHeroArea) {
                  if (isInHeroArea) {
                      mainHeaderBar.classList.remove(HEADER_HIDE_CLASS);
                      // [수정됨] experience 페이지의 override 클래스도 함께 제거
                      mainHeaderBar.classList.remove('experience-header-hidden-override');
                  } else {
                      headerScrollLogic.lastScrollY = window.scrollY;
                      headerScrollLogic.handleScroll();
                  }
              }
          });
      }, { root: null, threshold: 0.1 }
  );
  observer.observe(sentinel);
}

// =======================================================
// ==== 하이라이터 및 팝업 메뉴 기능 (좌표 점프 문제 해결) ====
// =======================================================

let currentlyAssociatedMenuElement = null;
let highlightMenu = null;
const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];

let isDragging = false;
let startX = 0;
let startY = 0;
const DRAG_THRESHOLD = 5;

function createHighlightMenu() {
    if (document.getElementById('highlight-menu')) return;
    const menu = document.createElement('div');
    menu.id = 'highlight-menu';
    menu.innerHTML = `
        <div class="drag-handle" title="Drag to move">::</div>
        <div class="color-palette">
            ${highlightColors.map(color => `<div class="color-swatch" data-color="${color}" title="${color}"></div>`).join('')}
        </div>
    `;
    document.body.appendChild(menu);
    highlightMenu = menu;

    menu.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch && currentlyAssociatedMenuElement) {
            const newColor = swatch.dataset.color;
            applyHighlight(currentlyAssociatedMenuElement, newColor);
            updateActiveColor(currentlyAssociatedMenuElement); // 색상 변경 후 메뉴 UI도 업데이트
        }
    });

    makeMenuDraggable(menu);
}

function makeMenuDraggable(menuElement) {
    const dragHandle = menuElement.querySelector('.drag-handle');
    let offsetX, offsetY;
    dragHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        isDragging = true; startX = e.clientX; startY = e.clientY;
        offsetX = e.clientX - menuElement.getBoundingClientRect().left;
        offsetY = e.clientY - menuElement.getBoundingClientRect().top;
        menuElement.style.transition = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    function onMouseMove(e) {
        e.preventDefault();
        const x = e.clientX + window.scrollX - offsetX;
        const y = e.clientY + window.scrollY - offsetY;
        menuElement.style.left = `${x}px`;
        menuElement.style.top = `${y}px`;
    }
    function onMouseUp(e) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        const diffX = Math.abs(e.clientX - startX);
        const diffY = Math.abs(e.clientY - startY);
        if (diffX < DRAG_THRESHOLD && diffY < DRAG_THRESHOLD) { isDragging = false; }
        setTimeout(() => { isDragging = false; }, 50);
        if (menuElement.style.transition === 'none') { menuElement.style.transition = ''; }
    }
}

function applyHighlight(element, color) {
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    element.classList.add(`highlight-${color}`);
}

function unHighlightElement(element) {
    if (!element) return;
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
}

function hideMenu() {
    if (highlightMenu) {
        highlightMenu.style.display = 'none';
    }
}

/**
 * [신규] 활성화된 하이라이트 색상을 메뉴에 반영하는 헬퍼 함수
 */
function updateActiveColor(targetElement) {
    if (!highlightMenu || !targetElement) return;
    const currentColor = highlightColors.find(c => targetElement.classList.contains(`highlight-${c}`)) || 'yellow';
    highlightMenu.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    const activeSwatch = highlightMenu.querySelector(`.color-swatch[data-color="${currentColor}"]`);
    if (activeSwatch) activeSwatch.classList.add('active');
}


/**
 * [수정됨] 메뉴가 화면에 보일 경우 위치를 고정하는 로직 추가
 * @param {HTMLElement} targetElement - 하이라이트 대상 요소
 * @param {MouseEvent} clickEvent - 메뉴를 표시하게 한 원본 클릭 이벤트
 */
function showMenu(targetElement, clickEvent) {
    if (!highlightMenu || !clickEvent) return;

    // [핵심 로직] 메뉴가 이미 화면에 보이는지 확인
    const menuRect = highlightMenu.getBoundingClientRect();
    const isMenuVisibleOnScreen = highlightMenu.style.display === 'flex' &&
                                 menuRect.top < window.innerHeight && // 메뉴 상단이 뷰포트 하단보다 위에 있고
                                 menuRect.bottom > 0;                 // 메뉴 하단이 뷰포트 상단보다 아래에 있는 경우

    if (isMenuVisibleOnScreen) {
        // 메뉴가 이미 화면에 보이면 위치를 바꾸지 않고, 활성 색상만 업데이트
        updateActiveColor(targetElement);
        return; // 여기서 함수 종료
    }

    // [기존 로직] 메뉴가 숨겨져 있거나 화면 밖에 있을 경우, 초기 위치에 표시
    const menuLeft = window.scrollX + clickEvent.clientX - (highlightMenu.offsetWidth / 2);
    const menuTop = window.scrollY + clickEvent.clientY - 100; // 클릭 위치보다 100px 위

    highlightMenu.style.left = `${menuLeft < 5 ? 5 : menuLeft}px`;
    highlightMenu.style.top = `${menuTop}px`;
    highlightMenu.style.display = 'flex';

    updateActiveColor(targetElement);
}

function initializeHighlighter() {
    createHighlightMenu();
    const targetSelector = '.meaning-chunk, .timeline-chunk, .skill-chunk';

    document.body.addEventListener('click', (e) => {
        if (isDragging) {
            return;
        }

        const highlightableTarget = e.target.closest(targetSelector);
        const menuClicked = e.target.closest('#highlight-menu');

        if (menuClicked) {
            // 메뉴 내부(색상 스와치) 클릭 시 하이라이트 색상 적용 후 종료
            if(e.target.closest('.color-swatch') && currentlyAssociatedMenuElement) {
                applyHighlight(currentlyAssociatedMenuElement, e.target.dataset.color);
                updateActiveColor(currentlyAssociatedMenuElement);
            }
            return;
        }

        if (highlightableTarget) {
            const isAlreadyHighlighted = highlightColors.some(c => highlightableTarget.classList.contains(`highlight-${c}`));
            
            // 이전에 연결된 요소와 다른 요소를 클릭했고, 메뉴가 보이는 상태면
            // 메뉴 위치는 그대로 두고 연결된 요소만 변경
            if (currentlyAssociatedMenuElement !== highlightableTarget && highlightMenu.style.display === 'flex') {
                 currentlyAssociatedMenuElement = highlightableTarget;
                 if(!isAlreadyHighlighted) applyHighlight(highlightableTarget, 'yellow');
                 showMenu(highlightableTarget, e);
                 return;
            }

            if (isAlreadyHighlighted) {
                unHighlightElement(highlightableTarget);
                if (highlightableTarget === currentlyAssociatedMenuElement) {
                    hideMenu();
                    currentlyAssociatedMenuElement = null;
                }
            } else {
                applyHighlight(highlightableTarget, 'yellow');
                currentlyAssociatedMenuElement = highlightableTarget;
                showMenu(highlightableTarget, e);
            }
        } else {
            hideMenu();
            currentlyAssociatedMenuElement = null;
        }
    });
}

// ==== DOMContentLoaded에서 각 기능 실행 ====
window.addEventListener('DOMContentLoaded', () => {
    initSentinelObserver();
    headerScrollLogic.init();

    if (document.querySelector('.nav-menu')) {
        setActiveNav();
        navActiveHoverControl();
    }
    if (document.querySelector('.footer-image')) {
        footerImgShake();
    }

    document.addEventListener('click', function(event) {
        if (isDragging || event.target.closest('.nav-menu a, button, input, .no-general-splash, #highlight-menu, .meaning-chunk, .timeline-chunk, .skill-chunk')) {
            return;
        }
        createScreenInkSplash(event.clientX, event.clientY, document.body, 0.1);
    });

    initializeHighlighter();
});