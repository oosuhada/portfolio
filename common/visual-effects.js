// visual-effects.js

const slideColors = [
    { confetti: ['#000000', '#181818', '#282828', '#0A0A0A', '#111111', '#202020'] }, // Black/Grayscale
    { confetti: ['#ff8c42', '#ffaa6e', '#e07b39', '#d2691e', '#ffbf80'] }, // Orange
    { confetti: ['#d279ee', '#c45eda', '#e89cd2', '#b54bc6', '#f8c390'] }, // Purple/Pink
    { confetti: ['#f78fad', '#e43970', '#fdd090', '#db0567', '#c21d54'] }, // Hot Pink/Red
    { confetti: ['#6de195', '#4caf50', '#2c5e1a', '#388e3c', '#c4e759'] }, // Green
    { confetti: ['#41c7af', '#26a69a', '#155d47', '#54e38e', '#00796b'] }, // Teal
    { confetti: ['#5583ee', '#1976d2', '#41d8dd', '#0288d1', '#4fc3f7'] }, // Blue
    { confetti: ['#6cacff', '#2196f3', '#8debff', '#0288d1', '#4fc3f7'] }, // Lighter Blue
    { confetti: ['#a16bfe', '#7b1fa2', '#deb0df', '#8e24aa', '#ab47bc'] }, // Violet
    { confetti: ['#bc3d2f', '#a16bfe', '#d32f2f', '#c2185b', '#ab47bc'] }  // Red/Violet mix
];

/**
 * 화면에 잉크 스플래시 효과를 생성합니다.
 * @param {number} clickX - 클릭 X 좌표
 * @param {number} clickY - 클릭 Y 좌표
 * @param {HTMLElement} targetElement - 스플래시를 추가할 DOM 요소
 * @param {number} scaleFactor - 스플래시 크기 조절 계수
 */
function createScreenInkSplash(clickX, clickY, targetElement = document.body, scaleFactor = 1.0) {
    const splash = document.createElement('div');
    splash.classList.add('screen-click-splash-blob');

    const borderRadii = [
        "47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%",
        "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%",
        "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%",
        "60% 45% 46% 62% / 95% 62% 62% 58%", "30% 65% 60% 62% / 60% 39% 60% 68%",
        "61% 63% 35% 57% / 65% 26% 55% 62%"
    ];
    splash.style.borderRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)];

    const rootStyles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.classList.contains('dark');

    let inkShades;
    if (isDark) {
        const C_WHITE = rootStyles.getPropertyValue('--white').trim() || '#FFFFFF';
        const C_GRAY_LIGHT = rootStyles.getPropertyValue('--gray-light').trim() || '#DDDDDD';
        const C_GRAY_LIGHTER = rootStyles.getPropertyValue('--gray-lighter').trim() || '#EEEEEE';
        inkShades = [C_WHITE, C_GRAY_LIGHT, C_GRAY_LIGHTER, '#F0F0F0', '#CCCCCC'];
    } else {
        const C_BLACK = rootStyles.getPropertyValue('--black').trim() || '#000000';
        const C_GRAY_DARK = rootStyles.getPropertyValue('--gray-dark').trim() || '#222222';
        const C_GRAY = rootStyles.getPropertyValue('--gray').trim() || '#555555';
        inkShades = [C_BLACK, C_GRAY_DARK, C_GRAY, '#1A1A1A', '#101010'];
    }

    splash.style.backgroundColor = inkShades[Math.floor(Math.random() * inkShades.length)];
    const baseMinSize = 60;
    const baseRangeSize = 20;
    const splashBaseSize = (Math.random() * baseRangeSize + baseMinSize) * scaleFactor;
    splash.style.width = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`;
    splash.style.height = `${Math.max(2, splashBaseSize * (0.9 + Math.random() * 0.1))}px`;
    splash.style.position = 'fixed';
    splash.style.left = `${clickX}px`;
    splash.style.top = `${clickY}px`;
    splash.style.transform = 'translate(-50%, -50%) scale(0)';
    targetElement.appendChild(splash);
    setTimeout(() => {
        if (splash.parentElement) splash.remove();
    }, 700);
}

/**
 * 대상 요소 내부에 콘페티 같은 잉크 스플래시를 생성합니다.
 * @param {HTMLElement} targetElement - 스플래시를 추가할 DOM 요소
 * @param {MouseEvent} event - 클릭 이벤트 객체 (좌표 얻기용)
 * @param {Array<string>} confettiColors - 스플래시 색상 배열
 */
function createConfettiInkSplash(targetElement, event, confettiColors) {
    const existingSplash = targetElement.querySelector('.confetti-ink-splash');
    if (existingSplash) existingSplash.remove();

    const internalSplash = document.createElement('span');
    internalSplash.classList.add('confetti-ink-splash');

    const rect = targetElement.getBoundingClientRect();
    const splashSize = Math.max(rect.width, rect.height) * 0.02;

    if (targetElement === document.body) {
        internalSplash.style.left = `${event.clientX - splashSize / 2}px`;
        internalSplash.style.top = `${event.clientY - splashSize / 2}px`;
    } else {
        internalSplash.style.left = `${event.clientX - rect.left - splashSize / 2}px`;
        internalSplash.style.top = `${event.clientY - rect.top - splashSize / 2}px`;
    }

    internalSplash.style.width = `${splashSize}px`;
    internalSplash.style.height = `${splashSize}px`;

    const borderRadii = [
        "47% 53% 50% 40% / 60% 37% 53% 40%", "65% 42% 70% 55% / 70% 68% 46% 51%",
        "60% 60% 45% 55% / 55% 60% 50% 60%", "59% 58% 65% 62% / 52% 68% 37% 59%",
        "60% 45% 46% 62% / 95% 62% 62% 58%", "55% 66% 33% 55% / 66% 68% 66% 62%",
        "60% 45% 46% 62% / 95% 62% 62% 58%", "30% 65% 60% 62% / 60% 39% 60% 68%",
        "61% 63% 35% 57% / 65% 26% 55% 62%"
    ];
    const randomRadius = borderRadii[Math.floor(Math.random() * borderRadii.length)];
    internalSplash.style.borderRadius = randomRadius;

    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    internalSplash.style.backgroundColor = color;

    targetElement.appendChild(internalSplash);

    setTimeout(() => {
        if (internalSplash.parentElement) internalSplash.remove();
    }, 700);
}

/**
 * 원점부터 외부로 퍼지는 잉크 입자를 생성합니다.
 * @param {number} originX - 원점 X 좌표
 * @param {number} originY - 원점 Y 좌표
 * @param {Array<string>} confettiColors - 입자 색상 배열
 */
function createExternalInkParticles(originX, originY, confettiColors) {
    const particleCount = 5;
    const irregularBorderRadii = [
        '45% 58% 62% 37% / 52% 38% 67% 49%', '62% 64% 58% 60% / 70% 50% 70% 50%',
        '54% 42% 62% 57% / 54% 42% 62% 47%', '62% 68% 60% 56% / 70% 60% 70% 50%',
        '63% 38% 70% 33% / 53% 62% 39% 46%', '65% 70% 65% 68% / 75% 54% 74% 50%',
        '48% 56% 35% 38% / 54% 42% 62% 47%', '66% 75% 65% 70% / 66% 55% 66% 60%',
        '30% 70% 70% 30% / 30% 30% 70% 70%', '50% 50% 30% 70% / 60% 40% 60% 40%',
        '35% 65% 45% 55% / 60% 30% 70% 40%', '70% 30% 80% 20% / 65% 35% 75% 25%'
    ];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('confetti-particle-effect');
        particle.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        particle.style.filter = 'url(#inkParticleSurface)';

        let width, height;
        const sizeMultiplier = 4;
        const randomFactor = Math.random();

        if (randomFactor < 0.6) {
            const baseSize = (Math.random() * 10 + 8) * sizeMultiplier;
            width = baseSize * (0.8 + Math.random() * 0.4);
            height = baseSize * (0.8 + Math.random() * 0.4);
        } else {
            const baseWidth = (Math.random() * 12 + 6) * sizeMultiplier;
            const baseHeight = (Math.random() * 8 + 4) * sizeMultiplier;
            width = baseWidth;
            height = baseHeight;
        }

        particle.style.width = `${width}px`;
        particle.style.height = `${height}px`;
        particle.style.borderRadius = irregularBorderRadii[Math.floor(Math.random() * irregularBorderRadii.length)];

        if (width < 15 && height < 15) {
            particle.style.opacity = (Math.random() * 0.2 + 0.7).toString();
        }

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 60 + 40;
        const duration = Math.random() * 1.5 + 2.5;
        const initialRotation = Math.random() * 360;
        const finalRotation = initialRotation + (Math.random() * 30 - 90);
        const initialOpacity = parseFloat(particle.style.opacity || '0.6');
        const maxBlur = 5 + Math.random() * 5;

        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        particle.style.transform = `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`;

        particle.animate([
            { transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, opacity: initialOpacity, filter: 'blur(0.5px)' },
            { transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.05) rotate(${finalRotation}deg)`, opacity: 0, filter: `blur(${maxBlur}px)` }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)',
            fill: 'forwards'
        });

        setTimeout(() => { particle.remove(); }, duration * 1000);
    }
}

let isMouseDownForConfetti = false;
let confettiInterval = null;
let currentMousedownEvent = null;
let currentColorSetIndex = 0;
let mousedownTimeout = null;
const MOUSEDOWN_DELAY = 300;
const CONFETTI_INTERVAL = 100;

/**
 * 마우스 다운 시 콘페티 효과를 지연 후 시작합니다.
 * @param {MouseEvent} event - 트리거 마우스 이벤트
 */
function startConfettiEffect(event) {
    if (event.target.closest('a, button, input, .no-general-splash, #highlight-menu, [data-highlight-id], .balloon, .fast-text-balloon, .slide-title, .nav-button, .welcome-banner-link, #inboxIconContainer, #darkModeToggleContainer, #ai-assistant-FAB')) {
        return;
    }

    isMouseDownForConfetti = true;
    currentMousedownEvent = event;
    confettiInterval = setInterval(() => {
        if (isMouseDownForConfetti && currentMousedownEvent) {
            const currentColors = slideColors[currentColorSetIndex].confetti;
            createConfettiInkSplash(document.body, currentMousedownEvent, currentColors);
            createExternalInkParticles(currentMousedownEvent.clientX, currentMousedownEvent.clientY, currentColors);
            currentColorSetIndex = (currentColorSetIndex + 1) % slideColors.length;
        }
    }, CONFETTI_INTERVAL);
}

/**
 * 콘페티 효과를 중지하고 관련 인터벌/타임아웃을 해제합니다.
 */
function stopConfettiEffect() {
    isMouseDownForConfetti = false;
    currentMousedownEvent = null;
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
    if (mousedownTimeout) {
        clearTimeout(mousedownTimeout);
        mousedownTimeout = null;
    }
}

/**
 * 시각 효과를 초기화하고 전역 클릭 및 마우스 이벤트 리스너를 설정합니다.
 */
function initializeVisualEffects() {
    // 전역 마우스 이벤트 리스너 (콘페티)
    document.addEventListener('mousedown', (event) => {
        if (event.button === 2) return; // 우클릭 무시

        if (mousedownTimeout) {
            clearTimeout(mousedownTimeout);
        }
        mousedownTimeout = setTimeout(() => {
            startConfettiEffect(event);
        }, MOUSEDOWN_DELAY);
    });

    document.addEventListener('mousemove', (event) => {
        if (isMouseDownForConfetti) {
            currentMousedownEvent = event;
        }
    });

    document.addEventListener('mouseup', () => {
        stopConfettiEffect();
    });

    document.addEventListener('mouseleave', () => {
        stopConfettiEffect();
    });

    // 비상호작용 요소에 대한 일반 화면 클릭 스플래시
    document.addEventListener('click', function(event) {
        // 특정 상호작용 요소 또는 콘페티가 활성화된 경우 스플래시 방지
        if (event.target.closest('a, button, input, .no-general-splash, #highlight-menu, [data-highlight-id], #ai-assistant-FAB') || isMouseDownForConfetti) {
            return;
        }
        createScreenInkSplash(event.clientX, event.clientY, document.body, 0.1);
    });
}

// 다른 모듈에서 사용될 수 있도록 함수를 전역 스코프에 노출
window.createScreenInkSplash = createScreenInkSplash;
window.initializeVisualEffects = initializeVisualEffects;