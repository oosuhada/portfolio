// connect.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. THEME MANAGEMENT (Dark/Light Mode) ---
    // 이 함수 정의 전체를 connect.js에서 삭제합니다.
    /*
    function initThemeManager() {
        const themeToggleButton = document.querySelector('.connect-page-header .theme-toggle-button');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');

        if (!themeToggleButton) {
            console.error("Error: Theme toggle button not found. Please check HTML for '.connect-page-header .theme-toggle-button'. Theme manager not initialized.");
            return;
        }
        if (!sunIcon || !moonIcon) {
            console.warn("Warning: Sun or Moon icon not found. Theme toggle visual might not work correctly.");
        }

        const applyTheme = (theme) => {
            document.body.setAttribute('data-theme', theme);
            if (sunIcon && moonIcon) {
                if (theme === 'dark') {
                    sunIcon.classList.add('hidden');
                    moonIcon.classList.remove('hidden');
                } else {
                    sunIcon.classList.remove('hidden');
                    moonIcon.classList.add('hidden');
                }
            }
        };

        const toggleTheme = () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('oosuPortfolioTheme', newTheme);
            applyTheme(newTheme);
        };

        themeToggleButton.addEventListener('click', toggleTheme);

        const savedTheme = localStorage.getItem('oosuPortfolioTheme') || 'light';
        applyTheme(savedTheme);
    }
    */ // initThemeManager 함수 끝

    // --- 2. HEADER VISIBILITY OBSERVER ---
    function initHeaderObserver() {
        const pageHeader = document.getElementById('connect-page-header');
        const heroSection = document.getElementById('hero-section');

        if (pageHeader && heroSection) {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observerCallback = (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        pageHeader.classList.add('hidden');
                    } else {
                        pageHeader.classList.remove('hidden');
                    }
                });
            };

            const heroObserver = new IntersectionObserver(observerCallback, observerOptions);
            heroObserver.observe(heroSection);
        } else {
            console.warn("Header or Hero section not found for observer initialization. Header visibility observer not initialized.");
        }
    }

    // --- 3. GSAP & ANIMATION INITIALIZATION ---
    function initAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollToPlugin === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error("GSAP or its plugins not loaded! Animations will not work.");
            return;
        }
        gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

        document.querySelectorAll('.scroll-down-arrow').forEach(arrow => {
            arrow.addEventListener('click', () => {
                const targetSelector = arrow.dataset.scrollTarget;
                if (targetSelector) {
                    gsap.to(window, {
                        duration: 1.5,
                        scrollTo: { y: targetSelector, offsetY: 70 },
                        ease: 'power3.inOut'
                    });
                }
            });
        });
        
        gsap.to('#highlight-hub-section', {
            scrollTrigger: {
                trigger: '#highlight-hub-section',
                start: 'top 85%', 
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        });

        gsap.to('#ai-assistant-section', {
            scrollTrigger: {
                trigger: '#ai-assistant-section',
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        });

        gsap.to('#postcard-section', {
            scrollTrigger: {
                trigger: '#postcard-section',
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        });

        document.body.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.highlight-card')) {
                gsap.to(e.target, { y: -5, boxShadow: '0 8px 16px rgba(0,0,0,0.1)', duration: 0.3, ease: 'power2.out' });
            }
        }, true);
        document.body.addEventListener('mouseleave', (e) => {
            if (e.target.matches('.highlight-card')) {
                gsap.to(e.target, { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', duration: 0.3, ease: 'power2.out' });
            }
        }, true);
    }

    // --- 4. POSTCARD SECTION LOGIC ---
    function initPostcardSection() {
        const westernThemeBtn = document.getElementById('pen-theme-btn');
        const easternThemeBtn = document.getElementById('brush-theme-btn');
        const penStyleBtn = document.getElementById('pen-style-indicator-btn');
        const brushStyleBtn = document.getElementById('brush-style-indicator-btn');
        const langEnBtn = document.getElementById('lang-en-btn');
        const langKoBtn = document.getElementById('lang-ko-btn');
        const fontSizeSmallBtn = document.getElementById('font-size-small');
        const fontSizeMediumBtn = document.getElementById('font-size-medium');
        const fontSizeLargeBtn = document.getElementById('font-size-large');
        const postcardFronts = document.querySelectorAll('.postcard-front');
        const postcardBack = document.getElementById('main-postcard-back');
        const formInputs = postcardBack.querySelectorAll('input, textarea');
        const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
        const bodyElement = document.body;
        const inquiryForm = document.getElementById('inquiry-form');

        if (!westernThemeBtn || !easternThemeBtn || !postcardBack) {
            console.warn("Postcard section elements (e.g., theme buttons or postcard back) not found. Postcard logic not fully initialized.");
            return;
        }

        function applyFrontTheme(theme) {
            postcardFronts.forEach(front => {
                front.classList.toggle('hidden', !front.classList.contains(theme + '-theme'));
            });
            westernThemeBtn.classList.toggle('active', theme === 'western');
            easternThemeBtn.classList.toggle('active', theme === 'eastern');
            localStorage.setItem('oosuPortfolioFrontTheme', theme);
        }

        function applyCursorStyle(style) {
            formInputs.forEach(input => {
                input.classList.remove('pen-cursor', 'brush-cursor');
                input.classList.add(`${style}-cursor`);
            });
            penStyleBtn.classList.toggle('active', style === 'pen');
            brushStyleBtn.classList.toggle('active', style === 'brush');
            localStorage.setItem('oosuPortfolioCursorStyle', style);
        }

        function applyLanguage(lang) {
            langDataElements.forEach(el => {
                const textKey = `lang${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
                const text = el.dataset[textKey];
                if (text) {
                     if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = text;
                    } else {
                        el.innerHTML = text;
                    }
                }
            });
            langEnBtn.classList.toggle('active', lang === 'en');
            langKoBtn.classList.toggle('active', lang === 'ko');
            localStorage.setItem('oosuPortfolioLang', lang);
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
        }

        function applyFontSize(size) {
            bodyElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
            bodyElement.classList.add(`font-size-${size}`);
            fontSizeSmallBtn.classList.toggle('active', size === 'small');
            fontSizeMediumBtn.classList.toggle('active', size === 'medium');
            fontSizeLargeBtn.classList.toggle('active', size === 'large');
            localStorage.setItem('oosuPortfolioFontSize', size);
        }

        westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
        easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
        penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
        brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
        langEnBtn.addEventListener('click', () => applyLanguage('en'));
        langKoBtn.addEventListener('click', () => applyLanguage('ko'));
        fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
        fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
        fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

        if (inquiryForm) {
            inquiryForm.querySelectorAll('[required]').forEach(field => {
                if (typeof window.validateField === 'function') { 
                    field.addEventListener('input', () => window.validateField(field));
                    field.addEventListener('blur', () => window.validateField(field));
                } else {
                    console.warn("window.validateField is not defined. Form validation may not work.");
                }
            });

            inquiryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isFormValid = true;
                if (typeof window.validateField === 'function') {
                    isFormValid = Array.from(inquiryForm.querySelectorAll('[required]')).every(field => window.validateField(field));
                } else {
                    console.warn("Skipping form validation as window.validateField is not defined.");
                }

                if (!isFormValid) return;

                const postcardClone = postcardBack.cloneNode(true);
                const rect = postcardBack.getBoundingClientRect();
                postcardClone.style.cssText = `position: fixed; left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px; margin: 0; z-index: 1001;`;
                document.body.appendChild(postcardClone);
                postcardBack.style.visibility = 'hidden';

                postcardClone.classList.add('postcard-falling-3d');
                postcardClone.addEventListener('animationend', () => {
                    postcardClone.remove();
                    postcardBack.style.visibility = 'visible';
                    inquiryForm.reset();
                    inquiryForm.querySelectorAll('.error-message.visible').forEach(el => el.classList.remove('visible'));
                });
            });
        }
        
        applyFrontTheme(localStorage.getItem('oosuPortfolioFrontTheme') || 'western');
        applyCursorStyle(localStorage.getItem('oosuPortfolioCursorStyle') || 'pen');
        applyLanguage(localStorage.getItem('oosuPortfolioLang') || 'en');
        applyFontSize(localStorage.getItem('oosuPortfolioFontSize') || 'medium');
    }

    // --- 5. MAIN INITIALIZATION CALL ---
    // initThemeManager(); // 이 줄을 삭제합니다.
    initHeaderObserver();
    initAnimations();
    initPostcardSection();
});