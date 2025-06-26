// common/ai_chat_logic.js
// Transformers.js 라이브러리에서 필요한 함수를 동적으로 임포트
const { pipeline, cos_sim } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');

const AIPortfolioLogic = (() => {
    let knowledgeBase = null; // JSON 데이터를 캐싱할 변수
    let currentLanguage = 'en'; // 현재 언어 설정

    // 로컬 라이브러리 인스턴스
    let fuse;
    let extractor; // Transformers.js 모델
    let dbEmbeddings;
    let documents;

    /**
     * 포트폴리오 지식 베이스(JSON)를 비동기적으로 로드하고 캐싱하며,
     * Fuse.js 및 Transformers.js 모델을 초기화합니다.
     * @returns {Promise<void>}
     */
    async function loadKnowledgeBase() {
        if (knowledgeBase) return; // 이미 로드되었으면 실행하지 않음
        try {
            const response = await fetch('../common/ai_chat_data.json');
            if (!response.ok) throw new Error('Knowledge base file not found or failed to fetch.');
            knowledgeBase = await response.json();
            documents = knowledgeBase.search_documents;

            if (!documents || !Array.isArray(documents) || documents.length === 0) {
                console.warn("[AI_Portfolio_Logic] No search documents found in knowledgeBase. Fuse.js and Transformers.js will not be fully functional.");
                documents = []; // 문서가 없으면 빈 배열로 초기화하여 이후 오류 방지
            }

            // Fuse.js 초기화
            fuse = new Fuse(documents, {
                keys: ['query_phrases'],
                threshold: 0.6, // 0에 가까울수록 엄격, 1에 가까울수록 관대
                includeScore: true // 점수 포함
            });
            console.log("[AI_Portfolio_Logic] Fuse.js initialized.");

            // Transformers.js 모델 로드 및 임베딩 생성
            console.log("[AI_Portfolio_Logic] Loading Transformers.js model...");
            extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small');
            console.log("[AI_Portfolio_Logic] Transformers.js model loaded.");

            const itemsToEmbed = documents.map(doc => {
                // Ensure text_for_embedding is a string, handling localization
                const text = doc.text_for_embedding && typeof doc.text_for_embedding === 'object' ?
                    doc.text_for_embedding[currentLanguage] || doc.text_for_embedding['en'] :
                    doc.text_for_embedding;
                return typeof text === 'string' ? text : ''; // Ensure it's a string
            }).filter(Boolean); // Filter out empty strings

            if (itemsToEmbed.length > 0) {
                 dbEmbeddings = await extractor(itemsToEmbed, { pooling: 'mean', normalize: true });
                 console.log("[AI_Portfolio_Logic] Document embeddings created.");
            } else {
                 console.warn("[AI_Portfolio_Logic] No valid text to create embeddings from. Transformers.js semantic search may not work.");
                 dbEmbeddings = null;
            }

            console.log("[AI_Portfolio_Logic] Local libraries and knowledge base ready.");

        } catch (error) {
            console.error("[AI_Portfolio_Logic] Critical error during knowledge base load or library initialization:", error);
            knowledgeBase = null; // 오류 발생 시 knowledgeBase를 null로 설정하여 이후 접근 시 오류 명확화
            fuse = null;
            extractor = null;
            dbEmbeddings = null;
        }
    }

    /**
     * 현재 언어를 설정합니다.
     * @param {string} lang - 'en' 또는 'ko'
     */
    function setLanguage(lang) {
        currentLanguage = lang;
        console.log(`[AI_Portfolio_Logic] Language set to: ${currentLanguage}`);
    }

    /**
     * Knowledge Base에서 다국어 필드를 현재 언어에 맞게 추출합니다.
     * @param {string|object} field - 다국어 객체 또는 단일 문자열
     * @returns {string} 현재 언어에 맞는 텍스트 또는 영어 기본값
     */
    function getLocalizedText(field) {
        if (typeof field === 'object' && field !== null) {
            return field[currentLanguage] || field['en'] || '';
        }
        return field || '';
    }

    /**
     * 특정 쿼리가 키워드 목록 중 하나라도 포함하는지 확인합니다.
     * 동의어 맵을 활용하여 유연성을 높입니다.
     * @param {string} query - 사용자 쿼리 (소문자)
     * @param {Array<string>} keywords - 매칭할 키워드 배열 (이미 소문자)
     * @param {Object} synonymsMap - 현재 언어의 동의어 맵
     * @returns {boolean} 일치 여부
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

    // 1. Fuse.js 검색 로직
    function runFuseSearch(query) {
        if (!fuse || !documents || documents.length === 0) {
            console.warn("[AI_Portfolio_Logic] Fuse.js not initialized or no documents to search.");
            return null;
        }
        const results = fuse.search(query);
        if (results.length > 0 && results[0].score < 0.6) { // 임계값 조정
            console.log(`[AI_Portfolio_Logic] Fuse.js matched: ${results[0].item.id} with score ${results[0].score}`);
            return results[0].item.response; // 매칭된 문서의 응답 템플릿 반환
        }
        return null;
    }

    // 2. Compromise.js (영어 전용) 로직
    function runCompromise(query) {
        if (typeof nlp === 'undefined') {
            console.warn("[AI_Portfolio_Logic] Compromise.js (nlp) is not loaded or available.");
            return null;
        }

        const doc = nlp(query.toLowerCase());

        // 특정 엔티티나 패턴을 찾아서 의도 파악
        // 예시: "projects about AI", "tell me about your skills"
        if (doc.has('project') || doc.has('projects') || doc.has('work')) {
            if (doc.has('ai') || doc.has('machine learning')) {
                const aiRelated = knowledgeBase.response_categories.projects.items.filter(p =>
                    (p.tags && p.tags.some(tag => tag.toLowerCase().includes('ai') || tag.toLowerCase().includes('machine learning'))) ||
                    (p.keywords && p.keywords.some(kw => kw.toLowerCase().includes('ai') || kw.toLowerCase().includes('machine learning')))
                );
                if (aiRelated.length > 0) {
                    return { category: 'projects', item: aiRelated[0].id };
                }
                return { category: 'no_ai_projects' };
            }
            return { category: 'projects', item: null }; // 일반 프로젝트 질문
        }
        if (doc.has('skill') || doc.has('skills') || doc.has('tech stack')) {
            return { category: 'skills', item: null }; // 스킬 질문
        }
        if (doc.has('career') || doc.has('experience') || doc.has('job')) {
            return { category: 'career', item: null }; // 경력 질문
        }
        if (doc.has('contact') || doc.has('connect') || doc.has('email')) {
            return { category: 'connect', item: null }; // 연락 질문
        }
        if (doc.has('oosu') || doc.has('about you')) {
            return { category: 'about_me_deep_dive', item: null }; // Oosu에 대한 질문
        }

        return null; // 매칭되는 의도가 없을 경우
    }

    // 3. Transformers.js 의미 검색 로직
    async function runTransformers(query) {
        if (!extractor || !dbEmbeddings) {
            console.warn("[AI_Portfolio_Logic] Transformers.js model or embeddings not ready.");
            return null;
        }

        const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });
        let bestMatch = { score: -1, index: -1 };

        for (let i = 0; i < dbEmbeddings.dims[0]; ++i) {
            const docEmbedding = dbEmbeddings.slice([i, i + 1]);
            const score = (queryEmbedding.dot(docEmbedding.T)).data[0];
            if (score > bestMatch.score) {
                bestMatch = { score, index: i };
            }
        }

        // 0.75 이상의 높은 유사도일 때만 유효하다고 판단
        if (bestMatch.score > 0.75) {
            console.log(`[AI_Portfolio_Logic] Transformers.js matched: ${documents[bestMatch.index].id} with score ${bestMatch.score}`);
            return documents[bestMatch.index].response; // 매칭된 문서의 응답 템플릿 반환
        }
        return null;
    }

    // 4. Korean.js (한국어 전용) - Placeholder
    // 실제 Korean.js 라이브러리에 따라 구현 필요
    function runKoreanJs(query) {
        // 이 부분은 Korean.js의 실제 기능에 따라 구현되어야 합니다.
        // 예: 형태소 분석, 키워드 추출 등을 통해 의도 파악
        // 현재는 더미 로직으로 구성
        const normalizedQuery = query.toLowerCase();
        const synonymsMap = knowledgeBase.synonyms_map[currentLanguage] || knowledgeBase.synonyms_map['en'];

        if (matchesKeyword(normalizedQuery, ["프로젝트", "작품"], synonymsMap)) {
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
        if (matchesKeyword(normalizedQuery, ["스킬", "기술", "기술 스택"], synonymsMap)) {
            return { category: 'skills', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["경력", "경험", "직무"], synonymsMap)) {
            return { category: 'career', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["연락", "컨택"], synonymsMap)) {
            return { category: 'connect', item: null };
        }
        if (matchesKeyword(normalizedQuery, ["오수", "oosu", "오수에 대해"], synonymsMap)) {
            return { category: 'about_me_deep_dive', item: null };
        }
        return null;
    }

    // 5. 서버리스 API 프록시 호출
    async function callApiProxy(query) {
        try {
            console.log("[AI_Portfolio_Logic] Calling API Proxy...");
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query, language: currentLanguage })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Proxy error: ${response.status} - ${errorText}`);
                return null;
            }
            const data = await response.json();
            console.log("[AI_Portfolio_Logic] API Proxy response:", data);

            if (data && data.aiInsight) {
                return {
                    aiInsight: data.aiInsight, // API에서 이미 로컬라이즈된 텍스트나 객체 형태로 반환한다고 가정
                    results: data.results || [],
                    followUpActions: data.followUpActions || [],
                    response_type: data.response_type || 'text_only',
                    action: data.action,
                    target_page: data.target_page,
                    url_fragment: data.url_fragment,
                    additionalInfo: data.additionalInfo || ''
                };
            }
            return null;
        } catch (error) {
            console.error("[AI_Portfolio_Logic] API Proxy call failed:", error);
            return null;
        }
    }

    /**
     * 인텐트 키워드를 사용자 친화적인 라벨로 변환합니다.
     * @param {string} intentKey - 인텐트 키 (예: 'general_info', 'challenges')
     * @returns {string} 사용자 친화적인 라벨
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
     * 분석된 의도(match 객체)와 rawQuery를 기반으로 최종 AI 응답 객체를 생성합니다.
     * @param {object} match - 로컬 라이브러리/API에서 반환된 매칭 객체
     * @param {string} rawQuery - 사용자의 원본 쿼리
     * @returns {object} UI 렌더링을 위한 포맷된 응답 객체
     */
    function generateFinalResponse(match, rawQuery) {
        let response = {
            aiInsight: '',
            results: [],
            followUpActions: [],
            additionalInfo: '',
            response_type: 'text_only', // 기본값
            action: match.action,
            target_page: match.target_page,
            url_fragment: match.url_fragment
        };

        // 매칭 객체에 aiInsight가 직접 포함된 경우 (예: API 응답)
        if (match.aiInsight) {
            response.aiInsight = getLocalizedText(match.aiInsight);
            response.results = match.results || [];
            response.followUpActions = match.followUpActions || [];
            response.response_type = match.response_type || 'text_only';
            response.action = match.action;
            response.target_page = match.target_page;
            response.url_fragment = match.url_fragment;
            response.additionalInfo = getLocalizedText(match.additionalInfo) || '';
            return response;
        }

        // --- 상호작용 문구 처리 (highest priority) ---
        if (['greeting', 'thank_you', 'celebratory', 'empathetic'].includes(match.category)) {
            const prompts = knowledgeBase.interactive_phrases[`${match.category}_responses`]?.prompts;
            if (prompts) {
                let selectedPrompt;
                if (match.category === 'empathetic') {
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
                    response.followUpActions = knowledgeBase.interactive_phrases.no_results_follow_up.prompts.slice(0, 2).map(s => ({
                        label: getLocalizedText(s),
                        query: getLocalizedText(s)
                    }));
                }
            }
            return response;
        }

        // --- 'What If' 시나리오 처리 ---
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

        // --- 특정 페이지 이동 (`navigation` 카테고리) ---
        if (match.category === 'navigation') {
            const pageData = knowledgeBase.navigation_map[match.target_page];
            if (pageData) {
                response.aiInsight = getLocalizedText(knowledgeBase.interactive_phrases.navigation_confirmations.navigating).replace('{page_name}', getLocalizedText(pageData.name));
                response.action = 'navigate';
                response.target_page = match.target_page;
                response.url_fragment = pageData.page.split('#')[1] || null;
                response.response_type = 'text_only';
            } else {
                return getDefaultResponse();
            }
            return response;
        }

        // --- AI 관련 프로젝트가 없다는 특별 응답 처리 ---
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

        // --- 메인 카테고리별 응답 처리 (knowledgeBase.response_categories 참조) ---
        const categoryBaseData = knowledgeBase.response_categories && knowledgeBase.response_categories[match.category] ?
                                 knowledgeBase.response_categories[match.category] : null;

        if (!categoryBaseData) {
            console.warn(`[AI_Portfolio_Logic] No category data found for '${match.category}'. Falling back to default response.`);
            return getDefaultResponse();
        }

        response.aiInsight = getLocalizedText(categoryBaseData.aiInsight);
        response.response_type = categoryBaseData.response_type;

        if (categoryBaseData.items) {
            if (match.item) {
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
                        type: match.category.slice(0, -1),
                        title: getLocalizedText(specificItem.title || specificItem.name),
                        description: getLocalizedText(specificItem.description),
                        tags: specificItem.tags || specificItem.keywords || [],
                        link: specificItem.link,
                        keywords: specificItem.keywords || []
                    }];
                    response.response_type = 'cards_and_link';
                } else {
                    console.warn(`[AI_Portfolio_Logic] Specific item '${match.item}' not found in category '${match.category}'. Listing all.`);
                    response.results = categoryBaseData.items.map(item => ({
                        type: match.category.slice(0, -1),
                        title: getLocalizedText(item.title || item.name),
                        description: getLocalizedText(item.description),
                        tags: item.tags || item.keywords || [],
                        link: item.link,
                        keywords: item.keywords || []
                    }));
                    response.response_type = 'cards_and_link';
                }
            } else { // 특정 아이템이 지정되지 않았으면 모든 아이템 목록을 보여줌
                response.results = categoryBaseData.items.map(item => ({
                    type: match.category.slice(0, -1),
                    title: getLocalizedText(item.title || item.name),
                    description: getLocalizedText(item.description),
                    tags: item.tags || item.keywords || [],
                    link: item.link,
                    keywords: item.keywords || []
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
            let aboutMeText = '';
            for (const key in categoryBaseData.content) {
                aboutMeText += `<p>${getLocalizedText(categoryBaseData.content[key])}</p>`;
            }
            response.aiInsight += aboutMeText;
            response.response_type = 'text_and_link';
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
        } else {
            // 카테고리 데이터는 있지만 items가 없는 경우 (예: career_availability, about_ai_assistant)
            response.aiInsight = getLocalizedText(categoryBaseData.aiInsight);
            response.response_type = categoryBaseData.response_type;
        }

        // 팔로우업 액션 추가 (기본 카테고리의 followUpActions)
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

        // 특정 아이템의 내러티브 Q&A에 따른 추가 팔로우업 액션
        if (match.item && categoryBaseData && categoryBaseData.items) {
            const specificItem = categoryBaseData.items.find(i => i.id === match.item);
            if (specificItem && specificItem.details && specificItem.details.narrative_qna) {
                const narrativeQna = specificItem.details.narrative_qna;
                for (const qnaKey in narrativeQna) {
                    if (qnaKey !== '_label' && qnaKey !== match.intent && typeof narrativeQna[qnaKey] === 'object' && narrativeQna[qnaKey][currentLanguage]) {
                        const queryLabel = formatIntentLabel(qnaKey);
                        response.followUpActions.push({
                            label: `${queryLabel} (${getLocalizedText(specificItem.title)})`,
                            query: `${qnaKey} ${getLocalizedText(specificItem.title).toLowerCase()}`,
                            action: 'show_specific_item_details',
                            target_id: specificItem.id,
                            category: match.category,
                            intent: qnaKey
                        });
                    }
                }
                // 중복 제거
                response.followUpActions = Array.from(new Set(response.followUpActions.map(a => JSON.stringify(a))))
                    .map(s => JSON.parse(s));
            }
        }

        return response;
    }

    /**
     * 어떤 키워드에도 매칭되지 않을 때 기본 응답을 반환합니다.
     * @returns {object} - 포맷된 기본 응답 객체
     */
    function getDefaultResponse() {
        // knowledgeBase가 로드되지 않았을 경우를 대비한 최후의 방어
        if (!knowledgeBase || !knowledgeBase.default_response || !knowledgeBase.interactive_phrases) {
            console.error("[AI_Portfolio_Logic] Default response data missing from knowledgeBase or knowledgeBase not loaded.");
            return {
                aiInsight: {
                    en: "Sorry, I'm currently unable to provide a response. Please check the console for errors.",
                    ko: "죄송합니다. 현재 응답을 제공할 수 없습니다. 콘솔에서 오류를 확인해주세요."
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

    // Public API
    return {
        loadKnowledgeBase: async function() {
            await loadKnowledgeBase();
        },
        setLanguage: function(lang) {
            setLanguage(lang);
        },
        // 초기 제안을 가져오는 새로운 공개 메서드 추가
        getInitialSuggestions: function() {
            if (knowledgeBase && knowledgeBase.assistant_info && knowledgeBase.assistant_info.user_guidance_examples) {
                return knowledgeBase.assistant_info.user_guidance_examples.initial_suggestions.map(s => ({
                    label: getLocalizedText(s.label),
                    query: getLocalizedText(s.query)
                }));
            }
            return [];
        },
        getAIResponse: async function(query) {
            if (!knowledgeBase) {
                console.error("[AI_Portfolio_Logic] Knowledge Base not loaded. Cannot process query.");
                return {
                    aiInsight: getLocalizedText({en: 'My knowledge base is not ready yet. Please try again in a moment.', ko: '아직 지식 베이스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'}),
                    results: [],
                    followUpActions: []
                };
            }

            let responseTemplate = null;

            console.log("Attempting Level 1: Fuse.js");
            responseTemplate = runFuseSearch(query);
            if (responseTemplate) {
                console.log("Fuse.js successful.");
                return generateFinalResponse(responseTemplate, query);
            }

            if (currentLanguage === 'en') {
                console.log("Attempting Level 2 (EN): compromise.js");
                responseTemplate = runCompromise(query);
                if (responseTemplate) {
                    console.log("Compromise.js successful.");
                    return generateFinalResponse(responseTemplate, query);
                }
            } else if (currentLanguage === 'ko') {
                console.log("Attempting Level 2 (KO): Korean.js (Placeholder)");
                responseTemplate = runKoreanJs(query); // Korean.js 로직 호출
                if (responseTemplate) {
                    console.log("Korean.js (Placeholder) successful.");
                    return generateFinalResponse(responseTemplate, query);
                }
            }

            console.log("Attempting Level 3: Transformers.js");
            responseTemplate = await runTransformers(query);
            if (responseTemplate) {
                console.log("Transformers.js successful.");
                return generateFinalResponse(responseTemplate, query);
            }

            console.log("Falling back to API Proxy (Gemini/Grok/OpenAI)...");
            responseTemplate = await callApiProxy(query);
            if (responseTemplate) {
                console.log("API Proxy successful.");
                return generateFinalResponse(responseTemplate, query);
            }

            // 최종 실패
            console.warn("All AI logic layers failed. Returning default response.");
            return getDefaultResponse();
        }
    };
})();

// `export` 대신 전역 스코프나 다른 방식으로 `ai_chat.js`에서 접근할 수 있도록 합니다.
window.AIPortfolioLogic = AIPortfolioLogic;