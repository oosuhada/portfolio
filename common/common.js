document.addEventListener('DOMContentLoaded', function() {
    // --- Preloader Logic ---
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

    // MODIFIED: This ensures the preloader hides correctly,
    // whether or not there's a hero video on the page.
    window.addEventListener('load', () => {
        const heroVideo = document.getElementById('heroVideo');
        if (heroVideo) {
            const onVideoReady = () => {
                hidePreloader();
            };
            if (heroVideo.readyState >= 3) {
                onVideoReady();
            } else {
                heroVideo.addEventListener('canplaythrough', onVideoReady, {
                    once: true
                });
                heroVideo.addEventListener('loadeddata', onVideoReady, {
                    once: true
                });
                heroVideo.addEventListener('error', onVideoReady, {
                    once: true
                }); // Also hide on error
            }
        } else {
            // If no heroVideo element is present, hide the preloader immediately after the 'load' event.
            hidePreloader();
        }
    });

    // --- Hanja Mappings ---
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
        const borderRadii = ["47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%", "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%", "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%", "54% 61% 67% 63% / 59% 27% 66% 65%", "30% 65% 60% 62% / 60% 39% 60% 68%", "61% 63% 35% 57% / 65% 26% 55% 62%"];
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

                // --- 페이지 이동 시 transition 비활성화 ---
                disableAllTransitions();
                // 숏딜레이 후 원래 href로 이동 (브라우저가 transition 없이 바로 페이지 로드하도록)
                setTimeout(() => {
                    window.location.href = link.href;
                }, 10);
                event.preventDefault(); // 기본 링크 동작 막기
                // ------------------------------------
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
    const HEADER_HIDE_CLASS = 'hidden'; // 이 클래스를 활용!

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
            // resize 이벤트는 initializeAccordionMenu에서 단일 관리
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
            const scrollThreshold = this.headerElement.querySelector('.nav-top-row').offsetHeight > 0 ? this.headerElement.querySelector('.nav-top-row').offsetHeight : 60;

            // isInHeroArea일 때는 헤더가 항상 보임 (스크롤 숨김 로직 무시)
            if (isInHeroArea) {
                this.headerElement.classList.remove(HEADER_HIDE_CLASS);
                // 블러는 initializeAccordionMenu가 결정 (여기서 직접 건드리지 않음)
                this.lastScrollY = currentScrollY;
                this.ticking = false;
                return;
            }

            // 데스크톱일 때만 스크롤에 따른 헤더 숨김/보임 로직 적용
            // 모바일일 때는 이 로직은 무시하고, 아코디언 메뉴가 헤더 가시성을 결정
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
        }
    };

    function initSentinelObserver() {
        const sentinel = document.getElementById('top-sentinel');
        const mainHeaderBar = document.querySelector('.nav-header');
        if (!sentinel || !mainHeaderBar) {
            isInHeroArea = false;
            // Sentinel이 없으면 headerScrollLogic이 모든 스크롤 동작을 처리하도록
            // 이때 header-blur-active는 initializeAccordionMenu에서 관리
            if (headerScrollLogic.init) headerScrollLogic.handleScroll(); // 초기 스크롤 상태 반영
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const previousIsInHeroArea = isInHeroArea;
                    isInHeroArea = entry.isIntersecting;
                    if (previousIsInHeroArea !== isInHeroArea) {
                        if (isInHeroArea) {
                            // 히어로 영역 진입 시: 데스크톱이라면 헤더 보임, 모바일은 아코디언이 결정
                            if (window.innerWidth >= 768) { // 데스크톱일 때만 hidden 제거
                                mainHeaderBar.classList.remove(HEADER_HIDE_CLASS);
                            }
                            // 블러는 initializeAccordionMenu가 결정
                        } else {
                            // 히어로 영역 이탈 시: 데스크톱 스크롤 숨김 로직 활성화, 모바일은 아코디언이 결정
                            if (window.innerWidth >= 768) { // 데스크톱일 때만 스크롤 로직 적용
                                headerScrollLogic.lastScrollY = window.scrollY;
                                headerScrollLogic.handleScroll();
                            }
                        }
                    }
                });
            }, {
                root: null,
                threshold: 0.1
            }
        );
        observer.observe(sentinel);
    }

    // --- Highlighter Logic (변경 없음) ---
    let currentlyAssociatedMenuElement = null;
    let highlightMenu = null;
    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    const DRAG_THRESHOLD = 5;

    function getHighlightData() {
        const data = localStorage.getItem('userHighlights');
        return data ? JSON.parse(data) : {};
    }

    function saveHighlightData(data) {
        localStorage.setItem('userHighlights', JSON.stringify(data));
    }

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

    function applyHighlight(element, color) {
        const id = element.dataset.highlightId;
        if (!id) return;
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

    function unHighlightElement(element) {
        const id = element.dataset.highlightId;
        if (!element) return;
        highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
        if (id) {
            const highlights = getHighlightData();
            delete highlights[id];
            saveHighlightData(highlights);
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
                cursor: url('../highlighter.png') 20 20, auto;
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
                        applyHighlight(highlightableTarget, 'yellow');
                    }
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

    // --- Modified Accordion Menu Logic ---
    function initializeAccordionMenu() {
        const navToggleBtn = document.querySelector('.nav-toggle-btn');
        let accordionNavMenu = document.getElementById('accordionNavMenu');
        const headerElement = document.querySelector('.nav-header');

        if (!accordionNavMenu) {
            const tempAccordionNavMenu = document.querySelector('.nav-menu');
            if (tempAccordionNavMenu) {
                accordionNavMenu = tempAccordionNavMenu;
                console.warn("Element with ID 'accordionNavMenu' not found. Using '.nav-menu' instead.");
            } else {
                console.error("Neither element with ID 'accordionNavMenu' nor class '.nav-menu' found.");
                return;
            }
        }

        const path = location.pathname;

        // 헤더 및 메뉴의 상태를 설정하는 핵심 함수
        const setHeaderAndMenuState = () => {
            const isDesktop = window.innerWidth >= 768;
            const isExperienceOrHobby = path.includes('experience') || path.includes('hobby');

            if (isDesktop) {
                if (isExperienceOrHobby) {
                    // 데스크톱 - experience/hobby: 축소 상태
                    accordionNavMenu.classList.remove('expanded');
                    navToggleBtn.classList.remove('active');
                    headerElement.classList.remove('expanded-desktop');
                    headerElement.classList.add('collapsed-desktop');
                    headerElement.classList.remove('expanded-mobile');
                    headerElement.classList.remove(HEADER_HIDE_CLASS); // 데스크톱에서는 hidden 아님
                    // 블러는 데스크톱 축소 시에도 없음
                } else {
                    // 데스크톱 - 일반 페이지: 확장 상태
                    accordionNavMenu.classList.add('expanded');
                    navToggleBtn.classList.add('active');
                    headerElement.classList.add('expanded-desktop');
                    headerElement.classList.remove('collapsed-desktop');
                    headerElement.classList.remove('expanded-mobile');
                    headerElement.classList.remove(HEADER_HIDE_CLASS); // 데스크톱에서는 hidden 아님
                    // 블러 활성화 (header-blur-active)는 CSS에서 header:not(.hidden)에 따라 자동으로 활성화되므로, 굳이 여기서 header-blur-active를 추가할 필요 없음
                }
            } else {
                // 모바일 (초기 상태: 메뉴는 숨겨져 있고, 헤더 전체도 숨겨짐)
                accordionNavMenu.classList.remove('expanded');
                navToggleBtn.classList.remove('active');
                headerElement.classList.remove('expanded-desktop');
                headerElement.classList.remove('collapsed-desktop');
                headerElement.classList.remove('expanded-mobile');
                headerElement.classList.add(HEADER_HIDE_CLASS); // 모바일에서 메뉴 닫혔을 때 헤더 숨기기
                // 블러도 hidden 클래스에 의해 자동 비활성화됨
            }
            // 모든 경우에 공통으로 스타일 초기화 (width, height)
            // CSS에서 처리되도록 맡김
        };

        // 초기 로드 시 상태 설정
        setHeaderAndMenuState();

        if (navToggleBtn && accordionNavMenu && headerElement) {
            navToggleBtn.addEventListener('click', () => {
                const isCurrentlyExpanded = accordionNavMenu.classList.contains('expanded');
                const isDesktopView = window.innerWidth >= 768;

                accordionNavMenu.classList.toggle('expanded');
                navToggleBtn.classList.toggle('active');

                if (isDesktopView) {
                    if (isCurrentlyExpanded) { // 데스크톱에서 현재 확장 -> 축소
                        headerElement.classList.remove('expanded-desktop');
                        headerElement.classList.add('collapsed-desktop');
                        headerElement.classList.remove(HEADER_HIDE_CLASS); // 데스크톱 축소는 hidden 아님
                    } else { // 데스크톱에서 현재 축소 -> 확장
                        headerElement.classList.remove('collapsed-desktop');
                        headerElement.classList.add('expanded-desktop');
                        headerElement.classList.remove(HEADER_HIDE_CLASS); // 데스크톱 확장도 hidden 아님
                    }
                    // CSS에서 width, height 관리
                } else { // 모바일
                    if (isCurrentlyExpanded) { // 모바일에서 현재 확장 -> 축소
                        headerElement.classList.add(HEADER_HIDE_CLASS); // 헤더 숨기기
                        headerElement.classList.remove('expanded-mobile');
                    } else { // 모바일에서 현재 축소 -> 확장
                        headerElement.classList.remove(HEADER_HIDE_CLASS); // 헤더 보이기
                        headerElement.classList.add('expanded-mobile');
                    }
                    // CSS에서 height, width 관리
                }
            });

            accordionNavMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (event) => {
                    const isDesktopView = window.innerWidth >= 768;
                    if (!isDesktopView) { // 모바일에서 링크 클릭 시 메뉴 닫기
                        accordionNavMenu.classList.remove('expanded');
                        navToggleBtn.classList.remove('active');
                        headerElement.classList.add(HEADER_HIDE_CLASS); // 헤더 숨기기
                        headerElement.classList.remove('expanded-mobile');
                    }
                    // --- 페이지 이동 시 transition 비활성화 ---
                    disableAllTransitions();
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 10);
                    event.preventDefault();
                    // ------------------------------------
                });
            });

            document.addEventListener('click', (e) => {
                const isDesktopView = window.innerWidth >= 768;
                // 모바일에서 확장된 상태이고, 헤더 외부를 클릭했을 때
                if (!isDesktopView &&
                    accordionNavMenu.classList.contains('expanded') &&
                    !headerElement.contains(e.target) &&
                    !e.target.closest('#highlight-menu')) {
                    accordionNavMenu.classList.remove('expanded');
                    navToggleBtn.classList.remove('active');
                    headerElement.classList.add(HEADER_HIDE_CLASS); // 헤더 숨기기
                    headerElement.classList.remove('expanded-mobile');
                }
            });

            // 리사이즈 이벤트 리스너 수정
            window.addEventListener('resize', () => {
                setHeaderAndMenuState(); // 리사이즈 시에도 상태를 다시 설정합니다.
            });
        }
    }

    // --- Transition 비활성화 함수 ---
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

    // --- Initialize Functions ---
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
    initializeAccordionMenu(); // 가장 마지막에 호출되어 모든 헤더 상태를 최종적으로 결정하도록 함

    document.addEventListener('click', function(event) {
        if (isDragging || event.target.closest('a, button, input, .no-general-splash, #highlight-menu, .meaning-chunk, .timeline-chunk, .skill-chunk')) {
            return;
        }
        createScreenInkSplash(event.clientX, event.clientY, document.body, 0.1);
    });
});