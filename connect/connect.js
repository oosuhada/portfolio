document.addEventListener('DOMContentLoaded', () => {
    // Theme Buttons (Now in floating-menu1, using original IDs for JS compatibility)
    const penThemeBtn = document.getElementById('pen-theme-btn'); // Points to the "Western" theme button in floating-menu1
    const brushThemeBtn = document.getElementById('brush-theme-btn'); // Points to the "Eastern" theme button in floating-menu1

    // Language Buttons (in floating-menu2)
    const langEnBtn = document.getElementById('lang-en-btn');
    const langKoBtn = document.getElementById('lang-ko-btn');

    // Font Size Buttons (in floating-menu2)
    const fontSizeSmallBtn = document.getElementById('font-size-small');
    const fontSizeMediumBtn = document.getElementById('font-size-medium');
    const fontSizeLargeBtn = document.getElementById('font-size-large');

    const westernElements = document.querySelectorAll('.western-theme');
    const easternElements = document.querySelectorAll('.eastern-theme');

    const westernFrontImg = document.getElementById('western-front-img');
    const easternFrontImg = document.getElementById('eastern-front-img');

    const westernPostcardBack = document.getElementById('western-postcard-back');
    const easternPostcardBack = document.getElementById('eastern-postcard-back');
    const footerElement = document.querySelector('footer');
    const footerTargetImg = document.getElementById('footer-target-img');

    const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
    const bodyElement = document.body;

    let currentTheme = 'western';
    let currentLang = 'en';

    function applyLanguage(lang) {
        currentLang = lang;
        langDataElements.forEach(el => {
            const textKey = `lang-${lang}`;
            if (el.dataset[textKey]) {
                let content = el.dataset[textKey];
                if (el.tagName === 'P' && el.innerHTML.includes("<a href=")) {
                    el.innerHTML = content;
                } else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.tagName === 'TEXTAREA')) {
                    if (el.placeholder !== undefined) {
                        el.placeholder = content;
                    }
                } else if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
                    el.value = content;
                } else {
                    el.textContent = content;
                }
            }
        });

        langEnBtn.classList.toggle('active', lang === 'en');
        langKoBtn.classList.toggle('active', lang === 'ko');
        localStorage.setItem('oosuPortfolioLang', lang);
    }

    function applyTheme(theme) {
        currentTheme = theme;

        westernElements.forEach(el => el.classList.toggle('hidden', theme === 'eastern'));
        easternElements.forEach(el => el.classList.toggle('hidden', theme === 'western'));

        // Adjusted paths to match HTML
        if (theme === 'western' && westernFrontImg) {
            westernFrontImg.src = 'western/ezgif-frame-001.jpg';
        } else if (theme === 'eastern' && easternFrontImg) {
            easternFrontImg.src = 'eastern/ezgif-frame-001.jpg';
        }

        // These will correctly target the new theme buttons in floating-menu1
        if (penThemeBtn) penThemeBtn.classList.toggle('active', theme === 'western');
        if (brushThemeBtn) brushThemeBtn.classList.toggle('active', theme === 'eastern');
        localStorage.setItem('oosuPortfolioTheme', theme);
    }

    function applyFontSize(size) {
        bodyElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        let newSizeClass = 'font-size-medium';
        if (size === 'small') newSizeClass = 'font-size-small';
        else if (size === 'large') newSizeClass = 'font-size-large';
        bodyElement.classList.add(newSizeClass);

        if (fontSizeSmallBtn) fontSizeSmallBtn.classList.toggle('active', size === 'small');
        if (fontSizeMediumBtn) fontSizeMediumBtn.classList.toggle('active', size === 'medium' || !size);
        if (fontSizeLargeBtn) fontSizeLargeBtn.classList.toggle('active', size === 'large');
        localStorage.setItem('oosuPortfolioFontSize', size);
    }

    if (penThemeBtn) penThemeBtn.addEventListener('click', () => applyTheme('western'));
    if (brushThemeBtn) brushThemeBtn.addEventListener('click', () => applyTheme('eastern'));

    if (langEnBtn) langEnBtn.addEventListener('click', () => applyLanguage('en'));
    if (langKoBtn) langKoBtn.addEventListener('click', () => applyLanguage('ko'));

    if (fontSizeSmallBtn) fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    if (fontSizeMediumBtn) fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    if (fontSizeLargeBtn) fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    const savedTheme = localStorage.getItem('oosuPortfolioTheme') || 'western';
    const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

    applyTheme(savedTheme);
    applyLanguage(savedLang);
    applyFontSize(savedFontSize);


    function animatePostcardFrames(callback) {
        const frontImageToAnimate = currentTheme === 'western' ? westernFrontImg : easternFrontImg;
        if (!frontImageToAnimate) {
            if (callback) callback();
            return;
        }

        const basePath = `${currentTheme}/`;
        const frameCount = currentTheme === 'western' ? 43 : 49;
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


    document.querySelectorAll('.send-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            const form = button.closest('form');
            let isValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderBottomColor = 'red';
                } else {
                    input.style.borderBottomColor = '';
                }
            });

            if (!isValid) {
                alert(currentLang === 'ko' ? '모든 필수 항목을 입력해주세요.' : 'Please fill in all required fields.');
                return;
            }

            animatePostcardFrames(() => {
                const postcardBackToAnimate = currentTheme === 'western' ? westernPostcardBack : easternPostcardBack;

                if (postcardBackToAnimate && footerElement && footerTargetImg) {
                    const postcardRect = postcardBackToAnimate.getBoundingClientRect();

                    const postcardClone = postcardBackToAnimate.cloneNode(true);
                    postcardClone.style.position = 'fixed';
                    postcardClone.style.left = `${postcardRect.left}px`;
                    postcardClone.style.top = `${postcardRect.top}px`;
                    postcardClone.style.width = `${postcardRect.width}px`;
                    postcardClone.style.height = `${postcardRect.height}px`;
                    postcardClone.style.margin = '0';
                    postcardClone.style.zIndex = '1001';
                    document.body.appendChild(postcardClone);

                    postcardBackToAnimate.style.visibility = 'hidden';
                    postcardClone.classList.add('postcard-falling-3d');

                    setTimeout(() => {
                        footerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 800);

                    postcardClone.addEventListener('animationend', () => {
                        postcardClone.remove();
                        postcardBackToAnimate.style.visibility = 'visible';
                        form.reset();
                        form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                            input.style.borderBottomColor = '';
                        });

                        if (currentTheme === 'western' && westernFrontImg) {
                            westernFrontImg.src = 'western/ezgif-frame-001.jpg';
                        } else if (currentTheme === 'eastern' && easternFrontImg) {
                            easternFrontImg.src = 'eastern/ezgif-frame-001.jpg';
                        }
                    });
                } else {
                    form.reset();
                    if (currentTheme === 'western' && westernFrontImg) {
                        westernFrontImg.src = 'western/ezgif-frame-001.jpg';
                    } else if (currentTheme === 'eastern' && easternFrontImg) {
                        easternFrontImg.src = 'eastern/ezgif-frame-001.jpg';
                    }
                }
            });
        });
    });

    const navHeader = document.querySelector('.nav-header');
    const topSentinel = document.getElementById('top-sentinel');

    if (navHeader && topSentinel) {
        const observerOptions = {
            rootMargin: `-${navHeader.offsetHeight}px 0px 0px 0px`,
        };

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isSticky = !entry.isIntersecting;
                navHeader.classList.toggle('sticky', isSticky);
            });
        }, observerOptions);
        navObserver.observe(topSentinel);
    }
});