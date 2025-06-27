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
                    pageHeader.classList.toggle('hidden', entry.isIntersecting);
                });
            };
            const heroObserver = new IntersectionObserver(observerCallback, observerOptions);
            heroObserver.observe(heroSection);
        } else {
            console.warn("Header or Hero section not found for observer initialization.");
        }
    }

    // --- 2. GSAP & ANIMATION INITIALIZATION ---
    function initAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollToPlugin === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error("GSAP or its plugins not loaded! Animations will not work.");
            return;
        }
        gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

        document.querySelectorAll('.scroll-down-arrow, .scroll-up-arrow').forEach(arrow => {
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

        ['highlight-hub-section', 'ai-assistant-section', 'postcard-section'].forEach(sectionId => {
            gsap.to(`#${sectionId}`, {
                scrollTrigger: {
                    trigger: `#${sectionId}`,
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

    // --- 3. SHARED UTILITIES ---
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

    // --- 4. DYNAMIC SECTION HEADER LOGIC ---
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
                subtitle: `Your focus on ${topKeywords.join(' and ')} is clear. Draft a message or use the AI to help.`
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

    function updateAllSectionHeaders() {
        const userName = getUserName();
        const highlights = getStoredHighlights();

        // Update Highlight Hub Section Header
        const hubGreeting = document.getElementById('hub-greeting');
        const hubSubGreeting = document.getElementById('hub-sub-greeting');
        const analysis = extractTopKeywords(highlights);
        if (hubGreeting) {
            hubGreeting.textContent = `Welcome, ${userName}! Here is your journey.`;
        }
        if (hubSubGreeting) {
            if (analysis.length > 0) {
                hubSubGreeting.innerHTML = `It seems you were particularly interested in <strong>${analysis.join(', ')}</strong>. Let's craft a message together.`;
            } else {
                hubSubGreeting.textContent = 'As you explore and highlight your interests, your analysis will be displayed here.';
            }
        }

        // Update AI Assistant Section Header
        const aiHeaderData = getAIAssistantHeaderText(userName, highlights);
        const aiGreetingEl = document.getElementById('ai-assistant-greeting');
        const aiSubGreetingEl = document.getElementById('ai-assistant-sub-greeting');
        if (aiGreetingEl) aiGreetingEl.innerHTML = `${aiHeaderData.title}`;
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
        updateAllSectionHeaders();
    }

    // --- 6. MAIN INITIALIZATION ---
    initHeaderObserver();
    initAnimations();
    initHeaderUpdaters();
});