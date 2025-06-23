/**
 * ===================================================================
 * ThemeManager: 테마 변경 및 인트로 색상 동기화를 관리하는 클래스
 * ===================================================================
 */
class ThemeManager {
  constructor() {
    this.themeToggleButton = document.getElementById('theme-toggle');
    this.sunIcon = document.querySelector('.theme-icon.sun');
    this.moonIcon = document.querySelector('.theme-icon.moon');
    
    // IntroSequence 인스턴스를 저장하기 위한 속성
    this.introSequence = null; 

    // [수정] 시스템 설정 및 localStorage 확인 로직 제거, 라이트 모드로 시작 강제
    this.isDark = false;
    
    this._toggleThemeHandler = this.toggleTheme.bind(this);
    this.init();
  }

  // IntroSequence 인스턴스를 등록하는 메서드
  registerIntro(introInstance) {
    this.introSequence = introInstance;
    // 등록 시 현재 테마에 맞게 인트로 색상 즉시 업데이트
    this.updateIntroColors(this.isDark);
  }

  init() {
    // 테마 토글 버튼이 존재할 경우에만 이벤트 리스너 추가
    if (this.themeToggleButton) {
        this.themeToggleButton.addEventListener('click', this._toggleThemeHandler);
    }
    this.applyTheme(this.isDark);
  }
  
  toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme(this.isDark);
  }

  applyTheme(isDark) {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (this.sunIcon && this.moonIcon) {
      this.sunIcon.classList.toggle('hidden', isDark);
      this.moonIcon.classList.toggle('hidden', !isDark);
    }
    
    // 테마 적용 시 인트로 관련 요소들의 색상을 강제로 업데이트
    this.updateIntroColors(isDark);
  }
  
  /**
   * [핵심 해결 로직]
   * 인트로 관련 요소들의 색상을 직접 강제 업데이트합니다.
   * GSAP 애니메이션 중이라도 CSS 변수 변경에 따른 렌더링 문제를 회피할 수 있습니다.
   */
  updateIntroColors(isDark) {
    // 인트로가 활성화 상태가 아니면 실행하지 않음
    if (!this.introSequence || !this.introSequence.isAnimating) {
        // 인트로가 끝난 후에는 강제 스타일을 제거하여 CSS(:root)가 제어하도록 함
        const introElements = [
            document.querySelector('.typing-container'),
            document.getElementById('countdown-container'),
            document.getElementById('scroll-down-arrow')
        ];
        introElements.forEach(el => {
            if (el) el.style.color = '';
        });
        return;
    }
    
    const newColor = isDark ? 'white' : 'black';

    // CSS 변수도 함께 업데이트하여 일관성 유지
    document.documentElement.style.setProperty('--intro-text-color', newColor);
    
    // 1. 타이핑 텍스트 색상 강제 업데이트
    const typingContainer = document.querySelector('.typing-container');
    if (typingContainer) {
      typingContainer.style.color = newColor;
    }

    // 2. 카운트다운 숫자 색상 강제 업데이트
    const countdownContainer = document.getElementById('countdown-container');
    if (countdownContainer) {
      countdownContainer.style.color = newColor;
    }

    // 3. 스크롤 다운 화살표 색상 강제 업데이트
    const scrollArrow = document.getElementById('scroll-down-arrow');
    if (scrollArrow) {
      scrollArrow.style.color = newColor;
    }
    
    console.log(`[ThemeManager] Intro colors forcibly updated to ${newColor}`);
  }
}


/**
 * ===================================================================
 * IntroSequence: 기존 인트로 애니메이션 클래스
 * ===================================================================
 */
class IntroSequence {
  // 생성자에 themeManager 추가
  constructor(themeManager) {
    this.themeManager = themeManager; // 테마 매니저 인스턴스 저장
    this.introScreen = document.getElementById('intro-screen');
    this.backgroundVideo = document.getElementById('background-video');
    this.typingContainer = document.querySelector('.typing-container');
    this.typingLine1 = document.querySelector('.typing-text-line1');
    this.typingLine2 = document.querySelector('.typing-text-line2');
    this.countdownNumbers = [
      document.getElementById('count-0'),
      document.getElementById('count-22'),
      document.getElementById('count-90'),
      document.getElementById('count-100')
    ];
    this.scrollDownArrow = document.getElementById('scroll-down-arrow');
    this.labHeaderButtonGroup = document.querySelector('.lab-header .button-group');
    this.isAnimating = false;
    this._scrollDownHandler = this.handleScrollDownClick.bind(this);

    // IntroSequence 인스턴스를 ThemeManager에 등록
    if (this.themeManager) {
      this.themeManager.registerIntro(this);
    }
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    gsap.set(this.introScreen, { opacity: 1, visibility: 'visible' });
    gsap.set(this.typingContainer, { opacity: 0, y: 20 });
    this.countdownNumbers.forEach(num => gsap.set(num, { opacity: 0, y: 20 }));
    gsap.set(this.scrollDownArrow, { opacity: 0, pointerEvents: 'none' });

    if (this.labHeaderButtonGroup) {
        gsap.set(this.labHeaderButtonGroup, { opacity: 0, y: -20, pointerEvents: 'none' });
        
        // 인트로 중에는 테마와 관계없이 항상 잘 보이도록 어두운 버튼/밝은 텍스트로 고정
        this.labHeaderButtonGroup.style.setProperty('--button-intro-color', 'black');
        this.labHeaderButtonGroup.style.setProperty('--button-intro-text-color', 'white');
    }

    if (this.backgroundVideo) {
      this.backgroundVideo.play().catch(error => {
        console.error("Video autoplay prevented:", error);
      });
    }

    const masterTimeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        console.log("[IntroSequence] Master timeline completed, isAnimating set to false");
      }
    });

    const line1Text = "Welcome to my playground.";
    const line2Text = "Where my passion meets creativity.";
    const startTime = 0.5;

    masterTimeline.to(this.typingContainer, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, startTime);
    masterTimeline.to(this.typingLine1, {
      width: "auto",
      duration: line1Text.length * 0.08,
      ease: "none",
    }, startTime + 0.5);
    masterTimeline.to(this.typingLine2, {
      width: "auto",
      duration: line2Text.length * 0.08,
      ease: "none",
    }, "+=0.5");

    masterTimeline.addLabel("startCountdown", startTime);

    masterTimeline.to(this.countdownNumbers[0], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown");
    masterTimeline.to(this.countdownNumbers[0], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=0.8");
    masterTimeline.to(this.countdownNumbers[1], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown+=1.2");
    masterTimeline.to(this.countdownNumbers[1], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=2.0");
    masterTimeline.to(this.countdownNumbers[2], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown+=2.4");
    masterTimeline.to(this.countdownNumbers[2], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=3.2");
    masterTimeline.to(this.countdownNumbers[3], { opacity: 0.7, y: 0, duration: 0.4, ease: "power2.out" }, "startCountdown+=3.6");
    masterTimeline.to(this.countdownNumbers[3], {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        this.countdownNumbers.forEach(num => num.style.display = 'none');
      }
    }, "startCountdown+=4.2");

    masterTimeline.to(this.scrollDownArrow, {
        opacity: 0.5,
        duration: 0.7,
        pointerEvents: 'auto'
    }, "startCountdown+=2.4");
    masterTimeline.to(this.scrollDownArrow, {
        opacity: 1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        onStart:  () => {
            console.log("[IntroSequence] Adding click event listener to scroll-down arrow");
            this.scrollDownArrow.addEventListener('click', this._scrollDownHandler);
        }
    }, "startCountdown+=3.8");

    if (this.labHeaderButtonGroup) {
        masterTimeline.to(this.labHeaderButtonGroup, {
            opacity: 1,
            y: 0,
            duration: 4,
            ease: "power2.out",
            pointerEvents: 'auto'
        }, "startCountdown+=1");
    }
  }

  handleScrollDownClick() {
    console.log("[IntroSequence] Scroll-down arrow clicked");
    
    // 이미 진행 중인 경우 중복 실행 방지
    if (gsap.isTweening(this.introScreen) || gsap.isTweening('main')) {
        return;
    }

    gsap.killTweensOf([
      this.introScreen, this.typingContainer, this.typingLine1, this.typingLine2,
      ...this.countdownNumbers, this.scrollDownArrow, this.labHeaderButtonGroup
    ]);
    console.log("[IntroSequence] Killed ongoing animations");
    
    this.isAnimating = false;

    this.countdownNumbers.forEach(num => {
      num.style.display = 'none';
    });
    gsap.set(this.scrollDownArrow, { opacity: 0, y: 20, pointerEvents: 'none' });
    this.scrollDownArrow.removeEventListener('click', this._scrollDownHandler);
    console.log("[IntroSequence] Removed scroll-down arrow click listener");
    
    if (this.themeManager) {
        this.themeManager.updateIntroColors(this.themeManager.isDark);
    }

    // 인트로 화면을 위로 사라지게 하는 애니메이션
    gsap.to(this.introScreen, {
      y: '-100%',
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        this.introScreen.style.display = 'none';
        console.log("[IntroSequence] Intro screen hidden");
      }
    });

    // 메인 콘텐츠의 padding-top을 0으로 만들면서 부드럽게 등장시키는 애니메이션
    gsap.to('main.carousel-main', {
        paddingTop: 0,
        duration: 1.5,
        ease: 'power3.inOut',
        onComplete: () => {
            console.log("[IntroSequence] Main content positioned.");
            const mainElement = document.querySelector('main');
            mainElement.classList.remove('initial-carousel-space'); // 클래스 제거
            
            // [중요] 모든 전환 애니메이션이 끝난 후 메인 비주얼 시작
            if (typeof window.startApplicationVisuals === 'function') {
                console.log("[IntroSequence] Calling startApplicationVisuals");
                window.startApplicationVisuals();
            } else {
                console.error("[IntroSequence] startApplicationVisuals function not found!");
            }

            this.isAnimating = false;
        }
    });
    
    // lab-header가 즉시 보이도록 상태 복구
    if (this.labHeaderButtonGroup) {
        gsap.to(this.labHeaderButtonGroup, { 
            opacity: 1, 
            y: 0, 
            duration: 0.5,
            ease: "power2.out",
            pointerEvents: 'auto',
            onComplete: () => {
                 this.labHeaderButtonGroup.style.removeProperty('--button-intro-color');
                 this.labHeaderButtonGroup.style.removeProperty('--button-intro-text-color');
            }
        });
    }
  }
}


/**
 * ===================================================================
 * 애플리케이션 초기화
 * ===================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. 테마 매니저를 먼저 생성
  const themeManager = new ThemeManager();
  
  // 2. 인트로 시퀀스를 생성하면서 테마 매니저를 주입
  const introSequence = new IntroSequence(themeManager);
  
  // 3. 인트로 시작
  // HTML 요소가 모두 로드된 후 인트로를 시작해야 합니다.
  if (document.getElementById('intro-screen')) {
      introSequence.start();
  }

  // 전역에서 접근 가능하도록 설정 (디버깅 또는 다른 모듈과의 연동 시)
  window.introSequence = introSequence;
  window.themeManager = themeManager;
});