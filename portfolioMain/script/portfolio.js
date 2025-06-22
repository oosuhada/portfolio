// portfolio.js

import { projectDetailsHtml, initModalContentInteractions, openModal, closeModal } from './modal.js';

// Global variables for onboarding shared with hero.js
window.onboardingActive = false;
window.guideIndex = 0;
window.guideSteps = [
    {
        msg: "Click 'Oosu'",
        target: '.hover-name',
        sparkle: '#sparkle-name',
        pos: (el) => { return getSectionRect(el) ? { top: getSectionRect(el).top - (guideTooltip?.offsetHeight || 60) - 25, left: getSectionRect(el).left - (guideTooltip?.offsetWidth || 180) - 10 } : { top: 0, left: 0 }; }
    },
    {
        msg: "Double-click the slider text",
        target: '.hero-slider-wrapper',
        sparkle: '',
        pos: (el) => {
            const r = getSectionRect(el);
            const tH = guideTooltip?.offsetHeight || 60;
            const tW = guideTooltip?.offsetWidth || 200;
            let iT = r.bottom - 10;
            let iL = r.left + (r.width / 2) - (tW / 2) - 60;
            if (iL < 10) iL = 10;
            if (iL + tW > window.innerWidth - 10) iL = window.innerWidth - 10 - tW;
            return { top: iT, left: iL };
        },
        requiresDblClick: true
    },
    {
        msg: "Click profile image",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 10; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    },
    {
        msg: "Click profile image again",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top - 20; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    },
    {
        msg: "One more click on image",
        target: '.hover-img',
        sparkle: '#sparkle-img',
        pos: (el) => { const r = getSectionRect(el); const tW = guideTooltip?.offsetWidth || 180; let iT = r.top; let iL = r.left + (el.offsetWidth / 2) - (tW / 2); if (iT < 10) iT = 10; return { top: iT, left: iL }; }
    }
];

document.addEventListener('DOMContentLoaded', function () {
    console.log("[DEBUG] portfolio.js loaded.");

    // Preloader Handling
    function handlePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) {
            console.warn("[DEBUG] Preloader element not found. Skipping preloader handling.");
            document.dispatchEvent(new Event('preloaderHidden'));
            return;
        }

        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.addEventListener('animationend', () => {
                console.log("[DEBUG] Preloader text animation ended.");
                preloader.style.opacity = '0';
                preloader.style.transition = 'opacity 0.6s ease-out';
            });
        } else {
            console.warn("[DEBUG] Loading text element not found. Preloader might not fade out as expected.");
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.6s ease-out';
        }

        preloader.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && preloader.style.opacity === '0') {
                preloader.style.display = 'none';
                console.log("[DEBUG] Preloader fully hidden after transition.");
                document.dispatchEvent(new Event('preloaderHidden'));
            }
        });

        setTimeout(() => {
            if (preloader.style.display !== 'none') {
                console.warn("[DEBUG] Preloader did not hide via animation/transition. Forcing hide.");
                preloader.style.opacity = '0';
                preloader.style.transition = 'opacity 0.6s ease-out';
                setTimeout(() => {
                    if (preloader.style.display !== 'none') {
                        preloader.style.display = 'none';
                        console.log("[DEBUG] Preloader forced hidden and preloaderHidden event dispatched.");
                        document.dispatchEvent(new Event('preloaderHidden'));
                    }
                }, 700);
            }
        }, 4000);
    }

    handlePreloader();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = 'none';

    document.addEventListener('preloaderHidden', function() {
        console.log("[DEBUG] Received preloaderHidden event. Starting main content and onboarding logic.");
        if (mainContent) mainContent.style.display = 'block';

        // Variables
        window.onboardingCompletedSetting = localStorage.getItem('onboardingCompleted');
        const guideOverlay = document.getElementById('guide-overlay');
        const guideTooltip = document.getElementById('guide-tooltip');
        const guideCloseButton = document.querySelector('.guide-close');
        window.cameFromIndex = new URLSearchParams(window.location.search).get('from') === 'index';
        const scrollIcon = document.querySelector('.scroll-indicator');
        const projects = Array.from(document.querySelectorAll('.project'));
        const portfolioSection = document.getElementById('portfolio');
        const footer = document.querySelector('footer');
        const mainLogo = document.getElementById('mainLogo');
        const projectImageAnchors = Array.from(document.querySelectorAll('.project-image'));
        const projectModal = document.getElementById('projectModal');
        const modalContentBody = document.getElementById('modal-content-body');
        const closeModalButton = document.querySelector('.modal .close-button');
        let currentActiveProjectIndex = -1;
        const allMarqueeInnerRows = document.querySelectorAll('.marquee-container .marquee-inner');

        // URL Cleanup
        if (window.cameFromIndex) {
            console.log("[DEBUG] Detected 'from=index' query parameter.");
            let currentSearch = window.location.search;
            currentSearch = currentSearch.replace(/(\?|&)from=index/, '');
            if (currentSearch.startsWith('&')) {
                currentSearch = '?' + currentSearch.substring(1);
            }
            if (currentSearch === '?') currentSearch = '';
            const newUrl = window.location.pathname + currentSearch;
            history.replaceState(null, '', newUrl);
            console.log("[DEBUG] Cleaned URL, new relative URL:", newUrl);
        }

        if (!guideOverlay || !guideTooltip || !guideCloseButton) {
            console.error("[DEBUG] Essential guide elements missing. Onboarding may not work.");
        }
        if (!mainContent) console.warn("[DEBUG] Main content element not found.");

        if (mainLogo) {
            mainLogo.style.display = 'none';
            mainLogo.style.opacity = '0';
        }

        projectImageAnchors.forEach((anchor, index) => {
            const img = anchor.querySelector('img');
            if (img && index < 5) {
                img.src = `projects/project${index + 1}-cover.png`;
            }
        });

        // Functions
        function hideAllSparkles() {
            ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
                const sp = document.querySelector(sel);
                if (sp) sp.style.display = 'none';
            });
        }

        window.showPersistentSparkles = function() {
            console.log("[DEBUG] showPersistentSparkles called");
            const persistentSparkleTargets = [
                { el: '.hover-name', sparkle: '#sparkle-name' },
                { el: '.slider-dot' + '[data-index="0"]', sparkle: '#sparkle-dot' },
                { el: '.hover-img', sparkle: '#sparkle-img' }
            ];
            persistentSparkleTargets.forEach(target => {
                const mainEl = document.querySelector(target.el);
                const spElement = document.querySelector(target.sparkle);
                if (mainEl && spElement) {
                    spElement.style.display = 'inline-block';
                } else {
                    console.warn(`[DEBUG] Persistent sparkle target missing: mainEl ${target.el} or sparkle ${target.sparkle}`);
                }
            });
        };

        window.setUnderline = function(selector, add, extraPx = 0) {
            document.querySelectorAll('.guide-underline').forEach(el => {
                el.classList.remove('guide-underline');
                el.style.setProperty('--underline-extra', '0px');
            });
            if (add && selector) {
                const el = document.querySelector(selector);
                if (el) {
                    el.classList.add('guide-underline');
                    el.style.setProperty('--underline-extra', extraPx + 'px');
                }
            }
        };

        function getSectionRect(el) {
            if (!el) return { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };
            const rect = el.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                bottom: rect.bottom + window.scrollY,
                right: rect.right + window.scrollX,
                height: rect.height,
                width: rect.width
            };
        }

        function setProjectActive(activeIndex) {
            console.log(`[DEBUG] setProjectActive called with index: ${activeIndex}`);
            projects.forEach((project, idx) => {
                const projectInfo = project.querySelector('.project-info');
                const pImageAnchor = project.querySelector('.project-image');
                const viewOverlay = project.querySelector('.view-project-overlay');
                const isActive = idx === activeIndex;

                project.classList.toggle('active', isActive);
                if (projectInfo) {
                    projectInfo.classList.toggle('active', isActive);
                    console.log(`[DEBUG] Project ${idx + 1} projectInfo active: ${isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} projectInfo not found`);
                }
                if (pImageAnchor) {
                    pImageAnchor.classList.toggle('grayscale', !isActive);
                    console.log(`[DEBUG] Project ${idx + 1} pImageAnchor grayscale: ${!isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} pImageAnchor not found`);
                }
                if (viewOverlay) {
                    viewOverlay.classList.toggle('visible', isActive);
                    console.log(`[DEBUG] Project ${idx + 1} viewOverlay visible: ${isActive}`);
                } else {
                    console.warn(`[DEBUG] Project ${idx + 1} viewOverlay not found`);
                }
            });
        }

        function onScroll() {
            console.log("[DEBUG] onScroll triggered. ScrollY:", window.scrollY);
            if (window.onboardingActive || !portfolioSection) {
                console.log("[DEBUG] onScroll skipped: onboardingActive or portfolio missing");
                return;
            }

            const scroll = window.scrollY;
            const windowHeight = window.innerHeight;
            const heroRect = getSectionRect(document.getElementById('hero'));
            console.log(`[DEBUG] heroRect.bottom: ${heroRect.bottom}`);
            let footerTop = footer ? getSectionRect(footer).top : Infinity;
            console.log(`[DEBUG] footerTop: ${footerTop}`);

            const scrollThresholdEnter = heroRect.bottom - (windowHeight * 0.1);
            const scrollThresholdExit = footerTop - (windowHeight * 0.9);

            if (mainLogo) {
                console.log(`[DEBUG] Logo check - scroll: ${scroll}, enter: ${scrollThresholdEnter}, exit: ${scrollThresholdExit}`);
                if (scroll > scrollThresholdEnter && scroll < scrollThresholdExit) {
                    mainLogo.style.display = 'flex';
                    setTimeout(() => mainLogo.style.opacity = '1', 10);
                    mainLogo.classList.add('is-fixed');
                } else {
                    mainLogo.style.opacity = '0';
                    mainLogo.classList.remove('is-fixed');
                    setTimeout(() => {
                        if (mainLogo.style.opacity === '0') {
                            mainLogo.style.display = 'none';
                        }
                    }, 300);
                }
            }

            let newActiveProjectIndex = -1;
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];
                const rect = getSectionRect(project);
                console.log(`[DEBUG] Project ${i + 1} rect.top: ${rect.top}, rect.bottom: ${rect.bottom}, viewport center: ${scroll + windowHeight / 2}`);
                if (scroll + windowHeight / 2 >= rect.top && scroll + windowHeight / 2 < rect.bottom) {
                    newActiveProjectIndex = i;
                    console.log(`[DEBUG] Project ${i + 1} is in view, setting as active`);
                    break;
                }
            }

            if (newActiveProjectIndex !== currentActiveProjectIndex) {
                console.log(`[DEBUG] Changing active project from ${currentActiveProjectIndex + 1} to ${newActiveProjectIndex + 1}`);
                setProjectActive(newActiveProjectIndex);
                currentActiveProjectIndex = newActiveProjectIndex;
            }

            if (newActiveProjectIndex === -1) {
                const inHeroZone = scroll < heroRect.bottom - (windowHeight * 0.2);
                const inFooterZone = footer && (scroll + windowHeight * 0.9 > footerTop);
                console.log(`[DEBUG] No project active. In Hero Zone: ${inHeroZone}, In Footer Zone: ${inFooterZone}`);

                if (inHeroZone || inFooterZone) {
                    if (currentActiveProjectIndex !== -1) {
                        console.log(`[DEBUG] Deactivating all projects due to Hero/Footer zone`);
                        setProjectActive(-1);
                        currentActiveProjectIndex = -1;
                    }
                }
            }
        }

        window.showGuideStep = function(idx) {
            if (!window.guideSteps || idx < 0 || idx >= window.guideSteps.length || !guideTooltip) {
                if (window.guideSteps && idx >= window.guideSteps.length) window.clearGuide(false);
                return;
            }
            const step = window.guideSteps[idx];
            window.setUnderline(null, false);
            window.setSparkleDisplay(idx);
            const targetElement = document.querySelector(step.target);
            if (targetElement && step.pos) {
                guideTooltip.style.display = 'block';
                guideTooltip.style.opacity = "0";
                const pos = step.pos(targetElement);
                guideTooltip.style.top = `${pos.top}px`;
                guideTooltip.style.left = `${pos.left}px`;
                guideTooltip.textContent = step.msg;
                guideTooltip.style.opacity = "1";
            } else {
                if (!targetElement) console.error(`[DEBUG] showGuideStep: Target element '${step.target}' not found for tooltip positioning at step ${idx}.`);
                guideTooltip.style.opacity = "0";
                guideTooltip.style.display = 'none';
            }
        };

        window.setSparkleDisplay = function(guideStepIndex) {
            if (!window.guideSteps) return;
            window.guideSteps.forEach((step, i) => {
                if (step.sparkle) {
                    const spElement = document.querySelector(step.sparkle);
                    if (spElement) spElement.style.display = (i === guideStepIndex ? 'inline-block' : 'none');
                }
            });
            if (guideStepIndex < 0 || guideStepIndex >= window.guideSteps.length) {
                window.guideSteps.forEach(step => {
                    if (step.sparkle) {
                        const spElement = document.querySelector(step.sparkle);
                        if (spElement) spElement.style.display = 'none';
                    }
                });
            }
        };

        window.clearGuide = function(isSkippingOrFinishedEarly = false) {
            console.log(`[DEBUG] clearGuide called. isSkippingOrFinishedEarly: ${isSkippingOrFinishedEarly}`);
            if (guideOverlay) guideOverlay.style.display = "none";
            if (guideCloseButton) guideCloseButton.style.display = "none";
            window.setUnderline(null, false);
            window.setSparkleDisplay(-1);
            window.onboardingActive = false;
            window.guideIndex = 0;
            document.body.classList.remove('no-scroll');

            if (localStorage.getItem('onboardingCompleted') === 'true' || !isSkippingOrFinishedEarly) {
                console.log("[DEBUG] clearGuide: Showing persistent sparkles.");
                window.showPersistentSparkles();
            } else {
                console.log("[DEBUG] clearGuide: Hiding all sparkles.");
                hideAllSparkles();
            }
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            if (!isSkippingOrFinishedEarly || (isSkippingOrFinishedEarly && localStorage.getItem('onboardingCompleted') !== 'true')) {
                console.log("[DEBUG] clearGuide: Setting onboardingCompleted to true in localStorage.");
                localStorage.setItem('onboardingCompleted', 'true');
            }
            setTimeout(() => { onScroll(); }, 100);
        };

        function startGuide() {
            console.log("[DEBUG] startGuide: Attempting to start guide...");
            if (!guideOverlay || !guideTooltip || !guideCloseButton) { return; }
            for (let i = 0; i < window.guideSteps.length; i++) { if (!document.querySelector(window.guideSteps[i].target)) return; }
            if (window.onboardingActive) { return; }
            window.onboardingActive = true;
            window.guideIndex = 0;

            guideOverlay.style.display = "block";
            if (guideCloseButton) guideCloseButton.style.display = 'block';
            if (scrollIcon) { scrollIcon.style.opacity = "0"; scrollIcon.style.pointerEvents = "none"; }

            document.body.classList.add('no-scroll');
            window.scrollTo(0, 0);

            window.showGuideStep(window.guideIndex);
            console.log("[DEBUG] startGuide: Guide started successfully.");
        }

        // Event Listeners
        if (scrollIcon) {
            scrollIcon.addEventListener('click', () => {
                if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'smooth' });
            });
        }

        projectImageAnchors.forEach(pImageAnchor => {
            const overlay = pImageAnchor.querySelector('.view-project-overlay');
            const parentProject = pImageAnchor.closest('.project');
            if (overlay && parentProject) {
                pImageAnchor.addEventListener('mouseenter', () => {
                    if (parentProject.classList.contains('active')) {
                        overlay.style.backgroundColor = parentProject.dataset.projectColor || 'var(--gray-dark)';
                        overlay.style.color = '#fff';
                    }
                });
                pImageAnchor.addEventListener('mouseleave', () => {
                    overlay.style.backgroundColor = '';
                    overlay.style.color = '';
                });
            }
        });

        if (guideOverlay) {
            guideOverlay.addEventListener('click', (e) => {
                if (!window.onboardingActive) return;
                if (e.target === guideTooltip || (guideCloseButton && guideCloseButton.contains(e.target))) {
                    return;
                }
                const currentStepConfig = window.guideSteps[window.guideIndex];
                if (currentStepConfig && currentStepConfig.requiresDblClick) {
                    console.log("[DEBUG] Guide overlay single click ignored for double-click step.");
                    return;
                }
                console.log(`[DEBUG] Guide overlay single click detected for step ${window.guideIndex}. Advancing guide.`);
                window.guideIndex++;
                if (window.guideIndex < window.guideSteps.length) {
                    window.showGuideStep(window.guideIndex);
                } else {
                    window.clearGuide(false);
                }
            });

            guideOverlay.addEventListener('dblclick', (e) => {
                if (!window.onboardingActive) return;
                const currentStepConfig = window.guideSteps[window.guideIndex];
                if (window.guideIndex === 1 && currentStepConfig && currentStepConfig.requiresDblClick) {
                    console.log("[DEBUG] Guide overlay double-click detected for step 1. Advancing guide.");
                    window.guideIndex++;
                    if (window.guideIndex < window.guideSteps.length) {
                        window.showGuideStep(window.guideIndex);
                    } else {
                        window.clearGuide(false);
                    }
                } else {
                    console.log("[DEBUG] Guide overlay double-click ignored for current step or not onboarding.");
                }
            });
        }

        if (guideCloseButton) {
            guideCloseButton.addEventListener('click', () => {
                if (window.onboardingActive) window.clearGuide(true);
            });
        }

        if (guideTooltip) {
            guideTooltip.addEventListener('click', (e) => e.stopPropagation());
        }

        projectImageAnchors.forEach(anchor => {
            anchor.addEventListener('click', function (event) {
                event.preventDefault();
                const projectId = this.dataset.projectId;
                if (projectId) {
                    openModal(projectId, this);
                } else {
                    console.warn("[DEBUG] Project ID not found for the clicked anchor.");
                }
            });
        });

        if (mainLogo) {
            mainLogo.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        if (allMarqueeInnerRows.length >= 4) {
            allMarqueeInnerRows[0].style.animation = 'marquee-scroll-rtl-fast 20s linear infinite';
            allMarqueeInnerRows[1].style.animation = 'marquee-scroll-ltr-medium 25s linear infinite';
            allMarqueeInnerRows[2].style.animation = 'marquee-scroll-rtl-slow 30s linear infinite';
            allMarqueeInnerRows[3].style.animation = 'marquee-scroll-ltr-v_slow 35s linear infinite';

            allMarqueeInnerRows.forEach(row => {
                row.addEventListener('mouseenter', () => {
                    row.classList.add('paused');
                });
                row.addEventListener('mouseleave', () => {
                    row.classList.remove('paused');
                });
            });
        }

        // Initialize Onboarding
        if (!window.onboardingCompletedSetting || window.cameFromIndex) {
            console.log("[DEBUG] Starting onboarding guide due to onboardingCompleted=false or cameFromIndex=true.");
            startGuide();
        } else {
            console.log("[DEBUG] Onboarding already completed, showing persistent sparkles.");
            window.showPersistentSparkles();
            if (scrollIcon) {
                scrollIcon.style.opacity = "1";
                scrollIcon.style.pointerEvents = "auto";
            }
            setTimeout(() => onScroll(), 100);
        }

        // Scroll and Resize Handling
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            if (window.onboardingActive) {
                window.showGuideStep(window.guideIndex);
            }
            onScroll();
        });
    });
});