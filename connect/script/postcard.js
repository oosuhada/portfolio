document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
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
    const postcardImageSequence = [ // Assumed image sequence for animation
        'img/western/ezgif-frame-001.jpg',
        'img/western/ezgif-frame-002.jpg',
        'img/western/ezgif-frame-003.jpg',
        'img/western/ezgif-frame-004.jpg',
        'img/western/ezgif-frame-005.jpg',
    ];
    let imageInterval; // To hold the interval timer

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
        localStorage.setItem('oosuPortfolioLang', lang);
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    function resetPostcardState() {
        inquiryForm.reset();
        inquiryForm.querySelectorAll('.error-message.visible').forEach(el => el.classList.remove('visible'));
        inquiryForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

        postcardContainer.style.opacity = '1';
        postcardContainer.classList.remove('is-flipped', 'is-flying');
        frontImage.src = postcardImageSequence[0]; // Reset to first image
    }

    // --- 4. FORM VALIDATION & SUBMISSION ---
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
        let isFormValid = Array.from(inquiryForm.querySelectorAll('[required]')).every(field => window.validateField(field));
        
        if (!isFormValid) return;

        // 1. Flip the card
        postcardContainer.classList.add('is-flipped');
    });

    // --- 5. ANIMATION SEQUENCE LISTENERS ---
    
    // Listen for the flip to finish
    postcardContainer.querySelector('.postcard-flipper').addEventListener('transitionend', () => {
        // Check if the card is flipped (and not in the middle of flipping back)
        if (postcardContainer.classList.contains('is-flipped')) {
            // 2. Start cycling through front images
            let imageIndex = 0;
            imageInterval = setInterval(() => {
                imageIndex = (imageIndex + 1) % postcardImageSequence.length;
                frontImage.src = postcardImageSequence[imageIndex];
            }, 400); // Change image every 400ms

            // 3. Wait a bit, then start the fly-away animation
            setTimeout(() => {
                clearInterval(imageInterval); // Stop image cycling
                postcardContainer.classList.add('is-flying');
            }, 2500); // Fly away after 2.5 seconds of image cycling
        }
    });

    // Listen for the flying animation to finish
    postcardContainer.addEventListener('animationend', (e) => {
        // Make sure it's the 'fly-to-footer' animation
        if (e.animationName === 'fly-to-footer') {
            // 4. Hide the card and reset its state for next time
            postcardContainer.style.opacity = '0'; // Hide it
            setTimeout(resetPostcardState, 500); // Reset after a short delay
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
});
