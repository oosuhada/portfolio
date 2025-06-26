// navigation.js

const languageMaps = [
    { name: 'hanja', portfolio: '作品', about: '紹介', career: '經歷', lab: '實驗室', connect: '連結' },
    { name: 'korean', portfolio: '포트폴리오', about: '소개', career: '경력', lab: '실험실', connect: '연결' },
    { name: 'french', portfolio: 'Portefeuille', about: 'À propos', career: 'Parcours', lab: 'Laboratoire', connect: 'Connexion' },
    { name: 'japanese', portfolio: 'ポートフォリオ', about: '紹介', career: 'キャリア', lab: 'ラボ', connect: '接続' }
];
const englishMap = { portfolio: 'Portfolio', about: 'About', career: 'Career', lab: 'Lab', connect: 'Connect' };

let headerEntryCount = 0;
let currentLanguageIndex = 0;
let isInHeroArea = true; // 스크롤이 히어로 영역에 있는지 추적
const HEADER_HIDE_CLASS = 'hidden';

/**
 * 현재 페이지 경로에 따라 활성 내비게이션 링크를 설정합니다.
 * 언어 전환을 위한 원본 텍스트와 영어 텍스트 데이터 속성을 초기화합니다.
 */
function setActiveNav() {
    const path = location.pathname;
    let activePageKey = 'portfolio';
    if (path.includes('about')) activePageKey = 'about';
    else if (path.includes('career')) activePageKey = 'career';
    else if (path.includes('lab')) activePageKey = 'lab';
    else if (path.includes('connect')) activePageKey = 'connect';

    document.querySelectorAll('.nav-menu a').forEach(a => {
        const navKey = a.dataset.nav;
        const textWrapper = a.querySelector('.nav-text-wrapper');

        if (!a.dataset.originalIcon || !a.dataset.englishText) {
            a.dataset.originalIcon = textWrapper ? textWrapper.textContent.trim() : '';
            a.dataset.englishText = englishMap[navKey] || navKey;
            if (textWrapper) {
                textWrapper.textContent = `${a.dataset.originalIcon} ${a.dataset.englishText}`;
            }

            let visuallyHiddenSpan = a.querySelector('.visually-hidden');
            if (!visuallyHiddenSpan) {
                visuallyHiddenSpan = document.createElement('span');
                visuallyHiddenSpan.classList.add('visually-hidden');
                a.appendChild(visuallyHiddenSpan);
            }
            visuallyHiddenSpan.textContent = a.dataset.englishText;
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

/**
 * 내비게이션 링크 호버 효과를 제어합니다 (언어 전환, 잉크 스플래시 포함).
 * `window.createScreenInkSplash` 및 `window.disableAllTransitions`에 의존합니다.
 */
function navActiveHoverControl() {
    const navMenuLinks = document.querySelectorAll('.nav-menu a');
    const navMenuContainer = document.querySelector('.nav-menu.nav-center');
    const headerElement = document.querySelector('.nav-header');

    headerElement.addEventListener('mouseenter', () => {
        headerEntryCount++;
        currentLanguageIndex = (headerEntryCount - 1) % languageMaps.length;
    });

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
            const currentLanguageMap = languageMaps[currentLanguageIndex];

            if (currentLanguageMap[navKey] && this.dataset.originalIcon) {
                textWrapper.textContent = `${this.dataset.originalIcon} ${currentLanguageMap[navKey]}`;
            }
            // window.createScreenInkSplash 사용
            if (window.createScreenInkSplash) {
                window.createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 3);
            }
        });

        link.addEventListener('mouseleave', function() {
            if (this.dataset.originalIcon && this.dataset.englishText) {
                textWrapper.textContent = `${this.dataset.originalIcon} ${this.dataset.englishText}`;
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
            // window.createScreenInkSplash 사용
            if (window.createScreenInkSplash) {
                window.createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 6);
            }

            document.querySelectorAll('.nav-menu a').forEach(l => delete l.dataset.skipHoverOnce);
            this.dataset.skipHoverOnce = "true";

            // window.disableAllTransitions 사용
            if (window.disableAllTransitions) {
                window.disableAllTransitions();
            }

            setTimeout(() => {
                window.location.href = link.href;
            }, 10);
            event.preventDefault();
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

/**
 * 현재 페이지의 키(예: 'portfolio', 'about')를 반환합니다.
 * @returns {string} 현재 페이지에 해당하는 키
 */
function getCurrentPathKey() {
    const path = location.pathname;
    if (path.includes('about')) return 'about';
    if (path.includes('career')) return 'career';
    if (path.includes('lab')) return 'lab';
    if (path.includes('connect')) return 'connect';
    return 'portfolio';
}

/**
 * 스크롤 방향과 위치에 따라 헤더 가시성을 관리하는 로직입니다.
 */
const headerScrollLogic = {
    lastScrollY: 0,
    delta: 8,
    ticking: false,
    headerElement: null,

    init: function() {
        this.headerElement = document.querySelector('.nav-header');
        if (!this.headerElement) {
            return;
        }
        this.lastScrollY = window.scrollY;
        this.handleScroll();
        window.addEventListener('scroll', () => this.requestTick());
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

        // window.getNavHeaderExpandedState 사용
        if (window.getNavHeaderExpandedState()) {
            this.headerElement.classList.remove(HEADER_HIDE_CLASS);
            this.ticking = false;
            return;
        }

        const currentScrollY = window.scrollY;
        const scrollThreshold = this.headerElement.querySelector('.nav-top-row').offsetHeight > 0 ? this.headerElement.querySelector('.nav-top-row').offsetHeight : 60;

        if (isInHeroArea) {
            this.headerElement.classList.remove(HEADER_HIDE_CLASS);
            this.lastScrollY = currentScrollY;
            this.ticking = false;
            return;
        }

        if (window.innerWidth >= 500) {
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
        }

        this.lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        this.ticking = false;

        if (window.orchestrateHeaderVisibility) {
            window.orchestrateHeaderVisibility();
        }
    }
};

/**
 * 사용자가 히어로 영역에 있는지 감지하는 Intersection Observer를 초기화합니다.
 */
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
                        if (window.innerWidth >= 500) {
                            mainHeaderBar.classList.remove(HEADER_HIDE_CLASS);
                        }
                    } else {
                        if (window.innerWidth >= 500) {
                            headerScrollLogic.lastScrollY = window.scrollY;
                            headerScrollLogic.handleScroll();
                        }
                    }
                }
                if (window.orchestrateHeaderVisibility) {
                    window.orchestrateHeaderVisibility();
                }
            });
        }, {
            root: null,
            threshold: 0.1
        }
    );
    observer.observe(sentinel);
}

/**
 * 모바일 및 데스크톱용 아코디언 내비게이션 메뉴 기능을 초기화합니다.
 * `window.disableAllTransitions`에 의존합니다.
 */
function initializeAccordionMenu() {
    const navToggleBtn = document.querySelector('.nav-toggle-btn');
    let accordionNavMenu = document.getElementById('accordionNavMenu');
    const headerElement = document.querySelector('.nav-header');

    if (!accordionNavMenu) {
        const tempAccordionNavMenu = document.querySelector('.nav-menu');
        if (tempAccordionNavMenu) {
            accordionNavMenu = tempAccordionNavMenu;
        } else {
            console.error("Neither element with ID 'accordionNavMenu' nor class '.nav-menu' found.");
            return;
        }
    }

    const path = location.pathname;

    const setHeaderAndMenuState = () => {
        const isDesktop = window.innerWidth >= 500;
        const isCollapsedPage = path.includes('career') || path.includes('lab') || path.includes('connect');

        if (isDesktop) {
            if (isCollapsedPage) {
                accordionNavMenu.classList.remove('expanded');
                navToggleBtn.classList.remove('active');
                headerElement.classList.remove('expanded-desktop');
                headerElement.classList.add('collapsed-desktop');
                headerElement.classList.remove('expanded-mobile');
                headerElement.classList.remove(HEADER_HIDE_CLASS);
            } else {
                accordionNavMenu.classList.add('expanded');
                navToggleBtn.classList.add('active');
                headerElement.classList.add('expanded-desktop');
                headerElement.classList.remove('collapsed-desktop');
                headerElement.classList.remove('expanded-mobile');
                headerElement.classList.remove(HEADER_HIDE_CLASS);
            }
        } else {
            accordionNavMenu.classList.remove('expanded');
            navToggleBtn.classList.remove('active');
            headerElement.classList.remove('expanded-desktop');
            headerElement.classList.remove('collapsed-desktop');
            headerElement.classList.remove('expanded-mobile');
            headerElement.classList.add(HEADER_HIDE_CLASS);
        }
        if (window.orchestrateHeaderVisibility) {
            window.orchestrateHeaderVisibility();
        }
    };

    setHeaderAndMenuState();

    if (navToggleBtn && accordionNavMenu && headerElement) {
        navToggleBtn.addEventListener('click', () => {
            const isCurrentlyExpanded = accordionNavMenu.classList.contains('expanded');
            const isDesktopView = window.innerWidth >= 768;

            accordionNavMenu.classList.toggle('expanded');
            navToggleBtn.classList.toggle('active');

            if (isDesktopView) {
                if (isCurrentlyExpanded) {
                    headerElement.classList.remove('expanded-desktop');
                    headerElement.classList.add('collapsed-desktop');
                    headerElement.classList.remove(HEADER_HIDE_CLASS);
                } else {
                    headerElement.classList.remove('collapsed-desktop');
                    headerElement.classList.add('expanded-desktop');
                    headerElement.classList.remove(HEADER_HIDE_CLASS);
                }
            } else {
                if (isCurrentlyExpanded) {
                    headerElement.classList.add(HEADER_HIDE_CLASS);
                    headerElement.classList.remove('expanded-mobile');
                } else {
                    headerElement.classList.remove(HEADER_HIDE_CLASS);
                    headerElement.classList.add('expanded-mobile');
                }
            }
            if (window.orchestrateHeaderVisibility) {
                window.orchestrateHeaderVisibility();
            }
        });

        accordionNavMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (event) => {
                const isDesktopView = window.innerWidth >= 500;
                if (!isDesktopView) {
                    accordionNavMenu.classList.remove('expanded');
                    navToggleBtn.classList.remove('active');
                    headerElement.classList.add(HEADER_HIDE_CLASS);
                    headerElement.classList.remove('expanded-mobile');
                }
                if (window.orchestrateHeaderVisibility) {
                    window.orchestrateHeaderVisibility();
                }
                // window.disableAllTransitions 사용
                if (window.disableAllTransitions) {
                    window.disableAllTransitions();
                }
                setTimeout(() => {
                    window.location.href = link.href;
                }, 10);
                event.preventDefault();
            });
        });

        document.addEventListener('click', (e) => {
            const isDesktopView = window.innerWidth >= 500;
            if (!isDesktopView &&
                accordionNavMenu.classList.contains('expanded') &&
                !headerElement.contains(e.target) &&
                !e.target.closest('#highlight-menu')) {
                accordionNavMenu.classList.remove('expanded');
                navToggleBtn.classList.remove('active');
                headerElement.classList.add(HEADER_HIDE_CLASS);
                headerElement.classList.remove('expanded-mobile');
                if (window.orchestrateHeaderVisibility) {
                    window.orchestrateHeaderVisibility();
                }
            }
        });

        window.addEventListener('resize', () => {
            setHeaderAndMenuState();
        });
    }
}

// 내비게이션 관련 모든 초기화 함수를 묶어 common.js에서 한 번에 호출할 수 있도록 노출
window.initializeNavigation = function() {
    initSentinelObserver();
    headerScrollLogic.init();
    if (document.querySelector('.nav-menu')) {
        setActiveNav();
        navActiveHoverControl();
    }
    initializeAccordionMenu();
};