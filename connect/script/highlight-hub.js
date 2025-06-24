// highlight-hub.js
document.addEventListener('DOMContentLoaded', () => {
// --- 1. ELEMENT SELECTORS ---
const hubGreeting = document.getElementById('hub-greeting');
if (!hubGreeting) return;
const topInterestPlaceholder = document.getElementById('top-interest-placeholder');
const hubTabs = document.querySelector('.hub-tabs');
const cardsContainer = document.getElementById('highlight-cards-container');
const timelineContainer = document.getElementById('timeline-container');
const postcardMessageTextarea = document.getElementById('message');
const aiInsightsOutput = document.getElementById('ai-insights-output');
const aiTemplateButtons = document.querySelectorAll('.ai-template-btn');
const aiToneButtons = document.querySelectorAll('.ai-tone-btn');
const aiOutput = document.getElementById('ai-output');
const generateBtn = document.getElementById('ai-generate-btn');
const postGenerateControls = document.getElementById('ai-post-generate-controls');
const regenerateBtn = document.getElementById('ai-regenerate-btn');
const goToPostcardBtn = document.getElementById('ai-go-to-postcard-btn');
// --- 2. STATE & UTILITIES ---
let currentView = 'timeline';
let currentLang = localStorage.getItem('oosuPortfolioLang') || 'en';
let aiState = {
template: 'general',
tone: 'professional'
};
let userName = localStorage.getItem('currentUser') || (currentLang === 'en' ? 'Visitor' : '방문자');
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

/**
* [수정됨] 타임스탬프를 상대 시간 문자열로 변환하고 디버깅 로그를 추가합니다.
* @param {number|string} timestamp - 변환할 타임스탬프
* @returns {string} 변환된 상대 시간 문자열
*/
function formatRelativeTime(timestamp) {
// 콘솔 로그 추가: 함수에 전달된 원본 타임스탬프 확인
console.log(`[formatRelativeTime] Received timestamp: ${timestamp} (Type: ${typeof timestamp})`);

// 1. timestamp가 유효한 값인지 먼저 확인하고, 명시적으로 숫자형으로 변환합니다.
if (!timestamp) return 'Recent';
const numericTimestamp = Number(timestamp);

// 2. 변환된 숫자형 타임스탬프가 유효한 숫자인지 확인합니다.
if (isNaN(numericTimestamp)) {
console.error(`[formatRelativeTime] Failed to convert timestamp to a valid number. Input was: ${timestamp}`);
return 'Recent';
}

const now = new Date();
const past = new Date(numericTimestamp); // 숫자형 타임스탬프를 사용하여 Date 객체 생성
const diffInSeconds = Math.floor((now - past) / 1000);

// 콘솔 로그 추가: 계산된 시간 차이(초) 확인
console.log(`[formatRelativeTime] Calculated difference in seconds: ${diffInSeconds}`);

// 3. 시간 차이가 음수(미래)이거나 매우 작은 경우 '방금 전'으로 처리합니다.
if (diffInSeconds < 1) {
return currentLang === 'en' ? 'Just now' : '방금 전';
}

const rtf = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });
const intervals = [
{ unit: 'year', seconds: 31536000 },
{ unit: 'month', seconds: 2592000 },
{ unit: 'day', seconds: 86400 },
{ unit: 'hour', seconds: 3600 },
{ unit: 'minute', seconds: 60 }
];

for (let i = 0; i < intervals.length; i++) {
const interval = intervals[i];
if (diffInSeconds >= interval.seconds) {
const count = Math.floor(diffInSeconds / interval.seconds);
return rtf.format(-count, interval.unit);
}
}

// 4. 모든 구간에 해당하지 않는 작은 시간 차이(1초 이상, 60초 미만) 처리
return rtf.format(-diffInSeconds, 'second');
}

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
// --- 3. RENDERING LOGIC ---
function renderTimeline() {
if (!timelineContainer) return;
timelineContainer.innerHTML = '';
const data = getHighlightData();
const sortedItems = Object.entries(data).sort(([, a], [, b]) => (a.timestamp || 0) - (b.timestamp || 0));
if (sortedItems.length === 0) {
const message = currentLang === 'en' ? 'Your journey will be displayed here as you highlight items.' : '포트폴리오를 둘러보며 하이라이트하면 당신의 여정이 이곳에 표시됩니다.';
timelineContainer.innerHTML = `<p class="no-highlights">${message}</p>`;
return;
}
sortedItems.forEach(([id, item]) => {
const timelineItem = document.createElement('div');
timelineItem.className = 'timeline-item';
const date = formatRelativeTime(item.timestamp);
timelineItem.innerHTML = `
<div class="timeline-dot" style="border-color: var(--highlight-${item.color})"></div>
<div class="timeline-content">
<span class="timeline-date">${date}</span>
<h4 class="timeline-page">From page: <strong>${item.page || 'Portfolio'}</strong></h4>
<p class="timeline-text">"${item.text}"</p>
</div>`;
timelineContainer.appendChild(timelineItem);
});
const farewellItem = document.createElement('div');
farewellItem.className = 'timeline-item farewell-timeline-item';
farewellItem.innerHTML = `
<div class="timeline-content">
<div class="farewell-message">
<i class="fas fa-star" style="color: #ffc107;"></i>
<p>Every highlight you've collected is a star that lights up our conversation.</p>
</div>
</div>`;
timelineContainer.appendChild(farewellItem);
gsap.to('.timeline-item', { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
}
function renderCards(viewType) {
if (!cardsContainer) return;
cardsContainer.innerHTML = '';
const data = (viewType === 'active') ? getHighlightData() : getUnhighlightData();
if (Object.keys(data).length === 0) {
let message = viewType === 'active'
? (currentLang === 'en' ? 'No active highlights. Explore the portfolio!' : '활성화된 하이라이트가 없습니다.')
: (currentLang === 'en' ? 'The archive is empty.' : '보관함이 비어있습니다.');
cardsContainer.innerHTML = `<p class="no-highlights">${message}</p>`;
return;
}
Object.keys(data).forEach(id => {
const item = data[id];
const card = document.createElement('div');
card.className = 'highlight-card';
card.dataset.id = id;
card.style.borderColor = `var(--highlight-${item.color})`;
let actionButtonsHTML = '';
if (viewType === 'active') {
card.draggable = true;
actionButtonsHTML = `<button class="unhighlight-card-btn" title="Archive">✕</button>`;
} else {
card.draggable = false;
actionButtonsHTML = `<div class="card-actions">
<button class="restore-btn" data-id="${id}">${currentLang === 'en' ? 'Restore' : '복원'}</button>
<button class="delete-btn" data-id="${id}">${currentLang === 'en' ? 'Delete' : '삭제'}</button>
</div>`;
}
card.innerHTML = `
<div class="card-header">
<span class="card-page-source">${item.page || 'Portfolio'}</span>
${viewType === 'active' ? actionButtonsHTML : ''}
</div>
<p class="card-text">${item.text}</p>
${viewType === 'archived' ? actionButtonsHTML : ''}`;
cardsContainer.appendChild(card);
});
gsap.to('.highlight-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
}
function renderContent() {
switch (currentView) {
case 'timeline':
cardsContainer.classList.add('hidden');
timelineContainer.classList.remove('hidden');
renderTimeline();
break;
case 'active':
case 'archived':
timelineContainer.classList.add('hidden');
cardsContainer.classList.remove('hidden');
renderCards(currentView);
break;
}
}
// --- 4. AI SIMULATION LOGIC ---
function generateAndDisplayInsights() {
const highlights = getHighlightData();
if (Object.keys(highlights).length === 0) {
aiInsightsOutput.innerHTML = 'Highlight items from the portfolio to see your interest analysis.';
if (topInterestPlaceholder) topInterestPlaceholder.textContent = 'various topics';
return;
}
const analysis = analyzeInterests(highlights);
let insightsHTML = '';
if(analysis.topPage) {
insightsHTML += `<p>I see you've spent some time on the **${analysis.topPage}** page. `;
}
if (analysis.topKeywords.length > 0) {
const keywordString = analysis.topKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join(' ');
insightsHTML += `It seems you're particularly interested in topics like ${keywordString}.</p>`;
}
if(analysis.topNGrams.length > 0) {
insightsHTML += `<p>Specifically, phrases like "**${analysis.topNGrams.join('", "')}**" caught your attention more than once.</p>`;
}
insightsHTML += `<p>Based on your **${analysis.totalHighlights}** highlights, I can help you draft a message.</p>`;
aiInsightsOutput.innerHTML = insightsHTML;
if (topInterestPlaceholder) {
topInterestPlaceholder.textContent = analysis.topKeywords.join(', ') || 'your interests';
}
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
if(highlightSnippet) {
body += `\n\nI was particularly drawn to these points:\n${highlightSnippet}`;
}
return `${greeting}\n\n${body}\n\n${closing}`;
}
// --- 5. EVENT HANDLERS ---
function updateGreeting(name) {
userName = name;
hubGreeting.textContent = currentLang === 'en'
? `Welcome, ${userName}! Here is your journey.`
: `${userName}님, 반갑습니다! 당신의 여정을 확인해보세요.`;
}
function handleGenerateClick() {
const highlights = getHighlightData();
if (Object.keys(highlights).length === 0) {
aiOutput.textContent = "Please highlight items first to generate a message.";
return;
}
aiOutput.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Crafting message...`;
setTimeout(() => {
const draftText = generateDraftText();
aiOutput.textContent = draftText;
generateBtn.classList.add('hidden');
postGenerateControls.classList.remove('hidden');
}, 1200);
}
function handleGoToPostcardClick() {
const draft = aiOutput.textContent;
gsap.to(window, {
duration: 1.5,
scrollTo: { y: "#postcard-section", offsetY: 70 },
ease: 'power3.inOut',
onComplete: () => {
if (postcardMessageTextarea) {
postcardMessageTextarea.value = draft;
postcardMessageTextarea.focus();
gsap.from(postcardMessageTextarea, { opacity: 0, duration: 0.5 });
}
}
});
}
// --- 6. EVENT LISTENERS BINDING ---
document.addEventListener('userLoggedIn', (e) => {
updateGreeting(e.detail.username);
generateAndDisplayInsights();
});
document.addEventListener('highlightDataChanged', () => {
renderContent();
generateAndDisplayInsights();
});
hubTabs.addEventListener('click', (e) => {
if (e.target.classList.contains('hub-tab-btn')) {
currentView = e.target.dataset.view;
hubTabs.querySelectorAll('.hub-tab-btn').forEach(btn => btn.classList.remove('active'));
e.target.classList.add('active');
renderContent();
}
});
cardsContainer.addEventListener('click', e => {
const button = e.target.closest('button');
if (!button) return;
const card = button.closest('.highlight-card');
const id = card?.dataset.id;
if (!id) return;
if (button.classList.contains('unhighlight-card-btn')) {
unHighlightElement(null, id);
} else if (button.classList.contains('restore-btn')) {
restoreHighlight(id);
} else if (button.classList.contains('delete-btn')) {
if (confirm(currentLang === 'en' ? 'Delete permanently?' : '영구적으로 삭제하시겠습니까?')) {
deleteUnhighlightPermanently(id);
}
}
});
aiTemplateButtons.forEach(button => {
button.addEventListener('click', () => {
aiTemplateButtons.forEach(btn => btn.classList.remove('active'));
button.classList.add('active');
aiState.template = button.dataset.template;
});
});
aiToneButtons.forEach(button => {
button.addEventListener('click', () => {
aiToneButtons.forEach(btn => btn.classList.remove('active'));
button.classList.add('active');
aiState.tone = button.dataset.tone;
});
});
generateBtn.addEventListener('click', handleGenerateClick);
regenerateBtn.addEventListener('click', handleGenerateClick);
goToPostcardBtn.addEventListener('click', handleGoToPostcardClick);
// --- 7. INITIALIZATION ---
updateGreeting(userName);
renderContent();
generateAndDisplayInsights();
document.querySelector('.ai-template-btn[data-template="general"]').classList.add('active');
document.querySelector('.ai-tone-btn[data-tone="professional"]').classList.add('active');
});