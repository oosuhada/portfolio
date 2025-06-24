document.addEventListener('DOMContentLoaded', () => {

    // --- 1. THEME MANAGEMENT (Dark/Light Mode) ---
    function initThemeManager() {
        const themeToggleButton = document.getElementById('theme-toggle-btn');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');

        if (!themeToggleButton) return;

        const applyTheme = (theme) => {
            document.body.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                sunIcon?.classList.add('hidden');
                moonIcon?.classList.remove('hidden');
            } else {
                sunIcon?.classList.remove('hidden');
                moonIcon?.classList.add('hidden');
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

    // --- 2. HEADER VISIBILITY OBSERVER (UPDATED) ---
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
        }
    }

    // --- 3. GSAP & ANIMATION INITIALIZATION ---
    function initAnimations() {
        if (typeof gsap === 'undefined') {
            console.error("GSAP not loaded!");
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
        
        const sections = ['#highlight-hub-section', '#postcard-section'];
        sections.forEach(sec => {
            gsap.to(sec, {
                scrollTrigger: {
                    trigger: sec,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                opacity: 1,
                y: 0,
                duration: 1.2,
                ease: 'power3.out'
            });
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

        if (!westernThemeBtn) return;

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
                field.addEventListener('input', () => window.validateField(field));
                field.addEventListener('blur', () => window.validateField(field));
            });

            inquiryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isFormValid = Array.from(inquiryForm.querySelectorAll('[required]')).every(field => window.validateField(field));
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
    initThemeManager();
    initHeaderObserver();
    initAnimations();
    initPostcardSection();
});