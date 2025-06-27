// connect.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. HEADER VISIBILITY OBSERVER ---
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

    // --- 2. GSAP & ANIMATION INITIALIZATION ---
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
        
        document.querySelectorAll('.scroll-up-arrow').forEach(arrow => {
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

    // --- 3. POSTCARD SECTION LOGIC ---
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
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageTextarea = document.getElementById('message');

        if (!westernThemeBtn || !easternThemeBtn || !postcardBack) {
            console.warn("Postcard section elements not found. Postcard logic not fully initialized.");
            return;
        }

        if(nameInput) nameInput.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));
        if(emailInput) emailInput.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));
        if(messageTextarea) messageTextarea.addEventListener('input', () => document.dispatchEvent(new CustomEvent('postcardInputChanged')));

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

    // ===================================================
    // --- 4. DYNAMIC SECTION HEADER LOGIC ---
    // ===================================================

    // --- Helper Functions ---
    function getUserName() {
        return localStorage.getItem('currentUser') || 'Visitor';
    }

    function getStoredHighlights() {
        const highlightsData = JSON.parse(localStorage.getItem('userHighlights')) || {};
        return Object.values(highlightsData);
    }

    function getAIGeneratedMessage() {
        const output = document.getElementById('connect-ai-output');
        return (output && output.textContent.length > 50 && !output.querySelector('.fa-spinner')) ? output.textContent : '';
    }

    function extractTopKeywords(highlights) {
        if (!highlights || highlights.length === 0) return [];
        const words = [];
        const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'with', 'and', 'or', 'to', 'of', 'is', 'i', 'you', 'it', 'for', 'are', 'was', 'were', 'this', 'that', 'have', 'been']);
        highlights.forEach(highlight => {
            const textWords = highlight.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
            words.push(...textWords.filter(word => word.length > 3 && !stopWords.has(word)));
        });
        const frequency = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]).slice(0, 3);
    }
    
    // --- State Determination Functions ---
    function determineAIAssistantState(highlights) {
        const highlightCount = highlights.length;
        const hasSelectedTemplate = document.querySelector('.connect-ai-template-btn.active');
        const hasGeneratedMessage = getAIGeneratedMessage().length > 0;

        if (hasGeneratedMessage) return 'messageGenerated';
        if (hasSelectedTemplate && highlightCount > 0) return 'templateSelected';
        if (highlightCount === 0) return 'noHighlights';
        if (highlightCount <= 3) return 'fewHighlights';
        return 'manyHighlights';
    }

    function determinePostcardState(hasHighlights, hasAIMessage) {
        const messageInput = document.getElementById('message');
        const hasUserInput = messageInput && messageInput.value.trim().length > 0;
        const name = document.getElementById('name')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const formFilled = name.length > 0 && email.length > 0;

        if (formFilled && (hasUserInput || hasAIMessage)) return 'readyToSend';
        if (hasUserInput) return 'typing';
        if (hasAIMessage) return 'aiMessageReady';
        if (hasHighlights) return 'highlightsOnly';
        return 'initial';
    }

    // --- Header Content Generators ---
    function getAIAssistantHeaderText(userName, highlights) {
        const state = determineAIAssistantState(highlights);
        const topKeywords = extractTopKeywords(highlights).map(k => `<strong>${k}</strong>`);
        const template = document.querySelector('.connect-ai-template-btn.active')?.textContent || 'message';

        const headers = {
            noHighlights: {
                title: `${userName}, let's start crafting together`,
                subtitle: "Highlight items from the portfolio, and I'll help you create the perfect message."
            },
            fewHighlights: {
                title: `${userName}, I see what caught your attention`,
                subtitle: `Your interest in ${topKeywords.join(' and ')} is a great starting point. Let's draft a message.`
            },
            manyHighlights: {
                title: `${userName}, your curiosity is inspiring!`,
                subtitle: `With ${highlights.length} highlights, we have rich material. Let's create something meaningful.`
            },
            templateSelected: {
                title: `Perfect choice, ${userName}`,
                subtitle: `Now, let's generate a '${template}' inquiry based on your interest in ${topKeywords.join(' and ')}.`
            },
            messageGenerated: {
                title: `Your draft is ready, ${userName}!`,
                subtitle: "Review the AI-generated message below. You can regenerate it or proceed to the postcard."
            }
        };
        return headers[state];
    }

    function getPostcardHeaderText(userName, highlights) {
        const hasHighlights = highlights.length > 0;
        const hasAIMessage = getAIGeneratedMessage().length > 0;
        const state = determinePostcardState(hasHighlights, hasAIMessage);
        const topKeywords = extractTopKeywords(highlights).map(k => `<strong>${k}</strong>`);

        const headers = {
            initial: {
                title: `${userName}, your canvas awaits`,
                subtitle: "This is where your thoughts take flight. Write your message or use the AI assistant above."
            },
            highlightsOnly: {
                title: `${userName}, ready to put pen to paper?`,
                subtitle: `Your focus on ${topKeywords.join(' and ')} is clear. Draft a message below or use the AI to help.`
            },
            aiMessageReady: {
                title: `Your message is here, ${userName}`,
                subtitle: "The AI draft is ready. You can copy it, edit it here, and then send your postcard."
            },
            typing: {
                title: `Looking great, ${userName}`,
                subtitle: "Your personalized message is taking shape. Just fill in your details and choose a style."
            },
            readyToSend: {
                title: `Ready to make a connection, ${userName}?`,
                subtitle: "Your postcard is ready to be sent. Just click the send button!"
            }
        };
        return headers[state];
    }

    // --- Main Update Function ---
    function updateAllSectionHeaders() {
        const userName = getUserName();
        const highlights = getStoredHighlights();

        // Update AI Assistant Section Header
        const aiHeaderData = getAIAssistantHeaderText(userName, highlights);
        const aiGreetingEl = document.getElementById('ai-assistant-greeting');
        const aiSubGreetingEl = document.getElementById('ai-assistant-sub-greeting');
        if (aiGreetingEl) aiGreetingEl.innerHTML = `<i class="fas fa-robot"></i> ${aiHeaderData.title}`;
        if (aiSubGreetingEl) aiSubGreetingEl.innerHTML = aiHeaderData.subtitle;

        // Update Postcard Section Header
        const postcardHeaderData = getPostcardHeaderText(userName, highlights);
        const postcardGreetingEl = document.getElementById('postcard-greeting');
        const postcardSubGreetingEl = document.getElementById('postcard-sub-greeting');
        if (postcardGreetingEl) postcardGreetingEl.textContent = postcardHeaderData.title;
        if (postcardSubGreetingEl) postcardSubGreetingEl.innerHTML = postcardHeaderData.subtitle;
    }

    // --- 5. EVENT LISTENERS FOR DYNAMIC HEADERS ---
    function initHeaderUpdaters() {
        document.addEventListener('highlightDataChanged', updateAllSectionHeaders);
        document.addEventListener('aiMessageGenerated', updateAllSectionHeaders);
        document.addEventListener('templateSelected', updateAllSectionHeaders);
        document.addEventListener('postcardInputChanged', updateAllSectionHeaders);
        document.addEventListener('userLoggedIn', updateAllSectionHeaders);
        // Initial call to set headers on page load
        updateAllSectionHeaders();
    }


    // --- 6. MAIN INITIALIZATION CALL ---
    initHeaderObserver();
    initAnimations();
    initPostcardSection();
    initHeaderUpdaters();
});