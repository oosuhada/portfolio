/**
 * ===================================================================
 * ✨ 전역 테마 관리자 (Global Theme Manager) ✨
 * ===================================================================
 * 모든 페이지에서 일관된 다크/라이트 모드 경험을 제공합니다.
 * - localStorage의 'user-theme' 키를 사용합니다.
 * - CSS가 테마를 인지할 수 있도록 <body> 요소에 'data-theme' 속성을 설정합니다.
 */

const THEME_KEY = 'user-theme'; // 1. 일관된 localStorage 키 정의

/**
 * 지정된 테마를 페이지에 적용하고, localStorage에 저장합니다.
 * @param {('light'|'dark')} theme - 적용할 테마
 */
function applyTheme(theme) {
  const htmlElement = document.documentElement;
  const bodyElement = document.body; // <body> 요소를 가져옵니다.

  // ▼▼▼ [수정됨] CSS가 테마를 인식할 수 있도록 <body>에 'data-theme' 속성을 설정합니다. ▼▼▼
  bodyElement.setAttribute('data-theme', theme);

  // 일관성과 다른 스크립트와의 호환성을 위해 <html>에 클래스도 설정합니다.
  htmlElement.classList.remove('light', 'dark');
  htmlElement.classList.add(theme);

  // localStorage에 현재 테마 저장
  localStorage.setItem(THEME_KEY, theme);

  // ▼▼▼ [개선됨] 아이콘 상태 업데이트 로직 개선 ▼▼▼
  // 모든 페이지의 토글 버튼에 적용됩니다.
  document.querySelectorAll('.theme-toggle-button').forEach(button => {
    const sunIcon = button.querySelector('#sun-icon'); // ID로 명확하게 선택
    const moonIcon = button.querySelector('#moon-icon'); // ID로 명확하게 선택
    if (sunIcon && moonIcon) {
        // hidden 클래스를 제어하는 것이 더 안정적입니다.
        sunIcon.classList.toggle('hidden', theme === 'dark');
        moonIcon.classList.toggle('hidden', theme !== 'dark');
    }
  });

  // 다른 컴포넌트들이 테마 변경을 감지할 수 있도록 커스텀 이벤트 발생
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  console.log(`[ThemeManager] 테마 적용됨: ${theme}`);
}

/**
 * 현재 테마를 반대 테마로 전환합니다.
 */
function toggleTheme() {
  // 현재 테마를 body의 data-theme 속성이나 localStorage에서 가져옵니다.
  const currentTheme = document.body.getAttribute('data-theme') || localStorage.getItem(THEME_KEY) || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

/**
 * 페이지 로드 시 테마를 초기화합니다.
 * @param {'light'|'dark'|null} [forceTheme=null] - 특정 테마를 강제할 경우 지정합니다. (예: 'dark')
 */
function initializeTheme(forceTheme = null) {
  // 특정 페이지를 위한 테마 강제 로직
  if (forceTheme) {
    console.log(`[ThemeManager] '${forceTheme}' 테마 강제 적용.`);
    applyTheme(forceTheme);
    return;
  }

  // 강제 테마가 없는 경우, 저장된 값 또는 시스템 설정을 따름
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
}

// --- 이벤트 리스너 설정 ---
// DOM이 로드되면 모든 테마 토글 버튼에 클릭 이벤트를 추가합니다.
document.addEventListener('DOMContentLoaded', () => {
    // 여러 개의 토글 버튼이 있을 수 있으므로 querySelectorAll 사용
    const themeToggleButtons = document.querySelectorAll('.theme-toggle-button');
    
    themeToggleButtons.forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    // 참고: 실제 테마 초기화는 각 페이지의 메인 JS 파일에서 initializeTheme()을 호출하여 실행합니다.
});

// 전역에서 접근할 수 있도록 window 객체에 함수 할당
window.themeManager = {
    initialize: initializeTheme,
    apply: applyTheme,
    toggle: toggleTheme
};