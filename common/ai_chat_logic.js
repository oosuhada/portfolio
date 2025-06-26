/*
 * AI Portfolio Chat - Core Logic (Lazy Loaded)
 * This script handles the core AI logic for processing user queries,
 * searching the knowledge base, and generating structured responses.
 * It does NOT interact with the DOM directly.
 */

// Dynamically import pipeline and cos_sim from Transformers.js as this is a module script.
// This ensures these functions are available within this module's scope before its code executes.
let pipeline, cos_sim;
try {
    const transformersModule = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
    pipeline = transformersModule.pipeline;
    cos_sim = transformersModule.cos_sim;
    console.log("[AIPortfolioLogic] Transformers.js functions imported successfully.");
} catch (error) {
    console.error("[AIPortfolioLogic] Failed to import Transformers.js functions:", error);
    // Provide dummy functions or handle gracefully if transformers fail to load
    pipeline = async () => { console.error("Transformers.js pipeline not available."); return null; };
    cos_sim = () => { console.error("Transformers.js cos_sim not available."); return 0; };
}

window.AIPortfolioLogic = (() => {
    let knowledgeBase = null; // JSON data cache
    let currentLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en'; // Current language setting

    // Local library instances
    let fuse; // Instance of Fuse.js
    let extractor; // Transformers.js model for feature extraction
    let dbEmbeddings; // Stored embeddings of our knowledge base documents
    let searchDocuments = []; // Renamed from 'documents' to avoid confusion and ensure it's always an array

    // Track if the knowledge base has been loaded and initialized
    let isKnowledgeBaseLoaded = false;
    let isTransformersReady = false; // Flag for Transformers.js specific readiness

    /**
     * Helper to check if external global libraries (Fuse) are loaded.
     * `pipeline` and `cos_sim` are handled by the top-level import in this module.
     * @returns {void}
     * @throws {Error} if a required global library is not found.
     */
    function checkExternalLibraries() {
        if (typeof Fuse === 'undefined') {
            console.error("[AIPortfolioLogic] Fuse.js is not loaded.");
            throw new Error("Required library Fuse.js not available.");
        }
    }

    /**
     * Normalizes the user query for more effective matching.
     * Includes lowercasing, trimming, and basic punctuation removal.
     * For Korean, further normalization (e.g., josa removal) might be needed for advanced accuracy.
     * @param {string} query - The raw user query.
     * @param {string} lang - The current language ('en' or 'ko').
     * @returns {string} The normalized query.
     */
    function normalizeQuery(query, lang) {
        let normalized = query.toLowerCase().trim();
        normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]<>@"\'+?|]/g, "");
        return normalized;
    }


    /**
     * Asynchronously loads and caches the portfolio knowledge base (JSON),
     * and initializes Fuse.js and Transformers.js model and embeddings.
     * This function ensures external libraries are loaded before proceeding.
     * @returns {Promise<void>}
     */
    async function loadKnowledgeBase() {
        if (isKnowledgeBaseLoaded) {
            console.log("[AIPortfolioLogic] Knowledge base already loaded.");
            return; // Already loaded, do nothing
        }

        try {
            checkExternalLibraries();
            console.log("[AIPortfolioLogic] Fetching knowledge base...");
            const response = await fetch('../common/ai_chat_data.json');
            if (!response.ok) throw new Error(`Knowledge base file not found or failed to fetch: ${response.status}`);
            knowledgeBase = await response.json();
            
            searchDocuments = knowledgeBase.search_documents && Array.isArray(knowledgeBase.search_documents) ?
                knowledgeBase.search_documents : [];

            if (searchDocuments.length === 0) {
                console.warn("[AIPortfolioLogic] No search_documents found in knowledgeBase. Fuse.js and Transformers.js semantic search will be disabled.");
            } else {
                fuse = new Fuse(searchDocuments, {
                    keys: ['query_phrases'],
                    threshold: 0.4,
                    includeScore: true
                });
                console.log("[AIPortfolioLogic] Fuse.js initialized.");

                if (typeof pipeline === 'function' && pipeline !== null) {
                    const itemsToEmbed = searchDocuments.map(doc => {
                        const text = doc.text_for_embedding && typeof doc.text_for_embedding === 'object' ?
                            doc.text_for_embedding[currentLanguage] || doc.text_for_embedding['en'] :
                            doc.text_for_embedding;
                        return typeof text === 'string' ? text : '';
                    }).filter(Boolean);

                    if (itemsToEmbed.length > 0) {
                        try {
                            extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small');
                            dbEmbeddings = await extractor(itemsToEmbed, { pooling: 'mean', normalize: true });
                            isTransformersReady = true;
                            console.log("[AIPortfolioLogic] Document embeddings created and Transformers.js ready.");
                        } catch (extractorError) {
                            console.error("[AIPortfolioLogic] Failed to load or run Transformers.js extractor:", extractorError);
                            isTransformersReady = false;
                        }
                    } else {
                        console.warn("[AIPortfolioLogic] No valid text to create embeddings from for Transformers.js. Semantic search will be disabled.");
                        isTransformersReady = false;
                    }
                } else {
                    console.warn("[AIPortfolioLogic] Transformers.js pipeline is not available. Semantic search will be disabled.");
                    isTransformersReady = false;
                }
            }

            isKnowledgeBaseLoaded = true;
            console.log("[AIPortfolioLogic] Knowledge base and core local libraries ready.");

        } catch (error) {
            console.error("[AIPortfolioLogic] Critical error during knowledge base load or library initialization:", error);
            knowledgeBase = null;
            fuse = null;
            extractor = null;
            dbEmbeddings = null;
            searchDocuments = [];
            isKnowledgeBaseLoaded = false;
            isTransformersReady = false;
            throw error;
        }
    }

    /**
     * Sets the current language for responses.
     * @param {string} lang - 'en' or 'ko'.
     */
    function setLanguage(lang) {
        currentLanguage = lang;
        console.log(`[AIPortfolioLogic] Language set to: ${currentLanguage}`);
    }

    /**
     * Extracts localized text from an object or returns the string directly.
     * Prioritizes currentLanguage, then 'en', then empty string.
     * @param {string|object|Array<string>} field - Multi-language object, a single string, or an array of strings.
     * @returns {string|Array<string>} Text in the current language or fallback to English/empty string, or a localized array.
     */
    function getLocalizedText(field) {
        if (typeof field === 'object' && field !== null) {
            if (Array.isArray(field)) {
                return field;
            }
            return field[currentLanguage] || field['en'] || '';
        }
        return field || '';
    }

    /**
     * Checks if a query contains any of the provided keywords, including synonyms.
     * @param {string} query - User query (should be normalized/lowercase).
     * @param {Array<string>} keywords - Array of keywords to match (should be lowercase).
     * @param {Object} synonymsMap - Synonyms map for the current language.
     * @returns {boolean} True if a match is found, false otherwise.
     */
    function matchesKeyword(query, keywords, synonymsMap) {
        if (!Array.isArray(keywords)) {
            console.warn("[AIPortfolioLogic] matchesKeyword received non-array keywords:", keywords);
            return false;
        }
        for (const keyword of keywords) {
            if (query.includes(keyword)) {
                return true;
            }
            if (synonymsMap && synonymsMap[keyword] && Array.isArray(synonymsMap[keyword])) {
                if (synonymsMap[keyword].some(s => query.includes(s.toLowerCase()))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Finds the best keyword-based match for a given query by iterating through the knowledge base's keyword map.
     * @param {string} normalizedQuery - The pre-processed (normalized) user query.
     * @param {object} keywordsMap - The keywords_map from the knowledge base.
     * @param {object} synonymsMap - The synonyms_map for the current language.
     * @returns {object|null} An object with `category`, `item` (optional), and `intent` (optional) or `null` if no match.
     */
    function findBestKeywordMatch(normalizedQuery, keywordsMap, synonymsMap) {
        let bestMatch = null;
        let bestScore = 0;

        // Check for direct intent/phrase matches first (greetings, thanks, empathetic)
        if (matchesKeyword(normalizedQuery, ["hello", "hi", "hey", "안녕", "안녕하세요", "헬로"], synonymsMap)) {
            return { category: 'greeting' };
        }
        if (matchesKeyword(normalizedQuery, ["thank you", "thanks", "고마워", "감사합니다", "수고했어"], synonymsMap)) {
            return { category: 'thank_you' };
        }
        if (matchesKeyword(normalizedQuery, ["sorry", "apologize", "my bad", "죄송", "미안", "실수"], synonymsMap)) {
            return { category: 'empathetic', trigger_keywords: ["sorry", "죄송"] };
        }

        // Check for 'what if' scenarios with specific triggers
        for (const scenario of knowledgeBase.what_if_scenarios.scenarios) {
            const localizedTriggerKeywords = getLocalizedText(scenario.trigger_keywords);
            if (Array.isArray(localizedTriggerKeywords)) {
                if (matchesKeyword(normalizedQuery, localizedTriggerKeywords.map(kw => kw.toLowerCase()), synonymsMap)) {
                    return { category: 'what_if', item: scenario.id };
                }
            } else {
                console.warn(`[AIPortfolioLogic] Scenario ${scenario.id} has malformed trigger_keywords:`, scenario.trigger_keywords);
            }
        }
        // General "what if"
        if (matchesKeyword(normalizedQuery, ["what if", "만약", "만약에", "가정"], synonymsMap)) {
             return { category: 'what_if', item: null };
        }

        // Check for direct navigation keywords
        // IMPORTANT: Here, we don't return an "action: 'navigate'" directly.
        // We only return the 'navigation' category and its target page.
        // The generateFinalResponse function will then decide to ask for confirmation.
        for (const navKey in knowledgeBase.navigation_map) {
            const navData = knowledgeBase.navigation_map[navKey];
            const navKeywords = (navData.keywords || []).map(kw => kw.toLowerCase());
            if (matchesKeyword(normalizedQuery, navKeywords, synonymsMap)) {
                let navMatch = { category: 'navigation', target_page: navKey };
                const urlFragMatch = normalizedQuery.match(/#([a-zA-Z0-9_-]+)/);
                if (urlFragMatch) {
                    navMatch.url_fragment = urlFragMatch[1];
                }
                return navMatch; // High priority for navigation intent
            }
        }

        // Iterate through high-level content categories
        for (const catKey in keywordsMap) {
            const categoryMap = keywordsMap[catKey];
            const mainKeywords = (Array.isArray(categoryMap.main_keywords) ? categoryMap.main_keywords : [])
                                 .map(kw => kw.toLowerCase());

            if (matchesKeyword(normalizedQuery, mainKeywords, synonymsMap)) {
                let currentMatch = { category: categoryMap.category || catKey };
                let currentScore = 1;

                if (categoryMap.sub_keywords) {
                    for (const subKey in categoryMap.sub_keywords) {
                        const subItem = categoryMap.sub_keywords[subKey];
                        const subItemName = getLocalizedText(subItem.en || subItem.ko || subKey).toLowerCase();
                        const subItemVariations = (subItem.variations || []).map(v => v.toLowerCase());
                        const subItemKeywords = [subItemName, ...subItemVariations];

                        if (matchesKeyword(normalizedQuery, subItemKeywords, synonymsMap)) {
                            currentMatch.item = subKey;
                            currentScore += 2;
                            break;
                        }
                    }
                }

                if (categoryMap.intent_keywords) {
                    for (const intentKey in categoryMap.intent_keywords) {
                        const intentKeywords = (Array.isArray(categoryMap.intent_keywords[intentKey]) ? categoryMap.intent_keywords[intentKey] : [])
                                               .map(kw => kw.toLowerCase());
                        if (matchesKeyword(normalizedQuery, intentKeywords, synonymsMap)) {
                            currentMatch.intent = intentKey;
                            currentScore += 1.5;
                            break;
                        }
                    }
                }

                if (catKey === 'career' && categoryData.sub_keywords) {
                    for (const subSectionKey in categoryData.sub_keywords) {
                        const subSectionKeywords = (categoryData.sub_keywords[subSectionKey].variations || []).map(v => v.toLowerCase());
                        if (matchesKeyword(normalizedQuery, subSectionKeywords, synonymsMap)) {
                            currentMatch.subSection = subSectionKey;
                            currentScore += 1.7;
                            break;
                        }
                    }
                }

                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestMatch = currentMatch;
                }
            }
        }
        return bestMatch;
    }


    function runFuseSearch(query) {
        if (!fuse || !searchDocuments || searchDocuments.length === 0) {
            console.warn("[AIPortfolioLogic] Fuse.js not initialized or no search documents loaded. Skipping Fuse.js search.");
            return null;
        }
        const results = fuse.search(query);
        if (results.length > 0 && results[0].score < 0.4) {
            console.log(`[AIPortfolioLogic] Fuse.js matched: ${results[0].item.id} with score ${results[0].score}`);
            return results[0].item.response;
        }
        console.log("[AIPortfolioLogic] Fuse.js found no strong match.");
        return null;
    }


    function runCompromise(query) {
        if (typeof nlp === 'undefined' || currentLanguage !== 'en') {
            return null;
        }
        const normalizedQuery = normalizeQuery(query, currentLanguage);
        const synonymsMap = knowledgeBase.synonyms_map[currentLanguage];
        return findBestKeywordMatch(normalizedQuery, knowledgeBase.keywords_map, synonymsMap);
    }

    async function runTransformers(query) {
        if (!isTransformersReady || !searchDocuments.length) {
            console.warn("[AIPortfolioLogic] Transformers.js not ready or no search documents. Semantic search skipped.");
            return null;
        }

        try {
            const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });
            let bestMatch = { score: -1, index: -1 };

            for (let i = 0; i < dbEmbeddings.dims[0]; ++i) {
                const docEmbedding = dbEmbeddings.slice([i, i + 1]);
                const score = (queryEmbedding.dot(docEmbedding.T)).data[0];
                if (score > bestMatch.score) {
                    bestMatch = { score, index: i };
                }
            }

            if (bestMatch.score > 0.75) {
                console.log(`[AIPortfolioLogic] Transformers.js matched: ${searchDocuments[bestMatch.index].id} with score ${bestMatch.score}`);
                return searchDocuments[bestMatch.index].response;
            }
        } catch (e) {
            console.error("[AIPortfolioLogic] Error during Transformers.js processing:", e);
        }
        console.log("[AIPortfolioLogic] Transformers.js found no strong semantic match.");
        return null;
    }

    function runKoreanJs(query) {
        if (currentLanguage !== 'ko') {
            return null;
        }
        const normalizedQuery = normalizeQuery(query, currentLanguage);
        const synonymsMap = knowledgeBase.synonyms_map[currentLanguage] || knowledgeBase.synonyms_map['en'];
        return findBestKeywordMatch(normalizedQuery, knowledgeBase.keywords_map, synonymsMap);
    }

    async function callApiProxy(query) {
        try {
            console.log("[AIPortfolioLogic] Attempting Level 4: Serverless API Proxy (LLM)...");
            const payload = {
                contents: [{ role: "user", parts: [{ text: query }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`API Proxy error: ${response.status} -`, errorData);
                return null;
            }

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const textResponse = result.candidates[0].content.parts[0].text;
                console.log("[AIPortfolioLogic] Level 4 (API Proxy) successful. Raw response:", textResponse);

                try {
                    const jsonResponse = JSON.parse(textResponse);
                    if (jsonResponse.aiInsight || jsonResponse.results || jsonResponse.followUpActions) {
                        return jsonResponse;
                    }
                } catch (e) {
                    // Not a JSON response, treat as plain text
                }

                return {
                    aiInsight: { [currentLanguage]: textResponse, en: textResponse },
                    results: [],
                    followUpActions: []
                };

            } else {
                console.warn("[AIPortfolioLogic] API Proxy response structure unexpected or empty.");
                return null;
            }

        } catch (error) {
            console.error("[AIPortfolioLogic] API Proxy call failed:", error);
            return null;
        }
    }

    /**
     * Formats an intent key into a user-friendly localized label.
     * @param {string} intentKey - The intent key (e.g., 'general_info', 'challenges').
     * @returns {string} User-friendly localized label.
     */
    function formatIntentLabel(intentKey) {
        const labels = {
            'general_info': { 'en': 'Overview', 'ko': '개요' },
            'challenges': { 'en': 'Challenges', 'ko': '도전 과제' },
            'solutions': { 'en': 'Solutions', 'ko': '해결책' },
            'outcomes': { 'en': 'Outcomes', 'ko': '결과' },
            'learnings': { 'en': 'Learnings', 'ko': '배운 점' },
            'redo': { 'en': 'If Redo', 'ko': '다시 한다면' },
            'motivation': { 'en': 'Motivation', 'ko': '계기' },
            'contributions': { 'en': 'Contributions', 'ko': '기여' },
            'tech_used': { 'en': 'Tech Used', 'ko': '사용 기술' },
            'proficiency': { 'en': 'Proficiency', 'ko': '숙련도' },
            'usage': { 'en': 'Usage', 'ko': '사용처' },
            'experience': { 'en': 'Experience', 'ko': '경험' },
            'confident': { 'en': 'Most Confident', 'ko': '가장 자신 있는' },
            'achievements': { 'en': 'Achievements', 'ko': '성과' },
            'skills_applied': { 'en': 'Skills Applied', 'ko': '적용 기술' },
            'summary': { 'en': 'Summary', 'ko': '요약' },
            'role_details': { 'en': 'Role Details', 'ko': '역할 상세' },
            'why_this_role': { 'en': 'Why this role?', 'ko': '왜 이 역할이었나요?' },
            'biggest_challenge': { 'en': 'Biggest Challenge', 'ko': '가장 큰 도전' },
            'proudest_achievement': { 'en': 'Proudest Achievement', 'ko': '가장 자랑스러운 성과' },
            'failure_example': { 'en': 'Failure Example', 'ko': '실패 사례' },
            'ai_integration': { 'en': 'AI Integration', 'ko': 'AI 통합' }
        };
        return labels[intentKey] ? labels[intentKey][currentLanguage] : intentKey;
    }

    /**
     * Generates the final AI response object based on the detected intent (match object) and raw query.
     * @param {object} match - The matching object returned from local libraries or API.
     * @param {string} rawQuery - The original user query.
     * @param {object} sessionContext - Current session context.
     * @returns {object} Formatted response object for UI rendering.
     */
    function generateFinalResponse(match, rawQuery, sessionContext) {
        let response = {
            aiInsight: '',
            results: [],
            followUpActions: [],
            additionalInfo: '',
            response_type: 'text_only',
            action: null, // Actions for UI (navigate, show_specific_item_details etc.)
            target_page: null,
            url_fragment: null
        };

        // If the match already contains a full structured response (e.g., from API proxy or `search_documents`), use it directly.
        if (match.aiInsight !== undefined || match.results?.length > 0 || match.followUpActions?.length > 0) {
            response.aiInsight = getLocalizedText(match.aiInsight);
            response.results = match.results || [];
            response.followUpActions = (match.followUpActions || []).map(action => ({
                ...action,
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query)
            }));
            response.response_type = match.response_type || 'text_only';
            response.action = match.action;
            response.target_page = match.target_page;
            response.url_fragment = match.url_fragment;
            response.additionalInfo = getLocalizedText(match.additionalInfo) || '';

            if (match.inferred_role && sessionContext) {
                sessionContext.inferredRole = match.inferred_role;
                console.log(`[AIPortfolioLogic] Inferred user role: ${sessionContext.inferredRole}`);
            }
            return response;
        }

        // --- Handle specific interactive phrases/categories (greetings, thanks, empathetic) ---
        if (['greeting', 'thank_you', 'empathetic'].includes(match.category)) {
            const prompts = knowledgeBase.interactive_phrases[`${match.category}_responses`]?.prompts;
            if (prompts) {
                let selectedPrompt;
                if (match.category === 'empathetic' && match.trigger_keywords) {
                    selectedPrompt = prompts.find(p => p.trigger_keywords && p.trigger_keywords.some(kw => rawQuery.toLowerCase().includes(kw.toLowerCase())));
                }
                if (!selectedPrompt) {
                    selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                }
                response.aiInsight = getLocalizedText(selectedPrompt.response || selectedPrompt);
                response.response_type = 'text_only';
                if (match.category === 'greeting') {
                    if (knowledgeBase.assistant_info && knowledgeBase.assistant_info.user_guidance_examples) {
                        response.followUpActions = knowledgeBase.assistant_info.user_guidance_examples.initial_suggestions.map(s => ({
                            label: getLocalizedText(s.label),
                            query: getLocalizedText(s.query)
                        }));
                    }
                } else if (match.category === 'empathetic' || match.category === 'thank_you') {
                    response.followUpActions = knowledgeBase.default_response.followUpActions.actions.slice(0, 3).map(s => ({
                        label: getLocalizedText(s.label),
                        query: getLocalizedText(s.query)
                    }));
                }
            }
            return response;
        }

        // --- 'What If' scenario handling ---
        if (match.category === 'what_if') {
            const scenario = knowledgeBase.what_if_scenarios.scenarios.find(s => s.id === match.item);
            if (scenario) {
                response.aiInsight = getLocalizedText(scenario.response);
                response.response_type = 'text_and_follow_ups';
                response.followUpActions = scenario.followUpActions.map(action => ({
                    label: getLocalizedText(action.label),
                    query: getLocalizedText(action.query),
                    action: action.action,
                    target_id: action.target_id,
                    category: action.category,
                    target_page: action.target_page,
                    url_fragment: action.url_fragment
                }));
            } else {
                response.aiInsight = getLocalizedText({
                    en: "That's an interesting 'what if' scenario! Could you specify what kind of situation you're curious about related to Oosu's experience?",
                    ko: "흥미로운 '만약 ~라면?' 시나리오네요! Oosu님의 경험과 관련하여 어떤 종류의 상황이 궁금하신지 구체적으로 알려주시겠어요?"
                });
                response.followUpActions = knowledgeBase.what_if_scenarios.scenarios.map(s => ({
                    label: getLocalizedText(s.response).substring(0, Math.min(getLocalizedText(s.response).length, 30)) + '...',
                    query: getLocalizedText(Array.isArray(s.trigger_keywords) ? s.trigger_keywords[0] : (s.trigger_keywords.en || s.trigger_keywords.ko || '')).toLowerCase(),
                    action: 'show_specific_item_details',
                    target_id: s.id,
                    category: 'what_if'
                }));
                response.response_type = 'text_and_follow_ups';
            }
            return response;
        }

        // --- NEW LOGIC FOR NAVIGATION CONFIRMATION ---
        if (match.category === 'navigation') {
            const pageData = knowledgeBase.navigation_map[match.target_page];
            if (pageData) {
                const pageName = getLocalizedText(pageData.name);
                response.aiInsight = getLocalizedText(knowledgeBase.interactive_phrases.navigation_confirmations.confirm_before_navigate)
                                    .replace('{page_name}', pageName);
                response.response_type = 'text_and_follow_ups';
                response.followUpActions.push({
                    label: getLocalizedText({en: "Yes, move me!", ko: "네, 이동할게요!"}),
                    query: `Maps to ${pageName}`, // This query is just for tracking/display
                    action: 'navigate_direct', // A new action to directly tell UI to navigate
                    target_page: match.target_page,
                    url_fragment: match.url_fragment
                });
                response.followUpActions.push({
                    label: getLocalizedText({en: "No, stay here.", ko: "아니요, 여기에 있을게요."}),
                    query: `stay on current page`, // For UI to cancel navigation
                    action: 'cancel_navigation'
                });
            } else {
                return getDefaultResponse(); // Page not found in navigation_map
            }
            return response;
        }

        // --- Special response for no AI projects ---
        if (match.category === 'no_ai_projects') {
            response.aiInsight = getLocalizedText({
                en: "Oosu doesn't have a dedicated project purely focused on AI or Machine Learning in the portfolio. However, many projects involve data-driven insights and problem-solving, which are foundational to AI thinking.",
                ko: "Oosu님의 포트폴리오에는 순수하게 인공지능 또는 머신러닝에만 집중된 프로젝트는 없습니다. 하지만 많은 프로젝트들이 데이터 기반의 인사이트와 문제 해결 과정을 포함하고 있으며, 이는 AI적 사고의 기반이 됩니다."
            });
            response.additionalInfo = getLocalizedText({
                en: "Would you like to explore projects that involve strong data analysis or complex problem-solving?",
                ko: "강력한 데이터 분석 또는 복잡한 문제 해결 과정을 담은 프로젝트들을 탐색해 보시겠어요?"
            });
            response.followUpActions = [
                { "label": { "en": "Show projects with data analysis.", "ko": "데이터 분석 프로젝트 보여줘." }, "query": { "en": "projects with data analysis", "ko": "데이터 분석 프로젝트" } },
                { "label": { "en": "Tell me about problem-solving.", "ko": "문제 해결 능력에 대해 알려줘." }, "query": { "en": "problem solving skill", "ko": "문제 해결 능력" } },
                { "label": { "en": "What are your main projects?", "ko": "주요 프로젝트는 어떤 것이 있나요?" }, "query": { "en": "main projects", "ko": "주요 프로젝트" } }
            ];
            response.response_type = 'text_and_follow_ups';
            return response;
        }

        // --- Handle main content categories (projects, skills, career etc.) ---
        const categoryBaseData = knowledgeBase.response_categories && knowledgeBase.response_categories[match.category] ?
                                 knowledgeBase.response_categories[match.category] : null;

        if (!categoryBaseData) {
            console.warn(`[AIPortfolioLogic] No category base data found for '${match.category}'. Falling back to default response.`);
            return getDefaultResponse();
        }

        const positiveStarts = knowledgeBase.interactive_phrases.positive_start.prompts;
        const randomPositiveStart = positiveStarts[Math.floor(Math.random() * positiveStarts.length)];
        response.aiInsight = getLocalizedText(randomPositiveStart) + " " + getLocalizedText(categoryBaseData.aiInsight);

        response.response_type = categoryBaseData.response_type;

        if (categoryBaseData.items) {
            if (match.item) {
                const specificItem = categoryBaseData.items.find(i => i.id === match.item);
                if (specificItem) {
                    let itemContent = '';
                    if (match.intent && specificItem.details && specificItem.details.narrative_qna && specificItem.details.narrative_qna[match.intent]) {
                        const qnaAnswer = specificItem.details.narrative_qna[match.intent];
                        itemContent += `<h4>${getLocalizedText(specificItem.title || specificItem.name)}</h4>`;
                        itemContent += `<p><strong>${formatIntentLabel(match.intent)}:</strong> ${getLocalizedText(qnaAnswer)}</p>`;
                        response.aiInsight += itemContent;
                        response.response_type = 'text_only';
                    } else if (match.category === 'skills' && specificItem.details) {
                        itemContent += `<h4>${getLocalizedText(specificItem.name)}</h4><p>${getLocalizedText(specificItem.description)}</p><ul>`;
                        specificItem.details.forEach(detail => {
                            itemContent += `<li><strong>${detail.name}</strong>: ${detail.level} (${detail.experience_years} experience)`;
                            if (detail.projects_used_in && detail.projects_used_in.length > 0) {
                                const projectsUsed = detail.projects_used_in.map(pId => {
                                    const proj = knowledgeBase.response_categories.projects.items.find(pi => pi.id === pId);
                                    return proj ? getLocalizedText(proj.title) : pId;
                                }).join(', ');
                                itemContent += `<br> - Used in: ${projectsUsed}`;
                            }
                            if (detail.narrative_qna && detail.narrative_qna.advice) {
                                itemContent += `<br><em>💡 ${getLocalizedText(detail.narrative_qna.advice)}</em>`;
                            }
                            itemContent += `</li>`;
                        });
                        itemContent += `</ul>`;
                        response.aiInsight += itemContent;
                        response.response_type = 'text_and_link';
                    } else if (match.category === 'lab' && specificItem.demonstration_link) {
                        itemContent += `<h4>${getLocalizedText(specificItem.name)}</h4><p>${getLocalizedText(specificItem.description)}</p>`;
                        itemContent += `<p><strong>Technologies Used:</strong> ${(specificItem.technologies_used || []).join(', ')}</p>`;
                        itemContent += `<p><a href="${specificItem.demonstration_link}" target="_blank">${currentLanguage === 'ko' ? '데모 보기' : 'View Demo'}</a></p>`;
                        response.aiInsight += itemContent;
                        response.response_type = 'text_and_link';
                    } else {
                        response.results = [{
                            type: match.category.slice(0, -1),
                            title: getLocalizedText(specificItem.title || specificItem.name),
                            description: getLocalizedText(specificItem.description),
                            tags: specificItem.tags || specificItem.keywords || [],
                            link: specificItem.link,
                            keywords: specificItem.keywords || [],
                            id: specificItem.id
                        }];
                        response.response_type = 'cards_and_link';
                    }
                } else {
                    console.warn(`[AIPortfolioLogic] Specific item '${match.item}' not found in category '${match.category}'. Listing all items in category.`);
                    response.results = categoryBaseData.items.map(item => ({
                        type: match.category.slice(0, -1),
                        title: getLocalizedText(item.title || item.name),
                        description: getLocalizedText(item.description),
                        tags: item.tags || item.keywords || [],
                        link: item.link,
                        keywords: item.keywords || [],
                        id: item.id
                    }));
                    response.response_type = 'cards_and_link';
                }
            } else {
                response.results = categoryBaseData.items.map(item => ({
                    type: match.category.slice(0, -1),
                    title: getLocalizedText(item.title || item.name),
                    description: getLocalizedText(item.description),
                    tags: item.tags || item.keywords || [],
                    link: item.link,
                    keywords: item.keywords || [],
                    id: item.id
                }));
                response.response_type = 'cards_and_link';
            }
        } else if (match.category === 'career' && match.subSection) {
            const subSectionData = categoryBaseData.sections[match.subSection];
            if (subSectionData) {
                let sectionHtml = `<h4>${getLocalizedText(subSectionData.title)}</h4><ul>`;
                subSectionData.items.forEach(item => {
                    sectionHtml += `<li><strong>${getLocalizedText(item.title)}</strong> (${getLocalizedText(item.description)})`;
                    if (match.intent && item.narrative_qna && item.narrative_qna[match.intent]) {
                        sectionHtml += `<br><em>${formatIntentLabel(match.intent)}: ${getLocalizedText(item.narrative_qna[match.intent])}</em>`;
                    } else if (match.intent === 'general_info' && item.achievements && Array.isArray(item.achievements)) {
                        sectionHtml += `<br><em>${formatIntentLabel('achievements')}: ${item.achievements.map(a => getLocalizedText(a)).join(', ')}</em>`;
                    }
                    sectionHtml += `</li>`;
                });
                sectionHtml += `</ul>`;
                response.aiInsight += sectionHtml;
                response.response_type = 'text_and_link';
                response.url_fragment = subSectionData.url_fragment;
            } else {
                return getDefaultResponse();
            }
        } else if (match.category === 'about_me_deep_dive') {
            let aboutMeText = '';
            for (const key in categoryBaseData.content) {
                aboutMeText += `<p>${getLocalizedText(categoryBaseData.content[key])}</p>`;
            }
            response.aiInsight += aboutMeText;
            response.response_type = 'text_and_link';
            response.url_fragment = categoryBaseData.url_fragment;
        } else if (match.category === 'portfolio_building_tips') {
            let tipsHtml = '';
            categoryBaseData.items.forEach(tip => {
                tipsHtml += `<p>${getLocalizedText(tip)}</p>`;
            });
            if (categoryBaseData.additionalInfo) {
                tipsHtml += `<p><em>${getLocalizedText(categoryBaseData.additionalInfo)}</em></p>`;
            }
            response.aiInsight += tipsHtml;
            response.response_type = 'list_and_text';
        } else if (match.category === 'site_structure_overview') {
            let structureHtml = '<ul>';
            categoryBaseData.items.forEach(section => {
                structureHtml += `<li><strong>${getLocalizedText(section.name)}</strong>: ${getLocalizedText(section.description)}</li>`;
            });
            structureHtml += '</ul>';
            response.aiInsight += structureHtml;
            response.response_type = 'list_and_link';
        } else if (match.category === 'connect') {
            response.aiInsight += `<p>${getLocalizedText(categoryBaseData.contact_details)}</p>`;
            response.response_type = 'text_and_link';
            response.url_fragment = categoryBaseData.url_fragment;
        } else {
            response.aiInsight += getLocalizedText(categoryBaseData.aiInsight);
            response.response_type = categoryBaseData.response_type;
        }

        // Add general category follow-up actions
        if (categoryBaseData && categoryBaseData.followUpActions && categoryBaseData.followUpActions.length > 0) {
            response.followUpActions = [...response.followUpActions, ...categoryBaseData.followUpActions.map(action => ({
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query),
                action: action.action,
                target_id: action.target_id,
                category: action.category,
                target_page: action.target_page,
                url_fragment: action.url_fragment,
                intent: action.intent
            }))];
        }

        // Add specific item's narrative Q&A as follow-up actions
        if (match.item && categoryBaseData && categoryBaseData.items) {
            const specificItem = categoryBaseData.items.find(i => i.id === match.item);
            if (specificItem && specificItem.details && specificItem.details.narrative_qna) {
                const narrativeQna = specificItem.details.narrative_qna;
                for (const qnaKey in narrativeQna) {
                    if (qnaKey !== '_label' && qnaKey !== match.intent && typeof narrativeQna[qnaKey] === 'object' && (narrativeQna[qnaKey][currentLanguage] || narrativeQna[qnaKey]['en'])) {
                        const queryLabel = formatIntentLabel(qnaKey);
                        const itemTitle = getLocalizedText(specificItem.title || specificItem.name);
                        response.followUpActions.unshift({
                            label: `${queryLabel} (${itemTitle})`,
                            query: `${itemTitle.toLowerCase()} ${getLocalizedText(knowledgeBase.keywords_map[match.category]?.intent_keywords?.[qnaKey]?.[0] || qnaKey).toLowerCase()}`,
                            action: 'show_specific_item_details',
                            target_id: specificItem.id,
                            category: match.category,
                            intent: qnaKey
                        });
                    }
                }
            }
        }

        // Add specific career item's narrative Q&A as follow-up actions
        if (match.subSection && categoryBaseData && categoryBaseData.sections && categoryBaseData.sections[match.subSection] && categoryBaseData.sections[match.subSection].items) {
             categoryBaseData.sections[match.subSection].items.forEach(item => {
                 if (item.narrative_qna) {
                     for (const qnaKey in item.narrative_qna) {
                         if (qnaKey !== '_label' && qnaKey !== match.intent && typeof item.narrative_qna[qnaKey] === 'object' && (item.narrative_qna[qnaKey][currentLanguage] || item.narrative_qna[qnaKey]['en'])) {
                             const queryLabel = formatIntentLabel(qnaKey);
                             const itemTitle = getLocalizedText(item.title);
                             response.followUpActions.unshift({
                                 label: `${queryLabel} (${itemTitle})`,
                                 query: `${itemTitle.toLowerCase()} ${getLocalizedText(knowledgeBase.keywords_map[match.category]?.intent_keywords?.[qnaKey]?.[0] || qnaKey).toLowerCase()}`,
                                 action: 'show_specific_item_details',
                                 target_id: item.id,
                                 category: match.category,
                                 subSection: match.subSection,
                                 intent: qnaKey
                             });
                         }
                     }
                 }
             });
         }

        // Remove duplicates in follow-up actions
        response.followUpActions = Array.from(new Set(response.followUpActions.map(a => JSON.stringify(a))))
            .map(s => JSON.parse(s));

        const addRandomPrompt = Math.random() < 0.2;
        if (response.response_type === 'text_only' && response.aiInsight.length > 50 && addRandomPrompt) {
            const randomGem = knowledgeBase.interactive_phrases.random_gems.items[Math.floor(Math.random() * knowledgeBase.interactive_phrases.random_gems.items.length)];
            response.aiInsight += `<br><br><em>💡 ${getLocalizedText(randomGem.text)}</em>`;
        }

        if (response.followUpActions.length < 3 && sessionContext.currentPage && knowledgeBase.interactive_phrases.context_management.proactive_engagement_by_page) {
            const pageSpecificPrompt = knowledgeBase.interactive_phrases.context_management.proactive_engagement_by_page[`${sessionContext.currentPage}_page_active`];
            if (pageSpecificPrompt) {
                let proactiveSuggestionText = getLocalizedText(pageSpecificPrompt);
                if (sessionContext.highlightedTopic) {
                    proactiveSuggestionText = proactiveSuggestionText.replace('[highlighted_topic]', getLocalizedText(sessionContext.highlightedTopic));
                }
                if (sessionContext.inferredRole) {
                    proactiveSuggestionText = proactiveSuggestionText.replace('[inferred_role]', getLocalizedText({en: sessionContext.inferredRole, ko: sessionContext.inferredRole === 'recruiter' ? '채용 담당자' : sessionContext.inferredRole}));
                }
                response.additionalInfo = (response.additionalInfo ? response.additionalInfo + "<br>" : "") + proactiveSuggestionText;
            }
        }

        return response;
    }


    /**
     * Provides a default response when no specific information or intent is matched.
     * @returns {object} Formatted default response object.
     */
    function getDefaultResponse() {
        if (!knowledgeBase || !knowledgeBase.default_response || !knowledgeBase.interactive_phrases) {
            console.error("[AIPortfolioLogic] Default response data missing or knowledge base not loaded. Cannot form default response.");
            return {
                aiInsight: {
                    en: "Sorry, I'm currently unable to provide a response. Please try rephrasing your question.",
                    ko: "죄송합니다. 현재 응답을 제공할 수 없습니다. 질문을 다르게 바꿔서 다시 시도해주세요."
                },
                results: [],
                followUpActions: []
            };
        }

        const defaultData = knowledgeBase.default_response;
        let response = {
            aiInsight: getLocalizedText(defaultData.aiInsight),
            results: [],
            followUpActions: defaultData.followUpActions.actions.map(action => ({
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query)
            })),
            additionalInfo: '',
            response_type: 'text_only'
        };

        const clarificationPrompts = knowledgeBase.interactive_phrases.clarification_requests.prompts;
        const randomPrompt = clarificationPrompts[Math.floor(Math.random() * clarificationPrompts.length)];
        response.additionalInfo = getLocalizedText(randomPrompt);
        return response;
    }

    // Public API exposed via window.AIPortfolioLogic
    return {
        /**
         * Initiates the loading of the knowledge base and necessary AI libraries.
         * This can be called multiple times; it will only load once.
         * @returns {Promise<void>}
         */
        loadKnowledgeBase: async function() {
            if (!isKnowledgeBaseLoaded) {
                await loadKnowledgeBase();
            }
        },

        /**
         * Sets the current language for the AI assistant.
         * @param {string} lang - 'en' or 'ko'.
         */
        setLanguage: function(lang) {
            currentLanguage = lang;
            console.log(`[AIPortfolioLogic] Language set to: ${currentLanguage}`);
        },

        /**
         * Retrieves initial suggestion queries for display in the UI.
         * @returns {Array<object>} An array of suggestion objects {label, query}.
         */
        getInitialSuggestions: function() {
            if (knowledgeBase && knowledgeBase.assistant_info && knowledgeBase.assistant_info.user_guidance_examples) {
                return knowledgeBase.assistant_info.user_guidance_examples.initial_suggestions.map(s => ({
                    label: getLocalizedText(s.label),
                    query: getLocalizedText(s.query)
                }));
            }
            return [];
        },

        /**
         * Main function to get an AI-generated response for a given user query.
         * @param {string} query - The user's query.
         * @param {object} sessionContext - The current session context (optional).
         * @returns {Promise<object>} A structured response object.
         */
        getAIResponse: async function(query, sessionContext = {}) {
            sessionContext = sessionContext || {};

            if (!isKnowledgeBaseLoaded) {
                console.error("[AIPortfolioLogic] Knowledge Base not loaded. Attempting to load...");
                try {
                    await loadKnowledgeBase();
                    if (!isKnowledgeBaseLoaded) {
                         console.error("[AIPortfolioLogic] Knowledge Base failed to load after retry. Returning default response.");
                         return getDefaultResponse();
                    }
                } catch (e) {
                    console.error("[AIPortfolioLogic] Critical error during knowledge base loading:", e);
                    return getDefaultResponse();
                }
            }

            let responseTemplate = null;
            const normalizedQuery = normalizeQuery(query, currentLanguage);
            const synonymsMap = knowledgeBase.synonyms_map[currentLanguage] || knowledgeBase.synonyms_map['en'];

            console.log(`[AIPortfolioLogic] Processing query: "${query}" (Normalized: "${normalizedQuery}")`);

            // Layer 1: Keyword-based intent detection (including greetings, what-if, navigation, and content categories)
            console.log("[AIPortfolioLogic] Attempting Level 1: Keyword-based intent detection...");
            let keywordMatch = findBestKeywordMatch(normalizedQuery, knowledgeBase.keywords_map, synonymsMap);
            
            if (keywordMatch) {
                console.log("[AIPortfolioLogic] Level 1 (Keyword Match) successful:", keywordMatch);
                responseTemplate = keywordMatch;
                return generateFinalResponse(responseTemplate, query, sessionContext);
            } else {
                console.log("[AIPortfolioLogic] Level 1 (Keyword Match) found no specific intent.");
            }

            // Layer 2: Fuse.js (fuzzy keyword/phrase matching based on pre-defined search_documents)
            if (searchDocuments.length > 0) {
                console.log("[AIPortfolioLogic] Attempting Level 2: Fuse.js search...");
                const fuseResult = runFuseSearch(query);
                if (fuseResult) {
                    console.log("[AIPortfolioLogic] Level 2 (Fuse.js) successful.");
                    return generateFinalResponse(fuseResult, query, sessionContext);
                } else {
                    console.log("[AIPortfolioLogic] Level 2 (Fuse.js) found no strong match.");
                }
            } else {
                console.warn("[AIPortfolioLogic] Fuse.js disabled due to empty search_documents.");
            }

            // Layer 3: Semantic search (Transformers.js)
            if (isTransformersReady) {
                console.log("[AIPortfolioLogic] Attempting Level 3: Transformers.js semantic search...");
                const transformersResult = await runTransformers(query);
                if (transformersResult) {
                    console.log("[AIPortfolioLogic] Level 3 (Transformers.js) successful.");
                    return generateFinalResponse(transformersResult, query, sessionContext);
                } else {
                    console.log("[AIPortfolioLogic] Level 3 (Transformers.js) found no strong semantic match.");
                }
            } else {
                console.warn("[AIPortfolioLogic] Transformers.js semantic search disabled.");
            }

            // Layer 4: Fallback to Serverless API Proxy (LLM)
            console.log("[AIPortfolioLogic] Attempting Level 4: Serverless API Proxy (LLM)...");
            const apiResult = await callApiProxy(query);
            if (apiResult) {
                console.log("[AIPortfolioLogic] Level 4 (API Proxy) successful.");
                return generateFinalResponse(apiResult, query, sessionContext);
            } else {
                console.log("[AIPortfolioLogic] Level 4 (API Proxy) failed or returned no content.");
            }

            console.warn("[AIPortfolioLogic] All AI logic layers failed to find a specific response. Returning default.");
            return getDefaultResponse();
        },

        get knowledgeBase() {
            return knowledgeBase;
        },

        getThinkingPrompt: function() {
            if (knowledgeBase && knowledgeBase.interactive_phrases && knowledgeBase.interactive_phrases.thinking.prompts) {
                const prompts = knowledgeBase.interactive_phrases.thinking.prompts;
                const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                return getLocalizedText(randomPrompt);
            }
            return currentLanguage === 'ko' ? "생각 중입니다..." : "Thinking...";
        }
    };
})();