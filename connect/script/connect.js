// connect.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 선택 ---
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
    const formInputs = postcardBack.querySelectorAll('input[type="text"], input[type="email"], textarea');
    const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
    const bodyElement = document.body;
    const inquiryForm = document.getElementById('inquiry-form');
    const footerElement = document.querySelector('footer');

    // --- 2. 상태 변수 ---
    let currentFrontTheme = 'western';
    let currentCursorStyle = 'pen';
    let currentLang = 'en';

    // --- 3. 핵심 기능 함수 (엽서 컨트롤) ---
    function applyFrontTheme(theme) {
        currentFrontTheme = theme;
        postcardFronts.forEach(front => {
            front.classList.toggle('hidden', !front.classList.contains(theme + '-theme'));
        });
        westernThemeBtn.classList.toggle('active', theme === 'western');
        easternThemeBtn.classList.toggle('active', theme === 'eastern');
        localStorage.setItem('oosuPortfolioFrontTheme', theme);
    }

    function applyCursorStyle(style) {
        currentCursorStyle = style;
        formInputs.forEach(input => {
            input.classList.remove('pen-cursor', 'brush-cursor');
            input.classList.add(`${style}-cursor`);
        });
        penStyleBtn.classList.toggle('active', style === 'pen');
        brushStyleBtn.classList.toggle('active', style === 'brush');
        localStorage.setItem('oosuPortfolioCursorStyle', style);
    }

    function applyLanguage(lang) {
        currentLang = lang;
        langDataElements.forEach(el => {
            const textKey = `data-lang-${lang}`;
            if (el.hasAttribute(textKey)) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = el.getAttribute(textKey) || '';
                } else if (el.tagName === 'BUTTON' && el.type === 'submit') {
                    el.textContent = el.getAttribute(textKey) || el.textContent;
                } else {
                    el.innerHTML = el.getAttribute(textKey) || el.innerHTML;
                }
            }
        });
        langEnBtn.classList.toggle('active', lang === 'en');
        langKoBtn.classList.toggle('active', lang === 'ko');
        localStorage.setItem('oosuPortfolioLang', lang);

        // 언어 변경 시 허브의 텍스트도 변경하도록 커스텀 이벤트 발생
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

    // --- 4. 이벤트 리스너 연결 ---
    westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
    easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));
    fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    // --- 5. 엽서 제출 애니메이션 및 폼 로직 ---
    function animatePostcardFrames(callback) {
        const frontImageToAnimate = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
        if (!frontImageToAnimate) {
            if (callback) callback();
            return;
        }

        const basePath = `img/${currentFrontTheme}/`;
        const frameCount = currentFrontTheme === 'western' ? 43 : 49;
        const framePrefix = 'ezgif-frame-';
        const frameSuffix = '.jpg';
        const animationSpeed = 60;

        let currentFrame = 1;

        function showNextFrame() {
            if (currentFrame <= frameCount) {
                frontImageToAnimate.src = `${basePath}${framePrefix}${String(currentFrame).padStart(3, '0')}${frameSuffix}`;
                currentFrame++;
                setTimeout(showNextFrame, animationSpeed);
            } else {
                if (callback) callback();
            }
        }
        showNextFrame();
    }

    if (inquiryForm) {
        inquiryForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('input', () => { window.validateField && window.validateField(field); });
            field.addEventListener('blur', () => { window.validateField && window.validateField(field); });
        });

        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isFormValid = true;
            inquiryForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (window.validateField && !window.validateField(field)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) return;

            animatePostcardFrames(() => {
                const postcardRect = postcardBack.getBoundingClientRect();
                const postcardClone = postcardBack.cloneNode(true);
                postcardClone.style.position = 'fixed';
                postcardClone.style.left = `${postcardRect.left}px`;
                postcardClone.style.top = `${postcardRect.top}px`;
                postcardClone.style.width = `${postcardRect.width}px`;
                postcardClone.style.height = `${postcardRect.height}px`;
                postcardClone.style.margin = '0';
                postcardClone.style.padding = '0';
                postcardClone.style.zIndex = '1001';
                document.body.appendChild(postcardClone);
                postcardBack.style.visibility = 'hidden';
                postcardClone.classList.add('postcard-falling-3d');
                setTimeout(() => footerElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 800);
                postcardClone.addEventListener('animationend', () => {
                    postcardClone.remove();
                    postcardBack.style.visibility = 'visible';
                    inquiryForm.reset();
                    inquiryForm.querySelectorAll('input.invalid, textarea.invalid').forEach(el => el.classList.remove('invalid'));
                    const frontImageToReset = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
                    if (frontImageToReset) {
                        frontImageToReset.src = `img/${currentFrontTheme}/ezgif-frame-001.jpg`;
                    }
                });
            });
        });
    }

    // --- 6. 페이지 로드 시 초기 설정 적용 ---
    const savedFrontTheme = localStorage.getItem('oosuPortfolioFrontTheme') || 'western';
    const savedCursorStyle = localStorage.getItem('oosuPortfolioCursorStyle') || 'pen';
    const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

    applyFrontTheme(savedFrontTheme);
    applyCursorStyle(savedCursorStyle);
    applyLanguage(savedLang);
    applyFontSize(savedFontSize);
});