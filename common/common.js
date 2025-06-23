// common.js (수정된 최종본)

// --- 전역 데이터 관리 함수 ---
// 다른 JS 파일 (highlight-hub.js 등)에서 접근할 수 있도록 DOMContentLoaded 이벤트 리스너 밖으로 이동시켰습니다.

/**
 * localStorage에서 하이라이트 데이터를 가져옵니다.
 * @returns {object} 하이라이트 데이터 객체
 */
function getHighlightData() {
    const data = localStorage.getItem('userHighlights');
    return data ? JSON.parse(data) : {};
}

/**
 * 하이라이트 데이터를 localStorage에 저장합니다.
 * @param {object} data - 저장할 하이라이트 데이터 객체
 */
function saveHighlightData(data) {
    localStorage.setItem('userHighlights', JSON.stringify(data));
}

/**
 * localStorage에서 보관된(unhighlighted) 데이터를 가져옵니다.
 * @returns {object} 보관된 하이라이트 데이터 객체
 */
function getUnhighlightData() {
    const data = localStorage.getItem('userUnhighlights');
    return data ? JSON.parse(data) : {};
}

/**
 * 보관된(unhighlighted) 데이터를 localStorage에 저장합니다.
 * @param {object} data - 저장할 보관된 하이라이트 데이터 객체
 */
function saveUnhighlightData(data) {
    localStorage.setItem('userUnhighlights', JSON.stringify(data));
}

/**
 * 요소에 하이라이트를 적용하고 데이터를 저장합니다.
 * @param {HTMLElement} element - 하이라이트를 적용할 DOM 요소
 * @param {string} color - 적용할 색상
 */
function applyHighlight(element, color) {
    const id = element.dataset.highlightId;
    if (!id) return;
    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    element.classList.add(`highlight-${color}`);
    const highlights = getHighlightData();
    highlights[id] = {
        color: color,
        text: element.textContent.trim(),
        page: document.title || location.pathname
    };
    saveHighlightData(highlights);
}

/**
 * 하이라이트를 비활성화하고 '보관함(unhighlights)'으로 옮깁니다. (휴지통 기능)
 * @param {HTMLElement|null} element - DOM 요소 (없을 경우 null)
 * @param {string} highlightId - 하이라이트 ID
 */
function unHighlightElement(element, highlightId) {
    const id = highlightId || (element ? element.dataset.highlightId : null);
    if (!id) return;

    // DOM 요소가 실제로 페이지에 존재하면 스타일을 제거합니다.
    if (element) {
        const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
        highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    }

    const highlights = getHighlightData();
    const unhighlights = getUnhighlightData();

    // 활성 하이라이트 목록에 해당 ID가 있으면 보관함으로 이동시킵니다.
    if (highlights[id]) {
        unhighlights[id] = highlights[id];
        delete highlights[id];

        saveHighlightData(highlights);
        saveUnhighlightData(unhighlights);
    }
}

/**
 * 보관된 하이라이트를 다시 활성화(복구)합니다.
 * @param {string} id - 복구할 하이라이트의 ID
 */
function restoreHighlight(id) {
    const highlights = getHighlightData();
    const unhighlights = getUnhighlightData();

    if (unhighlights[id]) {
        highlights[id] = unhighlights[id]; // 활성 목록으로 데이터 복원
        delete unhighlights[id]; // 보관함에서 데이터 삭제

        saveHighlightData(highlights);
        saveUnhighlightData(unhighlights);
    }
}

/**
 * 보관된 하이라이트를 영구적으로 삭제합니다.
 * @param {string} id - 영구 삭제할 하이라이트의 ID
 */
function deleteUnhighlightPermanently(id) {
    const unhighlights = getUnhighlightData();
    if (unhighlights[id]) {
        delete unhighlights[id];
        saveUnhighlightData(unhighlights);
    }
}


// --- 페이지 로드 후 실행되는 UI 및 이벤트 초기화 로직 ---
document.addEventListener('DOMContentLoaded', function() {
    // --- Existing Preloader Logic ---
    const preloader = document.getElementById("preloader");
    const loadingText = document.getElementById("loadingText");
    const words = ["Oosu", "우수", "佑守", "優秀", "憂愁"];
    let index = 0;

    let textInterval = setInterval(() => {
        if (loadingText) {
            index = (index + 1) % words.length;
            loadingText.textContent = words[index];
        }
    }, 100);

    let preloaderShownAt = null;
    let showPreloaderTimer = null;
    const PRELOADER_SHOW_DELAY = 500;
    const PRELOADER_MIN_SHOW_TIME = 1500;
    const PRELOADER_FADE_OUT_DURATION = 1500;

    showPreloaderTimer = setTimeout(() => {
        if (preloader) {
            preloader.style.display = 'flex';
            preloader.style.opacity = 1;
            preloaderShownAt = Date.now();
        }
    }, PRELOADER_SHOW_DELAY);

    function hidePreloader() {
        clearTimeout(showPreloaderTimer);
        if (!preloaderShownAt) {
            if (preloader) {
                preloader.style.display = "none";
                document.dispatchEvent(new Event('preloaderHidden'));
            }
            if (textInterval) clearInterval(textInterval);
            return;
        }
        const elapsed = Date.now() - preloaderShownAt;
        const timeToWaitBeforeFadeOut = Math.max(0, PRELOADER_MIN_SHOW_TIME - elapsed);
        setTimeout(() => {
            setTimeout(() => {
                if (preloader) {
                    preloader.style.opacity = 0;
                    setTimeout(() => {
                        preloader.style.display = "none";
                        document.dispatchEvent(new Event('preloaderHidden'));
                    }, 500);
                }
                if (textInterval) clearInterval(textInterval);
            }, PRELOADER_FADE_OUT_DURATION);
        }, timeToWaitBeforeFadeOut);
    }

    window.addEventListener('load', () => {
        const heroVideo = document.getElementById('heroVideo');
        if (heroVideo) {
            const onVideoReady = () => {
                hidePreloader();
            };
            if (heroVideo.readyState >= 3) {
                onVideoReady();
            } else {
                heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
                heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
                heroVideo.addEventListener('error', onVideoReady, { once: true });
            }
        } else {
            hidePreloader();
        }
    });

    // --- Language Maps and Navigation Logic ---
   const languageMaps = [
       {
           name: 'hanja',
           portfolio: '作品',
           about: '紹介',
           career: '經歷',
           lab: '實驗室',
           connect: '連結'
       },
       {
           name: 'korean',
           portfolio: '포트폴리오',
           about: '소개',
           career: '경력',
           lab: '실험실',
           connect: '연결'
       },
       {
           name: 'french',
           portfolio: 'Portefeuille',
           about: 'À propos',
           career: 'Parcours',
           lab: 'Laboratoire',
           connect: 'Connexion'
       },
       {
           name: 'japanese',
           portfolio: 'ポートフォリオ',
           about: '紹介',
           career: 'キャリア',
           lab: 'ラボ',
           connect: '接続'
       }
    ];

    const englishMap = {
       portfolio: 'Portfolio',
       about: 'About',
       career: 'Career',
       lab: 'Lab',
       connect: 'Connect'
    };

    let headerEntryCount = 0;
    let currentLanguageIndex = 0;

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

    function footerImgShake() {
        document.querySelectorAll('.footer-image').forEach(img => {
            if (!img.classList.contains('shake-x')) img.classList.add('shake-x');
        });
    }

    // --- Original createScreenInkSplash (for Short Clicks and Navigation) ---
    function createScreenInkSplash(clickX, clickY, targetElement = document.body, scaleFactor = 1.0) {
        const splash = document.createElement('div');
        splash.classList.add('screen-click-splash-blob');
        const borderRadii = [
            "47% 53% 50% 40% / 60% 37% 53% 40%",
            "65% 42% 70% 55% / 70% 68% 46% 51%",
            "60% 60% 45% 55% / 55% 60% 50% 60%",
            "59% 58% 65% 62% / 52% 68% 37% 59%",
            "60% 45% 46% 62% / 95% 62% 62% 58%",
            "55% 66% 33% 55% / 66% 68% 66% 62%",
            "54% 61% 67% 63% / 59% 27% 66% 65%",
            "30% 65% 60% 62% / 60% 39% 60% 68%",
            "61% 63% 35% 57% / 65% 26% 55% 62%"
        ];
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

    // --- Slide Colors from Portfolio ---
    const slideColors = [
        { confetti: ['#000000', '#181818', '#282828', '#0A0A0A', '#111111', '#202020'] },
        { confetti: ['#ff8c42', '#ffaa6e', '#e07b39', '#d2691e', '#ffbf80'] },
        { confetti: ['#d279ee', '#c45eda', '#e89cd2', '#b54bc6', '#f8c390'] },
        { confetti: ['#f78fad', '#e43970', '#fdd090', '#db0567', '#c21d54'] },
        { confetti: ['#6de195', '#4caf50', '#2c5e1a', '#388e3c', '#c4e759'] },
        { confetti: ['#41c7af', '#26a69a', '#155d47', '#54e38e', '#00796b'] },
        { confetti: ['#5583ee', '#1976d2', '#41d8dd', '#0288d1', '#4fc3f7'] },
        { confetti: ['#6cacff', '#2196f3', '#8debff', '#0288d1', '#4fc3f7'] },
        { confetti: ['#a16bfe', '#7b1fa2', '#deb0df', '#8e24aa', '#ab47bc'] },
        { confetti: ['#bc3d2f', '#a16bfe', '#d32f2f', '#c2185b', '#ab47bc'] }
    ];

    // --- createConfettiInkSplash for Mousedown Effect ---
    function createConfettiInkSplash(targetElement, event, confettiColors) {
        const existingSplash = targetElement.querySelector('.confetti-ink-splash');
        if (existingSplash) existingSplash.remove();

        const internalSplash = document.createElement('span');
        internalSplash.classList.add('confetti-ink-splash');

        const rect = targetElement.getBoundingClientRect();
        const splashSize = Math.max(rect.width, rect.height) * 0.02;

        if (targetElement === document.body) {
            internalSplash.style.left = `${event.clientX - splashSize / 2}px`;
            internalSplash.style.top = `${event.clientY - splashSize / 2}px`;
        } else {
            internalSplash.style.left = `${event.clientX - rect.left - splashSize / 2}px`;
            internalSplash.style.top = `${event.clientY - rect.top - splashSize / 2}px`;
        }

        internalSplash.style.width = `${splashSize}px`;
        internalSplash.style.height = `${splashSize}px`;

        const borderRadii = [ "47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%", "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%", "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%", "54% 61% 67% 63% / 59% 27% 66% 65%", "30% 65% 60% 62% / 60% 39% 60% 68%", "61% 63% 35% 57% / 65% 26% 55% 62%" ];
        const randomRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)];
        internalSplash.style.borderRadius = randomRadius;

        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        internalSplash.style.backgroundColor = color;
        targetElement.appendChild(internalSplash);

        setTimeout(() => {
            if (internalSplash.parentElement) internalSplash.remove();
        }, 700);
    }

    // --- createExternalInkParticles for Mousedown Effect ---
    function createExternalInkParticles(originX, originY, confettiColors) {
        const particleCount = 5;
        const irregularBorderRadii = [ '45% 58% 62% 37% / 52% 38% 67% 49%', '62% 64% 58% 60% / 70% 50% 70% 50%', '54% 42% 62% 57% / 54% 42% 62% 47%', '62% 68% 60% 56% / 70% 60% 70% 50%', '63% 38% 70% 33% / 53% 62% 39% 46%', '65% 70% 65% 68% / 75% 54% 74% 50%', '48% 56% 35% 38% / 54% 42% 62% 47%', '66% 75% 65% 70% / 66% 55% 66% 60%', '30% 70% 70% 30% / 30% 30% 70% 70%', '50% 50% 30% 70% / 60% 40% 60% 40%', '35% 65% 45% 55% / 60% 30% 70% 40%', '70% 30% 80% 20% / 65% 35% 75% 25%' ];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('confetti-particle-effect');
            particle.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            particle.style.filter = 'url(#inkParticleSurface)';
            let width, height;
            const sizeMultiplier = 4;
            const randomFactor = Math.random();
            if (randomFactor < 0.6) {
                const baseSize = (Math.random() * 10 + 8) * sizeMultiplier;
                width = baseSize * (0.8 + Math.random() * 0.4);
                height = baseSize * (0.8 + Math.random() * 0.4);
            } else {
                const baseWidth = (Math.random() * 12 + 6) * sizeMultiplier;
                const baseHeight = (Math.random() * 8 + 4) * sizeMultiplier;
                width = baseWidth;
                height = baseHeight;
            }
            particle.style.width = `${width}px`;
            particle.style.height = `${height}px`;
            particle.style.borderRadius = irregularBorderRadii[Math.floor(Math.random() * irregularBorderRadii.length)];
            if (width < 15 && height < 15) {
                particle.style.opacity = (Math.random() * 0.2 + 0.7).toString();
            }
            document.body.appendChild(particle);
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 60 + 40;
            const duration = Math.random() * 1.5 + 2.5;
            const initialRotation = Math.random() * 360;
            const finalRotation = initialRotation + (Math.random() * 30 - 90);
            const initialOpacity = parseFloat(particle.style.opacity || '0.6');
            const maxBlur = 5 + Math.random() * 5;
            particle.style.left = `${originX}px`;
            particle.style.top = `${originY}px`;
            particle.style.transform = `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`;
            particle.animate([ { transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, opacity: initialOpacity, filter: 'blur(0.5px)' }, { transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.05) rotate(${finalRotation}deg)`, opacity: 0, filter: `blur(${maxBlur}px)` } ], { duration: duration * 1000, easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)', fill: 'forwards' });
            setTimeout(() => { particle.remove(); }, duration * 1000);
        }
    }

    // --- Navigation Logic ---
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
                createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 3);
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
                createScreenInkSplash(event.clientX, event.clientY, document.body, 1 / 6);
                document.querySelectorAll('.nav-menu a').forEach(l => delete l.dataset.skipHoverOnce);
                this.dataset.skipHoverOnce = "true";
                disableAllTransitions();
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

    function getCurrentPathKey() {
        const path = location.pathname;
        if (path.includes('about')) return 'about';
        if (path.includes('career')) return 'career';
        if (path.includes('lab')) return 'lab';
        if (path.includes('connect')) return 'connect';
        return 'portfolio';
    }

    let isInHeroArea = true;
    const HEADER_HIDE_CLASS = 'hidden';

    window.getNavHeaderExpandedState = function() {
        const accordionNavMenu = document.getElementById('accordionNavMenu');
        return accordionNavMenu ? accordionNavMenu.classList.contains('expanded') : false;
    };

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
            if (window.innerWidth >= 768) {
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
                            if (window.innerWidth >= 768) {
                                mainHeaderBar.classList.remove(HEADER_HIDE_CLASS);
                            }
                        } else {
                            if (window.innerWidth >= 768) {
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

    // --- Highlighter Logic ---
    let currentlyAssociatedMenuElement = null;
    let highlightMenu = null;
    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    const DRAG_THRESHOLD = 5;

    // 데이터 관리 함수는 전역으로 이동했으므로 여기서는 UI 관련 함수만 남깁니다.
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
                // 이제 전역 함수를 호출합니다.
                applyHighlight(currentlyAssociatedMenuElement, newColor);
                updateActiveColor(currentlyAssociatedMenuElement);
            }
        });
        makeMenuDraggable(menu);
    }

    function makeMenuDraggable(menuElement) {
        const dragHandle = menuElement.querySelector('.drag-handle');
        let offsetX, offsetY;
        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
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
            if (diffX < DRAG_THRESHOLD && diffY < DRAG_THRESHOLD) {
                isDragging = false;
            } else {
                setTimeout(() => {
                    isDragging = false;
                }, 200);
            }
            if (menuElement.style.transition === 'none') {
                menuElement.style.transition = '';
            }
        }
    }

    function hideMenu() {
        if (highlightMenu) {
            highlightMenu.style.display = 'none';
        }
    }

    function updateActiveColor(targetElement) {
        if (!highlightMenu || !targetElement) return;
        const currentColor = highlightColors.find(c => targetElement.classList.contains(`highlight-${c}`)) || 'yellow';
        highlightMenu.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        const activeSwatch = highlightMenu.querySelector(`.color-swatch[data-color="${currentColor}"]`);
        if (activeSwatch) activeSwatch.classList.add('active');
    }

    function showMenu(targetElement, clickEvent) {
        if (!highlightMenu || !clickEvent || isDragging) return;
        const menuRect = highlightMenu.getBoundingClientRect();
        const isMenuVisibleOnScreen =
            highlightMenu.style.display === 'flex' &&
            menuRect.top < window.innerHeight &&
            menuRect.bottom > 0 &&
            menuRect.left < window.innerWidth &&
            menuRect.right > 0;
        if (isMenuVisibleOnScreen && currentlyAssociatedMenuElement === targetElement) {
            updateActiveColor(targetElement);
            return;
        }
        const menuLeft = window.scrollX + clickEvent.clientX - (highlightMenu.offsetWidth / 2);
        const menuTop = window.scrollY + clickEvent.clientY - 100;
        highlightMenu.style.left = `${Math.max(5, menuLeft)}px`;
        highlightMenu.style.top = `${menuTop}px`;
        highlightMenu.style.display = 'flex';
        updateActiveColor(targetElement);
    }

    function applySavedHighlights() {
        // 이제 전역 함수를 호출합니다.
        const highlights = getHighlightData();
        for (const id in highlights) {
            const element = document.querySelector(`[data-highlight-id="${id}"]`);
            if (element) {
                const savedColor = highlights[id].color;
                element.classList.add(`highlight-${savedColor}`);
            }
        }
    }

    function setHighlighterCursorStyle() {
        if (document.getElementById('highlighter-cursor-style')) return;
        const targetSelector = `
            .meaning-chunk[data-highlight-id]:hover,
            .timeline-chunk[data-highlight-id]:hover,
            .skill-chunk[data-highlight-id]:hover,
            .timeline-tag-chunk1[data-highlight-id]:hover,
            .timeline-tag-chunk2[data-highlight-id]:hover
        `;
        const style = document.createElement('style');
        style.id = 'highlighter-cursor-style';
        style.textContent = `
            ${targetSelector} {
                cursor: url('../img/highlighter.png') 20 20, auto;
            }
        `;
        document.head.appendChild(style);
    }

    function initializeHighlighter() {
        createHighlightMenu();
        applySavedHighlights();
        setHighlighterCursorStyle();
        const targetSelector = '.meaning-chunk[data-highlight-id], .timeline-chunk[data-highlight-id], .skill-chunk[data-highlight-id], .timeline-tag-chunk1[data-highlight-id], .timeline-tag-chunk2[data-highlight-id]';
        document.body.addEventListener('click', (e) => {
            if (isDragging || e.target.closest('.drag-handle')) {
                return;
            }
            const highlightableTarget = e.target.closest(targetSelector);
            const menuClicked = e.target.closest('#highlight-menu');
            if (menuClicked && !e.target.closest('.color-swatch')) {
                return;
            }
            if (highlightableTarget) {
                const isAlreadyHighlighted = highlightColors.some(c => highlightableTarget.classList.contains(`highlight-${c}`));
                if (currentlyAssociatedMenuElement !== highlightableTarget) {
                    currentlyAssociatedMenuElement = highlightableTarget;
                    if (!isAlreadyHighlighted) {
                        applyHighlight(highlightableTarget, 'yellow'); // 전역 함수 사용
                    }
                    showMenu(highlightableTarget, e);
                    return;
                }
                if (isAlreadyHighlighted) {
                    unHighlightElement(highlightableTarget); // 전역 함수 사용
                    if (highlightableTarget === currentlyAssociatedMenuElement) {
                        hideMenu();
                        currentlyAssociatedMenuElement = null;
                    }
                } else {
                    applyHighlight(highlightableTarget, 'yellow'); // 전역 함수 사용
                    currentlyAssociatedMenuElement = highlightableTarget;
                    showMenu(highlightableTarget, e);
                }
            } else {
                hideMenu();
                currentlyAssociatedMenuElement = null;
            }
        });
    }

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
            const isDesktop = window.innerWidth >= 768;
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
                    const isDesktopView = window.innerWidth >= 768;
                    if (!isDesktopView) {
                        accordionNavMenu.classList.remove('expanded');
                        navToggleBtn.classList.remove('active');
                        headerElement.classList.add(HEADER_HIDE_CLASS);
                        headerElement.classList.remove('expanded-mobile');
                    }
                    if (window.orchestrateHeaderVisibility) {
                        window.orchestrateHeaderVisibility();
                    }
                    disableAllTransitions();
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 10);
                    event.preventDefault();
                });
            });

            document.addEventListener('click', (e) => {
                const isDesktopView = window.innerWidth >= 768;
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

    function disableAllTransitions() {
        const style = document.createElement('style');
        style.id = 'no-transition-on-exit';
        style.textContent = `
            * {
                transition: none !important;
            }
            body::before {
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // --- Mousedown Confetti Effect Logic ---
    let isMouseDown = false;
    let confettiInterval = null;
    let currentMousedownEvent = null;
    let currentColorSetIndex = 0;
    let mousedownTimeout = null;
    const MOUSEDOWN_DELAY = 300;
    const CONFETTI_INTERVAL = 100;

    function startConfettiEffect(event) {
        if (event.target.closest('a, button, input, .no-general-splash, #highlight-menu, .meaning-chunk, .timeline-chunk, .skill-chunk, .balloon, .fast-text-balloon, .slide-title, .nav-button, .welcome-banner-link, #inboxIconContainer, #darkModeToggleContainer')) {
            return;
        }

        isMouseDown = true;
        currentMousedownEvent = event;

        confettiInterval = setInterval(() => {
            if (isMouseDown && currentMousedownEvent) {
                const currentColors = slideColors[currentColorSetIndex].confetti;
                createConfettiInkSplash(document.body, currentMousedownEvent, currentColors);
                createExternalInkParticles(currentMousedownEvent.clientX, currentMousedownEvent.clientY, currentColors);
                currentColorSetIndex = (currentColorSetIndex + 1) % slideColors.length;
            }
        }, CONFETTI_INTERVAL);
    }

    function stopConfettiEffect() {
        isMouseDown = false;
        currentMousedownEvent = null;
        if (confettiInterval) {
            clearInterval(confettiInterval);
            confettiInterval = null;
        }
        if (mousedownTimeout) {
            clearTimeout(mousedownTimeout);
            mousedownTimeout = null;
        }
    }

    document.addEventListener('mousedown', (event) => {
        if (event.button === 2) return;

        if (mousedownTimeout) {
            clearTimeout(mousedownTimeout);
        }

        mousedownTimeout = setTimeout(() => {
            startConfettiEffect(event);
        }, MOUSEDOWN_DELAY);
    });

    document.addEventListener('mousemove', (event) => {
        if (isMouseDown) {
            currentMousedownEvent = event;
        }
    });

    document.addEventListener('mouseup', () => {
        stopConfettiEffect();
    });

    document.addEventListener('mouseleave', () => {
        stopConfettiEffect();
    });

    // --- 다크 모드 초기화 로직 ---
    const initializeDarkMode = () => {
        const darkModeToggle = document.getElementById('darkModeToggleContainer');
        const htmlElement = document.documentElement;

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }
        };

        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDarkMode = htmlElement.classList.contains('dark');
                if (isDarkMode) {
                    localStorage.setItem('theme', 'light');
                    applyTheme('light');
                } else {
                    localStorage.setItem('theme', 'dark');
                    applyTheme('dark');
                }
            });
        }

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else if (prefersDark) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    };
    
    // --- Initialize All Features ---
    initSentinelObserver();
    headerScrollLogic.init();
    if (document.querySelector('.nav-menu')) {
        setActiveNav();
        navActiveHoverControl();
    }
    if (document.querySelector('.footer-image')) {
        footerImgShake();
    }
    initializeHighlighter();
    initializeAccordionMenu();
    initializeDarkMode();

    // --- Click Handler for Short Clicks ---
    document.addEventListener('click', function(event) {
        if (isDragging || event.target.closest('a, button, input, .no-general-splash, #highlight-menu, .meaning-chunk, .timeline-chunk, .skill-chunk')) {
            return;
        }
        if (!isMouseDown) {
            createScreenInkSplash(event.clientX, event.clientY, document.body, 0.1);
        }
    });
});