// lab-intro.js
/** * =================================================================== 
 * IntroSequence: 인트로 애니메이션 클래스 (수정됨) 
 * =================================================================== 
 */ 
class IntroSequence { 
    constructor() { 
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
          
        // ▼▼▼ [수정] lab-header 요소를 클래스 속성으로 추가 ▼▼▼ 
        this.labHeader = document.getElementById('lab-header'); 
          
        this.labHeaderButtonGroup = document.querySelector('.lab-header .button-group'); 
        this.isAnimating = false; 
        this._scrollDownHandler = this.handleScrollDownClick.bind(this); 
        this._themeChangeHandler = this.updateIntroColors.bind(this); 
          
        document.addEventListener('themeChanged', this._themeChangeHandler); 
    } 
      
    updateIntroColors(event) { 
        const theme = event.detail ? event.detail.theme : (document.documentElement.classList.contains('dark') ? 'dark' : 'light'); 
        const isDark = theme === 'dark'; 

        if (!this.isAnimating) { 
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
        document.documentElement.style.setProperty('--intro-text-color', newColor); 
          
        const typingContainer = document.querySelector('.typing-container'); 
        if (typingContainer) typingContainer.style.color = newColor; 

        const countdownContainer = document.getElementById('countdown-container'); 
        if (countdownContainer) countdownContainer.style.color = newColor; 

        const scrollArrow = document.getElementById('scroll-down-arrow'); 
        if (scrollArrow) scrollArrow.style.color = newColor; 

        console.log(`[IntroSequence] Intro colors forcibly updated to ${newColor}`); 
    } 

    start() { 
        if (this.isAnimating) return; 
        this.isAnimating = true; 

        this.updateIntroColors({ detail: { theme: localStorage.getItem('user-theme') || 'light' } }); 

        gsap.set(this.introScreen, { opacity: 1, visibility: 'visible' }); 
        gsap.set(this.typingContainer, { opacity: 0, y: 20 }); 
        this.countdownNumbers.forEach(num => gsap.set(num, { opacity: 0, y: 20 })); 
        gsap.set(this.scrollDownArrow, { opacity: 0, pointerEvents: 'none' }); 
          
        // ▼▼▼ [수정] labHeader 전체를 숨기도록 변경 ▼▼▼ 
        if (this.labHeader) { 
            gsap.set(this.labHeader, { opacity: 0, y: -20, pointerEvents: 'none' }); 
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
                this.updateIntroColors({});  
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
            onStart: () => { 
                console.log("[IntroSequence] Adding click event listener to scroll-down arrow"); 
                this.scrollDownArrow.addEventListener('click', this._scrollDownHandler); 
            } 
        }, "startCountdown+=3.8"); 

        // 헤더의 버튼 그룹 애니메이션은 헤더 전체가 제어하므로 그대로 두거나 삭제해도 무방합니다. 
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
        if (gsap.isTweening(this.introScreen) || gsap.isTweening('main')) { 
            return; 
        } 

        gsap.killTweensOf([ 
            this.introScreen, this.typingContainer, this.typingLine1, this.typingLine2, 
            ...this.countdownNumbers, this.scrollDownArrow, this.labHeaderButtonGroup 
        ]); 
        console.log("[IntroSequence] Killed ongoing animations"); 
          
        this.isAnimating = false; 
        document.removeEventListener('themeChanged', this._themeChangeHandler); 

        this.countdownNumbers.forEach(num => { 
            num.style.display = 'none'; 
        }); 
        gsap.set(this.scrollDownArrow, { opacity: 0, y: 20, pointerEvents: 'none' }); 
        this.scrollDownArrow.removeEventListener('click', this._scrollDownHandler); 
        console.log("[IntroSequence] Removed scroll-down arrow click listener"); 
          
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

        gsap.to('main.carousel-main', { 
            paddingTop: 0, 
            duration: 1.5, 
            ease: 'power3.inOut', 
            onComplete: () => { 
                console.log("[IntroSequence] Main content positioned."); 
                const mainElement = document.querySelector('main'); 
                mainElement.classList.remove('initial-carousel-space'); 
                if (typeof window.startApplicationVisuals === 'function') { 
                    console.log("[IntroSequence] Calling startApplicationVisuals"); 
                    window.startApplicationVisuals(); 
                } else { 
                    console.error("[IntroSequence] startApplicationVisuals function not found!"); 
                } 
                this.isAnimating = false; 
            } 
        }); 
          
        // ▼▼▼ [수정] labHeader가 부드럽게 나타나는 애니메이션 추가 ▼▼▼ 
        if (this.labHeader) { 
            gsap.to(this.labHeader, { 
                opacity: 1, 
                y: 0, 
                duration: 1.0, 
                ease: "power2.out", 
                pointerEvents: 'auto', 
                delay: 0.5  
            }); 
        } 
    } 
} 


/** * =================================================================== 
 * 애플리케이션 초기화 
 * =================================================================== 
 */ 
document.addEventListener('DOMContentLoaded', () => { 
    if (window.themeManager) { 
        window.themeManager.initialize(); 
    } else { 
        console.error("Theme Manager가 로드되지 않았습니다."); 
    } 

    const introSequence = new IntroSequence(); 
      
    if (document.getElementById('intro-screen')) { 
        introSequence.start(); 
    } 

    window.introSequence = introSequence; 
});