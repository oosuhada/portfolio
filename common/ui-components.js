// ui-components.js (최종 수정본)

// --- 테마 관련 UI 업데이트 함수 ---
/**
 * 현재 테마에 맞춰 CSS 커서 변수를 동적으로 업데이트합니다.
 */
function updateCursorVarsByTheme() {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    const themeSuffix = isDark ? 'dark' : 'light';
    root.style.setProperty('--cursor-default', `var(--cursor-pointer-${themeSuffix})`);
    root.style.setProperty('--cursor-default2', `var(--cursor-pointer-${themeSuffix}2)`);
    root.style.setProperty('--cursor-ew-resize', `var(--cursor-ew-resize-${themeSuffix})`);
    root.style.setProperty('--cursor-ew-resize2', `var(--cursor-ew-resize-${themeSuffix}2)`);
    root.style.setProperty('--cursor-ask', `var(--cursor-ask-${themeSuffix})`);
    console.log(`[Cursor] 테마에 맞춰 커서 업데이트: ${themeSuffix}`);
}

/**
 * AI Assistant FAB 내의 'Ask AI' 이미지의 src를 현재 테마에 맞게 업데이트합니다.
 */
function updateAIAssistantAskImage() {
    const askImage = document.getElementById('ai-assistant-ask-image');
    if (askImage) {
        const isDark = document.documentElement.classList.contains('dark');
        askImage.src = isDark ? '../../img/askdarkmode.png' : '../../img/asklightmode.png';
        console.log(`[AI FAB] 'Ask AI' image updated to: ${askImage.src}`);
    }
}

// 'themeChanged' 이벤트 발생 시 UI 업데이트
document.addEventListener('themeChanged', () => {
    updateCursorVarsByTheme();
    updateAIAssistantAskImage();
});


// --- AI 어시스턴트 플로팅 버튼 초기화 ---
/**
 * AI 어시스턴트 플로팅 버튼을 초기화하고 이벤트를 설정합니다.
 * 이 함수는 모든 페이지에 공통으로 추가된 HTML 구조를 기반으로 작동합니다.
 */
function initializeAIAssistantButton() {
    console.log('[AI Assistant] Initializing FAB button...');

    // 1단계에서 추가한 HTML 요소들을 찾습니다.
    const assistantButton = document.getElementById('ai-assistant-FAB');
    const footer = document.querySelector('footer');
    const aiPortfolioChatModal = document.getElementById('ai-portfolio-chat-modal');
    const customCursorDot = document.getElementById('custom-cursor-dot');
    const askImage = document.getElementById('ai-assistant-ask-image');

    // 필수 요소 중 하나라도 없으면 오류를 방지하기 위해 함수를 종료합니다.
    if (!assistantButton || !footer || !aiPortfolioChatModal || !customCursorDot || !askImage) {
        console.warn('[AI Assistant] Required elements not found. FAB functionality disabled.');
        return;
    }

    // Lottie 애니메이션 로드
    if (typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: assistantButton,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'https://gist.githubusercontent.com/oosuhada/10350c165ecf9363a48efa8f67aaa401/raw/ea144b564bea1a65faffe4b6c52f8cc1275576de/ai-assistant-logo.json'
        });
    } else {
        console.error('Lottie-web library is not loaded. AI Assistant button will show fallback text.');
    }

    // FAB 클릭 이벤트: 채팅 모달 열기/닫기
    assistantButton.addEventListener('click', () => {
        console.log('[AI Assistant] FAB clicked!');
        const isStage1Active = aiPortfolioChatModal.classList.contains('stage-1');
        const isStage2Active = aiPortfolioChatModal.classList.contains('stage-2');

        if (isStage2Active) {
            console.log('[AI Assistant] Stage 2 is active, FAB click ignored.');
            return;
        }

        if (isStage1Active) {
            aiPortfolioChatModal.classList.remove('show', 'stage-1');
        } else {
            aiPortfolioChatModal.classList.remove('stage-2');
            aiPortfolioChatModal.classList.add('show', 'stage-1');
            setTimeout(() => document.getElementById('aiPortfolioChatInput').focus(), 100);
        }
    });

    // 마우스 호버 이벤트: 커스텀 커서 표시
    assistantButton.addEventListener('mouseenter', function() {
        if (window.onboardingActive && window.guideIndex === 6) return;
        document.body.style.cursor = 'none';
        customCursorDot.style.opacity = '1';
        askImage.style.opacity = '1';
    });

    assistantButton.addEventListener('mouseleave', function() {
        if (window.onboardingActive && window.guideIndex === 6) return;
        document.body.style.cursor = '';
        customCursorDot.style.opacity = '0';
        askImage.style.opacity = '0';
    });

    // 마우스 이동 이벤트: 커스텀 커서 위치 추적
    document.addEventListener('mousemove', (e) => {
        const fabRect = assistantButton.getBoundingClientRect();
        const isHoveringFAB = e.clientX >= fabRect.left && e.clientX <= fabRect.right &&
                              e.clientY >= fabRect.top && e.clientY <= fabRect.bottom;

        if (isHoveringFAB && !window.onboardingActive) {
            customCursorDot.style.left = `${e.clientX}px`;
            customCursorDot.style.top = `${e.clientY}px`;
        }
    });

    // 스크롤 이벤트: 푸터에 닿으면 FAB 숨기기
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.01
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            assistantButton.classList.toggle('hidden', entry.isIntersecting);
            if (entry.isIntersecting) {
                customCursorDot.style.opacity = '0';
                askImage.style.opacity = '0';
                document.body.style.cursor = '';
            }
        });
    };

    const footerObserver = new IntersectionObserver(observerCallback, observerOptions);
    footerObserver.observe(footer);
    console.log('[AI Assistant] Footer observer started.');
}


// --- 프리로더 로직 (기존과 동일) ---
let preloader = null;
let loadingText = null;
let textInterval = null;
let preloaderShownAt = null;
let showPreloaderTimer = null;

const words = ["Oosu", "우수", "佑守", "優秀", "憂愁"];
const PRELOADER_SHOW_DELAY = 500;
const PRELOADER_MIN_SHOW_TIME = 1500;
const PRELOADER_FADE_OUT_DURATION = 1500;

function hidePreloader() {
    clearTimeout(showPreloaderTimer);

    if (!preloaderShownAt) {
        if (preloader) {
            preloader.style.display = "none";
            document.dispatchEvent(new Event('preloaderHidden'));
        }
        if (textInterval) clearInterval(textInterval);
        return;
    }

    const elapsed = Date.now() - preloaderShownAt;
    const timeToWaitBeforeFadeOut = Math.max(0, PRELOADER_MIN_SHOW_TIME - elapsed);

    setTimeout(() => {
        setTimeout(() => {
            if (preloader) {
                preloader.style.opacity = 0;
                setTimeout(() => {
                    preloader.style.display = "none";
                    document.dispatchEvent(new Event('preloaderHidden'));
                }, 500);
            }
            if (textInterval) clearInterval(textInterval);
        }, PRELOADER_FADE_OUT_DURATION);
    }, timeToWaitBeforeFadeOut);
}

function initializePreloader() {
    preloader = document.getElementById("preloader");
    loadingText = document.getElementById("loadingText");

    if (loadingText) {
        let index = 0;
        textInterval = setInterval(() => {
            loadingText.textContent = words[index];
            index = (index + 1) % words.length;
        }, 100);
    }

    showPreloaderTimer = setTimeout(() => {
        if (preloader) {
            preloader.style.display = 'flex';
            preloader.style.opacity = 1;
            preloaderShownAt = Date.now();
        }
    }, PRELOADER_SHOW_DELAY);

    window.addEventListener('load', () => {
        const heroVideo = document.getElementById('heroVideo');
        if (heroVideo) {
            const onVideoReady = () => hidePreloader();
            if (heroVideo.readyState >= 3) {
                onVideoReady();
            } else {
                heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
                heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
                heroVideo.addEventListener('error', onVideoReady, { once: true });
            }
        } else {
            hidePreloader();
        }
    });
}


// --- 기타 UI 초기화 (기존과 동일) ---
function initializeFooterImageShake() {
    document.querySelectorAll('.footer-image').forEach(img => {
        if (!img.classList.contains('shake-x')) {
            img.classList.add('shake-x');
        }
    });
}


// 각 초기화 함수들을 전역 스코프에 노출하여 common.js에서 호출할 수 있게 함
window.initializeAIAssistantButton = initializeAIAssistantButton;
window.initializePreloader = initializePreloader;
window.initializeFooterImageShake = initializeFooterImageShake;

// 테마 관련 함수들도 초기 호출을 위해 노출
window.updateCursorVarsByTheme = updateCursorVarsByTheme;
window.updateAIAssistantAskImage = updateAIAssistantAskImage;