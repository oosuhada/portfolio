document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 선택 (Selectors) ---
    const westernThemeBtn = document.getElementById('pen-theme-btn'); // Western theme (front image)
    const easternThemeBtn = document.getElementById('brush-theme-btn'); // Eastern theme (front image)
    const penStyleBtn = document.getElementById('pen-style-indicator-btn'); // Pen cursor
    const brushStyleBtn = document.getElementById('brush-style-indicator-btn'); // Brush cursor
    const langEnBtn = document.getElementById('lang-en-btn'); // English language
    const langKoBtn = document.getElementById('lang-ko-btn'); // Korean language
    const fontSizeSmallBtn = document.getElementById('font-size-small');
    const fontSizeMediumBtn = document.getElementById('font-size-medium');
    const fontSizeLargeBtn = document.getElementById('font-size-large');

    const postcardFronts = document.querySelectorAll('.postcard-front');
    const postcardBack = document.getElementById('main-postcard-back');
    const formInputs = postcardBack.querySelectorAll('input[type="text"], input[type="email"], textarea');
    const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
    const bodyElement = document.body;
    const footerElement = document.querySelector('footer');
    const brushStyleIcon = brushStyleBtn.querySelector('i'); // Icon element for brush button

    // --- 2. 상태 변수 (State Variables) ---
    let currentFrontTheme = 'western';
    let currentCursorStyle = 'pen';
    let currentLang = 'en';

    // --- 3. 핵심 기능 함수 (Core Functions) ---

    /**
     * 카드 앞면의 테마(이미지)를 변경합니다.
     * @param {string} theme - 'western' 또는 'eastern'
     */
    function applyFrontTheme(theme) {
        currentFrontTheme = theme;
        postcardFronts.forEach(front => {
            front.classList.toggle('hidden', !front.classList.contains(theme + '-theme'));
        });
        westernThemeBtn.classList.toggle('active', theme === 'western');
        easternThemeBtn.classList.toggle('active', theme === 'eastern');
        localStorage.setItem('oosuPortfolioFrontTheme', theme);
    }

    /**
     * 폼 입력 필드의 커서 스타일을 변경하고 brush 버튼 아이콘을 업데이트합니다.
     * @param {string} style - 'pen' 또는 'brush'
     */
    function applyCursorStyle(style) {
        currentCursorStyle = style;
        formInputs.forEach(input => {
            input.classList.remove('pen-cursor', 'brush-cursor');
            input.classList.add(`${style}-cursor`);
        });
        penStyleBtn.classList.toggle('active', style === 'pen');
        brushStyleBtn.classList.toggle('active', style === 'brush');
        
        // Update brush button icon
        if (brushStyleIcon) {
            brushStyleIcon.style.backgroundImage = style === 'brush' 
                ? 'url("brushwhite.png")' 
                : 'url("brushblack.png")';
        }
        
        localStorage.setItem('oosuPortfolioCursorStyle', style);
    }

    /**
     * 지정된 언어(en/ko)로 페이지의 텍스트를 변경합니다.
     * @param {string} lang - 'en' 또는 'ko'
     */
    function applyLanguage(lang) {
        currentLang = lang;
        langDataElements.forEach(el => {
            const textKey = `data-lang-${lang}`;
            if (el.hasAttribute(textKey)) {
                // Preserve HTML structure (e.g., links in footer)
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
    }

    /**
     * 페이지 전체의 폰트 크기를 조절합니다.
     * @param {string} size - 'small', 'medium', 'large'
     */
    function applyFontSize(size) {
        bodyElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        bodyElement.classList.add(`font-size-${size}`);
        fontSizeSmallBtn.classList.toggle('active', size === 'small');
        fontSizeMediumBtn.classList.toggle('active', size === 'medium');
        fontSizeLargeBtn.classList.toggle('active', size === 'large');
        localStorage.setItem('oosuPortfolioFontSize', size);
    }

    // --- 4. 이벤트 리스너 연결 (Event Listeners) ---
    westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
    easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));
    fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    // --- 5. 페이지 로드 시 초기 설정 적용 (Initialization) ---
    const savedFrontTheme = localStorage.getItem('oosuPortfolioFrontTheme') || 'western';
    const savedCursorStyle = localStorage.getItem('oosuPortfolioCursorStyle') || 'pen';
    const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

    applyFrontTheme(savedFrontTheme);
    applyCursorStyle(savedCursorStyle);
    applyLanguage(savedLang);
    applyFontSize(savedFontSize);

    // --- 폼 제출 및 애니메이션 관련 로직 ---
    function animatePostcardFrames(callback) {
        const frontImageToAnimate = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
        if (!frontImageToAnimate) {
            if (callback) callback();
            return;
        }
        const basePath = `${currentFrontTheme}/`;
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

     // --- 폼 제출 및 애니메이션 관련 로직 ---
     const form = document.getElementById('inquiry-form');
     if (form) {
         // 에러 메시지 정의
         const errorMessages = {
             en: {
                 valueMissing: 'This field is required.',
                 typeMismatch: 'Please enter a valid email address.',
             },
             ko: {
                 valueMissing: '필수 입력 항목입니다.',
                 typeMismatch: '올바른 이메일 주소를 입력해주세요.',
             }
         };
 
         // 폼 필드 유효성 검사 함수
         const validateField = (field) => {
             const errorMessageElement = field.nextElementSibling;
             let message = '';
 
             if (field.validity.valueMissing) {
                 message = errorMessages[currentLang].valueMissing;
             } else if (field.validity.typeMismatch) {
                 message = errorMessages[currentLang].typeMismatch;
             }
 
             if (message) {
                 field.classList.add('invalid');
                 errorMessageElement.textContent = message;
                 errorMessageElement.classList.add('visible');
                 return false;
             } else {
                 field.classList.remove('invalid');
                 errorMessageElement.classList.remove('visible');
                 return true;
             }
         };
 
         // 실시간 유효성 검사 (사용자가 입력할 때마다)
         form.querySelectorAll('input[required], textarea[required]').forEach(field => {
             field.addEventListener('input', () => {
                 // 사용자가 입력을 시작하면 유효성 상태를 다시 체크
                 validateField(field);
             });
         });
 
         form.addEventListener('submit', (e) => {
             e.preventDefault(); // 폼 자동 제출 방지
 
             let isFormValid = true;
             form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                 if (!validateField(field)) {
                     isFormValid = false;
                 }
             });
 
             if (!isFormValid) {
                 return; // 폼이 유효하지 않으면 여기서 중단
             }

             // 모든 것이 유효하면 엽서 떨어지는 애니메이션 실행
            animatePostcardFrames(() => {
                const postcardRect = postcardBack.getBoundingClientRect();
                const postcardClone = postcardBack.cloneNode(true);
                postcardClone.style.position = 'fixed';
                postcardClone.style.left = `${postcardRect.left}px`;
                postcardClone.style.top = `${postcardRect.top}px`;
                postcardClone.style.width = `${postcardRect.width}px`;
                postcardClone.style.height = `${postcardRect.height}px`;
                postcardClone.style.margin = '0';
                postcardClone. Destinations = '0';
                postcardClone.style.zIndex = '1001';
                document.body.appendChild(postcardClone);

                postcardBack.style.visibility = 'hidden';
                postcardClone.classList.add('postcard-falling-3d');

                setTimeout(() => {
                    footerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 800);

                postcardClone.addEventListener('animationend', () => {
                    postcardClone.remove();
                    postcardBack.style.visibility = 'visible';
                    form.reset();
                    form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                        input.style.borderBottomColor = '';
                    });

                    const frontImageToReset = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
                    if (frontImageToReset) {
                        frontImageToReset.src = `${currentFrontTheme}/ezgif-frame-001.jpg`;
                    }
                });
            });
        });
    }
});