// common/ai_chat_logic.js

const AIPortfolioLogic = (() => {
    // --- Private Variables ---
    let knowledgeBase = null; // JSON 데이터를 캐싱할 변수
    let currentLanguage = 'en'; // 현재 언어 설정

    // --- Private Methods ---

    /**
     * 포트폴리오 지식 베이스(JSON)를 비동기적으로 로드하고 캐싱합니다.
     * @returns {Promise<void>}
     */
    async function loadKnowledgeBase() {
        if (knowledgeBase) return; // 이미 로드되었으면 실행하지 않음
        try {
            const response = await fetch('../common/ai_chat_data.json');
            if (!response.ok) throw new Error('Knowledge base file not found.');
            knowledgeBase = await response.json();
            console.log("[AI_Portfolio_Logic] Knowledge Base loaded successfully.");
        } catch (error) {
            console.error("[AI_Portfolio_Logic] Error loading knowledge base:", error);
            knowledgeBase = {}; // 오류 발생 시 빈 객체로 초기화
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
            if (synonymsMap[keyword]) {
                if (synonymsMap[keyword].some(s => query.includes(s.toLowerCase()))) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 사용자 쿼리를 분석하여 가장 적합한 카테고리, 세부 항목, 의도를 찾아냅니다.
     * @param {string} rawQuery - 사용자의 원본 질문 (대소문자 보존)
     * @returns {object} { category, item, subSection, intent, score, action, target_page, url_fragment }
     */
    function processUserQuery(rawQuery) {
        const normalizedQuery = rawQuery.toLowerCase().trim();
        let bestMatch = {
            category: null,
            item: null,
            subSection: null,
            intent: null,
            score: 0,
            action: null,
            target_page: null,
            url_fragment: null
        };

        const keywordsMap = knowledgeBase.keywords_map;
        const synonymsMap = knowledgeBase.synonyms_map[currentLanguage] || knowledgeBase.synonyms_map['en'];

        // --- 1. 높은 우선순위: 상호작용 문구 처리 ---
        if (matchesKeyword(normalizedQuery, ['hello', 'hi', '안녕', '안녕하세요', '반가워'], synonymsMap)) {
            bestMatch.category = 'greeting'; bestMatch.score = 1000; return bestMatch;
        }
        if (matchesKeyword(normalizedQuery, ['thank', '고마워', '감사'], synonymsMap)) {
            bestMatch.category = 'thank_you'; bestMatch.score = 1000; return bestMatch;
        }
        if (matchesKeyword(normalizedQuery, ['love it', 'amazing', 'cool', 'awesome', '대박', '멋져요', '마음에 들어요', '최고', '흥미롭다', 'fantastic', 'wonderful'], synonymsMap)) {
            bestMatch.category = 'celebratory'; bestMatch.score = 1000; return bestMatch;
        }
        if (matchesKeyword(normalizedQuery, ['struggling', 'hard', 'difficult', '막막', '어려워요', '힘들어요', '고민', '좌절', 'confused', 'don\'t understand', 'complex', '복잡', '모르겠어요', '헷갈려요', 'overwhelmed', 'stressed', 'too much', '압도', '스트레스', '많다'], synonymsMap)) {
            bestMatch.category = 'empathetic'; bestMatch.score = 1000; return bestMatch;
        }

        // --- 2. 'What If' 시나리오 검사 ---
        for (const scenario of knowledgeBase.what_if_scenarios.scenarios) {
            const scenarioKeywords = (Array.isArray(scenario.trigger_keywords) ? scenario.trigger_keywords : [scenario.trigger_keywords]).map(kw => kw.toLowerCase());
            if (matchesKeyword(normalizedQuery, scenarioKeywords, synonymsMap)) {
                bestMatch.category = 'what_if';
                bestMatch.item = scenario.id;
                bestMatch.score = 900;
                return bestMatch;
            }
        }

        // --- 3. 특정 페이지 이동 요청 (navigation_map) ---
        for (const pageKey in knowledgeBase.navigation_map) {
            const pageData = knowledgeBase.navigation_map[pageKey];
            const pageKeywords = pageData.keywords.map(kw => kw.toLowerCase());
            if (matchesKeyword(normalizedQuery, pageKeywords, synonymsMap)) {
                bestMatch.category = 'navigation';
                bestMatch.target_page = pageKey;
                bestMatch.url_fragment = pageData.page.split('#')[1] || null;
                bestMatch.action = 'navigate';
                bestMatch.score = 800;
                return bestMatch;
            }
        }

        // --- 4. 메인 카테고리/아이템/의도 매칭 (더 복합적인 NLU) ---
        let matchedCandidates = [];

        for (const categoryKey in keywordsMap) {
            const categoryData = keywordsMap[categoryKey];
            let currentScore = 0;
            let currentCandidate = {
                category: categoryKey,
                item: null,
                subSection: null,
                intent: null
            };

            // 4.1. 메인 키워드 매칭
            const mainKeywords = categoryData.main_keywords ? categoryData.main_keywords.map(k => k.toLowerCase()) : [];
            if (matchesKeyword(normalizedQuery, mainKeywords, synonymsMap)) {
                currentScore += 100;
            }

            // 4.2. 서브 키워드 매칭 (특정 아이템)
            if (categoryData.sub_keywords) {
                for (const subKey in categoryData.sub_keywords) {
                    const subItem = categoryData.sub_keywords[subKey];
                    const subKeywords = [
                        getLocalizedText(subItem.en).toLowerCase(), // Ensure localized text is processed
                        getLocalizedText(subItem.ko).toLowerCase(),
                        ...(subItem.variations || []).map(k => k.toLowerCase())
                    ].filter(Boolean);

                    if (matchesKeyword(normalizedQuery, subKeywords, synonymsMap)) {
                        currentCandidate.item = subKey;
                        currentScore += 200;
                        break;
                    }
                }
            }

            // 4.3. 의도 키워드 매칭
            if (categoryData.intent_keywords) {
                for (const intentKey in categoryData.intent_keywords) {
                    const intentKeywords = categoryData.intent_keywords[intentKey].map(k => k.toLowerCase());
                    if (matchesKeyword(normalizedQuery, intentKeywords, synonymsMap)) {
                        currentCandidate.intent = intentKey;
                        currentScore += 50;
                        break;
                    }
                }
            }

            // 4.4. 경력 서브 섹션 매칭
            if (categoryKey === 'career' && knowledgeBase.response_categories.career.sections) {
                for (const sectionKey in knowledgeBase.response_categories.career.sections) {
                    const sectionData = knowledgeBase.response_categories.career.sections[sectionKey];
                    const sectionKeywords = (sectionData.keywords || []).map(k => k.toLowerCase());
                    if (matchesKeyword(normalizedQuery, sectionKeywords, synonymsMap)) {
                        currentCandidate.subSection = sectionKey;
                        currentScore += 150;
                        break;
                    }
                }
            }

            if (currentScore > 0) {
                currentCandidate.score = currentScore;
                matchedCandidates.push(currentCandidate);
            }
        }

        // 5. 가장 적합한 매칭 후보 선택
        if (matchedCandidates.length > 0) {
            matchedCandidates.sort((a, b) => b.score - a.score);
            bestMatch = { ...bestMatch, ...matchedCandidates[0] };
        }

        // --- 6. 특정 명확한 질문에 대한 직접 매칭 (높은 점수 부여) ---
        if (matchesKeyword(normalizedQuery, knowledgeBase.profile_info.keywords, synonymsMap)) {
            bestMatch.category = 'about_me_deep_dive'; bestMatch.score = Math.max(bestMatch.score, 700);
        }
        if (matchesKeyword(normalizedQuery, knowledgeBase.keywords_map.about_ai_assistant.main_keywords, synonymsMap)) {
            bestMatch.category = 'about_ai_assistant'; bestMatch.score = Math.max(bestMatch.score, 700);
        }
        if (matchesKeyword(normalizedQuery, knowledgeBase.response_categories.portfolio_building_tips.keywords, synonymsMap)) {
            bestMatch.category = 'portfolio_building_tips'; bestMatch.score = Math.max(bestMatch.score, 700);
        }
        if (matchesKeyword(normalizedQuery, knowledgeBase.response_categories.career_availability.keywords, synonymsMap)) {
            bestMatch.category = 'career_availability'; bestMatch.score = Math.max(bestMatch.score, 700);
        }
        if (matchesKeyword(normalizedQuery, ['site structure', 'site map', 'page list', '사이트 구조', '사이트 맵', '페이지 목록', '구성'], synonymsMap)) {
            bestMatch.category = 'site_structure_overview'; bestMatch.score = Math.max(bestMatch.score, 700);
        }
        if (matchesKeyword(normalizedQuery, knowledgeBase.keywords_map.connect.main_keywords, synonymsMap)) {
            bestMatch.category = 'connect'; bestMatch.score = Math.max(bestMatch.score, 700);
        }

        // --- 7. "AI 관련 프로젝트" 질문에 대한 특별 처리 (JSON에 AI 내용 직접 추가하지 않는 방식) ---
        const aiKeywords = ['ai', '인공지능', 'machine learning', '머신러닝', 'deep learning', '딥러닝'];
        const projectKeywords = ['project', '프로젝트', 'work', '작품', 'case study', '사례', '개발'];

        const hasAiKeyword = matchesKeyword(normalizedQuery, aiKeywords, synonymsMap);
        const hasProjectKeyword = matchesKeyword(normalizedQuery, projectKeywords, synonymsMap);

        if (hasAiKeyword && hasProjectKeyword) {
            // AI 관련 프로젝트를 JSON 데이터 내에서 찾으려고 시도 (tags, keywords, description 내 AI 키워드 포함 여부)
            const aiRelatedProjects = knowledgeBase.response_categories.projects.items.filter(p =>
                (p.tags && p.tags.some(tag => aiKeywords.some(ak => tag.toLowerCase().includes(ak)))) ||
                (p.keywords && p.keywords.some(kw => aiKeywords.some(ak => kw.toLowerCase().includes(ak)))) ||
                (getLocalizedText(p.description).toLowerCase().includes('ai')) ||
                (getLocalizedText(p.description).toLowerCase().includes('인공지능')) ||
                (p.details && p.details.narrative_qna && p.details.narrative_qna.ai_integration) // AI 통합 인텐트가 있는 경우
            );

            if (aiRelatedProjects.length > 0) {
                // AI 관련 프로젝트가 있는 경우, 해당 프로젝트 카테고리로 강하게 매칭
                bestMatch.category = 'projects';
                // 가장 관련 높은 프로젝트의 ID를 item으로 설정 (여기서는 첫 번째)
                bestMatch.item = aiRelatedProjects[0].id;
                // AI 관련 질문에 대한 일반 정보 의도
                bestMatch.intent = 'general_info'; // 또는 'ai_integration' 인텐트가 있다면
                bestMatch.score = Math.max(bestMatch.score, 980); // 매우 높은 점수
                bestMatch.ai_found = true; // AI 관련 프로젝트를 찾았음을 표시
                return bestMatch;
            } else {
                // AI 관련 프로젝트가 JSON에 명시적으로 없는 경우, 특별한 폴백 응답
                bestMatch.category = 'no_ai_projects'; // 새로운 임시 카테고리
                bestMatch.score = Math.max(bestMatch.score, 900);
                return bestMatch;
            }
        }

        // --- 8. 최종 폴백: 매칭되는 것이 없으면 default_response ---
        if (bestMatch.score === 0 || !bestMatch.category) {
            bestMatch.category = 'default_response';
        }

        console.log(`[AI_Portfolio_Logic] Query analysis result for "${rawQuery}":`, bestMatch);
        return bestMatch;
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
     * 매칭된 결과에 따라 지식 베이스에서 응답 데이터를 추출하고 포맷합니다.
     * @param {object} match - processUserQuery가 반환한 매칭 객체
     * @param {string} rawQuery - 사용자의 원본 쿼리 (특정 Q&A 매칭용)
     * @returns {object} - UI 렌더링을 위한 포맷된 응답 객체
     */
    function generateAIResponse(match, rawQuery) {
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

        // --- 상호작용 문구 처리 (highest priority) ---
        if (['greeting', 'thank_you', 'celebratory', 'empathetic'].includes(match.category)) {
            const prompts = knowledgeBase.interactive_phrases[`${match.category}_responses`]?.prompts;
            if (prompts) {
                let selectedPrompt;
                if (match.category === 'empathetic') {
                    selectedPrompt = prompts.find(p => p.trigger_keywords && p.trigger_keywords.some(kw => rawQuery.toLowerCase().includes(kw.toLowerCase())));
                }
                if (!selectedPrompt) {
                    selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                }
                response.aiInsight = getLocalizedText(selectedPrompt.response || selectedPrompt);
                response.response_type = 'text_only';
                if (match.category === 'greeting') {
                    response.followUpActions = knowledgeBase.assistant_info.user_guidance_examples.initial_suggestions.map(s => ({
                        label: getLocalizedText(s.label),
                        query: s.query['en']
                    }));
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


        // --- 메인 카테고리별 응답 처리 ---
        const categoryBaseData = knowledgeBase.response_categories[match.category];
        if (categoryBaseData) {
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
                } else {
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
            }
        } else {
             // 카테고리 데이터는 있지만 items가 없는 경우 (예: career_availability, about_ai_assistant)
             response.aiInsight = getLocalizedText(categoryBaseData.aiInsight);
             response.response_type = categoryBaseData.response_type;
        }

        // 팔로우업 액션 추가 (기본 카테고리의 followUpActions)
        if (categoryBaseData && categoryBaseData.followUpActions && categoryBaseData.followUpActions.length > 0) {
            response.followUpActions = categoryBaseData.followUpActions.map(action => ({
                label: getLocalizedText(action.label),
                query: getLocalizedText(action.query),
                action: action.action,
                target_id: action.target_id,
                category: action.category,
                target_page: action.target_page,
                url_fragment: action.url_fragment
            }));
        }

        // 특정 아이템의 내러티브 Q&A에 따른 추가 팔로우업 액션
        if (match.item && categoryBaseData && categoryBaseData.items) {
             const specificItem = categoryBaseData.items.find(i => i.id === match.item);
             if (specificItem && specificItem.details && specificItem.details.narrative_qna) {
                const narrativeQna = specificItem.details.narrative_qna;
                for (const qnaKey in narrativeQna) {
                    if (qnaKey !== '_label' && qnaKey !== match.intent && typeof narrativeQna[qnaKey] === 'object') {
                        const queryLabel = formatIntentLabel(qnaKey);
                        if (queryLabel && narrativeQna[qnaKey][currentLanguage]) {
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
                }
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

    // --- Public API ---
    return {
        loadKnowledgeBase: async function() {
            await loadKnowledgeBase();
        },
        setLanguage: function(lang) {
            setLanguage(lang);
        },
        getAIResponse: function(query) {
            if (!knowledgeBase) {
                 console.error("[AI_Portfolio_Logic] Knowledge Base not loaded. Cannot process query.");
                 return {
                    aiInsight: getLocalizedText({en: 'My knowledge base is not ready yet. Please try again in a moment.', ko: '아직 지식 베이스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.'}),
                    results: [],
                    followUpActions: []
                 };
            }
            const queryAnalysisResult = processUserQuery(query);
            return generateAIResponse(queryAnalysisResult, query);
        }
    };
})();

export { AIPortfolioLogic };