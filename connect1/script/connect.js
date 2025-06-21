document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 요소 선택 (Selectors) ---
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
    const footerElement = document.querySelector('footer');
    const brushStyleIcon = brushStyleBtn.querySelector('i');
    const highlightList = document.querySelector('.highlight-list');
    const unhighlightList = document.querySelector('.unhighlight-list');
    const highlightSection = document.querySelector('.highlight-summary-section');
    const unhighlightSection = document.querySelector('.unhighlight-summary-section');

    // --- 2. 상태 변수 (State Variables) ---
    let currentFrontTheme = 'western';
    let currentCursorStyle = 'pen';
    let currentLang = 'en';

    // --- 3. 핵심 기능 함수 (Core Functions) ---

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
        
        if (brushStyleIcon) {
            brushStyleIcon.style.backgroundImage = style === 'brush' 
                ? 'url("brushwhite.png")' 
                : 'url("brushblack.png")';
        }
        
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
        renderHighlightSummaries();
    }

    // function applyFontSize(size) {
    //     bodyElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    //     bodyElement.classList.add(`font-size-${size}`);
    //     fontSizeSmallBtn.classList.toggle('active', size === 'small');
    //     fontSizeMediumBtn.classList.toggle('active', size === 'medium');
    //     fontSizeLargeBtn.classList.toggle('active', size === 'large');
    //     localStorage.setItem('oosuPortfolioFontSize', size);
    // }

    // --- 4. 하이라이트 요약 렌더링 함수 ---
    function getUnhighlightData() {
        const data = localStorage.getItem('userUnhighlights');
        return data ? JSON.parse(data) : {};
    }
    
    function saveUnhighlightData(data) {
        localStorage.setItem('userUnhighlights', JSON.stringify(data));
    }
    
    function renderHighlightSummaries() {
        const highlights = getHighlightData();
        const unhighlights = getUnhighlightData();

        // Render Highlights, grouped by page
        highlightList.innerHTML = '';
        if (Object.keys(highlights).length === 0) {
            const message = currentLang === 'en' 
                ? 'No highlights yet. Explore the portfolio and mark what stands out!'
                : '아직 하이라이트한 내용이 없습니다. 포트폴리오를 둘러보며 인상 깊은 부분을 체크해보세요!';
            highlightList.innerHTML = `<p class="no-highlights">${message}</p>`;
        } else {
            const pages = [...new Set(Object.values(highlights).map(item => item.page))];
            pages.forEach(page => {
                const pageSection = document.createElement('div');
                pageSection.classList.add('highlight-page-section');
                const pageHeader = document.createElement('h3');
                pageHeader.textContent = page;
                pageSection.appendChild(pageHeader);
                const ul = document.createElement('ul');
                ul.classList.add('highlight-list-page');
                for (const id in highlights) {
                    if (highlights[id].page === page) {
                        const item = highlights[id];
                        const li = document.createElement('li');
                        li.classList.add('highlight-list-item');
                        li.innerHTML = `
                            <span class="color-indicator" style="background-color: var(--highlight-${item.color});"></span>
                            <span class="highlight-text">${item.text}</span>
                            <button class="unhighlight-btn" data-id="${id}" title="Remove highlight">✕</button>
                        `;
                        ul.appendChild(li);
                    }
                }
                pageSection.appendChild(ul);
                highlightList.appendChild(pageSection);
            });
        }
        highlightSection.classList.toggle('active', Object.keys(highlights).length > 0);

        // Render Unhighlights
        unhighlightList.innerHTML = '';
        if (Object.keys(unhighlights).length === 0) {
            const message = currentLang === 'en' 
                ? 'No unhighlighted items yet.'
                : '아직 해제된 하이라이트가 없습니다.';
            unhighlightList.innerHTML = `<li class="unhighlight-list-item">${message}</li>`;
        } else {
            for (const id in unhighlights) {
                const item = unhighlights[id];
                const li = document.createElement('li');
                li.classList.add('unhighlight-list-item');
                li.innerHTML = `
                    <span class="color-indicator" style="background-color: var(--highlight-${item.color});"></span>
                    <span class="unhighlight-text">${item.text}</span>
                    <span class="unhighlight-context">${item.page}</span>
                    <button class="unhighlight-btn" data-id="${id}" title="Permanently delete">✕</button>
                    <button class="restore-highlight-btn" data-id="${id}" title="Restore highlight">Restore</button>
                `;
                unhighlightList.appendChild(li);
            }
        }
        unhighlightSection.classList.toggle('active', Object.keys(unhighlights).length > 0);
    }

    // --- 5. 이벤트 리스너 연결 (Event Listeners) ---
    westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
    easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));
    // fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    // fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    // fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    // Highlight/Unhighlight button listeners
    highlightList.addEventListener('click', (e) => {
        if (e.target.classList.contains('unhighlight-btn')) {
            const id = e.target.dataset.id;
            const element = document.querySelector(`[data-highlight-id="${id}"]`);
            if (element) {
                unHighlightElement(element);
            }
        }
    });

    unhighlightList.addEventListener('click', (e) => {
        if (e.target.classList.contains('unhighlight-btn')) {
            const id = e.target.dataset.id;
            const unhighlights = getUnhighlightData();
            delete unhighlights[id];
            saveUnhighlightData(unhighlights);
            renderHighlightSummaries();
        } else if (e.target.classList.contains('restore-highlight-btn')) {
            const id = e.target.dataset.id;
            const unhighlights = getUnhighlightData();
            const highlights = getHighlightData();
            const element = document.querySelector(`[data-highlight-id="${id}"]`);
            if (unhighlights[id]) {
                highlights[id] = unhighlights[id];
                delete unhighlights[id];
                saveHighlightData(highlights);
                saveUnhighlightData(unhighlights);
                if (element) {
                    applyHighlight(element, highlights[id].color);
                }
                renderHighlightSummaries();
            }
        }
    });

    // --- 6. 페이지 로드 시 초기 설정 적용 (Initialization) ---
    const savedFrontTheme = localStorage.getItem('oosuPortfolioFrontTheme') || 'western';
    const savedCursorStyle = localStorage.getItem('oosuPortfolioCursorStyle') || 'pen';
    const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

    applyFrontTheme(savedFrontTheme);
    applyCursorStyle(savedCursorStyle);
    applyLanguage(savedLang);
    // applyFontSize(savedFontSize);

    // Initial render of highlight summaries
    renderHighlightSummaries();

    // Register renderHighlightSummaries globally for common.js to call
    window.renderHighlightSummaries = renderHighlightSummaries;

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

    const form = document.getElementById('inquiry-form');
    if (form) {
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

        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('input', () => {
                validateField(field);
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let isFormValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (!validateField(field)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                return;
            }

            // Append highlighted content to the message
            const messageField = form.querySelector('#message');
            const highlights = getHighlightData();
            let highlightedContent = '';
            if (Object.keys(highlights).length > 0) {
                highlightedContent = currentLang === 'en' ? '\n\nHighlighted Content:\n' : '\n\n하이라이트된 내용:\n';
                const pages = [...new Set(Object.values(highlights).map(item => item.page))];
                pages.forEach(page => {
                    highlightedContent += `${page}:\n`;
                    for (const id in highlights) {
                        if (highlights[id].page === page) {
                            highlightedContent += `- ${highlights[id].text}\n`;
                        }
                    }
                });
            }
            const originalMessage = messageField.value;
            messageField.value = originalMessage + highlightedContent;

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

                setTimeout(() => {
                    footerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 800);

                postcardClone.addEventListener('animationend', () => {
                    postcardClone.remove();
                    postcardBack.style.visibility = 'visible';
                    form.reset();
                    form.querySelectorAll('input.invalid, textarea.invalid').forEach(el => {
                        el.classList.remove('invalid');
                    });
                    form.querySelectorAll('.error-message.visible').forEach(el => {
                        el.classList.remove('visible');
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