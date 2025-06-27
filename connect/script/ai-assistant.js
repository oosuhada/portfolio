// ai-assistant.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ELEMENT SELECTORS ---
    const connectAiInsightsOutput = document.getElementById('connect-ai-insights-output');
    const connectAiTemplateButtons = document.querySelectorAll('.connect-ai-template-btn');
    const connectAiToneButtons = document.querySelectorAll('.connect-ai-tone-btn');
    const connectAiOutput = document.getElementById('connect-ai-output');
    const connectGenerateBtn = document.getElementById('connect-ai-generate-btn');
    const connectPostGenerateControls = document.getElementById('connect-ai-post-generate-controls');
    const connectRegenerateBtn = document.getElementById('connect-ai-regenerate-btn');
    const connectGoToPostcardBtn = document.getElementById('connect-ai-go-to-postcard-btn');
    const postcardMessageTextarea = document.getElementById('message');

    // --- 2. STATE & UTILITIES ---
    let currentLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    let userName = localStorage.getItem('currentUser') || (currentLang === 'en' ? 'Visitor' : '방문자');
    let aiState = {
        template: 'general',
        tone: 'professional'
    };
    const thesaurus = {
        'frontend': 'web', 'front-end': 'web', '웹': 'web', 'web': 'web',
        'ui': 'design', 'ux': 'design', 'user experience': 'design', '디자인': 'design', 'design': 'design',
        'project': 'project', '프로젝트': 'project',
        'animation': 'interactive', 'interactive': 'interactive', '인터랙티브': 'interactive',
        'javascript': 'skill', 'css': 'skill', 'react': 'skill', 'gsap': 'skill'
    };
    const questionTemplates = {
        design: [
            "I was impressed by your approach to user experience. Could you elaborate on the design process for one of your projects?",
            "Your portfolio showcases a strong eye for UI design. What design principles do you prioritize in your work?"
        ],
        web: [
            "Regarding your web development projects, what was the most challenging technical problem you solved?",
            "I'm curious about the front-end architecture of your projects. What frameworks and libraries do you enjoy working with?"
        ],
        project: [
            "It looks like you've worked on some interesting projects. Which one are you most proud of and why?",
            "Could you walk me through the lifecycle of one of your key projects, from concept to completion?"
        ],
        default: [
            "I really enjoyed exploring your portfolio. I'd love to hear more about your work.",
            "I have a few questions about the items I highlighted. Could we discuss them further?"
        ]
    };

    function analyzeInterests(highlights) {
        const words = [];
        const nGrams2 = [];
        const pageCounts = {};
        let latestTimestamp = 0;
        Object.values(highlights).forEach(item => {
            const page = item.page || 'General';
            pageCounts[page] = (pageCounts[page] || 0) + 1;
            if (item.timestamp > latestTimestamp) latestTimestamp = item.timestamp;
            const cleanText = item.text.toLowerCase().replace(/[.,!?"'()]/g, '');
            const textWords = cleanText.split(/[\s/]+/).filter(w => w.length > 1);
            const normalizedWords = textWords.map(word => thesaurus[word] || word);
            words.push(...normalizedWords);
            for (let i = 0; i < normalizedWords.length - 1; i++) {
                nGrams2.push(`${normalizedWords[i]} ${normalizedWords[i+1]}`);
            }
        });
        const wordCounts = words.reduce((acc, word) => { acc[word] = (acc[word] || 0) + 1; return acc; }, {});
        const nGramCounts = nGrams2.reduce((acc, nGram) => { acc[nGram] = (acc[nGram] || 0) + 1; return acc; }, {});
        const stopWords = ['a', 'an', 'the', 'in', 'on', 'with', 'and', 'or', 'to', 'of', 'is', 'i', 'you', 'it', 'for', 'are', 'was', 'were'];
        stopWords.forEach(sw => delete wordCounts[sw]);
        const sortedKeywords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
        const sortedNGrams = Object.entries(nGramCounts).sort((a, b) => b[1] - a[1]);
        const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
        return {
            totalHighlights: Object.keys(highlights).length,
            topKeywords: sortedKeywords.slice(0, 3).map(item => item[0]),
            topNGrams: sortedNGrams.filter(item => item[1] > 1).slice(0, 2).map(item => item[0]),
            topPage: sortedPages.length > 0 ? sortedPages[0][0] : null,
            latestTimestamp: latestTimestamp
        };
    }

    function generateAndDisplayInsights() {
        const highlights = getHighlightData();
        if (Object.keys(highlights).length === 0) {
            connectAiInsightsOutput.innerHTML = 'Highlight items from the portfolio to see your interest analysis.';
            return;
        }
        const analysis = analyzeInterests(highlights);
        let insightsHTML = '';
        if (analysis.topPage) {
            insightsHTML += `<p>I see you've spent some time on the **${analysis.topPage}** page. `;
        }
        if (analysis.topKeywords.length > 0) {
            const keywordString = analysis.topKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join(' ');
            insightsHTML += `It seems you're particularly interested in topics like ${keywordString}.</p>`;
        }
        if (analysis.topNGrams.length > 0) {
            insightsHTML += `<p>Specifically, phrases like "**${analysis.topNGrams.join('", "')}**" caught your attention more than once.</p>`;
        }
        insightsHTML += `<p>Based on your **${analysis.totalHighlights}** highlights, I can help you draft a message.</p>`;
        connectAiInsightsOutput.innerHTML = insightsHTML;
    }

    function generateDraftText() {
        const highlights = getHighlightData();
        const analysis = analyzeInterests(highlights);
        let greeting, closing, body;
        const tone = aiState.tone;
        switch (tone) {
            case 'friendly':
                greeting = `Hi Oosu,\n\nI had a great time looking through your portfolio!`;
                closing = `Cheers,\n${userName}`;
                break;
            case 'direct':
                greeting = `Hello Oosu Jang,`;
                closing = `Regards,\n${userName}`;
                break;
            case 'curious':
                greeting = `Hello Oosu,\n\nYour portfolio sparked a few questions in my mind.`;
                closing = `Looking forward to your insights,\n${userName}`;
                break;
            default:
                greeting = `Dear Oosu Jang,\n\nI am writing to you after a thorough review of your portfolio.`;
                closing = `Sincerely,\n${userName}`;
                break;
        }
        const mainInterest = analysis.topKeywords[0];
        const templatePool = questionTemplates[mainInterest] || questionTemplates.default;
        body = templatePool[Math.floor(Math.random() * templatePool.length)];
        const highlightSnippet = Object.values(highlights).slice(0, 2).map(item => `- "${item.text}"`).join('\n');
        if (highlightSnippet) {
            body += `\n\nI was particularly drawn to these points:\n${highlightSnippet}`;
        }
        return `${greeting}\n\n${body}\n\n${closing}`;
    }

    // --- 3. EVENT HANDLERS ---
    function handleGenerateClick() {
        const highlights = getHighlightData();
        if (Object.keys(highlights).length === 0) {
            connectAiOutput.textContent = "Please highlight items first to generate a message.";
            return;
        }
        connectAiOutput.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Crafting message...`;
        setTimeout(() => {
            const draftText = generateDraftText();
            connectAiOutput.textContent = draftText;
            connectGenerateBtn.classList.add('hidden');
            connectPostGenerateControls.classList.remove('hidden');
            document.dispatchEvent(new CustomEvent('aiMessageGenerated'));
        }, 1200);
    }

    function handleGoToPostcardClick() {
        const draft = connectAiOutput.textContent;
        gsap.to(window, {
            duration: 1.5,
            scrollTo: { y: "#postcard-section", offsetY: 70 },
            ease: 'power3.inOut',
            onComplete: () => {
                if (postcardMessageTextarea) {
                    postcardMessageTextarea.value = draft;
                    postcardMessageTextarea.focus();
                    gsap.from(postcardMessageTextarea, { opacity: 0, duration: 0.5 });
                    document.dispatchEvent(new CustomEvent('postcardInputChanged'));
                }
            }
        });
    }

    // --- 4. EVENT LISTENERS ---
    document.addEventListener('userLoggedIn', (e) => {
        userName = e.detail.username;
        generateAndDisplayInsights();
    });

    document.addEventListener('highlightDataChanged', () => {
        generateAndDisplayInsights();
    });

    document.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        userName = localStorage.getItem('currentUser') || (currentLang === 'en' ? 'Visitor' : '방문자');
        generateAndDisplayInsights();
    });

    connectAiTemplateButtons.forEach(button => {
        button.addEventListener('click', () => {
            connectAiTemplateButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            aiState.template = button.dataset.template;
            document.dispatchEvent(new CustomEvent('templateSelected'));
        });
    });

    connectAiToneButtons.forEach(button => {
        button.addEventListener('click', () => {
            connectAiToneButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            aiState.tone = button.dataset.tone;
        });
    });

    connectGenerateBtn.addEventListener('click', handleGenerateClick);
    connectRegenerateBtn.addEventListener('click', handleGenerateClick);
    connectGoToPostcardBtn.addEventListener('click', handleGoToPostcardClick);

    // --- 5. INITIALIZATION ---
    generateAndDisplayInsights();
    document.querySelector('.connect-ai-template-btn[data-template="general"]').classList.add('active');
    document.querySelector('.connect-ai-tone-btn[data-tone="professional"]').classList.add('active');
});