/* === 헤더 숨김 === */
function initHeaderObserver() {
  const header = document.querySelector('.nav-header');
  const sentinel = document.getElementById('top-sentinel');
  if (!header || !sentinel) {
    console.warn("[HEADER] Header or sentinel not found for IntersectionObserver.");
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

// ===== Modern Carousel - Vanilla JS Implementation (MODIFIED FOR SEQUENCING & DEBUGGING) ===== //
class ModernCarousel {
  constructor() {
    console.log("[CAROUSEL CONSTRUCTOR] Initializing ModernCarousel instance.");
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
      console.log("[CAROUSEL CONSTRUCTOR] DOM still loading, deferring setupDomReferences.");
      document.addEventListener('DOMContentLoaded', () => this.setupDomReferences(), { once: true });
    } else {
      console.log("[CAROUSEL CONSTRUCTOR] DOM ready or past loading, calling setupDomReferences immediately.");
      this.setupDomReferences();
    }
  }

  setupDomReferences() {
    if (this.carousel) {
        console.log("[CAROUSEL] setupDomReferences: Already set up.");
        return;
    }
    console.log("[CAROUSEL] setupDomReferences called.");
    this.carousel = document.querySelector('.carousel');
    this.labels = document.querySelector('.carousel-labels');
    this.posters = Array.from(this.carousel?.querySelectorAll('.poster') || []);
    this.n = this.posters.length;

    if (this.n > 0) {
      this.center = Math.floor(this.n / 2);
      this.lastCenter = this.center;
    } else {
      this.center = 0;
      this.lastCenter = 0;
      console.warn("[CAROUSEL] No poster elements found during setupDomReferences. Carousel might not function as expected.");
    }
    console.log(`[CAROUSEL] DOM references setup. Found ${this.n} posters. Initial center: ${this.center}`);
  }

  startVisuals() {
    console.log("[CAROUSEL] Attempting to start visuals...");
    if (this.visualsStarted) {
      console.log("[CAROUSEL] Visuals already started. Aborting startVisuals.");
      return;
    }
    if (this.n === 0 && this.carousel) {
        console.log("[CAROUSEL] No poster items (this.n is 0 in startVisuals), trying to re-setup DOM references.");
        this.setupDomReferences();
        if (this.n === 0) {
            console.error("[CAROUSEL] CRITICAL: No poster items even after re-setup. Cannot start visuals.");
            return;
        }
    } else if (!this.carousel) {
        console.error("[CAROUSEL] CRITICAL: Carousel DOM element not found. Cannot start visuals.");
        return;
    }
    this.visualsStarted = true;
    console.log("[CAROUSEL] startVisuals: Approved. Triggering preloader hiding and carousel appearance.");
    this.actuallyStartPreloaderAndRunCarousel();
  }

  actuallyStartPreloaderAndRunCarousel() {
    const self = this;
    const preloader = document.getElementById('preloader');
    const main = document.getElementById('main');
    const carouselHero = document.querySelector('.carousel-hero');

    if (!self.carousel && self.n === 0) {
        console.log("[CAROUSEL] actuallyStartPreloaderAndRunCarousel: DOM refs might not be set, calling setupDomReferences.");
        self.setupDomReferences();
    }
    if (self.n === 0 && self.posters.length === 0) {
        console.error("[CAROUSEL] actuallyStartPreloaderAndRunCarousel: No poster items. Aborting.");
        return;
    }

    console.log("[CAROUSEL] actuallyStartPreloaderAndRunCarousel: Starting logic.");

    if (preloader) {
      console.log("[CAROUSEL] Preloader element found. Starting preloader fade out sequence.");
      preloader.style.transition = 'opacity 0.3s ease-out';
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
        console.log("[CAROUSEL] Preloader hidden. Showing #main and .carousel-hero.");
        if (main) {
          main.style.display = 'block';
          gsap.fromTo(main, { opacity: 0 }, {
            opacity: 1, duration: 0.45,
            onComplete: () => {
              console.log("[CAROUSEL GSAP MainFadeIn onComplete] 'this':", this, "'self':", self);
              if (typeof self.runCarousel === 'function') {
                console.log("[CAROUSEL] Main content faded in. Calling self.runCarousel(true).");
                self.runCarousel(true);
              } else {
                console.error("[CAROUSEL CRITICAL ERROR] self.runCarousel is NOT a function! 'self':", self, "Methods on prototype:", Object.getOwnPropertyNames(ModernCarousel.prototype));
              }
            }
          });
        } else {
          console.error("[CAROUSEL] #main element not found. Attempting to run carousel anyway.");
          if (typeof self.runCarousel === 'function') self.runCarousel(true); else console.error("[CAROUSEL CRITICAL ERROR] self.runCarousel is NOT a function! (#main not found case)");
        }
        if (carouselHero) {
          carouselHero.style.opacity = '0';
          gsap.to(carouselHero, { opacity: 1, duration: 0.45, ease: "power2.out" });
        }
      }, 300);
    } else {
      console.warn("[CAROUSEL] Preloader element not found. Showing main content directly.");
      if (main) {
        main.style.display = 'block';
        gsap.to(main, { opacity: 1, duration: 0.45, ease: "power2.out" });
      }
      if (carouselHero) {
        carouselHero.style.opacity = '0';
        gsap.to(carouselHero, { opacity: 1, duration: 0.45, ease: "power2.out" });
      }
      if (typeof self.runCarousel === 'function') {
        self.runCarousel(true);
      } else {
        console.error("[CAROUSEL CRITICAL ERROR] self.runCarousel is NOT a function (no preloader case).");
      }
    }
  }

  renderLabels(centerIdx, visibleCount = 5) {
    if (!this.labels) return;
    this.labels.innerHTML = '';
    const half = Math.floor(visibleCount / 2);
    const { angleStep, curveRadius, labelVerticalOffset } = this.animParams;
    for (let i = 0; i < this.n; i++) {
      let rel = ((i - centerIdx + this.n) % this.n + Math.floor(this.n/2)) % this.n - Math.floor(this.n/2);
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
      const normalizedDiff = ((diff + Math.floor(this.n/2)) % this.n) - Math.floor(this.n/2);
      moveDirection = normalizedDiff > 0 ? 1 : -1;
    }
    this.posters.forEach((poster, i) => {
      let rel = ((i - centerIdx + this.n) % this.n + Math.floor(this.n/2)) % this.n - Math.floor(this.n/2);
      const visible = Math.abs(rel) <= this.maxVisible;
      const angle = rel * cardAngle * (Math.PI / 180);
      const x = Math.sin(angle) * R;
      const y = verticalOffset - Math.cos(angle) * (R * 0.38);
      const rotation = angle * (180 / Math.PI) * 0.55;
      const scale = 1 - Math.abs(rel) * scaleStep;
      const z = 1000 - Math.abs(rel) * 60;
      const opacity = visible ? 1 : 0;
      const isCenterCard = rel === 0;
      if (animate) {
        if (this.isEntranceAnimation || !isCenterCard || moveDirection === 0) {
          gsap.to(poster, { duration: this.isEntranceAnimation ? 0.6 : 0.8, x, y, rotation, scale, zIndex: z, opacity, ease: this.isEntranceAnimation ? "power2.out" : "expo.out"});
        } else {
          const timeline = gsap.timeline();
          const bounceMultiplier = moveDirection;
          const overshootX = x + (15 * bounceMultiplier);
          const overshootRotation = rotation + (12 * bounceMultiplier);
          timeline.to(poster, { duration: 0.66, x: overshootX, rotation: overshootRotation, ease: "power2.out" }).to(poster, { duration: 0.22, x, rotation, ease: "power1.out" });
          gsap.to(poster, { duration: 0.38, y, scale, zIndex: z, opacity, ease: "expo.out" });
        }
      } else { gsap.set(poster, { x, y, rotation, scale, zIndex: z, opacity }); }
    });
    this.renderLabels(centerIdx, 5);
  }


  runCarousel(isFirst = false) {
    console.log(`[CAROUSEL] runCarousel called. isFirst: ${isFirst}. 'this' context:`, this);
    if (!this || typeof this.playEntranceAnimation !== 'function' || typeof this.renderCarousel !== 'function' || typeof this.setupEvents !== 'function') {
        console.error("[CAROUSEL CRITICAL ERROR] In runCarousel, 'this' is incorrect or essential methods are missing. 'this':", this);
        return;
    }
    this.isEntranceAnimation = isFirst;
    if (isFirst) {
      this.playEntranceAnimation();
    } else {
      this.renderCarousel(this.center, false);
      this.setupEvents();
    }
  }

  // ===== REPLACED playEntranceAnimation with the desired version =====
  playEntranceAnimation() {
    console.log("[CAROUSEL] playEntranceAnimation (NEW VERSION) started.");
    if (this.n === 0 || !this.carousel) {
        console.warn("[CAROUSEL] playEntranceAnimation: No items or carousel element. Aborting.");
        return;
    }

    // Start carousel transparent
    this.carousel.style.opacity = '0';

    // Calculate starting center (6 items to the "left" or fewer if not enough items)
    const entranceOffset = Math.min(6, Math.floor(this.n / 2));
    let startCenter = (this.center - entranceOffset + this.n) % this.n;
    this.lastCenter = startCenter; // Initial lastCenter for the animation sequence

    // Render posters at this initial off-screen/offset position without animation
    this.renderCarousel(startCenter, false);
    this.posters.forEach(poster => poster.style.opacity = '0'); // Posters start transparent

    // Fade in the main carousel container
    gsap.to(this.carousel, { opacity: 1, duration: 0.5, ease: "power2.out" });

    // Quickly fade in all posters at their 'startCenter' positions with a slight stagger
    this.posters.forEach((poster, i) => {
        // Calculate relative index for delay based on startCenter
        let relToStart = ((i - startCenter + this.n) % this.n + Math.floor(this.n/2)) % this.n - Math.floor(this.n/2);
        gsap.to(poster, {
            opacity: 1,
            duration: 0.4,
            delay: Math.abs(relToStart) * 0.05 + 0.2, // Stagger from startCenter, add base delay
            ease: "power2.out"
        });
    });
    console.log(`[CAROUSEL] playEntranceAnimation: Posters faded in at startCenter: ${startCenter}. Target center: ${this.center}`);

    // After posters are visible (but still at 'startCenter'), begin the rotation to the true center
    setTimeout(() => {
      let currentAnimatedCenter = startCenter;
      let rotationStep = 0;
      // Number of steps to move to the actual center
      const totalSteps = (this.center - startCenter + this.n) % this.n;

      if (totalSteps === 0) { // Already at center, or very few items
          console.log("[CAROUSEL] playEntranceAnimation: Already at target center or no steps to take.");
          this.isEntranceAnimation = false;
          this.lastCenter = this.center;
          this.setupEvents();
          if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
            console.log("[CAROUSEL] playEntranceAnimation: Initializing background for carousel at center (no rotation).");
            window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
          }
          console.log("[CAROUSEL] playEntranceAnimation (NEW VERSION) finished early, events set up.");
          return;
      }

      console.log(`[CAROUSEL] playEntranceAnimation: Starting rotation sequence from ${startCenter} to ${this.center} in ${totalSteps} steps.`);
      const rotateStep = () => {
        this.lastCenter = currentAnimatedCenter; // Update lastCenter for renderCarousel's animation logic
        currentAnimatedCenter = (currentAnimatedCenter + 1) % this.n;
        this.renderCarousel(currentAnimatedCenter, true); // Animate one step
        rotationStep++;
        console.log(`[CAROUSEL] playEntranceAnimation: Rotation step ${rotationStep}/${totalSteps}, currentAnimatedCenter: ${currentAnimatedCenter}`);

        if (rotationStep < totalSteps) {
          setTimeout(rotateStep, 100); // Schedule next step
        } else {
          // Final adjustments after rotation animation completes
          console.log("[CAROUSEL] playEntranceAnimation: Rotation sequence finished.");
          setTimeout(() => {
            this.lastCenter = currentAnimatedCenter; // Ensure lastCenter is the one before final
            this.center = currentAnimatedCenter;     // Final center is now set
            this.renderCarousel(this.center, true);  // A final render to ensure correct state
            console.log(`[CAROUSEL] playEntranceAnimation: Final render to center ${this.center}.`);

            setTimeout(() => {
              this.isEntranceAnimation = false;
              this.lastCenter = this.center; // Solidify lastCenter after all animations
              this.setupEvents();
              // Sync background with the final carousel center
              if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
                console.log("[CAROUSEL] playEntranceAnimation: Initializing background for carousel post-animation.");
                window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
              }
              console.log("[CAROUSEL] playEntranceAnimation (NEW VERSION) finished, events set up.");
            }, 700); // Allow final render animation to settle
          }, (this.n > 3 ? 600: 100) ); // Allow rotation animation to somewhat complete
        }
      };
      rotateStep(); // Start the rotation sequence
    }, 800); // Wait a bit for posters to become visible before starting the rotation
  }
  // ===== END OF REPLACED playEntranceAnimation =====

  moveTo(newCenter, userDirection = null) {
    const targetCenter = (newCenter + this.n) % this.n;
    const oldActualCenter = this.center;

    if (this.isMoving || (oldActualCenter === targetCenter && !this.pendingMoveQueue.length)) {
        if (oldActualCenter !== targetCenter && this.pendingMoveQueue.every(move => move.target !== targetCenter)) {
            this.pendingMoveQueue.push({ target: targetCenter, direction: userDirection });
        }
        if(this.isMoving) { return; }
        if(oldActualCenter === targetCenter && !this.pendingMoveQueue.length) {
            if (window.appBackgroundChanger && typeof window.appBackgroundChanger.triggerDramaticAnimation === 'function') {
                window.appBackgroundChanger.triggerDramaticAnimation(0, 0, 0);
            }
            return;
        }
    }

    this.isMoving = true;
    this.lastCenter = oldActualCenter;
    this.center = targetCenter;

    this.renderCarousel(this.center, true);

    if (window.appBackgroundChanger && typeof window.appBackgroundChanger.triggerDramaticAnimation === 'function') {
        let cardDeltaMagnitude = 0;
        let bgCycleDirection = 0;

        if (oldActualCenter !== this.center) {
            const distForward = (this.center - oldActualCenter + this.n) % this.n;
            const distBackward = (oldActualCenter - this.center + this.n) % this.n;

            if (userDirection !== null && userDirection !== 0) {
                cardDeltaMagnitude = 1;
                bgCycleDirection = userDirection > 0 ? 1 : -1;
            } else {
                if (distForward <= distBackward) {
                    cardDeltaMagnitude = distForward;
                    bgCycleDirection = 1;
                } else {
                    cardDeltaMagnitude = distBackward;
                    bgCycleDirection = -1;
                }
            }
            if (cardDeltaMagnitude > 0) {
                 window.appBackgroundChanger.triggerDramaticAnimation(cardDeltaMagnitude, bgCycleDirection, 800);
            } else {
                 window.appBackgroundChanger.triggerDramaticAnimation(0, 0, 0);
            }
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
    console.log("[CAROUSEL] setupEvents called.");
    if (!this.carousel) { console.error("[CAROUSEL] setupEvents: Carousel element not found!"); return; }
    // Clear existing listeners to prevent duplication if setupEvents is called multiple times
    // This is a simplistic approach; a more robust solution would manage listeners explicitly.
    const newCarousel = this.carousel.cloneNode(true);
    this.carousel.parentNode.replaceChild(newCarousel, this.carousel);
    this.carousel = newCarousel;

    this.posters.forEach((poster, idx) => {
        const newPoster = this.carousel.querySelectorAll('.poster')[idx];
        if (newPoster) { // Make sure we have the new poster element
            this.posters[idx] = newPoster; // Update reference in this.posters array
            newPoster.addEventListener('click', () => {
                console.log(`[CAROUSEL] Poster clicked. Index: ${idx}, Current Center: ${this.center}`);
                if (idx === this.center) this.showModal(newPoster);
                else this.moveTo(idx);
            });
        }
    });


    this.carousel.addEventListener('wheel', (e) => { e.preventDefault(); if (e.deltaY > 0) this.moveTo(this.center + 1, 1); else this.moveTo(this.center - 1, -1); }, { passive: false });
    this.carousel.addEventListener('mousedown', (e) => { e.preventDefault(); this.isDragging = true; this.startX = e.pageX; this.carousel.style.cursor = 'grabbing'; });
    // mousemove and mouseup should ideally be on 'document' or 'window' to catch drags outside the carousel
    const mouseMoveHandler = (e) => { if (!this.isDragging) return; e.preventDefault(); };
    const mouseUpHandler = (e) => {
      if (!this.isDragging) return;
      const deltaX = e.pageX - this.startX;
      this.carousel.style.cursor = 'grab';
      this.isDragging = false;
      if (Math.abs(deltaX) > this.dragThreshold) { if (deltaX > 0) this.moveTo(this.center - 1, -1); else this.moveTo(this.center + 1, 1); }
    };
    // Store these handlers on the instance if you need to remove them later specifically
    this._mouseMoveHandler = mouseMoveHandler;
    this._mouseUpHandler = mouseUpHandler;
    document.addEventListener('mousemove', this._mouseMoveHandler);
    document.addEventListener('mouseup', this._mouseUpHandler);

    this.carousel.addEventListener('touchstart', (e) => { this.startTouchX = e.touches[0].pageX; }, { passive: true });
    this.carousel.addEventListener('touchend', (e) => {
      const endTouchX = e.changedTouches[0].pageX;
      const deltaX = endTouchX - this.startTouchX;
      if (Math.abs(deltaX) > this.dragThreshold) { if (deltaX > 0) this.moveTo(this.center - 1, -1); else this.moveTo(this.center + 1, 1); }
    }, { passive: true });

    this.carousel.style.cursor = 'grab';
    console.log("[CAROUSEL] Event listeners set up/re-set up.");
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
        let rel = ((i - this.center + this.n) % this.n + Math.floor(this.n/2)) % this.n - Math.floor(this.n/2);
        const visible = Math.abs(rel) <= this.maxVisible;
        const angle = rel * this.animParams.cardAngle * (Math.PI / 180);
        const x = Math.sin(angle) * this.animParams.R;
        const y = this.animParams.verticalOffset - Math.cos(angle) * (this.animParams.R * 0.38);
        const rotation = angle * (180 / Math.PI) * 0.55;
        const scale = 1 - Math.abs(rel) * this.animParams.scaleStep;
        const z = 1000 - Math.abs(rel) * 60;
        const opacity = visible ? 1 : 0;
        gsap.to(poster, {
            x, y, rotation, scale, zIndex: z, opacity,
            duration: 0.33, delay: 0.13 * Math.abs(rel) + 0.1, ease: "power2.out"
        });
    });
    const carouselSection = document.querySelector('.carousel-section');
    if (carouselSection) {
        gsap.to(carouselSection, { backgroundColor: "transparent", duration: 0.5, delay: 0.2, ease: "power2.inOut" });
    }
  }
}
// --- End of ModernCarousel ---

// ===== Background Image Slideshow (MODIFIED FOR NEW STRATEGY & DEBUGGING) ===== //
function initBackgroundSlideshow(onInitialAnimationComplete) {
    console.log("[BACKGROUND] initBackgroundSlideshow function called.");
    const introImageBaseUrl = 'images/';
    const carouselImageBaseUrl = 'images/';
    const totalSpecialImages = 15;

    let introImagePaths = [];
    for (let i = 1; i <= totalSpecialImages; i++) {
        introImagePaths.push(`${introImageBaseUrl}intro${i}.jpg`);
    }

    let carouselImagePaths = [];
    for (let i = 1; i <= totalSpecialImages; i++) {
        carouselImagePaths.push(`${carouselImageBaseUrl}${i}.jpg`);
    }

    const bgImageA = document.getElementById('bgImageA');
    const bgImageB = document.getElementById('bgImageB');

    if (!bgImageA || !bgImageB) {
        console.error("[BACKGROUND] CRITICAL: Background image elements #bgImageA or #bgImageB not found!");
        if (typeof onInitialAnimationComplete === 'function') {
            console.log("[BACKGROUND] Calling onInitialAnimationComplete early due to missing bg elements.");
            onInitialAnimationComplete();
        }
        return;
    }

    console.log("[BACKGROUND] Preloading intro images...");
    let introLoadInitiated = false;

    function startTheActualAnimation() {
        if (totalSpecialImages > 0 && introImagePaths.length === totalSpecialImages && introImagePaths[0]) {
            console.log("[BACKGROUND] Starting initial intro animation sequence (1st image set directly).");
            document.title = "Intro BG: 1";
            bgCurrentElement.src = introImagePaths[0];
            gsap.set(bgCurrentElement, { opacity: 1.0 });
            gsap.set(bgNextElement, { opacity: 0 });
            initialAnimationIndex = 1;
            initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, 50); // Animation interval
        } else {
            console.error("[BACKGROUND] No intro images to animate or paths array incomplete. ImagePaths[0] validity:", introImagePaths[0]);
            if (typeof onInitialAnimationComplete === 'function') {
                console.log("[BACKGROUND] Calling onInitialAnimationComplete immediately due to no images for initial anim.");
                onInitialAnimationComplete();
            }
        }
    }

    if (introImagePaths.length > 0 && !introLoadInitiated) {
        introLoadInitiated = true;
        let imagesToLoad = introImagePaths.length;
        introImagePaths.forEach(path => {
            const img = new Image();
            img.onload = img.onerror = () => {
                imagesToLoad--;
                if (imagesToLoad === 0) {
                    console.log("[BACKGROUND] All intro images attempted to preload. Starting animation.");
                    startTheActualAnimation();
                }
            };
            img.src = path;
        });
        // Fallback timeout in case some images fail to load/error out in a timely manner
        setTimeout(() => {
            if (imagesToLoad > 0 && imagesToLoad < introImagePaths.length) { // Some loaded, some not
                console.warn(`[BACKGROUND] Preloading timeout: ${imagesToLoad} images did not call onload/onerror. Starting animation anyway.`);
                startTheActualAnimation();
            } else if (imagesToLoad === introImagePaths.length) { // None loaded
                 console.error(`[BACKGROUND] Preloading timeout: NO images called onload/onerror. Check paths/network. Starting animation if possible.`);
                 startTheActualAnimation(); // Will likely fail if paths are bad, but follows logic
            }
        }, 5000); // 5 second timeout for preloading

    } else if (introImagePaths.length === 0) {
        console.warn("[BACKGROUND] No intro images defined.");
        startTheActualAnimation();
    }


    let initialAnimationIndex = 0;
    let initialAnimationTimeoutId = null;
    let bgCurrentElement = bgImageA;
    let bgNextElement = bgImageB;

    let currentCarouselBgAnimationId = null;
    let currentBgVisualIndexForCarousel = 0;

    function runInitialAnimationInternal() {
        document.title = `Intro BG Anim: ${initialAnimationIndex + 1}`;

        if (initialAnimationIndex >= totalSpecialImages) {
            initialAnimationTimeoutId = null;
            document.title = "Intro BG Anim DONE";
            console.log("[BACKGROUND] Initial intro animation sequence FINISHED. Calling onInitialAnimationComplete callback now.");
            if (typeof onInitialAnimationComplete === 'function') {
                onInitialAnimationComplete();
            } else {
                console.error("[BACKGROUND] onInitialAnimationComplete callback is NOT defined or not a function!");
            }
            return;
        }

        if (!introImagePaths[initialAnimationIndex]) {
            console.error(`[BACKGROUND] CRITICAL: Intro image path is undefined for index ${initialAnimationIndex}. Halting initial animation.`);
            if (initialAnimationTimeoutId) clearTimeout(initialAnimationTimeoutId);
            document.title = "Intro BG Anim ERROR";
            if (typeof onInitialAnimationComplete === 'function') {
                console.log("[BACKGROUND] Calling onInitialAnimationComplete due to image path error in intro anim.");
                onInitialAnimationComplete();
            }
            return;
        }

        console.log(`[BACKGROUND] Initial anim step: ${initialAnimationIndex + 1}/${totalSpecialImages}, Image: ${introImagePaths[initialAnimationIndex]}`);
        bgNextElement.src = introImagePaths[initialAnimationIndex];
        gsap.set(bgNextElement, { opacity: 1.0 });
        gsap.set(bgCurrentElement, { opacity: 0 });

        let temp = bgCurrentElement;
        bgCurrentElement = bgNextElement;
        bgNextElement = temp;

        initialAnimationIndex++;
        initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, 50); // Animation interval
    }

    function _setSingleBackgroundImageForCarousel(visualIndex) {
        const safeVisualIndex = (visualIndex % totalSpecialImages + totalSpecialImages) % totalSpecialImages;
        if (!carouselImagePaths[safeVisualIndex]) {
            console.error("[BACKGROUND-CAROUSEL] Invalid image path for visual index:", safeVisualIndex);
            return;
        }
        console.log(`[BACKGROUND-CAROUSEL] Setting background to: ${carouselImagePaths[safeVisualIndex]}`);
        bgNextElement.src = carouselImagePaths[safeVisualIndex];
        gsap.set(bgNextElement, { opacity: 1.0 });
        gsap.set(bgCurrentElement, { opacity: 0 });
        let temp = bgCurrentElement;
        bgCurrentElement = bgNextElement;
        bgNextElement = temp;
        currentBgVisualIndexForCarousel = safeVisualIndex;
     }

    function animateBackgroundDramatically(cardDeltaMagnitude, bgCycleDirection, totalAnimDuration = 800) {
        console.log(`[BACKGROUND-CAROUSEL] animateBackgroundDramatically. Delta: ${cardDeltaMagnitude}, Dir: ${bgCycleDirection}, Duration: ${totalAnimDuration}`);
        if (initialAnimationTimeoutId) {
            clearTimeout(initialAnimationTimeoutId);
            initialAnimationTimeoutId = null;
            console.log("[BACKGROUND] Initial intro animation stopped by carousel interaction.");
        }
        if (currentCarouselBgAnimationId) {
            clearTimeout(currentCarouselBgAnimationId);
            currentCarouselBgAnimationId = null;
        }
        if (cardDeltaMagnitude === 0 && totalAnimDuration === 0) { // Explicit request for immediate single image set
            _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel); // Or a target index if provided
            return;
        }
        let numBackgroundSteps = 0;
        const absCardDelta = Math.abs(cardDeltaMagnitude);
        if (absCardDelta === 1) numBackgroundSteps = 5;
        else if (absCardDelta === 2) numBackgroundSteps = 6;
        else if (absCardDelta === 3) numBackgroundSteps = 7;
        else if (absCardDelta >= 4) numBackgroundSteps = 8;
        else {
             _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
            return;
        }
        const stepInterval = totalAnimDuration / numBackgroundSteps;
        if (stepInterval <= 0) { // Avoid issues with zero or negative interval
             _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel + (bgCycleDirection * cardDeltaMagnitude)); // Go to target
             return;
        }
        let stepsTaken = 0;
        function animateNextBgStep() {
            if (stepsTaken >= numBackgroundSteps) {
                currentCarouselBgAnimationId = null;
                 // Ensure final image corresponds to the carousel's actual new center
                _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel); // currentBgVisualIndexForCarousel should have been updated by moveTo
                console.log(`[BACKGROUND-CAROUSEL] Dramatic animation finished. Final BG index: ${currentBgVisualIndexForCarousel}`);
                return;
            }
            // Each step advances the visual index
            _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel + (stepsTaken + 1) * bgCycleDirection); // Tentative: this needs careful index management
            stepsTaken++;
            currentCarouselBgAnimationId = setTimeout(animateNextBgStep, stepInterval);
        }
        animateNextBgStep();
     }

    function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
        console.log(`[BACKGROUND-CAROUSEL] initializeCarouselModeBg with posterIndex: ${posterIndexOfCarouselCenter}`);
        if (initialAnimationTimeoutId) {
            clearTimeout(initialAnimationTimeoutId);
            initialAnimationTimeoutId = null;
             console.log("[BACKGROUND] Initial intro animation stopped by carousel mode initialization.");
        }
        currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter % totalSpecialImages + totalSpecialImages) % totalSpecialImages;
        _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel);
     }

    window.appBackgroundChanger = {
        triggerDramaticAnimation: animateBackgroundDramatically,
        initializeCarouselModeBackground: initializeCarouselModeBg
    };

    if (introImagePaths.length === 0 && typeof onInitialAnimationComplete === 'function') {
        console.warn("[BACKGROUND] No intro images defined at the very start. Calling onInitialAnimationComplete.");
        onInitialAnimationComplete();
    }
}

// ===== 초기화 ===== //
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded: Script execution started.");
  // Ensure this block runs only once
  if (window.appInitialized) {
      console.log("DOMContentLoaded: App already initialized. Skipping.");
      return;
  }
  window.appInitialized = true;


  if (typeof initHeaderObserver === 'function') initHeaderObserver();

  if (typeof ModernCarousel !== 'undefined') {
    console.log("DOMContentLoaded: ModernCarousel class is defined. Creating instance.");
    window.modernCarouselInstanceForHobby = new ModernCarousel();

    if (typeof initBackgroundSlideshow === 'function' && !window.bgSlideshowInitialized) {
      console.log("DOMContentLoaded: Initializing background slideshow and passing the callback to start carousel visuals later.");
      initBackgroundSlideshow((() => {
        let called = false;
        return () => {
            if (called) {
                console.warn("[CALLBACK FROM BG_ANIM] onInitialAnimationComplete called more than once. Ignoring subsequent calls.");
                return;
            }
            called = true;
            console.log("[CALLBACK FROM BG_ANIM] Initial intro animation complete (or error). Requesting ModernCarousel to start visuals.");
            if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.startVisuals === 'function') {
              window.modernCarouselInstanceForHobby.startVisuals();
            } else {
              console.error("[CALLBACK FROM BG_ANIM] CRITICAL: ModernCarousel instance or startVisuals method not found!");
            }
        };
      })());
      window.bgSlideshowInitialized = true;
    } else {
      if (window.bgSlideshowInitialized) { console.log("DOMContentLoaded: Background slideshow already initialized (or init function missing)."); }
      else { console.error("DOMContentLoaded: initBackgroundSlideshow function is not defined!"); }
    }
  } else {
    console.error("DOMContentLoaded: ModernCarousel class is not defined!");
  }
});