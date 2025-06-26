// js/ai_chat_logic.js
/*
* AI Portfolio Chat - Core Logic (Lazy Loaded)
* This script contains the core AI logic for processing user queries,
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
    let documents; // Reference to the search_documents from the knowledge base

    // Track if the knowledge base has been loaded and initialized
    let isKnowledgeBaseLoaded = false;

    /**
     * Helper to check if external global libraries (Fuse, nlp) are loaded.
     * `pipeline` and `cos_sim` are handled by the top-level import in this module.
     * @returns {void}
     * @throws {Error} if a required global library is not found.
     */
    function checkExternalLibraries() {
        if (typeof Fuse === 'undefined') {
            console.error("[AIPortfolioLogic] Fuse.js is not loaded.");
            throw new Error("Required library Fuse.js not available.");
        }
        if (typeof nlp === 'undefined') {
            console.warn("[AIPortfolioLogic] Compromise.js (nlp) is not loaded. English NLP might be limited.");
        }
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
            // First, ensure all necessary external JS libraries (non-module globals) are loaded.
            checkExternalLibraries();

            // Fetch the knowledge base JSON
            console.log("[AIPortfolioLogic] Fetching knowledge base...");
            const response = await fetch('../common/ai_chat_data.json');
            if (!response.ok) throw new Error(`Knowledge base file not found or failed to fetch: ${response.status}`);
            knowledgeBase = await response.json();
            documents = knowledgeBase.search_documents; // Array of documents for Fuse.js and Transformers.js

            if (!documents || !Array.isArray(documents) || documents.length === 0) {
                console.warn("[AIPortfolioLogic] No search documents found in knowledgeBase. Fuse.js and Transformers.js will have limited functionality.");
                documents = []; // Ensure it's an empty array to prevent errors
            }

            // Initialize Fuse.js
            fuse = new Fuse(documents, {
                keys: ['query_phrases'],
                threshold: 0.6, // Adjust for stricter/looser matching
                includeScore: true // Include score for filtering
            });
            console.log("[AIPortfolioLogic] Fuse.js initialized.");

            // Create embeddings for Transformers.js if pipeline is available
            if (typeof pipeline === 'function' && pipeline !== null) {
                const itemsToEmbed = documents.map(doc => {
                    const text = doc.text_for_embedding && typeof doc.text_for_embedding === 'object' ?
                        doc.text_for_embedding[currentLanguage] || doc.text_for_embedding['en'] :
                        doc.text_for_embedding;
                    return typeof text === 'string' ? text : ''; // Ensure it's a string
                }).filter(Boolean); // Filter out empty strings that cause issues for the model

                if (itemsToEmbed.length > 0) {
                     extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small');
                     dbEmbeddings = await extractor(itemsToEmbed, { pooling: 'mean', normalize: true });
                     console.log("[AIPortfolioLogic] Document embeddings created.");
                } else {
                     console.warn("[AIPortfolioLogic] No valid text to create embeddings from. Semantic search may not work.");
                     dbEmbeddings = null;
                }
            } else {
                console.warn("[AIPortfolioLogic] Transformers.js pipeline is not available. Semantic search will be disabled.");
            }

            isKnowledgeBaseLoaded = true; // Mark as loaded successfully
            console.log("[AIPortfolioLogic] Knowledge base and local libraries ready.");

        } catch (error) {
            console.error("[AIPortfolioLogic] Critical error during knowledge base load or library initialization:", error);
            knowledgeBase = null; // Clear on error
            fuse = null;
            extractor = null;
            dbEmbeddings = null;
            isKnowledgeBaseLoaded = false; // Mark as failed
            throw error; // Re-throw to propagate the error
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
     * @param {string|object} field - Multi-language object or a single string.
     * @returns {string} Text in the current language or fallback to English/empty string.
     */
    function getLocalizedText(field) {
        if (typeof field === 'object' && field !== null) {
            return field[currentLanguage] || field['en'] || '';
        }
        return field || '';
    }


    /**
     * Checks if a query contains any of the provided keywords, including synonyms.
     * @param {string} query - User query (should be lowercase).
     * @param {Array<string>} keywords - Array of keywords to match (should be lowercase).
     * @param {Object} synonymsMap - Synonyms map for the current language.
     * @returns {boolean} True if a match is found, false otherwise.
     */
    function matchesKeyword(query, keywords, synonymsMap) {
        for (const keyword of keywords) {
            if (query.includes(keyword)) {
                return true;
            }
            if (synonymsMap && synonymsMap[keyword]) {
                if (synonymsMap[keyword].some(s => query.includes(s.toLowerCase()))) {
                    return true;
                }
            }
        }
        return false;
    }

    // 1. Fuse.js search logic (keyword/phrase matching)
    function runFuseSearch(query) {
        if (!fuse || !documents || documents.length === 0) {
            console.warn("[AIPortfolioLogic] Fuse.js not initialized or no documents to search.");
            return null;
        }
        const results = fuse.search(query);
        // Only consider a match if the score is below a certain threshold (lower score is better)
        if (results.length > 0 && results[0].score < 0.3) { // Stricter threshold for direct matches
            console.log(`[AIPortfolioLogic] Fuse.js matched: ${results[0].item.id} with score ${results[0].score}`);
            return results[0].item.response; // Return the response template from the matched document
        }
        return null;
    }


    // 2. Compromise.js (English only) for advanced NLP/intent detection
    function runCompromise(query) {
        if (typeof nlp === 'undefined' || currentLanguage !== 'en') {
            return null;
        }

        const doc = nlp(query.toLowerCase());

        // Check for specific entities or patterns to infer intent
        if (doc.has('(project|projects|work)')) {
            if (doc.has('(ai|machine learning|ml)')) {
                const aiRelated = knowledgeBase.response_categories.projects.items.filter(p =>
                    (p.tags && p.tags.some(tag => tag.toLowerCase().includes('ai') || tag.toLowerCase().includes('machine learning'))) ||
                    (p.keywords && p.keywords.some(kw => kw.toLowerCase().includes('ai') || kw.toLowerCase().includes('machine learning')))
                );
                if (aiRelated.length > 0) {
                    // Return the first AI-related project as a specific item match
                    return { category: 'projects', item: aiRelated[0].id, aiInsight: { en: `Here's a project related to AI or data analysis: ${aiRelated[0].title.en || aiRelated[0].title}` } };
                }
                return { category: 'no_ai_projects' }; // Specific response for no AI projects
            }
            return { category: 'projects', item: null }; // General project query
        }
        if (doc.has('(skill|skills|tech stack)')) {
            return { category: 'skills', item: null }; // General skills query
        }
        if (doc.has('(career|experience|job)')) {
            return { category: 'career', item: null }; // General career query
        }
        if (doc.has('(contact|connect|email)')) {
            return { category: 'connect', item: null }; // Connect query
        }
        if (doc.has('(oosu|about you|who are you)')) {
            return { category: 'about_me_deep_dive', item: null }; // About Oosu query
        }
        if (doc.has('(what if)')) {
            // Simple "what if" detection, further refinement would need specific scenario detection
            return { category: 'what_if', item: 'example_scenario_id' }; // Example scenario
        }
        if (doc.has('(thank you|thanks)')) {
            return { category: 'thank_you' };
        }
        if (doc.has('(hello|hi|hey)')) {
            return { category: 'greeting' };
        }
        if (doc.has('(sorry|apologize|my bad)')) {
            return { category: 'empathetic', trigger_keywords: ['sorry'] };
        }

        return null; // No matching intent
    }

    // 3. Transformers.js for semantic search
    async function runTransformers(query) {
        if (!extractor || !dbEmbeddings || typeof cos_sim === 'undefined' || pipeline === null) { // Added pipeline check
            console.warn("[AIPortfolioLogic] Transformers.js model, embeddings, or cos_sim not ready, or pipeline is null. Semantic search skipped.");
            return null;
        }

        try {
            const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });
            let bestMatch = { score: -1, index: -1 };

            for (let i = 0; i < dbEmbeddings.dims[0]; ++i) {
                const docEmbedding = dbEmbeddings.slice([i, i + 1]);
                const score = (queryEmbedding.dot(docEmbedding.T)).data[0]; // cos_sim for Float32Array
                if (score > bestMatch.score) {
                    bestMatch = { score, index: i };
                }
            }

            // Consider a match only if similarity score is high enough (e.g., > 0.75)
            if (bestMatch.score > 0.75) {
                console.log(`[AIPortfolioLogic] Transformers.js matched: ${documents[bestMatch.index].id} with score ${bestMatch.score}`);
                return documents[bestMatch.index].response; // Return response template
            }
        } catch (e) {
            console.error("[AIPortfolioLogic] Error during Transformers.js processing:", e);
        }
        return null;
    }

    // 4. Korean NLP/Keyword Matching (Placeholder for actual Korean.js)
    function runKoreanJs(query) {
        if (currentLanguage !== 'ko') {
            console.log("[AIPortfolioLogic] Skipping Korean.js as current language is not Korean.");
            return null;
        }
        // This part needs to be implemented based on the actual Korean.js library functionality.
        // For now, it's a dummy logic based on keyword matching.
        const normalizedQuery = query.toLowerCase();
        const synonymsMap = knowledgeBase.synonyms_map[currentLanguage] || knowledgeBase.synonyms_map['en'];

        if (matchesKeyword(normalizedQuery, ["프로젝트", "작품", "포트폴리오"], synonymsMap)) {
            if (matchesKeyword(normalizedQuery, ["ai", "인공지능", "머신러닝"], synonymsMap)) {
                const aiRelated = knowledgeBase.response_categories.projects.items.filter(p =>
                    (p.tags && p.tags.some(tag => matchesKeyword(tag.toLowerCase(), ["ai", "인공지능"], synonymsMap))) ||
                    (p.keywords && p.keywords.some(kw => matchesKeyword(kw.toLowerCase(), ["ai", "인공지능"], synonymsMap)))
                );
                if (aiRelated.length > 0) {
                    return { category: 'projects', item: aiRelated[0].id };
                }
                return { category: 'no_ai_projects' };
            }
            return { category: 'projects', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["스킬", "기술", "기술 스택", "능력"], synonymsMap)) {
            return { category: 'skills', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["경력", "경험", "직무", "이력"], synonymsMap)) {
            return { category: 'career', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["연락", "컨택", "문의", "이메일"], synonymsMap)) {
            return { category: 'connect', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["오수", "oosu", "오수에 대해", "누구", "자기소개"], synonymsMap)) {
            return { category: 'about_me_deep_dive', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["감사합니다", "고마워", "수고했어"], synonymsMap)) {
            return { category: 'thank_you' };
        }
        if (matchesKeyword(normalizedQuery, ["안녕", "안녕하세요", "헬로"], synonymsMap)) {
            return { category: 'greeting' };
        }
        if (matchesKeyword(normalizedQuery, ["죄송", "미안", "실수"], synonymsMap)) {
            return { category: 'empathetic', trigger_keywords: ["죄송", "미안", "실수"] };
        }
        if (matchesKeyword(normalizedQuery, ["만약", "가정", "만약에"], synonymsMap)) {
            return { category: 'what_if', item: 'example_scenario_id' };
        }

        return null; // No matching intent
    }

    // 5. Serverless API Proxy Call (Highest fallback)
    async function callApiProxy(query) {
        try {
            console.log("[AIPortfolioLogic] Calling API Proxy...");
            const payload = {
                contents: [{ role: "user", parts: [{ text: query }] }],
                generationConfig: {
                    // You might add a responseSchema here if you expect structured JSON from the LLM
                    // For now, let's assume it returns a general text response or simple JSON.
                }
            };
            const apiKey = ""; // Canvas will automatically provide this at runtime
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
                console.log("[AIPortfolioLogic] API Proxy raw response:", textResponse);

                // Attempt to parse as JSON if it looks like JSON
                try {
                    const jsonResponse = JSON.parse(textResponse);
                    // If the LLM returns a structured response matching expected format
                    if (jsonResponse.aiInsight || jsonResponse.results || jsonResponse.followUpActions) {
                        return jsonResponse;
                    }
                } catch (e) {
                    // Not a JSON response, treat as plain text
                }

                // If it's plain text, wrap it in a simple response object
                return {
                    aiInsight: { [currentLanguage]: textResponse, en: textResponse }, // Assuming LLM gives general text
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
            'general_info': {'en': 'Overview', 'ko': '개요'},
            'challenges': {'en': 'Challenges', 'ko': '도전 과제'},
            'solutions': {'en': 'Solutions', 'ko': '해결책'},
            'outcomes': {'en': 'Outcomes', 'ko': '결과'},
            'learnings': {'en': 'Learnings', 'ko': '배운 점'},
            'redo': {'en': 'If Redo', 'ko': '다시 한다면'},
            'motivation': {'en': 'Motivation', 'ko': '계기'},
            'contributions': {'en': 'Contributions', 'ko': '기여'},
            'tech_used': {'en': 'Tech Used', 'ko': '사용 기술'},
            'proficiency': {'en': 'Proficiency', 'ko': '숙련도'},
            'usage': {'en': 'Usage', 'ko': '사용처'},
            'experience': {'en': 'Experience', 'ko': '경험'},
            'confident': {'en': 'Most Confident', 'ko': '가장 자신 있는'},
            'achievements': {'en': 'Achievements', 'ko': '성과'},
            'skills_applied': {'en': 'Skills Applied', 'ko': '적용 기술'},
            'summary': {'en': 'Summary', 'ko': '요약'},
            'role_details': {'en': 'Role Details', 'ko': '역할 상세'},
            'why_this_role': {'en': 'Why this role?', 'ko': '왜 이 역할이었나요?'},
            'biggest_challenge': {'en': 'Biggest Challenge', 'ko': '가장 큰 도전'},
            'proudest_achievement': {'en': 'Proudest Achievement', 'ko': '가장 자랑스러운 성과'},
            'failure_example': {'en': 'Failure Example', 'ko': '실패 사례'},
            'ai_integration': {'en': 'AI Integration', 'ko': 'AI 통합'}
        };
        return labels[intentKey] ? labels[intentKey][currentLanguage] : intentKey;
    }


    /**
     * Generates the final AI response object based on the detected intent (match object) and raw query.
     * This function formats the data into a structure suitable for UI rendering.
     * @param {object} match - The matching object returned from local libraries or API.
     * @param {string} rawQuery - The original user query.
     * @returns {object} Formatted response object for UI rendering.
     */
    function generateFinalResponse(match, rawQuery) {
        let response = {
            aiInsight: '',
            results: [],
            followUpActions: [],
            additionalInfo: '',
            response_type: 'text_only', // Default response type
            action: match.action || null, // Action to take (e.g., 'navigate')
            target_page: match.target_page || null, // Target page for navigation
            url_fragment: match.url_fragment || null // URL fragment for navigation
        };

        // If the match already contains a full structured response (e.g., from API proxy), use it directly.
        if (match.aiInsight !== undefined || match.results.length > 0 || match.followUpActions.length > 0) {
            response.aiInsight = getLocalizedText(match.aiInsight);
            response.results = match.results || [];
            response.followUpActions = (match.followUpActions || []).map(action => ({
                ...action,
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query) // Query for AI logic, usually English
            }));
            response.response_type = match.response_type || 'text_only';
            response.action = match.action;
            response.target_page = match.target_page;
            response.url_fragment = match.url_fragment;
            response.additionalInfo = getLocalizedText(match.additionalInfo) || '';
            return response;
        }

        // --- Handle specific interactive phrases/categories (highest priority if not from API) ---
        if (['greeting', 'thank_you', 'empathetic'].includes(match.category)) {
            const prompts = knowledgeBase.interactive_phrases[`${match.category}_responses`]?.prompts;
            if (prompts) {
                let selectedPrompt;
                if (match.category === 'empathetic' && match.trigger_keywords) {
                    selectedPrompt = prompts.find(p => p.trigger_keywords && p.trigger_keywords.some(kw => rawQuery.toLowerCase().includes(getLocalizedText(kw).toLowerCase())));
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
                    // Provide some general follow-ups for empathetic/thank you responses
                    response.followUpActions = knowledgeBase.interactive_phrases.no_results_follow_up.prompts.slice(0, 2).map(s => ({
                        label: getLocalizedText(s),
                        query: getLocalizedText(s)
                    }));
                }
            }
            return response;
        }

        // --- 'What If' scenario handling ---
        if (match.category === 'what_if' && match.item) {
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
            }
            return response;
        }

        // --- Specific page navigation (`navigation` category) ---
        if (match.category === 'navigation') {
            const pageData = knowledgeBase.navigation_map[match.target_page];
            if (pageData) {
                response.aiInsight = getLocalizedText(knowledgeBase.interactive_phrases.navigation_confirmations.navigating).replace('{page_name}', getLocalizedText(pageData.name));
                response.action = 'navigate';
                response.target_page = match.target_page;
                response.url_fragment = pageData.page.split('#')[1] || null; // Extract fragment if exists
                response.response_type = 'text_only';
            } else {
                return getDefaultResponse();
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
                {"label": {"en": "Show projects with data analysis.", "ko": "데이터 분석 프로젝트 보여줘."}, "query": {"en": "projects with data analysis", "ko": "데이터 분석 프로젝트"}},
                {"label": {"en": "Tell me about problem-solving.", "ko": "문제 해결 능력에 대해 알려줘."}, "query": {"en": "problem solving skill", "ko": "문제 해결 능력"}},
                {"label": {"en": "What are your main projects?", "ko": "주요 프로젝트는 어떤 것이 있나요?"}, "query": {"en": "main projects", "ko": "주요 프로젝트"}}
            ];
            response.response_type = 'text_and_follow_ups';
            return response;
        }

        // --- Handle main categories (projects, skills, career etc.) from knowledgeBase.response_categories ---
        const categoryBaseData = knowledgeBase.response_categories && knowledgeBase.response_categories[match.category] ?
                                 knowledgeBase.response_categories[match.category] : null;

        if (!categoryBaseData) {
            console.warn(`[AIPortfolioLogic] No category data found for '${match.category}'. Falling back to default response.`);
            return getDefaultResponse();
        }

        response.aiInsight = getLocalizedText(categoryBaseData.aiInsight);
        response.response_type = categoryBaseData.response_type;

        if (categoryBaseData.items) {
            if (match.item) {
                // If a specific item ID is matched within a category
                const specificItem = categoryBaseData.items.find(i => i.id === match.item);
                if (specificItem) {
                    let itemInsight = `<h4>${getLocalizedText(specificItem.title || specificItem.name)}</h4><p>${getLocalizedText(specificItem.description)}</p>`;
                    if (match.intent && specificItem.details && specificItem.details.narrative_qna) {
                        const qnaAnswer = specificItem.details.narrative_qna[match.intent];
                        if (qnaAnswer) {
                            itemInsight += `<p><strong>${formatIntentLabel(match.intent)}:</strong> ${getLocalizedText(qnaAnswer)}</p>`;
                        }
                    } else if (match.category === 'skills' && specificItem.details) {
                        itemInsight += `<ul>`;
                        specificItem.details.forEach(detail => {
                            itemInsight += `<li><strong>${detail.name}</strong>: ${detail.level} (${detail.experience_years} experience)`;
                            if (detail.projects_used_in && detail.projects_used_in.length > 0) {
                                const projectsUsed = detail.projects_used_in.map(pId => {
                                    const proj = knowledgeBase.response_categories.projects.items.find(pi => pi.id === pId);
                                    return proj ? getLocalizedText(proj.title) : pId;
                                }).join(', ');
                                itemInsight += ` - Used in: ${projectsUsed}`;
                            }
                            if (detail.narrative_qna && detail.narrative_qna.advice) {
                                itemInsight += `<br><em>💡 ${getLocalizedText(detail.narrative_qna.advice)}</em>`;
                            }
                            itemInsight += `</li>`;
                        });
                        itemInsight += `</ul>`;
                    }
                    response.aiInsight = itemInsight;
                    response.results = [{
                        type: match.category.slice(0, -1), // e.g., 'projects' -> 'project'
                        title: getLocalizedText(specificItem.title || specificItem.name),
                        description: getLocalizedText(specificItem.description),
                        tags: specificItem.tags || specificItem.keywords || [],
                        link: specificItem.link,
                        keywords: specificItem.keywords || [],
                        id: specificItem.id // Include ID for project modal
                    }];
                    response.response_type = 'cards_and_link';
                } else {
                    // Fallback if specific item not found but category has items
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
            } else { // No specific item, list all items in the category
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
            // Handle specific career subsections
            const subSectionData = categoryBaseData.sections[match.subSection];
            if (subSectionData) {
                let sectionHtml = `<h4>${getLocalizedText(subSectionData.title)}</h4><ul>`;
                subSectionData.items.forEach(item => {
                    sectionHtml += `<li><strong>${getLocalizedText(item.title)}</strong> (${getLocalizedText(item.description)})`;
                    if (match.intent && item.narrative_qna && item.narrative_qna[match.intent]) {
                        sectionHtml += `<br><em>${formatIntentLabel(match.intent)}: ${getLocalizedText(item.narrative_qna[match.intent])}</em>`;
                    } else if (match.intent === 'general_info' && item.achievements) {
                        sectionHtml += `<br><em>${formatIntentLabel('achievements')}: ${getLocalizedText(item.achievements.join(', '))}</em>`;
                    }
                    sectionHtml += `</li>`;
                });
                sectionHtml += `</ul>`;
                response.aiInsight = sectionHtml;
                response.response_type = 'text_and_link';
                response.url_fragment = subSectionData.url_fragment;
            } else {
                return getDefaultResponse();
            }
        } else if (match.category === 'about_me_deep_dive') {
            // General "about me" information
            let aboutMeText = '';
            for (const key in categoryBaseData.content) {
                aboutMeText += `<p>${getLocalizedText(categoryBaseData.content[key])}</p>`;
            }
            response.aiInsight += aboutMeText;
            response.response_type = 'text_and_link';
        } else if (match.category === 'portfolio_building_tips') {
            // Tips for building a portfolio
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
            // Website structure overview
            let structureHtml = '<ul>';
            categoryBaseData.items.forEach(section => {
                structureHtml += `<li><strong>${getLocalizedText(section.name)}</strong>: ${getLocalizedText(section.description)}</li>`;
            });
            structureHtml += '</ul>';
            response.aiInsight += structureHtml;
            response.response_type = 'list_and_link';
        } else if (match.category === 'connect') {
            // Contact information
            response.aiInsight += `<p>${getLocalizedText(categoryBaseData.contact_details)}</p>`;
            response.response_type = 'text_and_link';
        } else {
            // Default handling for categories with just an insight (e.g., career_availability, about_ai_assistant)
            response.aiInsight = getLocalizedText(categoryBaseData.aiInsight);
            response.response_type = categoryBaseData.response_type;
        }

        // Add follow-up actions from the base category data
        if (categoryBaseData && categoryBaseData.followUpActions && categoryBaseData.followUpActions.length > 0) {
            response.followUpActions = [...response.followUpActions, ...categoryBaseData.followUpActions.map(action => ({
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query),
                action: action.action,
                target_id: action.target_id,
                category: action.category,
                target_page: action.target_page,
                url_fragment: action.url_fragment
            }))];
        }

        // Add specific item's narrative Q&A as follow-up actions (if not already the intent)
        if (match.item && categoryBaseData && categoryBaseData.items) {
            const specificItem = categoryBaseData.items.find(i => i.id === match.item);
            if (specificItem && specificItem.details && specificItem.details.narrative_qna) {
                const narrativeQna = specificItem.details.narrative_qna;
                for (const qnaKey in narrativeQna) {
                    // Add as follow-up if it's a valid Q&A key and not the current intent
                    if (qnaKey !== '_label' && qnaKey !== match.intent && typeof narrativeQna[qnaKey] === 'object' && (narrativeQna[qnaKey][currentLanguage] || narrativeQna[qnaKey]['en'])) {
                        const queryLabel = formatIntentLabel(qnaKey);
                        response.followUpActions.push({
                            label: `${queryLabel} (${getLocalizedText(specificItem.title || specificItem.name)})`,
                            query: `${qnaKey} ${getLocalizedText(specificItem.title || specificItem.name).toLowerCase()}`,
                            action: 'show_specific_item_details',
                            target_id: specificItem.id,
                            category: match.category,
                            intent: qnaKey
                        });
                    }
                }
                // Remove duplicates in follow-up actions
                response.followUpActions = Array.from(new Set(response.followUpActions.map(a => JSON.stringify(a))))
                    .map(s => JSON.parse(s));
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
            console.error("[AIPortfolioLogic] Default response data missing or knowledge base not loaded.");
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
            await loadKnowledgeBase();
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
         * It tries different AI layers in sequence until a suitable response is found.
         * @param {string} query - The user's query.
         * @returns {Promise<object>} A structured response object.
         */
        getAIResponse: async function(query) {
            if (!isKnowledgeBaseLoaded) {
                console.error("[AIPortfolioLogic] Knowledge Base not loaded. Attempting to load...");
                try {
                    await loadKnowledgeBase(); // Try to load it if not already
                } catch (e) {
                    return getDefaultResponse(); // Return default if loading fails
                }
            }

            let responseTemplate = null;

            // Normalize query for internal processing (lowercase)
            const processedQuery = query.toLowerCase();

            // Layer 1: Direct keyword matching (Fuse.js)
            console.log("[AIPortfolioLogic] Attempting Level 1: Fuse.js search...");
            responseTemplate = runFuseSearch(processedQuery);
            if (responseTemplate) {
                console.log("[AIPortfolioLogic] Level 1 (Fuse.js) successful.");
                return generateFinalResponse(responseTemplate, query); // Pass original query for localized text in UI
            }

            // Layer 2: NLP-based intent detection (Compromise.js for English, custom for Korean)
            if (currentLanguage === 'en') {
                console.log("[AIPortfolioLogic] Attempting Level 2 (EN): Compromise.js...");
                responseTemplate = runCompromise(processedQuery);
                if (responseTemplate) {
                    console.log("[AIPortfolioLogic] Level 2 (Compromise.js) successful.");
                    return generateFinalResponse(responseTemplate, query);
                }
            } else if (currentLanguage === 'ko') {
                console.log("[AIPortfolioLogic] Attempting Level 2 (KO): Korean.js (Placeholder Logic)...");
                responseTemplate = runKoreanJs(processedQuery); // Calls our custom Korean logic
                if (responseTemplate) {
                    console.log("[AIPortfolioLogic] Level 2 (Korean.js) successful.");
                    return generateFinalResponse(responseTemplate, query);
                }
            }

            // Layer 3: Semantic search (Transformers.js)
            console.log("[AIPortfolioLogic] Attempting Level 3: Transformers.js semantic search...");
            responseTemplate = await runTransformers(query); // Use original query for embedding
            if (responseTemplate) {
                console.log("[AIPortfolioLogic] Level 3 (Transformers.js) successful.");
                return generateFinalResponse(responseTemplate, query);
            }

            // Layer 4: Fallback to Serverless API Proxy (LLM)
            console.log("[AIPortfolioLogic] Attempting Level 4: Serverless API Proxy (LLM)...");
            responseTemplate = await callApiProxy(query); // Pass original query to LLM
            if (responseTemplate) {
                console.log("[AIPortfolioLogic] Level 4 (API Proxy) successful.");
                return generateFinalResponse(responseTemplate, query);
            }

            // If all layers fail, return a default "I don't understand" response
            console.warn("[AIPortfolioLogic] All AI logic layers failed to find a specific response. Returning default.");
            return getDefaultResponse();
        },

        // Expose knowledgeBase for UI to access navigation_map if needed (e.g., for navigation actions)
        get knowledgeBase() {
            return knowledgeBase;
        }
    };
})();
