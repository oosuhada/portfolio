console.log("--- grapefooter.js (v15 - ScrollTrigger Restart Animation Fix) loaded ---");

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
    const scanlines = document.getElementById('scanlines');

    const vcrNoiseCanvas = document.getElementById('vcrNoiseCanvas');
    const videoContentWrapper = videoContent.querySelector('.footer-image-container');

    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const effectToggleStatic = document.getElementById('effectToggle_static');
    const effectToggleVCR = document.getElementById('effectToggle_vcr');
    const effectToggleScanlines = document.getElementById('effectToggle_scanlines');
    const effectToggleGlow = document.getElementById('effectToggle_glow');
    const effectToggleRGBSplit = document.getElementById('effectToggle_rgbSplit');
    const effectToggleChromatic = document.getElementById('effectToggle_chromatic');

    const channelUpButton = document.getElementById('channelUpButton');
    const channelDownButton = document.getElementById('channelDownButton');
    const settingsButton = document.getElementById('settingsButton');
    const tvDial = document.getElementById('tvDial');

    // --- IMPORTANT: Element Check ---
    if (!section || !tvContainer || !tvScreen || !videoContent || !staticEffect || !tvTurnon || !colorBars || !closeBtn || !footerImgEl || !footerTextEl || !vcrNoiseCanvas || !settingsOverlay || !closeSettingsBtn || !channelUpButton || !channelDownButton || !settingsButton || !tvDial || !effectToggleStatic || !effectToggleVCR || !effectToggleScanlines || !effectToggleGlow || !videoContentWrapper || !effectToggleRGBSplit || !effectToggleChromatic) {
        console.error("GRAPEFOOTER: One or more required DOM elements not found. Please check your HTML structure and IDs carefully.");
        return;
    }
    console.log("GRAPEFOOTER: All DOM elements found.");

    // --- State & Animation variables ---
    let isFullScreen = false;
    let isAnimating = false;
    let mainTimeline, blossomTween, footerTween;
    let loopInterrupted = false;

    const blossomSteps = [
        { text: "Every journey begins with a leap of faith—", start: 1, end: 8 },
        { text: "Cultivating skills through patience, weathering every storm.", start: 9, end: 18 },
        { text: "Blossoming with new possibilities, growing stronger each day.", start: 19, end: 26 }
    ];
    const footerSteps = [
        { text: "Now, this grape is being transformed—", start: 1, end: 4 },
        { text: "Maturing into a unique wine, blending every season and lesson,", start: 5, end: 10 },
        { text: "Soon to be uncorked for the world to savor.", start: 11, end: 14 }
    ];

    // --- ScreenEffect Class for VCR Noise Canvas ---
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    class ScreenEffect {
        constructor(canvasElement, options) {
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext("2d");

            this.config = Object.assign({}, {
                fps: 30,
                blur: 1,
                miny: 0,
                maxy: this.canvas.height,
                miny2: 0,
                num: 20
            }, options);

            this.vcrInterval = null;
            this.onResize = this.onResize.bind(this);
            window.addEventListener("resize", this.onResize, false);

            this.rect = this.canvas.getBoundingClientRect();
            this.onResize();
        }

        onResize() {
            this.rect = this.canvas.getBoundingClientRect();
            this.canvas.width = this.rect.width;
            this.canvas.height = this.rect.height;
            this.config.maxy = this.canvas.height;
            if (this.vcrEnabled) {
                this.startVCRNoise();
            }
        }

        enableVCRNoise() {
            if (this.vcrEnabled) return;
            this.vcrEnabled = true;
            this.canvas.style.display = 'block';
            this.canvas.style.filter = `blur(${this.config.blur}px)`;
            this.canvas.style.opacity = '0.6';
            this.startVCRNoise();
        }

        disableVCRNoise() {
            if (!this.vcrEnabled) return;
            this.vcrEnabled = false;
            clearInterval(this.vcrInterval);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'none';
        }

        startVCRNoise() {
            if (this.vcrInterval) clearInterval(this.vcrInterval);
            this.vcrInterval = setInterval(() => {
                this.renderTrackingNoise();
            }, 1000 / this.config.fps);
        }

        renderTrackingNoise(radius = 2, xmax, ymax) {
            xmax = xmax || this.canvas.width;
            ymax = ymax || this.canvas.height;

            let posy1 = this.config.miny;
            let posy2 = this.config.maxy;
            let posy3 = this.config.miny2;
            const num = this.config.num;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = `#fff`;

            this.ctx.beginPath();
            for (var i = 0; i <= num; i++) {
                var x = Math.random(i) * xmax;
                var y1 = getRandomInt(posy1 += 3, posy2);
                var y2 = getRandomInt(0, posy3 -= 3);
                this.ctx.fillRect(x, y1, radius, radius);
                this.ctx.fillRect(x, y2, radius, radius);
                this.ctx.fill();

                this.renderTail(this.ctx, x, y1, radius);
                this.renderTail(this.ctx, x, y2, radius);
            }
            this.ctx.closePath();
        }

        renderTail(ctx, x, y, radius) {
            const n = getRandomInt(1, 50);
            const dirs = [1, -1];
            let rd = radius;
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            for (let i = 0; i < n; i++) {
                const step = 0.01;
                let r = getRandomInt((rd -= step), radius);
                let dx = getRandomInt(1, 4);
                radius -= 0.1;
                dx *= dir;
                ctx.fillRect((x += dx), y, r, r);
                ctx.fill();
            }
        }
    }

    const vcrScreenEffect = new ScreenEffect(vcrNoiseCanvas, {
        fps: 60,
        blur: 1,
        miny: 220,
        miny2: 220,
        num: 70
    });

    const baseVideoContentFilter = 'saturate(1.5) hue-rotate(0deg) contrast(1.2) sepia(0.1)';

    function updateVideoContentFilter() {
        let filterString = baseVideoContentFilter;
        if (effectToggleRGBSplit.checked) {
            filterString += ' url(#rgbSplitFilter)';
        }
        if (effectToggleChromatic.checked) {
            filterString += ' url(#chromaticAberrationFilter)';
        }
        gsap.to(videoContentWrapper, { filter: filterString, duration: 0.3 });
    }

    const toggleEffect = (element, isActive) => {
        if (element === staticEffect) {
            gsap.set(element, { className: isActive ? 'noise-active' : '' });
            gsap.to(element, { opacity: isActive ? 1 : 0, duration: 0.3 });
        } else if (element === vcrNoiseCanvas) {
            isActive ? vcrScreenEffect.enableVCRNoise() : vcrScreenEffect.disableVCRNoise();
        } else if (element === scanlines || element === screenGlow) {
            gsap.to(element, { opacity: isActive ? 1 : 0, duration: 0.3 });
        } else if (element.id === 'rgb-split-effect' || element.id === 'chromatic-aberration-effect') {
            updateVideoContentFilter();
        }
    };

    function resetAnimation() {
        loopInterrupted = true;
        if (mainTimeline) mainTimeline.kill();
        if (blossomTween) blossomTween.kill();
        if (footerTween) footerTween.kill();
        gsap.set([tvContainer, tvScreen, videoContent, staticEffect, screenGlow, tvTurnon, colorBars, footerTextEl, closeBtn, vcrNoiseCanvas, settingsOverlay, scanlines], {
            clearProps: "opacity, visibility, width, height, transform, borderRadius, borderWidth, top, left, right, bottom, padding-top, display, filter, className"
        });
        gsap.set(videoContentWrapper, { filter: 'none' });

        tvContainer.classList.remove('fullscreen');
        document.body.style.overflow = '';
        isFullScreen = false;
        isAnimating = false;
        vcrScreenEffect.disableVCRNoise();
        settingsOverlay.classList.remove('active');
        
        effectToggleStatic.checked = false;
        effectToggleVCR.checked = false;
        effectToggleScanlines.checked = false;
        effectToggleGlow.checked = false;
        effectToggleRGBSplit.checked = false;
        effectToggleChromatic.checked = false;

        gsap.set(staticEffect, { className: '' });
    }

    function expandToFullScreen() {
        if (isFullScreen || isAnimating) return;
        isAnimating = true;
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
            }
        });
    }

    function shrinkToSmall() {
        if (!isFullScreen || isAnimating) return;
        isAnimating = true;
        gsap.to(closeBtn, { opacity: 0, pointerEvents: 'none', duration: 0.3 });
        const state = Flip.getState(tvContainer, {
            props: "borderRadius,borderWidth", simple: true
        });
        tvContainer.classList.remove('fullscreen');
        tvContainer.style.zIndex = '';
        Flip.from(state, {
            duration: 1,
            ease: 'power2.inOut',
            absoluteOnLeave: false,
            onComplete: () => {
                isAnimating = false;
                isFullScreen = false;
                document.body.style.overflow = '';
                settingsOverlay.classList.remove('active');
            }
        });
    }

    function playBlossomLoopSequence(cb) {
        if (loopInterrupted) return;
        gsap.set(footerImgEl, { src: "images/1.png" });
        gsap.set(footerTextEl, { innerHTML: blossomSteps[0].text });
        gsap.set([footerImgEl, footerTextEl], { opacity: 0 });
        gsap.to([footerImgEl, footerTextEl], { opacity: 1, duration: 0.7 });

        const frameData = { current: 1 };
        blossomTween = gsap.to(frameData, {
            current: 26,
            duration: 8,
            ease: "steps(25)",
            onUpdate: () => {
                const frame = Math.floor(frameData.current);
                if (frame < 1 || frame > 26) return;
                footerImgEl.src = `images/${frame}.png`;
                let currentText = "";
                for (const step of blossomSteps) {
                    if (frame >= step.start && frame <= step.end) {
                        currentText = step.text;
                        break;
                    }
                }
                if (footerTextEl.innerHTML !== currentText) {
                    footerTextEl.innerHTML = currentText;
                }
            },
            onComplete: () => {
                setTimeout(() => {
                    if (loopInterrupted) return;
                    gsap.timeline()
                        .set(staticEffect, { className: 'noise-active' })
                        .to(staticEffect, { opacity: 1, duration: 0.2 })
                        .to(staticEffect, { opacity: 0.3, duration: 0.1, repeat: 3, yoyo: true })
                        .to(staticEffect, { opacity: 0, duration: 0.2 })
                        .set(staticEffect, { className: '' })
                        .call(() => {
                            if (typeof cb === "function") cb();
                        });
                }, 1500);
            }
        });
    }

    function playFooterLoopSequence(cb) {
        if (loopInterrupted) return;
        gsap.set(footerImgEl, { src: "images/footer1.png" });
        gsap.set(footerTextEl, { innerHTML: footerSteps[0].text });
        gsap.set([footerImgEl, footerTextEl], { opacity: 0 });
        gsap.to([footerImgEl, footerTextEl], { opacity: 1, duration: 0.7 });

        const frameData = { current: 1 };
        footerTween = gsap.to(frameData, {
            current: 14,
            duration: 9.8,
            ease: "steps(13)",
            onUpdate: () => {
                const frame = Math.floor(frameData.current);
                if (frame < 1 || frame > 14) return;
                footerImgEl.src = `images/footer${frame}.png`;
                let currentText = "";
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
            onComplete: () => {
                gsap.to([footerImgEl, footerTextEl], {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        setTimeout(() => {
                            if (loopInterrupted) return;
                            if (typeof cb === "function") cb();
                        }, 500);
                    }
                });
            }
        });
    }

    function playLoopSequence() {
        loopInterrupted = false;
        mainTimeline = gsap.timeline({
            onComplete: () => {
                expandToFullScreen();
                gsap.set([footerImgEl, footerTextEl], { opacity: 0 });
                footerImgEl.src = "";
                footerTextEl.innerHTML = "";
                
                setTimeout(() => {
                    if (loopInterrupted) return;
                    playBlossomLoopSequence(() => playFooterLoopSequence(playBlossomLoopSequence));
                }, 400);
            }
        });

        mainTimeline.set(tvContainer, { opacity: 1, visibility: 'visible' })
            .to(tvTurnon, { width: "100%", duration: 0.3, ease: "power2.out" })
            .to(tvTurnon, { height: "100%", duration: 0.3, ease: "power2.out" })
            .to(tvTurnon, { opacity: 0, duration: 0.1 })
            .to(colorBars, { opacity: 1, duration: 1.5 })
            .to(colorBars, { opacity: 0, duration: 0.3, delay: 0.3 })
            .to(videoContent, { opacity: 1, duration: 1 }, "<")
            .call(() => {
                gsap.to(staticEffect, { opacity: 1, duration: 0.5 });
                staticEffect.classList.add('noise-active');
                vcrScreenEffect.enableVCRNoise();
                gsap.to(scanlines, { opacity: 1, duration: 0.5 });
                gsap.to(screenGlow, { opacity: 1, duration: 0.5 });
                updateVideoContentFilter();
            });

        effectToggleStatic.checked = true;
        effectToggleVCR.checked = true;
        effectToggleScanlines.checked = true;
        effectToggleGlow.checked = true;
        effectToggleRGBSplit.checked = true;
        effectToggleChromatic.checked = true;
    }

    function playChannelSwitchEffect(cb) {
        if (isAnimating) return;
        isAnimating = true;

        const originalStaticOpacity = gsap.getProperty(staticEffect, 'opacity');
        const originalVCREnabled = vcrScreenEffect.vcrEnabled;
        const originalScanlinesOpacity = gsap.getProperty(scanlines, 'opacity');
        const originalGlowOpacity = gsap.getProperty(screenGlow, 'opacity');

        gsap.to([staticEffect, scanlines, screenGlow, vcrNoiseCanvas], { opacity: 0, duration: 0.1 });
        vcrScreenEffect.disableVCRNoise();
        gsap.to(videoContentWrapper, { filter: 'none', duration: 0.1 });


        gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                if (typeof cb === "function") cb();

                if (effectToggleStatic.checked) gsap.to(staticEffect, { opacity: originalStaticOpacity || 0.1, duration: 0.5 });
                if (effectToggleVCR.checked) vcrScreenEffect.enableVCRNoise();
                if (effectToggleScanlines.checked) gsap.to(scanlines, { opacity: originalScanlinesOpacity || 1, duration: 0.5 });
                if (effectToggleGlow.checked) gsap.to(screenGlow, { opacity: originalGlowOpacity || 1, duration: 0.5 });
                updateVideoContentFilter();
            }
        })
        .set(staticEffect, { className: 'noise-active' })
        .to(staticEffect, { opacity: 1, duration: 0.1 })
        .to(colorBars, { opacity: 1, duration: 0.1, delay: 0.1 })
        .to(staticEffect, { opacity: 0.5, duration: 0.05 })
        .to(colorBars, { opacity: 0, duration: 0.1 })
        .to(staticEffect, { opacity: 0, duration: 0.1 });
    }

    function jumpToBlossomSequence() {
        loopInterrupted = true;
        if (mainTimeline) mainTimeline.kill();
        if (blossomTween) blossomTween.kill();
        if (footerTween) footerTween.kill();
        gsap.set([footerImgEl, footerTextEl], { opacity: 0 });
        setTimeout(() => {
            loopInterrupted = false;
            playBlossomLoopSequence(() => playFooterLoopSequence(playBlossomLoopSequence));
        }, 80);
    }

    function jumpToFooterSequence() {
        loopInterrupted = true;
        if (mainTimeline) mainTimeline.kill();
        if (blossomTween) blossomTween.kill();
        if (footerTween) footerTween.kill();
        gsap.set([footerImgEl, footerTextEl], { opacity: 0 });
        setTimeout(() => {
            loopInterrupted = false;
            playFooterLoopSequence(() => playBlossomLoopSequence(playFooterLoopSequence));
        }, 80);
    }

    // --- Settings Panel Functions ---
    function openSettings() {
        gsap.to(settingsOverlay, { opacity: 1, visibility: 'visible', duration: 0.3 });
        settingsOverlay.classList.add('active'); // Add active class for styling/conditional checks
    }

    function closeSettings() {
        gsap.to(settingsOverlay, { opacity: 0, visibility: 'hidden', duration: 0.3, onComplete: () => {
            settingsOverlay.classList.remove('active'); // Remove active class on close
        }});
    }

    // --- ScrollTrigger ---
    ScrollTrigger.create({
        trigger: section,
        start: "top center",
        onLeaveBack: () => {
            console.log("GRAPEFOOTER: Scrolled out of view (upwards). Resetting.");
            resetAnimation();
        },
        onEnter: () => {
            console.log("GRAPEFOOTER: Entered view (from top). Restarting animation.");
            playLoopSequence();
        },
        onEnterBack: () => {
            console.log("GRAPEFOOTER: Entered view again (from bottom). Restarting animation.");
            playLoopSequence();
        },
        markers: false
    });

    // --- INITIALIZATION ---
    // The ScrollTrigger's onEnter/onEnterBack callbacks now handle the animation start.
    // The unconditional call below has been removed to prevent the animation from
    // playing on page load regardless of the scroll position.
    // playLoopSequence(); // <- THIS LINE IS NOW COMMENTED OUT TO FIX THE ISSUE

    // --- Event Listener Delegation for TV Container Clicks ---
    tvContainer.addEventListener('click', (e) => {
        if (isAnimating) {
            console.log("GRAPEFOOTER: Animation in progress, ignoring click.");
            return;
        }

        const target = e.target;
        
        console.log("GRAPEFOOTER: Clicked element:", target);
        console.log("GRAPEFOOTER: Clicked element ID:", target.id);
        console.log("GRAPEFOOTER: Clicked element classes:", target.className);

        if (settingsOverlay.classList.contains('active')) {
            if (target === closeSettingsBtn || target.closest('.settings-content')) {
                console.log("GRAPEFOOTER: Click within active settings overlay. Ignoring TV size change.");
                return; 
            }
            console.log("GRAPEFOOTER: Click on active settings overlay background. Ignoring TV size change.");
            return; 
        }

        if (target === channelUpButton) {
            e.stopPropagation();
            console.log("GRAPEFOOTER: Channel Up button clicked.");
            playChannelSwitchEffect(jumpToBlossomSequence);
        } else if (target === channelDownButton) {
            e.stopPropagation();
            console.log("GRAPEFOOTER: Channel Down button clicked.");
            playChannelSwitchEffect(jumpToFooterSequence);
        } else if (target === settingsButton) {
            e.stopPropagation();
            console.log("GRAPEFOOTER: Settings button clicked.");
            
            if (!isFullScreen) {
                expandToFullScreen();
                setTimeout(openSettings, 1000);
            } else {
                openSettings();
            }

        } else if (target === tvDial) {
            e.stopPropagation();
            console.log("GRAPEFOOTER: TV Dial clicked. Shrinking to small.");
            shrinkToSmall();
        } 
        else if (target === tvContainer || target.closest('.tv-screen-area')) {
             console.log("GRAPEFOOTER: TV Container/Screen area clicked. Toggling fullscreen.");
             if (!isFullScreen) {
                expandToFullScreen();
            } else {
                shrinkToSmall();
            }
        }
    });

    // --- Individual Event Listeners for Toggles and Close Button ---
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("GRAPEFOOTER: Close Button clicked.");
        shrinkToSmall();
    });

    closeSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("GRAPEFOOTER: Close Settings Button clicked.");
        closeSettings();
    });

    // Settings Toggles
    effectToggleStatic.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: Static Toggle changed to", e.target.checked);
        toggleEffect(staticEffect, e.target.checked);
    });
    effectToggleVCR.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: VCR Noise Toggle changed to", e.target.checked);
        toggleEffect(vcrNoiseCanvas, e.target.checked);
    });
    effectToggleScanlines.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: Scanlines Toggle changed to", e.target.checked);
        toggleEffect(scanlines, e.target.checked);
    });
    effectToggleGlow.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: Screen Glow Toggle changed to", e.target.checked);
        toggleEffect(screenGlow, e.target.checked);
    });
    effectToggleRGBSplit.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: RGB Split Toggle changed to", e.target.checked);
        toggleEffect({ id: 'rgb-split-effect' }, e.target.checked);
    });
    effectToggleChromatic.addEventListener('change', (e) => {
        console.log("GRAPEFOOTER: Chromatic Aberration Toggle changed to", e.target.checked);
        toggleEffect({ id: 'chromatic-aberration-effect' }, e.target.checked);
    });
});