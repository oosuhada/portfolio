// lab.js
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
     }
     setupDomReferences() {
       if (this.carousel) return; // Skip if already set up
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
           gsap.to(poster, { ...animationProps, duration: this.isEntranceAnimation ? 0.6 : 0.8 });
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
       this.carousel.style.opacity = '0'; // 캐러셀 컨테이너를 일단 숨깁니다.

       const entranceOffset = Math.min(6, Math.max(0, Math.floor(this.n / 2) - 1));
       let startCenter = (this.center - entranceOffset + this.n) % this.n;
       this.lastCenter = startCenter;
       this.renderCarousel(startCenter, false);
       this.posters.forEach(poster => gsap.set(poster, { opacity: 0 })); // 개별 포스터를 먼저 숨깁니다.

       gsap.to(this.carousel, { opacity: 1, duration: 0.3, ease: "power2.out" }); // 캐러셀 컨테이너를 페이드인 시킵니다.
       this.posters.forEach((poster, i) => {
         let relToStart = ((i - startCenter + this.n) % this.n + Math.floor(this.n / 2)) % this.n - Math.floor(this.n / 2);
         gsap.to(poster, { opacity: 1, duration: 0.3, delay: Math.abs(relToStart) * 0.05 + 0.2, ease: "power2.out" });
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
           // 캐러셀 진입 애니메이션이 끝나고 최종적으로 배경을 현재 캐러셀 중앙에 맞춰 설정
           if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
           return;
         }
         const initialDelay = 50; // 초기 회전 속도 (작을수록 빠름)
         const finalDelay = 200; // 최종 회전 속도 (클수록 느림)
         const delayIncrement = (finalDelay - initialDelay) / totalSteps; // 단계별 딜레이 증가량
         const rotateFn = () => {
           this.lastCenter = currentAnimatedCenter;
           currentAnimatedCenter = (currentAnimatedCenter + 1) % this.n;
           this.renderCarousel(currentAnimatedCenter, true);
           rotationStep++;
           if (rotationStep < totalSteps) {
             const currentDelay = initialDelay + (rotationStep * delayIncrement); // 현재 단계의 딜레이 계산
             setTimeout(rotateFn, currentDelay);
           } else {
             setTimeout(() => {
               this.lastCenter = currentAnimatedCenter;
               this.center = currentAnimatedCenter;
               this.renderCarousel(this.center, true);
               setTimeout(() => {
                 this.isEntranceAnimation = false;
                 this.lastCenter = this.center;
                 this.setupEvents();
                 // 캐러셀 진입 애니메이션이 끝나고 최종적으로 배경을 현재 캐러셀 중앙에 맞춰 설정
                 if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
               }, 700); // 최종 정착 애니메이션 딜레이는 유지
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
           return;
         }
       }
       this.isMoving = true;
       this.lastCenter = oldActualCenter;
       this.center = targetCenter;
       this.renderCarousel(this.center, true);
       setTimeout(() => {
         this.isMoving = false;
         if (this.pendingMoveQueue.length > 0) {
           const nextMove = this.pendingMoveQueue.shift();
           setTimeout(() => this.moveTo(nextMove.target, nextMove.direction), 50);
         }
       }, 900); // This delay should match the combined animation completion.
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

       // Background image transition settings
       const BACKGROUND_IMAGES_PER_CARD_STEP = 3; // 3 background images per card movement
       const BACKGROUND_TRANSITION_DURATION_PER_IMAGE = 0.1; // Duration for each background image transition (seconds)
       const totalBgImageSteps = steps * BACKGROUND_IMAGES_PER_CARD_STEP;
       const totalBgAnimationDuration = totalBgImageSteps * BACKGROUND_TRANSITION_DURATION_PER_IMAGE;

       // Synchronize carousel and background animation total time
       const animationDuration = Math.max(
         0.5 + (steps * 0.12), // Minimum carousel animation time
         totalBgAnimationDuration // Total time for background animation
       );
       const dummy = { value: oldCenter };
       let lastRenderedBgImageIndex = Math.floor(oldCenter * BACKGROUND_IMAGES_PER_CARD_STEP); // Index for background image rendering

       // Control both carousel and background transitions with a single GSAP timeline
       const combinedTimeline = gsap.timeline({
         onUpdate: () => {
           // Render carousel posters
           const currentCarouselIndexFloat = dummy.value;
           this.renderFastScrollFrame(currentCarouselIndexFloat);

           // Background image transition logic
           const currentBgImageBaseIndex = Math.floor(currentCarouselIndexFloat * BACKGROUND_IMAGES_PER_CARD_STEP);
           const currentBgImageIndex = (currentBgImageBaseIndex % window.appBackgroundChanger.totalImages + window.appBackgroundChanger.totalImages) % window.appBackgroundChanger.totalImages;

           if (window.appBackgroundChanger && currentBgImageIndex !== lastRenderedBgImageIndex) {
             window.appBackgroundChanger._setSingleBackgroundImageForCarousel(currentBgImageIndex, BACKGROUND_TRANSITION_DURATION_PER_IMAGE);
             lastRenderedBgImageIndex = currentBgImageIndex;
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

           const minAngle = 2;
           const maxAngle = 12;
           const maxStepsForAngle = 7;
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
           this.isMoving = false;
         }
       });

       // Add dummy.value animation to the timeline
       combinedTimeline.to(dummy, {
         value: endValue,
         duration: animationDuration,
         ease: "power3.easeInOut"
       }, 0);
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

   // ===== Background Image Slideshow (for carousel section) ===== //
   function initBackgroundSlideshow(onBgIntroAnimationCompleteCallbackGlobal) {
     let onBgIntroCompleteInternalCallback = null;

     const imageBaseUrl = './images/';
     const totalImages = 45; // Total images available
     const introImageCount = 30; // Use 30 images for intro
     let imagePaths = Array.from({ length: totalImages }, (_, i) => `${imageBaseUrl}${i + 1}.jpg`);

     // Create intro image sequence: 15 to 1 (descending), then 1 to 15 (ascending)
     let introImagePaths = [];
     // Part 1: 15 to 1 (slow to less slow)
     for (let i = 15; i >= 1; i--) {
       introImagePaths.push(imagePaths[i - 1]);
     }
     // Part 2: 1 to 15 (less slow to normal)
     for (let i = 1; i <= 15; i++) {
       introImagePaths.push(imagePaths[i - 1]);
     }

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
       finalBgIntroCallback();
       return;
     }

     let preloadAttempted = false;
     let initialAnimationIndex = 0;
     let initialAnimationTimeoutId = null;
     let bgCurrentElement = bgImageA;
     let bgNextElement = bgImageB;
     let currentBgVisualIndexForCarousel = 0;

     // Timing for image transitions
     // Part 1 (15 to 1): Start at 400ms, decrease to 200ms
     // Part 2 (1 to 15): Start at 200ms, decrease to 100ms
     const getTransitionDelay = (index) => {
       if (index < 15) {
         // Part 1: 15 to 1 (slow to less slow)
         const startDelay = 100;
         const endDelay = 100;
         const progress = index / 14; // 0 to 1 over 15 images
         return startDelay - (startDelay - endDelay) * progress;
       } else {
         // Part 2: 1 to 15 (less slow to normal)
         const startDelay = 100;
         const endDelay = 100;
         const progress = (index - 15) / 14; // 0 to 1 over 15 images
         return startDelay - (startDelay - endDelay) * progress;
       }
     };

     function runInitialAnimationInternal() {
       if (initialAnimationIndex >= introImagePaths.length) {
         initialAnimationTimeoutId = null;
         finalBgIntroCallback();
         return;
       }
       const imagePathToLoad = introImagePaths[initialAnimationIndex];
       if (!imagePathToLoad) {
         initialAnimationIndex++;
         initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
         return;
       }

       const imgChecker = new Image();
       imgChecker.onload = () => {
         bgNextElement.src = imagePathToLoad;

         gsap.timeline()
           .to(bgCurrentElement, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0)
           .to(bgNextElement, { opacity: 1.0, duration: 0.5, ease: "power2.out" }, 0)
           .call(() => {
             let temp = bgCurrentElement;
             bgCurrentElement = bgNextElement;
             bgNextElement = temp;
           });

         initialAnimationIndex++;
         initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
       };
       imgChecker.onerror = () => {
         initialAnimationIndex++;
         if (initialAnimationIndex >= introImagePaths.length) {
           finalBgIntroCallback();
         } else {
           initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
         }
       };
       imgChecker.src = imagePathToLoad;
     }

     function triggerPlayVisualIntro(onBgIntroAnimationComplete) {
       if (preloadAttempted) return;
       preloadAttempted = true;

       onBgIntroCompleteInternalCallback = onBgIntroAnimationComplete;

       const firstImagePath = introImagePaths[0];
       const tempImgCheck = new Image();
       tempImgCheck.onload = () => {
         bgCurrentElement.src = firstImagePath;
         gsap.set(bgCurrentElement, { opacity: 1.0 });
         gsap.set(bgNextElement, { opacity: 0 });
         initialAnimationIndex = 1;
         initialAnimationTimeoutId = setTimeout(runInitialAnimationInternal, getTransitionDelay(initialAnimationIndex));
       };
       tempImgCheck.onerror = () => {
         gsap.set(bgImageA, { opacity: 0 });
         gsap.set(bgImageB, { opacity: 0 });
         finalBgIntroCallback();
       };
       tempImgCheck.src = firstImagePath;
     }

     // Image preloading logic
     if (imagePaths.length > 0) {
       let imagesToPreloadCount = imagePaths.length;
       imagePaths.forEach((path) => {
         const img = new Image();
         img.onload = () => {
           imagesToPreloadCount--;
           if (imagesToPreloadCount === 0 && !preloadAttempted) {
             // Wait for preloaderHidden event
           }
         };
         img.onerror = () => {
           imagesToPreloadCount--;
           if (imagesToPreloadCount === 0 && !preloadAttempted) {
             // Wait for preloaderHidden event
           }
         };
         img.src = path;
       });

       setTimeout(() => {
         if (!preloadAttempted) {
           // Fallback if preloading is too slow
         }
       }, 7000);
     } else {
       finalBgIntroCallback();
     }

     function _setSingleBackgroundImageForCarousel(visualIndex, duration = 0.5) {
       const safeVisualIndex = (visualIndex % imagePaths.length + imagePaths.length) % imagePaths.length;
       if (!imagePaths[safeVisualIndex]) {
         return;
       }

       if (initialAnimationTimeoutId) {
         clearTimeout(initialAnimationTimeoutId);
         initialAnimationTimeoutId = null;
       }

       const imgChecker = new Image();
       imgChecker.onload = () => {
         bgNextElement.src = imagePaths[safeVisualIndex];

         gsap.timeline()
           .to(bgCurrentElement, { opacity: 0, duration: duration, ease: "power2.out" }, 0)
           .to(bgNextElement, { opacity: 1.0, duration: duration, ease: "power2.out" }, 0)
           .call(() => {
             let temp = bgCurrentElement;
             bgCurrentElement = bgNextElement;
             bgNextElement = temp;
             currentBgVisualIndexForCarousel = safeVisualIndex;
           });
       };
       imgChecker.onerror = () => {
         // Image load failure handled here
       };
       imgChecker.src = imagePaths[safeVisualIndex];
     }

     function initializeCarouselModeBg(posterIndexOfCarouselCenter) {
       const BACKGROUND_IMAGES_PER_CARD_STEP = 3;
       currentBgVisualIndexForCarousel = (posterIndexOfCarouselCenter * BACKGROUND_IMAGES_PER_CARD_STEP) % totalImages;
       _setSingleBackgroundImageForCarousel(currentBgVisualIndexForCarousel, 0);
     }

     window.appBackgroundChanger = {
       playVisualIntroAnimation: triggerPlayVisualIntro,
       initializeCarouselModeBackground: initializeCarouselModeBg,
       _setSingleBackgroundImageForCarousel: _setSingleBackgroundImageForCarousel,
       totalImages: totalImages
     };
   } // --- End of initBackgroundSlideshow ---

   // ===== New Intro Sequence Manager =====
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

    // Start scroll-down arrow animation
    masterTimeline.to(this.scrollDownArrow, {
      opacity: 0.5,
      y: 0,
      duration: 2.0,
      ease: "power2.out",
    }, "startCountdown+=1.2");

    // Animate 22 fade out
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
} // --- End of IntroSequence ---

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

     if (typeof initBackgroundSlideshow === 'function') {
       initBackgroundSlideshow();
     }

     window.startApplicationVisuals = () => {
       console.log("[hobby.js] startApplicationVisuals: Main content, hero, and background slideshow fade-in");

       const mainElement = document.querySelector('main');
       const carouselHero = document.querySelector('.carousel-hero');
       const backgroundSlideshow = document.getElementById('background-slideshow');

       if (mainElement) {
         gsap.fromTo(mainElement, { opacity: 0, pointerEvents: 'none' }, {
           opacity: 1, duration: 0.8, ease: "power2.out",
           onComplete: () => {
             mainElement.style.pointerEvents = 'auto';
             // console.log("[hobby.js] main content faded in.");
           }
         });
       }
       if (carouselHero) {
         gsap.fromTo(carouselHero, { opacity: 0, pointerEvents: 'none' }, {
           opacity: 1, duration: 0.8, ease: "power2.out",
           onComplete: () => {
             carouselHero.style.pointerEvents = 'auto';
           }
         });
       }

       if (backgroundSlideshow) {
         gsap.fromTo(backgroundSlideshow, { opacity: 0 }, {
           opacity: 0.5, duration: 1.0, ease: "power2.out",
           onComplete: () => {
             // console.log("[hobby.js] Background slideshow container faded in.");
           }
         });
       }

       if (typeof ModernCarousel !== 'undefined') {
         if (!window.modernCarouselInstanceForHobby) {
           window.modernCarouselInstanceForHobby = new ModernCarousel();
           window.modernCarouselInstanceForHobby.setupDomReferences();
           window.modernCarouselInstanceForHobby.setupCategoryJump();
           console.log("[hobby.js] ModernCarousel instance created and DOM references/category jump set up.");
         } else {
           console.log("[hobby.js] ModernCarousel instance already exists.");
         }
       } else {
         console.error("ModernCarousel class is not defined! Cannot initialize main component.");
         return;
       }

       if (window.appBackgroundChanger && typeof window.appBackgroundChanger.playVisualIntroAnimation === 'function') {
         let isCarouselStartTriggered = false;
         console.log("[hobby.js] Calling appBackgroundChanger.playVisualIntroAnimation with callback for carousel start.");
         window.appBackgroundChanger.playVisualIntroAnimation(() => {
           if (isCarouselStartTriggered) return;
           isCarouselStartTriggered = true;
           console.log("[CALLBACK] Background visual intro complete → carousel 등장 애니메이션 시작!");

           if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
             const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
             window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
             console.log(`[hobby.js] Initializing background for carousel center: ${initialCenterIndex}`);
           }

           if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
             window.modernCarouselInstanceForHobby.runCarousel(true);
             console.log("[hobby.js] ModernCarousel entrance animation triggered.");
           } else {
             console.error("ModernCarousel instance or runCarousel method not found!");
           }
         });
       } else {
         console.warn("[hobby.js] appBackgroundChanger.playVisualIntroAnimation not found. Falling back to direct carousel start.");
         if (window.modernCarouselInstanceForHobby && typeof window.modernCarouselInstanceForHobby.runCarousel === 'function') {
           if (window.appBackgroundChanger && typeof window.appBackgroundChanger.initializeCarouselModeBackground === 'function') {
             const initialCenterIndex = window.modernCarouselInstanceForHobby.center;
             window.appBackgroundChanger.initializeCarouselModeBackground(initialCenterIndex);
             console.log(`[hobby.js] Initializing background for carousel center: ${initialCenterIndex} (fallback mode).`);
           }
           window.modernCarouselInstanceForHobby.runCarousel(true);
           console.log("[hobby.js] ModernCarousel entrance animation triggered (fallback).");
         } else {
           console.error("ModernCarousel instance or runCarousel method not found for fallback!");
         }
       }
     };

     document.addEventListener('preloaderHidden', () => {
       // console.log("Received 'preloaderHidden' event. Fading in body and starting intro visuals.");
       gsap.to(document.body, { opacity: 1, duration: 0.5, ease: "power2.out", onComplete: () => {
         const intro = new IntroSequence();
         intro.start();
       }});
     });

     window.addEventListener('load', () => {
       // 여기에 다른 window.load 관련 로직이 있다면 추가
     });
   });
}