// lab-intro.js
(function() {
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
      this.isAnimating = false;
      this._scrollDownHandler = this.handleScrollDownClick.bind(this);
    }

    start() {
      if (this.isAnimating) return;
      this.isAnimating = true;

      // Initialize elements states
      gsap.set(this.introScreen, { opacity: 1, visibility: 'visible' });
      gsap.set(this.typingContainer, { opacity: 0, y: 20 });
      this.countdownNumbers.forEach(num => gsap.set(num, { opacity: 0, y: 20 }));
      gsap.set(this.scrollDownArrow, { opacity: 0, pointerEvents: 'none' });

      // Play video
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

      // Typing animation (Line 1)
      masterTimeline.to(this.typingContainer, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, startTime);
      masterTimeline.to(this.typingLine1, {
        width: "auto",
        duration: line1Text.length * 0.08,
        ease: "none",
        onUpdate: function() {
          this.targets()[0].style.borderRightColor = "white";
        },
        onComplete: function() {
          this.targets()[0].style.borderRightColor = "transparent";
        }
      }, startTime + 0.5);

      // Typing animation (Line 2)
      masterTimeline.to(this.typingLine2, {
        width: "auto",
        duration: line2Text.length * 0.08,
        ease: "none",
        onUpdate: function() {
          this.targets()[0].style.borderRightColor = "white";
        },
        onComplete: function() {
          this.targets()[0].style.borderRightColor = "transparent";
        }
      }, "+=0.5");

      // Countdown animation
      masterTimeline.addLabel("startCountdown", startTime);

      // Animate 0
      masterTimeline.to(this.countdownNumbers[0], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown");
      masterTimeline.to(this.countdownNumbers[0], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=0.8");

      // Animate 22
      masterTimeline.to(this.countdownNumbers[1], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown+=1.2");
      masterTimeline.to(this.countdownNumbers[1], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=2.0");

      // Animate 90
      masterTimeline.to(this.countdownNumbers[2], { opacity: 0.7, y: 0, duration: 0.5, ease: "power2.out" }, "startCountdown+=2.4");
      masterTimeline.to(this.countdownNumbers[2], { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "startCountdown+=3.2");

      // Animate 100
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

      // Continue scroll-down arrow to opacity 1
      masterTimeline.to(this.scrollDownArrow, {
        opacity: 1,
        duration: 2.0,
        ease: "power2.out",
        pointerEvents: 'auto',
        repeat: -1,
        yoyo: true,
        onStart: () => {
          console.log("[IntroSequence] Adding click event listener to scroll-down arrow");
          this.scrollDownArrow.addEventListener('click', this._scrollDownHandler);
        }
      }, "startCountdown+=4.2");
    }

    fadeOutCountdown() {
      gsap.to(this.countdownNumbers, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0,
        onComplete: () => {
          this.countdownNumbers.forEach(num => num.style.display = 'none');
        }
      });
    }

    handleScrollDownClick() {
      console.log("[IntroSequence] Scroll-down arrow clicked");

      // Interrupt ongoing animations
      gsap.killTweensOf([
        this.introScreen,
        this.typingContainer,
        this.typingLine1,
        this.typingLine2,
        this.countdownNumbers,
        this.scrollDownArrow
      ]);
      console.log("[IntroSequence] Killed ongoing animations");

      // Reset elements
      this.countdownNumbers.forEach(num => {
        num.style.display = 'none';
      });
      gsap.set(this.scrollDownArrow, { opacity: 0, y: 20, pointerEvents: 'none' });
      this.scrollDownArrow.removeEventListener('click', this._scrollDownHandler);
      console.log("[IntroSequence] Removed scroll-down arrow click listener");

      // Fade out intro screen and scroll
      this.isAnimating = true;
      gsap.to(this.introScreen, {
        y: '-100%',
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          this.introScreen.style.display = 'none';
          console.log("[IntroSequence] Intro screen hidden");

          // Scroll to main content
          const mainElement = document.querySelector('main');
          const scrollTarget = mainElement ? mainElement.offsetTop : window.innerHeight;
          console.log(`[IntroSequence] Scrolling to ${scrollTarget}px (mainElement: ${mainElement ? 'found' : 'not found'})`);

          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });

          // Verify scroll completion
          setTimeout(() => {
            console.log(`[IntroSequence] Current scroll position: ${window.scrollY}`);
            if (Math.abs(window.scrollY - scrollTarget) > 10) {
              console.warn("[IntroSequence] Scroll may not have reached target, retrying...");
              window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            }
          }, 1500);

          window.startApplicationVisuals();
          this.isAnimating = false;
          console.log("[IntroSequence] Scroll complete, isAnimating set to false");
        }
      });
    }
  }

  // Expose IntroSequence globally
  window.IntroSequence = IntroSequence;
})();