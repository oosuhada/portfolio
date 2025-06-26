// common.js

// --- Core Utility Functions ---

/**
 * Validates a form field and displays an error message if invalid.
 * @param {HTMLElement} field - The form field to validate.
 * @returns {boolean} True if the field is valid, false otherwise.
 */
window.validateField = (field) => {
    field.reportValidity();
    const isValid = !field.validity.valueMissing && !field.validity.typeMismatch;
    field.classList.toggle('invalid', !isValid);
    const errorMessageElement = field.nextElementSibling;
    if(errorMessageElement && errorMessageElement.classList.contains('error-message')) {
        if(!isValid) {
            errorMessageElement.textContent = field.validationMessage || "This field is required.";
            errorMessageElement.classList.add('visible');
        } else {
            errorMessageElement.classList.remove('visible');
        }
    }
    return isValid;
};

/**
 * Dynamically adds a temporary style tag to disable all CSS transitions for immediate changes.
 * This is useful for preventing animation delays when navigating between pages.
 */
function disableAllTransitions() {
    const style = document.createElement('style');
    style.id = 'no-transition-on-exit'; // 고유 ID
    style.textContent = `
        * {
            transition: none !important;
        }
        body::before { /* 배경 transition 등 유사 요소에 대비 */
            transition: none !important;
        }
    `;
    document.head.appendChild(style);

    // 짧은 시간 후 스타일 태그 제거 (페이지 로드 전 스타일 적용 보장)
    setTimeout(() => {
        const tempStyle = document.getElementById('no-transition-on-exit');
        if (tempStyle) {
            tempStyle.remove();
        }
    }, 100);
}

/**
 * 아코디언 내비게이션 메뉴의 확장 상태를 확인하는 전역 헬퍼 함수.
 * 헤더 스크롤 로직에서 사용됩니다.
 * @returns {boolean} 메뉴가 확장되어 있으면 true, 아니면 false
 */
window.getNavHeaderExpandedState = function() {
    const accordionNavMenu = document.getElementById('accordionNavMenu');
    return accordionNavMenu ? accordionNavMenu.classList.contains('expanded') : false;
};

// 다른 모듈에서 접근할 수 있도록 함수를 전역 스코프에 노출
window.disableAllTransitions = disableAllTransitions;


// --- Main Initialization Logic ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded 이벤트 발생: 페이지 초기화 시작');

    // ThemeManager 초기화 (window.themeManager가 다른 곳에 정의되어 있다고 가정)
    if (window.themeManager) window.themeManager.initialize();

    // 각 모듈 초기화 (의존성에 따라 순서 중요)
    // core-utilities는 함수를 바로 노출하므로 별도의 initialize 함수는 필요 없음.

    if (window.initializePreloader) window.initializePreloader(); // 프리로더 (UI 컴포넌트)
    if (window.initializeAIAssistantButton) window.initializeAIAssistantButton(); // AI FAB (UI 컴포넌트)
    if (window.updateCursorVarsByTheme) window.updateCursorVarsByTheme(); // 초기 커서 설정 (UI 컴포넌트)
    if (window.updateAIAssistantAskImage) window.updateAIAssistantAskImage(); // 초기 AI FAB 이미지 설정 (UI 컴포넌트)
    if (window.initializeVisualEffects) window.initializeVisualEffects(); // 시각 효과 초기화
    if (window.initializeNavigation) window.initializeNavigation(); // 내비게이션 (utils, visual-effects에 의존)
    if (window.initializeFooterImageShake) window.initializeFooterImageShake(); // 푸터 이미지 흔들기 (UI 컴포넌트)

    // highlighter.js는 자체적으로 DOMContentLoaded 리스너를 가지거나,
    // 만약 initializeHighlighter 함수를 노출한다면 여기서 호출:
    // if (window.initializeHighlighter) window.initializeHighlighter();

    console.log('페이지 초기화 완료');
});