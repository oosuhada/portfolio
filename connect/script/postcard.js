document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
    const postcardSection = document.getElementById('postcard-section');
    const postcardContainer = document.getElementById('postcard-container');
    const penStyleBtn = document.getElementById('pen-style-indicator-btn');
    const brushStyleBtn = document.getElementById('brush-style-indicator-btn');
    const langEnBtn = document.getElementById('lang-en-btn');
    const langKoBtn = document.getElementById('lang-ko-btn');
    const postcardBack = document.querySelector('.postcard-back');
    const frontImage = document.getElementById('postcard-front-img');
    const formInputs = postcardBack.querySelectorAll('input, textarea');
    const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
    const inquiryForm = document.getElementById('inquiry-form');

    // --- 2. CONFIGURATION ---
    // 이미지 1~24번까지만 사용
    const postcardImageSequence = [];
    for (let i = 1; i <= 24; i++) {
        const frameNumber = String(i).padStart(3, '0');
        postcardImageSequence.push(`img/postcard/ezgif-frame-${frameNumber}.jpg`);
    }

    // --- 3. HELPER FUNCTIONS ---
    if (!postcardContainer || !inquiryForm) {
        console.warn("Postcard section elements not found. Postcard logic not fully initialized.");
        return;
    }

    function applyCursorStyle(style) {
        formInputs.forEach(input => {
            input.classList.remove('pen-cursor', 'brush-cursor');
            if (style === 'pen' || style === 'brush') {
                input.classList.add(`${style}-cursor`);
            }
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
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    function autofillNameFromHero() {
        const nameInput = document.querySelector('.postcard-back input[type="text"][name="name"]');
        if (!nameInput) return;
        const savedName = localStorage.getItem('currentUser');
        if (savedName) nameInput.value = savedName;
    }
    
    function resetPostcardState() {
        inquiryForm.reset();
        inquiryForm.querySelectorAll('.error-message.visible').forEach(el => el.classList.remove('visible'));
        inquiryForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

        gsap.set(postcardContainer, {
            position: 'relative',
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            width: '',
            height: '',
            top: '',
            left: '',
            zIndex: ''
        });

        postcardContainer.classList.remove('is-flipped', 'is-flying');
        frontImage.src = postcardImageSequence[0];
        autofillNameFromHero();
    }

    // --- 4. FORM VALIDATION & SUBMISSION ---
    function validateInputField(field) {
        const errorEl = field.nextElementSibling;
        let errorMsg = "";
        if (field.validity.valueMissing) {
            errorMsg = "This field is required.";
        } else if (field.type === "email" && field.validity.typeMismatch) {
            errorMsg = "Please enter a valid email.";
        }
        if (errorMsg) {
            field.classList.add('invalid');
            if (errorEl && errorEl.classList.contains('error-message')) {
                errorEl.textContent = errorMsg;
                errorEl.classList.add('visible');
            }
            return false;
        } else {
            field.classList.remove('invalid');
            if (errorEl && errorEl.classList.contains('error-message')) {
                errorEl.textContent = "";
                errorEl.classList.remove('visible');
            }
            return true;
        }
    }

    formInputs.forEach(field => {
        field.addEventListener('input', () => validateInputField(field));
        field.addEventListener('blur', () => validateInputField(field));
    });

    inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (Array.from(inquiryForm.querySelectorAll('[required]')).every(validateInputField)) {
            postcardContainer.classList.add('is-flipped');
        }
    });

    // --- 5. ANIMATION LOGIC ---
    function startFlyAnimation() {
        const mailboxContainer = document.getElementById('lottie-container');
        if (!mailboxContainer) {
            console.error("Mailbox container with id 'lottie-container' not found.");
            return;
        }

        // 1. placeholder 만들기
        const postcardRect = postcardContainer.getBoundingClientRect();
        const placeholder = document.createElement('div');
        placeholder.style.width = postcardRect.width + 'px';
        placeholder.style.height = postcardRect.height + 'px';
        placeholder.style.display = getComputedStyle(postcardContainer).display;
        placeholder.style.visibility = 'hidden'; // 레이아웃 유지, 화면에는 안보임

        // 2. placeholder 삽입 (카드 앞에)
        postcardContainer.parentNode.insertBefore(placeholder, postcardContainer);

        // 3. 카드 body로 이동 (섹션 밖)
        document.body.appendChild(postcardContainer);

        // 4. 비행 애니메이션 시작
        postcardContainer.classList.add('is-flying');
        gsap.set(postcardContainer, {
            position: 'fixed',
            top: postcardRect.top,
            left: postcardRect.left,
            width: postcardRect.width,
            height: postcardRect.height,
            zIndex: 1000,
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1
        });

        const mailboxRect = mailboxContainer.getBoundingClientRect();
        const targetX = mailboxRect.left + (mailboxRect.width / 2) - (postcardRect.width / 2);
        const targetY = mailboxRect.top + (mailboxRect.height / 2) - (postcardRect.height / 2);
        const targetScale = mailboxRect.width / postcardRect.width;

        // 24장 기준 duration
        const frameDuration = 0.08; // 더 빠르게 하고 싶으면 0.06~0.07로 조절 가능
        const totalAnimationTime = postcardImageSequence.length * frameDuration;

        let imageIndex = { frame: 0 };

        const tl = gsap.timeline();

        // 1. 이미지 시퀀스 & 비행
        tl.to(imageIndex, {
            frame: postcardImageSequence.length - 1,
            duration: totalAnimationTime,
            ease: "steps(" + (postcardImageSequence.length - 1) + ")",
            onUpdate: () => {
                frontImage.src = postcardImageSequence[Math.round(imageIndex.frame)];
            }
        }, 0);

        tl.to(postcardContainer, {
            x: targetX - postcardRect.left,
            y: targetY - postcardRect.top,
            scale: targetScale,
            duration: totalAnimationTime,
            ease: "power2.in",
            opacity: 1
        }, 0);

        // 2. 도착 후 잠깐 멈춤
        tl.to(postcardContainer, { duration: 0.18 });

        // 3. fade out
        tl.to(postcardContainer, {
            opacity: 0,
            duration: 0.32,
            ease: "power1.in"
        });

        // 4. 여운 딜레이 후 원복
        tl.to({}, {
            duration: 0.7,
            onComplete: () => {
                // placeholder 자리에 카드 복귀
                placeholder.replaceWith(postcardContainer);
                // 스타일 정상화
                gsap.set(postcardContainer, {
                    position: 'relative',
                    top: '',
                    left: '',
                    width: '',
                    height: '',
                    x: 0,
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    zIndex: ''
                });
                postcardContainer.classList.remove('is-flipped', 'is-flying');
                frontImage.src = postcardImageSequence[0];

                inquiryForm.reset();
                inquiryForm.querySelectorAll('.error-message.visible').forEach(el => el.classList.remove('visible'));
                inquiryForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                autofillNameFromHero();
            }
        });
    }

    // 카드가 뒤집힌 후, 비행 애니메이션 트리거
    postcardContainer.querySelector('.postcard-flipper').addEventListener('transitionend', (event) => {
        if (event.target !== event.currentTarget) return;
        if (postcardContainer.classList.contains('is-flipped') && !postcardContainer.classList.contains('is-flying')) {
            startFlyAnimation();
        }
    });

    // --- 6. UI CONTROL EVENT LISTENERS ---
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));

    // --- 7. INITIALIZATION ---
    applyCursorStyle(localStorage.getItem('oosuPortfolioCursorStyle') || 'pen');
    applyLanguage(localStorage.getItem('oosuPortfolioLang') || 'en');
    autofillNameFromHero();

    document.addEventListener('userLoggedIn', autofillNameFromHero);
});
