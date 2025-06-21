console.log("--- grapefooter.js (v4 - Looping Logic) loaded ---");

document.addEventListener('DOMContentLoaded', () => {
    console.log("GRAPEFOOTER: DOMContentLoaded. Initializing script.");
    
    // GSAP and plugins check
    if (!window.gsap || !window.ScrollTrigger || !window.Flip) {
        console.error("GRAPEFOOTER: GSAP, ScrollTrigger, or Flip plugin not loaded.");
        return;
    }
    gsap.registerPlugin(ScrollTrigger, Flip);
    console.log("GRAPEFOOTER: GSAP plugins registered.");

    // --- DOM element selection ---
    const section = document.getElementById('grape-footer-section');
    const tvContainer = document.getElementById('tvContainer');
    const tvScreen = document.getElementById('tvScreen');
    const videoContent = document.getElementById('videoContent');
    const staticEffect = document.getElementById('staticEffect');
    const screenGlow = document.getElementById('screenGlow');
    const tvTurnon = document.getElementById('tvTurnon');
    const colorBars = document.getElementById('colorBars');
    const closeBtn = document.getElementById('closeBtn');
    const footerImgEl = document.getElementById('grapeFooterImg');
    const footerTextEl = document.getElementById('grapeFooterText');

    // --- Element check ---
    if (!section || !tvContainer || !tvScreen || !videoContent || !staticEffect || !screenGlow || !tvTurnon || !colorBars || !closeBtn || !footerImgEl || !footerTextEl) {
        console.error("GRAPEFOOTER: One or more required DOM elements not found.");
        return;
    }
    console.log("GRAPEFOOTER: All DOM elements found.");

    // --- State & Animation variables ---
    let isFullScreen = false;
    let isAnimating = false;
    let firstCycleCompleted = false; // Tracks if the first video loop is done
    let mainTimeline; // To control the main animation sequence
    let videoTween;   // To control the looping video content

    /**
     * Resets the entire animation to its initial state.
     */
    function resetAnimation() {
        console.log("GRAPEFOOTER: Resetting animation state.");
        // Kill running animations to prevent conflicts
        if (mainTimeline) mainTimeline.kill();
        if (videoTween) videoTween.kill();
        
  // 'clearProps' 수정: position과 z-index를 유지함
  gsap.set([tvContainer, tvScreen, videoContent, staticEffect, screenGlow, tvTurnon, colorBars, footerTextEl, closeBtn], { 
    clearProps: "opacity, visibility, width, height, transform, borderRadius, borderWidth, top, left, right, bottom, padding-top"
  });

  tvContainer.classList.remove('fullscreen');
  document.body.style.overflow = '';
        // Reset state variables
        isFullScreen = false;
        isAnimating = false;
        // firstCycleCompleted remains true after the first run
    }

    /**
     * Expands the TV to fullscreen.
     */
    function expandToFullScreen() {
        if (isFullScreen || isAnimating) return;
        isAnimating = true;
        console.log("GRAPEFOOTER: Expanding to fullscreen.");

        const state = Flip.getState(tvContainer, { props: "borderRadius, borderWidth" });
        
        tvContainer.classList.add('fullscreen');
        document.body.style.overflow = 'hidden';

        Flip.from(state, {
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                isAnimating = false;
                isFullScreen = true;
                gsap.to(closeBtn, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });
                console.log("GRAPEFOOTER: Fullscreen expansion complete.");
            }
        });
    }

    /**
     * Shrinks the TV back to its original size.
     */
   function shrinkToSmall() {
    if (!isFullScreen || isAnimating) return;
    isAnimating = true;
    console.log("GRAPEFOOTER: Shrinking to small size.");

    gsap.to(closeBtn, { opacity: 0, pointerEvents: 'none', duration: 0.3 });

    const state = Flip.getState(tvContainer, {
        props: "borderRadius,borderWidth", // 여기서 zIndex를 제거 (중요!)
        simple: true
    });

    tvContainer.classList.remove('fullscreen');
    tvContainer.style.zIndex = ''; // CSS 값으로 복구 (중요!)

    Flip.from(state, {
        duration: 1,
        ease: 'power2.inOut',
        absoluteOnLeave: false,  // Flip이 절대 위치를 사용하지 않도록 명시
        onComplete: () => {
            isAnimating = false;
            isFullScreen = false;
            document.body.style.overflow = '';
            console.log("GRAPEFOOTER: Shrink to small complete.");
        }
    });
}

    /**
     * Initial power-on sequence and grape animation.
     */
    function playInitialTurnOnSequence() {
        if (isAnimating) return;
        isAnimating = true;
        
        // Create a looping animation for the video content
        const frameData = { current: 1 };
        videoTween = gsap.to(frameData, {
            current: 15, // Go to frame 15 to include the last frame
            duration: 14 * 0.7, // Total duration for one loop
            ease: `steps(14)`,
            repeat: -1, // REQUIREMENT: Loop forever
            onUpdate: () => {
                const frame = Math.floor(frameData.current);
                if (frame > 14) return; // Prevent out-of-bounds
                footerImgEl.src = `images/footer${frame}.png`;

                let currentText = " ";
                for (const step of footerSteps) {
                    if (frame >= step.start && frame <= step.end) {
                        currentText = step.text;
                        break;
                    }
                }
                if (footerTextEl.innerHTML !== currentText) {
                     footerTextEl.innerHTML = currentText;
                }
            },
            onRepeat: () => { // This triggers after each loop finishes
                console.log("GRAPEFOOTER: videoContent loop completed.");
                // REQUIREMENT: Shrink only after the *first* cycle
                if (!firstCycleCompleted) {
                    console.log("GRAPEFOOTER: First cycle finished. Shrinking TV.");
                    shrinkToSmall();
                    firstCycleCompleted = true; // Prevent this from running again
                }
            }
        });
        videoTween.pause(); // Start paused

        // Timeline for the TV turn-on effect
        mainTimeline = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                console.log("GRAPEFOOTER: Initial sequence complete. Starting video loop.");
                expandToFullScreen();
                videoTween.play(); // Start the looping video
            }
        });

        mainTimeline.set(tvContainer, { opacity: 1, visibility: 'visible' })
            .to([staticEffect, screenGlow], { opacity: 1, duration: 0.5 }, "+=0.2")
            .to(tvTurnon, { width: "100%", duration: 0.2, ease: "power2.out" })
            .to(tvTurnon, { height: "100%", duration: 0.2, ease: "power2.out" })
            .to(tvTurnon, { opacity: 0, duration: 0.1 })
            .to(colorBars, { opacity: 1, duration: 0.1 })
            .to(colorBars, { opacity: 0, duration: 0.3, delay: 0.3 })
            .to(staticEffect, { opacity: 0.1, duration: 1 }, "-=0.3")
            .to(videoContent, { opacity: 1, duration: 1 }, "<");
    }

    const footerSteps = [
        { text: "Now, this grape is being transformed—", start: 1, end: 4 },
        { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
        { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
    ];

    // --- Main ScrollTrigger setup ---
    ScrollTrigger.create({
        trigger: section,
        start: "top center",
        // REQUIREMENT: Allow re-triggering
        onEnter: () => {
            console.log("GRAPEFOOTER: Scrolled into view. Starting animation.");
            playInitialTurnOnSequence();
        },
        onLeaveBack: () => {
            console.log("GRAPEFOOTER: Scrolled out of view. Resetting.");
            resetAnimation();
        },
        markers: false // Set to true for debugging
    });

    // --- Event Listeners ---
    tvContainer.addEventListener('click', () => {
        if (isAnimating) return;
        if (!isFullScreen) {
            expandToFullScreen();
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shrinkToSmall();
    });
});
