// /api/chat.js

// 각 API 호출을 위한 헬퍼 함수들
// 1. Google Gemini
async function callGemini(query, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `You are a portfolio assistant. Based on the user's question, provide a concise and helpful answer. Question: "${query}"` }] }]
        })
    });
    if (!response.ok) throw new Error('Gemini API request failed');
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

// 2. Cloudflare Workers AI
async function callCloudflare(query, accountId, apiToken) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: 'You are a friendly portfolio assistant.' },
                { role: 'user', content: `Answer this question concisely: "${query}"` }
            ]
        })
    });
    if (!response.ok) throw new Error('Cloudflare AI API request failed');
    const data = await response.json();
    return data.result.response.trim();
}

// 3. OpenAI
async function callOpenAI(query, apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a portfolio assistant.' },
                { role: 'user', content: `Answer this question concisely: "${query}"` }
            ]
        })
    });
    if (!response.ok) throw new Error('OpenAI API request failed');
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// 메인 핸들러 함수
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    // API 호출 순서 정의
    const apiCalls = [
        { name: 'Gemini', fn: callGemini, key: process.env.GOOGLE_API_KEY },
        { name: 'Cloudflare', fn: callCloudflare, accountId: process.env.CLOUDFLARE_ACCOUNT_ID, token: process.env.CLOUDFLARE_API_TOKEN },
        { name: 'OpenAI', fn: callOpenAI, key: process.env.OPENAI_API_KEY }
    ];

    for (const api of apiCalls) {
        try {
            console.log(`Attempting to call ${api.name}...`);
            let result;
            if (api.name === 'Cloudflare') {
                if (api.accountId && api.token) {
                    result = await api.fn(query, api.accountId, api.token);
                } else continue;
            } else {
                 if (api.key) {
                    result = await api.fn(query, api.key);
                 } else continue;
            }
            
            console.log(`${api.name} succeeded!`);
            return res.status(200).json({ answer: result, source: api.name });

        } catch (error) {
            console.warn(`Call to ${api.name} failed:`, error.message);
            // 실패 시 다음 API로 계속 진행
        }
    }

    // 모든 API 호출이 실패한 경우
    console.error('All API calls failed.');
    res.status(500).json({ error: 'All AI services are currently unavailable.' });
}


// GOOGLE_API_KEY : AIzaSyBDIzlLet6e6M4_WSsQhujozHsXebYtXiE (Google AI Studio에서 발급받은 키)
// CLOUDFLARE_ACCOUNT_ID : 9828e06ba265e12bbd9fa6ac6d88a3eb (Cloudflare 대시보드의 계정 ID)
// CLOUDFLARE_API_TOKEN : x5demad9cQBYO97-ojb4t76xGejonR9dDQZr70jG (Cloudflare 대시보드의 API 토큰)
// OPENAI_API_KEY : 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 (OpenAI에서 발급받은 키)