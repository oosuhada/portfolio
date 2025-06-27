// postcard.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
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
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageTextarea = document.getElementById('message');

    // --- 2. INITIALIZATION ---
    if (!westernThemeBtn || !easternThemeBtn || !postcardBack) {
        console.warn("Postcard section elements not found. Postcard logic not fully initialized.");
        return;
    }

    // --- 3. EVENT LISTENERS FOR FORM INPUTS ---
    if (nameInput) nameInput.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));
    if (emailInput) emailInput.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));
    if (messageTextarea) messageTextarea.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));

    // --- 4. THEME & STYLE HANDLERS ---
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

    // --- 5. FORM VALIDATION & SUBMISSION ---
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

    // --- 6. EVENT LISTENERS ---
    westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
    easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));
    fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    // --- 7. INITIALIZATION ---
    applyFrontTheme(localStorage.getItem('oosuPortfolioFrontTheme') || 'western');
    applyCursorStyle(localStorage.getItem('oosuPortfolioCursorStyle') || 'pen');
    applyLanguage(localStorage.getItem('oosuPortfolioLang') || 'en');
    applyFontSize(localStorage.getItem('oosuPortfolioFontSize') || 'medium');
});