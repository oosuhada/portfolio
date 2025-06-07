if (window.hobbyScriptHasFullyInitialized) {
  // console.warn("hobby.js: Script has already been fully initialized. Skipping redundant full execution.");
} else {
  window.hobbyScriptHasFullyInitialized = true;
  // console.log("hobby.js: Starting initial script evaluation and setup.");
  /* === 헤더 숨김 === */
  function initHeaderObserver() {
    const header = document.querySelector('.nav-header');
    const sentinel = document.getElementById('top-sentinel');
    if (!header || !sentinel) {
      // console.warn("[HEADER] Header or sentinel not found for IntersectionObserver.");
      return;
    }
    header.classList.remove('hide');
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          header.classList.toggle('hide', !entry.isIntersecting);
        });
      }, { root: null, threshold: 1.0 }
    );
    observer.observe(sentinel);
  }
  // ===== 스크롤 방향에 따라 nav-menu(nav-center)만 숨김/표시 =====
  $(function () {
    const $menu = $('.nav-menu.nav-center');
    if (!$menu.length) return;
    let lastScroll = 0;
    const delta = 8;
    let ticking = false;
    function updateMenuVisibility() {
      const st = $(window).scrollTop();
      if (st === 0) $menu.removeClass('hide');
      else if (st > lastScroll + delta && st > 60) $menu.addClass('hide');
      else if (st < lastScroll - delta || st <= 0) $menu.removeClass('hide');
      lastScroll = st;
      ticking = false;
    }
    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateMenuVisibility);
        ticking = true;
      }
    }
    $(window).on('scroll', requestTick).on('resize', requestTick);
    updateMenuVisibility();
  });
  // ===== Modern Carousel - Vanilla JS Implementation ===== //
  class ModernCarousel {
    constructor() {
      // console.log("[CAROUSEL CONSTRUCTOR] Initializing ModernCarousel instance.");
      this.carousel = null; this.posters = []; this.labels = null;
      this.n = 0; this.center = 0; this.lastCenter = 0;
      this.maxVisible = 6; this.isEntranceAnimation = false; this.visualsStarted = false;
      this.isMoving = false; this.pendingMoveQueue = []; this.isDragging = false;
      this.startX = 0; this.startTouchX = 0; this.dragThreshold = 50;
      this.animParams = {
        R: 550, verticalOffset: 190, cardAngle: 28, scaleStep: 0.085,
        angleStep: 26, curveRadius: 700, labelVerticalOffset: 250
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupDomReferences();
          this.setupCategoryJump();
        }, { once: true });
      } else {
        this.setupDomReferences();
        this.setupCategoryJump();
      }
    }
    setupDomReferences() {
      if (this.carousel) return;
      // console.log("[CAROUSEL] setupDomReferences called.");
      this.carousel = document.querySelector('.carousel');
      this.labels = document.querySelector('.carousel-labels');
      this.posters = Array.from(this.carousel?.querySelectorAll('.poster') || []);
      this.n = this.posters.length;
      if (this.n > 0) {
        this.center = Math.floor(this.n / 2);
        this.lastCenter = this.center;
      } else { this.center = 0; this.lastCenter = 0; }
      // console.log(`[CAROUSEL] DOM references setup. Found ${this.n} posters. Initial center: ${this.center}`);
    }
    startVisuals() {
      // console.log("[CAROUSEL] startVisuals: Called. This will hide preloader and then trigger background intro.");
      if (this.visualsStarted) {
        // console.log("[CAROUSEL] Visuals already started. Aborting.");
        return;
      }
      if (!this.carousel || this.n === 0) {
        this.setupDomReferences();
        if (!this.carousel || this.n === 0) {
          // console.error("[CAROUSEL] CRITICAL: Cannot start visuals, carousel/posters not found.");
          return;
        }
      }
      this.visualsStarted = true;
      this.actuallyStartPreloaderAndTriggerBackgroundIntro();
    }
    actuallyStartPreloaderAndTriggerBackgroundIntro() {
      const preloader = document.getElementById('preloader');
      const main = document.getElementById('main');
      const carouselHero = document.querySelector('.carousel-hero');
      // console.log("[CAROUSEL] Hiding preloader and showing main content...");
      if (preloader) {
        preloader.style.transition = 'opacity 0.3s ease-out';
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
          // console.log("[CAROUSEL] Preloader hidden.");
          this.showMainContentAndPlayBgIntro(main, carouselHero);
        }, 300);
      } else {
        // console.warn("[CAROUSEL] Preloader not found. Showing main content directly.");
        this.showMainContentAndPlayBgIntro(main, carouselHero);
      }
    }
    showMainContentAndPlayBgIntro(main, carouselHero) {
      let mainFadeInComplete = false;
      const triggerBg = () => {
        if (mainFadeInComplete) {
          if (window.appBackgroundChanger && typeof window.appBackgroundChanger.playVisualIntroAnimation === 'function') {
            // console.log("[CAROUSEL] Main content visible. Requesting background intro to play.");
            window.appBackgroundChanger.playVisualIntroAnimation();
          } else {
            // console.warn("[CAROUSEL] appBackgroundChanger.playVisualIntroAnimation not found! The BG intro won't play, and carousel might not start if it depends on BG callback.");
          }
        }
      };
      if (main) {
        main.style.display = 'block';
        gsap.fromTo(main, { opacity: 0 }, {
          opacity: 1, duration: 0.45,
          onComplete: () => {
            // console.log("[CAROUSEL] GSAP MainFadeIn onComplete.");
            mainFadeInComplete = true;
            triggerBg();
          }
        });
      } else {
        // console.error("[CAROUSEL] #main element not found.");
        mainFadeInComplete = true;
        triggerBg();
      }
      if (carouselHero) {
        carouselHero.style.opacity = '0';
        gsap.to(carouselHero, { opacity: 1, duration: 0.45, ease: "power2.out" });
      }
    }
    renderLabels(centerIdx, visibleCount = 5) {
      if (!this.labels) return;
      this.labels.innerHTML = '';
      const half = Math.floor(visibleCount / 2);
      const { angleStep, curveRadius, labelVerticalOffset } = this.animParams;
      for (let i = 0; i < this.n; i++) {
        let rel = ((i - centerIdx + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
        let opacity = Math.abs(rel) <= half ? 1 : 0;
        const rad = rel * angleStep * Math.PI / 180;
        const x = Math.sin(rad) * curveRadius;
        let y = labelVerticalOffset - Math.cos(rad) * (curveRadius * 0.38);
        if (rel === -2 || rel === 2) { y += 40; } else if (rel === -1 || rel === 1) { y += 20; }
        const rotate = rad * (180 / Math.PI) * 0.55;
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = this.posters[i]?.dataset.title || '';
        label.style.cssText = `opacity: ${opacity}; transform: translate(-50%, 0) translate(${x}px, ${y}px) rotate(${rotate}deg); z-index: ${100 - Math.abs(rel)};`;
        this.labels.appendChild(label);
      }
    }
    renderCarousel(centerIdx = this.center, animate = true) {
      const { R, verticalOffset, cardAngle, scaleStep } = this.animParams;
      let moveDirection = 0;
      if (animate && this.lastCenter !== centerIdx && !this.isEntranceAnimation) {
        const diff = centerIdx - this.lastCenter;
        const normalizedDiff = ((diff + Math.floor(this.n / 2)) % this.n) - Math.floor(this.n / 2);
        moveDirection = normalizedDiff > 0 ? 1 : -1;
      }
      this.posters.forEach((poster, i) => {
        let rel = ((i - centerIdx + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
        const distance = Math.abs(rel);
        const visible = distance <= this.maxVisible;
        const blurValue = Math.max(0, distance - 2) * 1.5;
        const angle = rel * cardAngle * (Math.PI / 180);
        const x = Math.sin(angle) * R;
        const y = verticalOffset - Math.cos(angle) * (R * 0.38);
        const rotation = angle * (180 / Math.PI) * 0.55;
        const scale = 1 - distance * scaleStep;
        const z = 1000 - distance * 60;
        const opacity = visible ? 1 : 0;
        const isCenterCard = rel === 0;
        const animationProps = {
          x, y, rotation, scale, zIndex: z, opacity,
          filter: `blur(${blurValue}px)`,
          ease: this.isEntranceAnimation ? "power2.out" : "expo.out"
        };
        if (animate) {
          if (this.isEntranceAnimation || !isCenterCard || moveDirection === 0) {
            gsap.to(poster, { ...animationProps, duration: this.isEntranceAnimation ? 0.6 : 0.8 });
          } else {
            const timeline = gsap.timeline();
            const bounceMultiplier = moveDirection;
            const overshootX = x + (15 * bounceMultiplier);
            const overshootRotation = rotation + (12 * bounceMultiplier);
            timeline.to(poster, { duration: 0.66, x: overshootX, rotation: overshootRotation, ease: "circ.out" }).to(poster, { duration: 0.33, x, rotation, ease: "power1.inOut" });
            gsap.to(poster, { ...animationProps, duration: 0.38, ease: "expo.out" });
          }
        } else {
          gsap.set(poster, animationProps);
        }
      });
      if (this.labels) this.renderLabels(centerIdx, 5);
      this.updateActiveCategoryButton(centerIdx);
    }
    runCarousel(isFirst = false) {
      if (!this || typeof this.playEntranceAnimation !== 'function') { return; }
      this.isEntranceAnimation = isFirst;
      if (isFirst) {
        this.playEntranceAnimation();
      } else {
        this.renderCarousel(this.center, false);
        this.setupEvents();
      }
    }
    playEntranceAnimation() {
      if (this.n === 0 || !this.carousel) { return; }
      this.carousel.style.opacity = '0';
      const entranceOffset = Math.min(6, Math.max(0, Math.floor(this.n / 2) - 1));
      let startCenter = (this.center - entranceOffset + this.n) % this.n;
      this.lastCenter = startCenter;
      this.renderCarousel(startCenter, false);
      this.posters.forEach(poster => gsap.set(poster, { opacity: 0 }));
      gsap.to(this.carousel, { opacity: 1, duration: 0.5, ease: "power2.out" });
      this.posters.forEach((poster, i) => {
        let relToStart = ((i - startCenter + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
        gsap.to(poster, { opacity: 1, duration: 0.4, delay: Math.abs(relToStart) * 0.05 + 0.2, ease: "power2.out" });
      });
      setTimeout(() => {
        let currentAnimatedCenter = startCenter;
        let rotationStep = 0;
        const totalSteps = (this.center - startCenter + this.n) % this.n;
        if (totalSteps === 0) {
          this.isEntranceAnimation = false;
          this.lastCenter = this.center;
          this.renderCarousel(this.center, false);
          this.setupEvents();
          if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
          return;
        }
        const rotateFn = () => {
          this.lastCenter = currentAnimatedCenter;
          currentAnimatedCenter = (currentAnimatedCenter + 1) % this.n;
          this.renderCarousel(currentAnimatedCenter, true);
          rotationStep++;
          if (rotationStep < totalSteps) {
            setTimeout(rotateFn, 100);
          } else {
            setTimeout(() => {
              this.lastCenter = currentAnimatedCenter;
              this.center = currentAnimatedCenter;
              this.renderCarousel(this.center, true);
              setTimeout(() => {
                this.isEntranceAnimation = false;
                this.lastCenter = this.center;
                this.setupEvents();
                if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
              }, 700);
            }, 150);
          }
        };
        rotateFn();
      }, 800);
    }
    moveTo(newCenter, userDirection = null) {
      const targetCenter = (newCenter + this.n) % this.n;
      const oldActualCenter = this.center;
      if (this.isMoving || (oldActualCenter === targetCenter && !this.pendingMoveQueue.length)) {
        if (oldActualCenter !== targetCenter && this.pendingMoveQueue.every(move => move.target !== targetCenter)) {
          this.pendingMoveQueue.push({ target: targetCenter, direction: userDirection });
        }
        if (this.isMoving) { return; }
        if (oldActualCenter === targetCenter && !this.pendingMoveQueue.length) {
          if (window.appBackgroundChanger) window.appBackgroundChanger.triggerDramaticAnimation(0, 0, 0);
          return;
        }
      }
      this.isMoving = true;
      this.lastCenter = oldActualCenter;
      this.center = targetCenter;
      this.renderCarousel(this.center, true);
      if (window.appBackgroundChanger) {
        let cardDeltaMagnitude = 0;
        let bgCycleDirection = 0;
        if (oldActualCenter !== this.center) {
          const distForward = (this.center - oldActualCenter + this.n) % this.n;
          const distBackward = (oldActualCenter - this.center + this.n) % this.n;
          if (userDirection !== null && userDirection !== 0) {
            cardDeltaMagnitude = 1;
            bgCycleDirection = userDirection > 0 ? 1 : -1;
          } else {
            if (distForward <= distBackward) { cardDeltaMagnitude = distForward; bgCycleDirection = 1; } 
            else { cardDeltaMagnitude = distBackward; bgCycleDirection = -1; }
          }
          if (cardDeltaMagnitude > 0) window.appBackgroundChanger.triggerDramaticAnimation(cardDeltaMagnitude, bgCycleDirection, 800);
          else window.appBackgroundChanger.triggerDramaticAnimation(0, 0, 0);
        } else {
          window.appBackgroundChanger.triggerDramaticAnimation(0, 0, 0);
        }
      }
      setTimeout(() => {
        this.isMoving = false;
        if (this.pendingMoveQueue.length > 0) {
          const nextMove = this.pendingMoveQueue.shift();
          setTimeout(() => this.moveTo(nextMove.target, nextMove.direction), 50);
        }
      }, 900);
    }
    setupEvents() {
      if (!this.carousel) { return; }
      const newCarousel = this.carousel.cloneNode(true);
      if (this.carousel.parentNode) {
        this.carousel.parentNode.replaceChild(newCarousel, this.carousel);
      }
      this.carousel = newCarousel;
      this.posters = Array.from(this.carousel.querySelectorAll('.poster'));
      this.carousel.addEventListener('wheel', (e) => { e.preventDefault(); if (this.isMoving) return; if (e.deltaY > 0) this.moveTo(this.center + 1, 1); else this.moveTo(this.center - 1, -1); }, { passive: false });
      this.carousel.addEventListener('mousedown', (e) => { e.preventDefault(); this.isDragging = true; this.startX = e.pageX; this.carousel.style.cursor = 'grabbing'; });
      if (this._mouseMoveHandler) document.removeEventListener('mousemove', this._mouseMoveHandler);
      if (this._mouseUpHandler) document.removeEventListener('mouseup', this._mouseUpHandler);
      this._mouseMoveHandler = (e) => { if (!this.isDragging) return; e.preventDefault(); };
      this._mouseUpHandler = (e) => {
        if (!this.isDragging) return;
        const deltaX = e.pageX - this.startX;
        this.carousel.style.cursor = 'grab';
        this.isDragging = false;
        if (Math.abs(deltaX) > this.dragThreshold) { if (deltaX > 0) this.moveTo(this.center - 1, -1); else this.moveTo(this.center + 1, 1); }
      };
      document.addEventListener('mousemove', this._mouseMoveHandler);
      document.addEventListener('mouseup', this._mouseUpHandler);
      this.carousel.addEventListener('touchstart', (e) => { this.startTouchX = e.touches[0].pageX; }, { passive: true });
      this.carousel.addEventListener('touchend', (e) => {
        const endTouchX = e.changedTouches[0].pageX;
        const deltaX = endTouchX - this.startTouchX;
        if (Math.abs(deltaX) > this.dragThreshold) { if (deltaX > 0) this.moveTo(this.center - 1, -1); else this.moveTo(this.center + 1, 1); }
      }, { passive: true });
      this.posters.forEach((poster, idx) => {
        poster.addEventListener('click', () => {
          if (this.isMoving) return;
          if (idx === this.center) {
            this.showModal(poster);
          } else {
            this.performFastScroll(idx);
          }
        });
      });
      this.carousel.style.cursor = 'grab';
    }
    setupCategoryJump() {
      const jumpButtons = document.querySelectorAll('.category-jump-btn');
      jumpButtons.forEach(button => {
        button.addEventListener('click', () => {
          const category = button.dataset.category;
          if (!category) return;
          const targetIndex = this.posters.findIndex(p => p.classList.contains(`poster-${category}`));
          if (targetIndex !== -1 && targetIndex !== this.center) {
            this.performFastScroll(targetIndex);
          }
        });
      });
    }
    updateActiveCategoryButton(centerIdx) {
      const centerPoster = this.posters[centerIdx];
      if (!centerPoster) return;
      let currentCategory = '';
      for (const cls of centerPoster.classList) {
        if (cls.startsWith('poster-')) {
          currentCategory = cls.replace('poster-', '');
          break;
        }
      }
      const jumpButtons = document.querySelectorAll('.category-jump-btn');
      jumpButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
      });
    }
    renderFastScrollFrame(currentCenterFloat) {
      this.posters.forEach((poster, i) => {
        let rel = i - currentCenterFloat;
        if (Math.abs(rel) > this.n / 2) {
          rel = rel < 0 ? rel + this.n : rel - this.n;
        }
        const distance = Math.abs(rel);
        const proximityFactor = Math.min(1, distance);
        const blur = Math.min(8, Math.pow(proximityFactor, 2) * 4);
        const opacity = Math.max(0, 1 - proximityFactor * 0.25);
        const { R, verticalOffset, cardAngle, scaleStep } = this.animParams;
        const angle = rel * cardAngle * (Math.PI / 180);
        const x = Math.sin(angle) * R;
        const y = verticalOffset - Math.cos(angle) * (R * 0.38);
        const rotation = angle * (180 / Math.PI) * 0.55;
        const scale = 1 - distance * scaleStep;
        const z = 1000 - distance * 60;
        gsap.set(poster, {
          x, y, rotation, scale, zIndex: z, opacity,
          filter: `blur(${blur}px)`
        });
      });
    }
    performFastScroll(targetCenter) {
      if (this.isMoving) return;
      this.isMoving = true;

      const oldCenter = this.center;
      const distForward = (targetCenter - oldCenter + this.n) % this.n;
      const distBackward = (oldCenter - targetCenter + this.n) % this.n;
      
      let endValue;
      let direction;
      const steps = Math.min(distForward, distBackward);

      if (distForward <= distBackward) {
        endValue = oldCenter + distForward;
        direction = 1;
      } else {
        endValue = oldCenter - distBackward;
        direction = -1;
      }

      const dynamicDuration = 0.5 + (steps * 0.12);
      const dummy = { value: oldCenter };
      let lastBgIndex = oldCenter;

      gsap.to(dummy, {
        value: endValue,
        duration: dynamicDuration,
        ease: "power3.easeInOut",
        onUpdate: () => {
          this.renderFastScrollFrame(dummy.value);
          const currentBgIndex = Math.round(dummy.value);
          if (currentBgIndex !== lastBgIndex) {
            if (window.appBackgroundChanger) {
              window.appBackgroundChanger.initializeCarouselModeBackground(currentBgIndex);
            }
            lastBgIndex = currentBgIndex;
          }
        },
        onComplete: () => {
          this.center = targetCenter;
          this.lastCenter = targetCenter; 
          this.updateActiveCategoryButton(this.center);
          if (this.labels) this.renderLabels(this.center, 5);

          const targetPoster = this.posters[this.center];
          const { R, verticalOffset, cardAngle, scaleStep } = this.animParams;

          this.posters.forEach((poster, i) => {
            if (i === this.center) return; 

            let rel = ((i - this.center + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
            const distance = Math.abs(rel);
            const visible = distance <= this.maxVisible;
            
            const blurValue = Math.max(0, distance - 2) * 1.5;
            const angle = rel * cardAngle * (Math.PI / 180);
            const x = Math.sin(angle) * R;
            const y = verticalOffset - Math.cos(angle) * (R * 0.38);
            const rotation = angle * (180 / Math.PI) * 0.55;
            const scale = 1 - distance * scaleStep;
            const z = 1000 - distance * 60;
            const opacity = visible ? 1 : 0;

            gsap.to(poster, {
              x, y, rotation, scale, zIndex: z, opacity,
              filter: `blur(${blurValue}px)`,
              duration: 0.5,
              ease: "power2.out"
            });
          });

          const finalX = 0;
          const finalY = verticalOffset - (R * 0.38);
          const finalRotation = 0;
          const finalScale = 1;
          const finalZ = 1000;
          const finalOpacity = 1;

          // --- DYNAMIC ANGLE & SPEED CALCULATION ---
          const minAngle = 2; // Decreased minimum angle
          const maxAngle = 12;
          const maxStepsForAngle = 7; // The number of steps over which the angle increases to max
          const angleMultiplier = Math.min(1, (steps - 1) / (maxStepsForAngle - 1));
          const dynamicTiltAngle = minAngle + (maxAngle - minAngle) * angleMultiplier;
          
          const maxDurationOut = 0.6;
          const minDurationOut = 0.25;
          const dynamicDurationOut = minDurationOut + (maxDurationOut - minDurationOut) * angleMultiplier;

          const maxDurationIn = 0.4;
          const minDurationIn = 0.15;
          const dynamicDurationIn = minDurationIn + (maxDurationIn - minDurationIn) * angleMultiplier;


          const overshootX = finalX + (15 * -direction);
          const overshootRotation = 0 + (dynamicTiltAngle * -direction);

          gsap.timeline()
            .to(targetPoster, {
              x: overshootX,
              rotation: overshootRotation,
              ease: "circ.out",
              duration: dynamicDurationOut
            }, 0)
            .to(targetPoster, {
              y: finalY,
              scale: finalScale,
              zIndex: finalZ,
              opacity: finalOpacity,
              filter: 'blur(0px)',
              ease: "power2.out",
              duration: 0.5,
            }, 0)
            .to(targetPoster, {
              x: finalX,
              rotation: finalRotation,
              ease: "power1.inOut",
              duration: dynamicDurationIn
            });

          setTimeout(() => {
            this.isMoving = false;
          }, 900);
        }
      });
    }
    showModal(poster) {
      const idx = this.posters.indexOf(poster);
      const bgColor = getComputedStyle(poster).backgroundColor;
      const title = poster.dataset.title || poster.textContent;
      this.posters.forEach((p, i) => {
        if (i !== idx) {
          gsap.to(p, {
            opacity: 0, scale: 0.7, duration: 0.28 + i * 0.05,
            delay: i * 0.04, x: (i < idx ? -70 : 70), ease: "power2.in"
          });
        }
      });
      const carouselSection = document.querySelector('.carousel-section');
      if (carouselSection) {
        gsap.to(carouselSection, { backgroundColor: bgColor, duration: 0.38, delay: 0.1, ease: "power2.inOut" });
      }
      gsap.to(poster, {
        scale: 1.18, rotate: -5, duration: 0.22, delay: 0.18, ease: "power1.inOut",
        onComplete: () => {
          gsap.to(poster, {
            scale: 1.26, rotate: 5, duration: 0.19, ease: "power1.inOut", yoyo: true, repeat: 1,
            onComplete: () => {
              gsap.to(poster, {
                x: "-64vw", opacity: 0, duration: 0.46, delay: 0.05, ease: "power2.in",
                onComplete: () => {
                  const modal = document.getElementById('card-modal');
                  const modalCard = modal.querySelector('.modal-card');
                  const modalBg = modal.querySelector('.modal-bg');
                  if (modal && modalCard && modalBg) {
                    modalCard.innerHTML = `ISSUE ${poster.dataset.num || '??'}<br>${title}<div class="modal-x" style="position:absolute;right:28px;top:18px;font-size:2.1rem;cursor:pointer;">×</div>`;
                    modalCard.style.background = bgColor;
                    modalCard.style.color = getComputedStyle(poster).color;
                    modal.style.display = 'flex';
                    modalBg.classList.add('active');
                    const closeHandler = (e) => {
                      if (e.target.classList.contains('modal-x') || e.target.classList.contains('modal-bg')) {
                        e.stopPropagation(); this.closeModal();
                      }
                    };
                    const keyHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
                    modal.addEventListener('click', closeHandler);
                    document.addEventListener('keydown', keyHandler);
                    modal._closeHandler = closeHandler; modal._keyHandler = keyHandler;
                  }
                }
              });
            }
          });
        }
      });
    }
    closeModal() {
      const modal = document.getElementById('card-modal');
      const modalBg = modal.querySelector('.modal-bg');
      if (modal && modalBg && modalBg.classList.contains('active')) {
        if (modal._closeHandler) modal.removeEventListener('click', modal._closeHandler);
        if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
        delete modal._closeHandler; delete modal._keyHandler;
        modalBg.classList.remove('active');
        setTimeout(() => {
          modal.style.display = 'none'; this.restoreCarousel();
        }, 650);
      }
    }
    restoreCarousel() {
      this.posters.forEach((poster, i) => {
        let rel = ((i - this.center + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
        const distance = Math.abs(rel);
        const visible = distance <= this.maxVisible;
        const blurValue = Math.max(0, distance - 2) * 1.5;
        const angle = rel * this.animParams.cardAngle * (Math.PI / 180);
        const x = Math.sin(angle) * this.animParams.R;
        const y = this.animParams.verticalOffset - Math.cos(angle) * (this.animParams.R * 0.38);
        const rotation = angle * (180 / Math.PI) * 0.55;
        const scale = 1 - distance * this.animParams.scaleStep;
        const z = 1000 - distance * 60;
        const opacity = visible ? 1 : 0;
        gsap.to(poster, {
          x, y, rotation, scale, zIndex: z, opacity,
          filter: `blur(${blurValue}px)`,
          duration: 0.33, delay: 0.13 * distance + 0.1, ease: "power2.out"
        });
      });
      const carouselSection = document.querySelector('.carousel-section');
      if (carouselSection) {
        gsap.to(carouselSection, { backgroundColor: "transparent", duration: 0.5, delay: 0.2, ease: "power2.inOut" });
      }
    }
  } // --- End of ModernCarousel ---
  // ===== Background Image Slideshow ===== //
  function initBackgroundSlideshow(onBgIntroAnimationCompleteCallbackGlobal) {
    // console.log("[BACKGROUND] initBackgroundSlideshow function called.");
    let onBgIntroCompleteInternalCallback = onBgIntroAnimationCompleteCallbackGlobal;
    const introImageBaseUrl = 'images/';
    const carouselImageBaseUrl = 'images/';
    const totalSpecialImages = 15;
    
    let introImagePaths = Array.from({ length: totalSpecialImages }, (_, i) => `${introImageBaseUrl}intro${i + 1}.jpg`);
    let carouselImagePaths = Array.from({ length: totalSpecialImages }, (_, i) => `${carouselImageBaseUrl}${i + 1}.jpg`);
    
    const bgImageA = document.getElementById('bgImageA');
    const bgImageB = document.getElementById('bgImageB');
    let onBgIntroCallbackProcessed = false; 
    function finalBgIntroCallback() {
      if (!onBgIntroCallbackProcessed && typeof onBgIntroCompleteInternalCallback === 'function') {
        onBgIntroCompleteInternalCallback();
        onBgIntroCallbackProcessed = true; 
      }
    }
    if (!bgImageA || !bgImageB) {
      // console.error("[BACKGROUND] CRITICAL: Background image elements not found!");
      finalBgIntroCallback();
      return;
    }
    let imagesLoadedSuccessfully = 0;
    let imagesErrored = 0;
    let preloadAttemptedForIntro = false;
    let initialAnimationIndex = 0;
    let initialAnimationTimeoutId = null;
    let bgCurrentElement = bgImageA;
    let bgNextElement = bgImageB;
    let currentCarouselBgAnimationId = null;
    let currentBgVisualIndexForCarousel = 0;
    function actualImageLoadingAndIntroStart() {
      if (totalSpecialImages === 0 || introImagePaths.length === 0) {
        // console.warn("[BACKGROUND] No images for intro animation.");
        finalBgIntroCallback();
        return;
      }
      // console.log("[BACKGROUND] Starting initial intro animation sequence (1st image set directly).");
      const firstImagePath = introImagePaths[0];
      const tempImgCheck = new Image();
      tempImgCheck.onload = () => {
        // console.log(`[BACKGROUND] First image ${firstImagePath} confirmed loadable.`);
        bgCurrentElement.src = firstImagePath;
        gsap.set(bgCurrentElement, { opacity: 1.0 });
        gsap.set(bgNextElement, { opacity: 0 });
        initialAnimationIndex = 1;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, 120);
      };
      tempImgCheck.onerror = () => {
        // console.error(`[BACKGROUND] CRITICAL: First image ${firstImagePath} FAILED to load. Aborting intro.`);
        gsap.set(bgImageA, { opacity: 0 }); gsap.set(bgImageB, { opacity: 0 });
        finalBgIntroCallback();
      };
      tempImgCheck.src = firstImagePath;
    }
    function runInitialAnimationInternal() {
      if (initialAnimationIndex >= totalSpecialImages || initialAnimationIndex >= introImagePaths.length) {
        initialAnimationTimeoutId = null;
        // console.log("[BACKGROUND] Initial intro animation sequence FINISHED.");
        finalBgIntroCallback();
        return;
      }
      const imagePathToLoad = introImagePaths[initialAnimationIndex];
      if (!imagePathToLoad) { return; }
      // console.log(`[BACKGROUND] Anim step: ${initialAnimationIndex + 1}, Image: ${imagePathToLoad}`);
      const imgChecker = new Image();
      imgChecker.onload = () => {
        bgNextElement.src = imagePathToLoad;
        gsap.set(bgNextElement, { opacity: 1.0 });
        gsap.set(bgCurrentElement, { opacity: 0 });
        let temp = bgCurrentElement; bgCurrentElement = bgNextElement; bgNextElement = temp;
        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, 120);
      };
      imgChecker.onerror = () => {
        // console.error(`[BACKGROUND] Image ${imagePathToLoad} FAILED load in step. Skipping.`);
        initialAnimationIndex++;
        if (initialAnimationIndex >= totalSpecialImages || initialAnimationIndex >= introImagePaths.length) {
          finalBgIntroCallback();
        } else {
          initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, 50);
        }
      };
      imgChecker.src = imagePathToLoad;
    }
    if (introImagePaths.length > 0) {
      // console.log("[BACKGROUND] Preloading intro images for slideshow...");
      let imagesToPreloadCount = introImagePaths.length;
      introImagePaths.forEach((path) => {
        const img = new Image();
        img.onload = () => { imagesLoadedSuccessfully++; imagesToPreloadCount--; if (imagesToPreloadCount === 0 && !preloadAttemptedForIntro) triggerPlayVisualIntro(); };
        img.onerror = () => { imagesErrored++; imagesToPreloadCount--; if (imagesToPreloadCount === 0 && !preloadAttemptedForIntro) triggerPlayVisualIntro(); };
        img.src = path;
      });
      setTimeout(() => { if (!preloadAttemptedForIntro) { /* console.warn("[BACKGROUND] Preload timeout."); */ triggerPlayVisualIntro(); } }, 7000);
    } else {
      // console.warn("[BACKGROUND] No intro images to preload, calling callback directly.");
      finalBgIntroCallback();
    }
    function triggerPlayVisualIntro() {
      if (preloadAttemptedForIntro) return;
      preloadAttemptedForIntro = true;
      // console.log(`[BACKGROUND] playVisualIntroAnimation called. Preload: ${imagesLoadedSuccessfully} loaded, ${imagesErrored} errored.`);
      actualImageLoadingAndIntroStart();
    }
    function _setSingleBackgroundImageForCarousel(visualIndex) {
      const safeVisualIndex = (visualIndex % carouselImagePaths.length + carouselImagePaths.length) % carouselImagePaths.length;
      if (!carouselImagePaths[safeVisualIndex]) {
        // console.error("[BACKGROUND-CAROUSEL] Invalid image path for visual index:", safeVisualIndex, " (using carouselImagePaths)");
        return;
      }
      // console.log(`[BACKGROUND-CAROUSEL] Setting background to: ${carouselImagePaths[safeVisualIndex]}`);
      bgNextElement.src = carouselImagePaths[safeVisualIndex];
      gsap.set(bgNextElement, { opacity: 1.0 });
      gsap.set(bgCurrentElement, { opacity: 0 });
      let temp = bgCurrentElement;
      bgCurrentElement = bgNextElement;
      bgNextElement = temp;
      currentBgVisualIndexForCarousel = safeVisualIndex;
    }
    function animateBackgroundDramatically(cardDeltaMagnitude, bgCycleDirection, totalAnimDuration = 800) {
      // console.log(`[BACKGROUND-CAROUSEL] animateBackgroundDramatically. cardDelta: ${cardDeltaMagnitude}, Dir: ${bgCycleDirection}, Duration: ${totalAnimDuration}`);
      if (initialAnimationTimeoutId) {
        clearTimeout(initialAnimationTimeoutId);
        initialAnimationTimeoutId = null;
        // console.log("[BACKGROUND] Initial intro animation stopped by carousel interaction.");
        finalBgIntroCallback(); 
      }
      if (currentCarouselBgAnimationId) {
        clearTimeout(currentCarouselBgAnimationId);
        currentCarouselBgAnimationId = null;
      }
      if (cardDeltaMagnitude === 0) {
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
        // console.log("[BACKGROUND-CAROUSEL] cardDeltaMagnitude is 0, setting single background for current index:", currentBgVisualIndexForCarousel);
        return;
      }
      let numBackgroundImagesToCycle;
      if (cardDeltaMagnitude > 0) {
        numBackgroundImagesToCycle = (cardDeltaMagnitude * 2) + 3;
      } else {
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
        return;
      }
      const stepInterval = totalAnimDuration / numBackgroundImagesToCycle;
      if (stepInterval <= 16) {
        for (let i = 0; i < numBackgroundImagesToCycle; i++) {
          currentBgVisualIndexForCarousel = (currentBgVisualIndexForCarousel + bgCycleDirection + totalSpecialImages) % totalSpecialImages;
        }
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
        return;
      }
      let stepsTaken = 0;
      function animateNextBgStep() {
        if (stepsTaken >= numBackgroundImagesToCycle) {
          currentCarouselBgAnimationId = null;
          return;
        }
        currentBgVisualIndexForCarousel = (currentBgVisualIndexForCarousel + bgCycleDirection + totalSpecialImages) % totalSpecialImages;
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
        stepsTaken++;
        currentCarouselBgAnimationId = setTimeout(animateNextBgStep, stepInterval);
      }
      animateNextBgStep();
    }
    function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
      if (initialAnimationTimeoutId) {
        clearTimeout(initialAnimationTimeoutId);
        initialAnimationTimeoutId = null;
        finalBgIntroCallback(); 
      }
      currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter % carouselImagePaths.length + carouselImagePaths.length) % carouselImagePaths.length;
      _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
    }
    window.appBackgroundChanger = {
      playVisualIntroAnimation: triggerPlayVisualIntro,
      initializeCarouselModeBackground: initializeCarouselModeBg,
      triggerDramaticAnimation: animateBackgroundDramatically
    };
  } // --- End of initBackgroundSlideshow ---
  // ===== PRIMARY INITIALIZATION on DOMContentLoaded ===== //
  document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOMContentLoaded event fired for hobby.js main logic.");
    if (window.appContentLoadedAndInitialized) {
      // console.warn("hobby.js DOMContentLoaded: Logic has already been executed. Skipping.");
      return;
    }
    window.appContentLoadedAndInitialized = true;
    // console.log("DOMContentLoaded (hobby.js): Main initialization sequence starting.");
    if (typeof initHeaderObserver === 'function') initHeaderObserver();
    
    if (typeof ModernCarousel !== 'undefined') {
      window.modernCarouselInstanceForHobby = new ModernCarousel();
      if (typeof initBackgroundSlideshow === 'function') {
        let isLimitedScrollLogicAttached = false; 
        initBackgroundSlideshow(() => { 
          if (isLimitedScrollLogicAttached) return;
          isLimitedScrollLogicAttached = true;
          // console.log("[CALLBACK FROM BG_MODULE (hobby.js)] Background visual intro complete. Attaching EMPTY scroll logic block.");
          if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
            window.modernCarouselInstanceForHobby.runCarousel(true);
          } else {
            // console.error("[CALLBACK FROM BG_MODULE (hobby.js)] CRITICAL: ModernCarousel instance or runCarousel method not found!");
          }
        });
        if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.startVisuals === 'function') {
          window.modernCarouselInstanceForHobby.startVisuals();
        } else {
          // console.error("DOMContentLoaded (hobby.js): Carousel instance or startVisuals not found. Cannot kick off sequence.");
        }
      } else {
        if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.startVisuals === 'function') {
          window.modernCarouselInstanceForHobby.startVisuals();
        }
      }
    } else {
      // console.error("DOMContentLoaded (hobby.js): ModernCarousel class is not defined! Cannot initialize main component.");
    }
    // console.log("DOMContentLoaded (hobby.js): Main initialization sequence setup finished.");
  });
  // console.log("hobby.js: Script evaluation and setup complete (outside DOMContentLoaded).");

  // --- Background image follows scroll, up to 300px ---
  (function() {
    const bgSlideshow = document.getElementById('background-slideshow');
    if (!bgSlideshow) return;
    let initialTopSet = false;
    if (getComputedStyle(bgSlideshow).position !== 'absolute') {
        if (getComputedStyle(bgSlideshow).position === 'fixed') {
            bgSlideshow.style.top = window.scrollY + 'px';
            initialTopSet = true;
        }
        bgSlideshow.style.position = 'absolute';
    }

    function updateBgPosition() {
      const scrollY = window.scrollY;
      if (getComputedStyle(bgSlideshow).position !== 'absolute') {
          return; 
      }
      initialTopSet = true; 

      if (scrollY < 300) {
        bgSlideshow.style.top = scrollY + 'px';
      } else {
        bgSlideshow.style.top = '300px';
      }
    }
    window.addEventListener('scroll', updateBgPosition, { passive: true });
    window.addEventListener('resize', updateBgPosition);
    updateBgPosition(); // Initial position set
  })();
}
