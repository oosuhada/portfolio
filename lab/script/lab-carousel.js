// lab-carousel.js
(function() {
  class ModernCarousel {
    constructor() {
      this.carousel = null; this.posters = []; this.labels = null;
      this.n = 0; this.center = 0; this.lastCenter = 0;
      this.backgroundImageIndex = 0; // 배경 이미지 인덱스 추적용 프로퍼티
      this.maxVisible = 6;
      this.isEntranceAnimation = false;
      this.isEntranceAnimationComplete = false; // 이 플래그가 핵심입니다.
      this.isMoving = false; this.pendingMoveQueue = []; this.isDragging = false;
      this.startX = 0; this.startTouchX = 0; this.dragThreshold = 50;
      this.animParams = {
        R: 550, verticalOffset: 190, cardAngle: 28, scaleStep: 0.085,
        angleStep: 26, curveRadius: 700, labelVerticalOffset: 250
      };
    }

    setupDomReferences() {
      this.carousel = document.querySelector('.carousel');
      this.labels = document.querySelector('.carousel-labels');
      this.posters = Array.from(this.carousel?.querySelectorAll('.poster') || []);
      this.n = this.posters.length;
      if (this.n > 0) {
        this.center = 0;
        this.lastCenter = 0;
      } else {
        this.center = 0;
        this.lastCenter = 0;
      }
    }

    tryFadeOverlay(poster) {
      if (poster.classList.contains('entrance-complete') && poster.dataset.iframeLoaded === 'true') {
        const overlay = poster.querySelector('.poster-paper-overlay');
        if (overlay && overlay.style.opacity !== '0') {
          gsap.to(overlay, {
            opacity: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onComplete: () => {
              overlay.style.pointerEvents = 'none';
            }
          });
        }
      }
    }

    loadIframeForPoster(poster) {
      if (!poster || poster.dataset.iframeLoaded === 'true') {
        return;
      }
      const path = poster.dataset.path;
      const previewContainer = poster.querySelector('.poster-preview-container');
      if (!path || !previewContainer) return;
      const iframe = document.createElement('iframe');
      iframe.className = 'poster-iframe';
      iframe.onload = () => {
        poster.dataset.iframeLoaded = 'true';
        gsap.to(iframe, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        this.tryFadeOverlay(poster);
      };
      iframe.onerror = () => { console.error(`[Carousel] Failed to load iframe content for: ${path}`); };
      iframe.src = path;
      iframe.setAttribute('scrolling', 'no');
      previewContainer.appendChild(iframe);
    }

    checkAndLoadVisibleIframes(centerIdx) {
      const halfVisible = Math.floor(this.maxVisible / 2);
      for (let i = -halfVisible; i <= halfVisible; i++) {
        const posterIndex = (centerIdx + i + this.n) % this.n;
        if (this.posters[posterIndex]) {
            this.loadIframeForPoster(this.posters[posterIndex]);
        }
      }
    }

    renderLabels(centerIdx, visibleCount = 5) {
      if (!this.labels) return;
      this.labels.innerHTML = '';
      const half = Math.floor(visibleCount / 2);
      const { angleStep, curveRadius, labelVerticalOffset } = this.animParams;
      for (let i = 0; i < this.n; i++) {
        let rel = ((i - centerIdx + this.n + Math.floor(this.n / 2)) % this.n) - Math.floor(this.n / 2);
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
      if (!this.isEntranceAnimation || this.isEntranceAnimationComplete) {
        this.checkAndLoadVisibleIframes(centerIdx);
      }
      this.posters.forEach((poster, i) => {
        let rel = ((i - centerIdx + this.n + Math.floor(this.n / 2)) % this.n) - Math.floor(this.n / 2);
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
      this.setupDomReferences();
      if (isFirst && !this.isEntranceAnimationComplete) {
          this.isEntranceAnimation = true;
          this.playEntranceAnimation();
      } else {
          this.isEntranceAnimation = false;
          this.renderCarousel(this.center, false);
          this.isEntranceAnimationComplete = true;
          this.posters.forEach(poster => {
              poster.classList.add('entrance-complete');
              this.tryFadeOverlay(poster);
          });
          this.setupEvents();
      }
    }

    playEntranceAnimation() {
      if (this.isEntranceAnimationComplete) {
          console.warn("[Carousel] Entrance animation already completed. Skipping re-run.");
          return;
      }
      if (this.n === 0 || !this.carousel) {
        console.warn("[Carousel] No posters to animate for entrance. Skipping.");
        this.isEntranceAnimation = false;
        this.isEntranceAnimationComplete = true; // 중요: 애니메이션 없어도 완료 처리
        this.setupEvents();
        return;
      }
      this.carousel.style.opacity = '0';
      const entranceOffset = Math.min(6, Math.max(0, Math.floor(this.n / 2) - 1));
      let startCenter = (this.center - entranceOffset + this.n) % this.n;
      this.lastCenter = startCenter;
      this.renderCarousel(startCenter, false);
      this.posters.forEach(poster => gsap.set(poster, { opacity: 0 })); // Ensure posters are initially hidden for this entrance animation
      gsap.to(this.carousel, { opacity: 1, duration: 0.3, ease: "power2.out" });
      this.posters.forEach((poster, i) => {
        let relToStart = ((i - startCenter + this.n + Math.floor(this.n / 2)) % this.n) - Math.floor(this.n / 2);
        gsap.to(poster, { opacity: 1, duration: 0.3, delay: Math.abs(relToStart) * 0.05 + 0.2, ease: "power2.out" });
      });

      setTimeout(() => {
        let currentAnimatedCenter = startCenter;
        let rotationStep = 0;
        const totalSteps = (this.center - startCenter + this.n) % this.n;
        if (totalSteps === 0) {
          this.renderCarousel(this.center, false);
          this.isEntranceAnimation = false;
          this.isEntranceAnimationComplete = true;
          this.lastCenter = this.center;
          this.posters.forEach(poster => {
              poster.classList.add('entrance-complete');
              this.tryFadeOverlay(poster);
          });
          this.setupEvents();
          this.checkAndLoadVisibleIframes(this.center);
          if (window.appBackgroundChanger && window.appBackgroundChanger.totalImages > 0) {
              this.backgroundImageIndex = (this.center * 3) % window.appBackgroundChanger.totalImages;
              window.appBackgroundChanger.initializeCarouselModeBackground(this.backgroundImageIndex);
          }
          // *** 핵심 수정 부분 2: 캐러셀 준비 완료 후, 카테고리 점프 섹션을 애니메이션으로 표시 (totalSteps === 0 경우) ***
          gsap.to('.carousel-category-jump', {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              delay: 0.3 // 캐러셀이 안정된 후 0.3초 뒤에 나타납니다.
          });
          return;
        }

        const initialDelay = 50;
        const finalDelay = 200;
        const delayIncrement = (finalDelay - initialDelay) / totalSteps;
        const rotateFn = () => {
          this.lastCenter = currentAnimatedCenter;
          currentAnimatedCenter = (currentAnimatedCenter + 1) % this.n;
          this.renderCarousel(currentAnimatedCenter, true);
          rotationStep++;
          if (rotationStep < totalSteps) {
            const currentDelay = initialDelay + (rotationStep * delayIncrement);
            setTimeout(rotateFn, currentDelay);
          } else {
            setTimeout(() => {
              this.lastCenter = currentAnimatedCenter;
              this.center = currentAnimatedCenter;
              this.renderCarousel(this.center, true);
              setTimeout(() => {
                // 모든 애니메이션의 맨 마지막에 상태를 최종 확정합니다.
                this.isEntranceAnimation = false;
                this.isEntranceAnimationComplete = true;
                this.lastCenter = this.center;
                if (window.appBackgroundChanger && window.appBackgroundChanger.totalImages > 0) {
                    this.backgroundImageIndex = (this.center * 3) % window.appBackgroundChanger.totalImages;
                } else {
                    this.backgroundImageIndex = 0;
                }
                this.posters.forEach(poster => {
                    poster.classList.add('entrance-complete');
                    this.tryFadeOverlay(poster);
                });
                this.setupEvents();
                this.checkAndLoadVisibleIframes(this.center);
                if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.backgroundImageIndex);

                // *** 핵심 수정 부분 2: 캐러셀 준비 완료 후, 카테고리 점프 섹션을 애니메이션으로 표시 (일반적인 경우) ***
                gsap.to('.carousel-category-jump', {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    delay: 0.3 // 캐러셀이 안정된 후 0.3초 뒤에 나타납니다.
                });

              }, 700);
            }, 150);
          }
        };
        rotateFn();
      }, 800);
    }

    moveTo(newCenter, userDirection = null) {
      if (!this.isEntranceAnimationComplete) return; // 안전장치 1

      const targetCenter = (newCenter + this.n) % this.n;
      const oldActualCenter = this.center;
      if (this.isMoving || oldActualCenter === targetCenter) return;

      this.isMoving = true;
      this.lastCenter = oldActualCenter;
      this.center = targetCenter;

      if (userDirection && window.appBackgroundChanger && window.appBackgroundChanger.totalImages > 0) {
        const totalImages = window.appBackgroundChanger.totalImages;
        this.backgroundImageIndex = (this.backgroundImageIndex + (userDirection * 3) + totalImages) % totalImages;
        window.appBackgroundChanger._setSingleBackgroundImageForCarousel(this.backgroundImageIndex, 0.8);
      }

      this.renderCarousel(this.center, true);
      setTimeout(() => { this.isMoving = false; }, 900);
    }

    setupEvents() {
      if (!this.carousel) return;
      if (this._wheelHandler) this.carousel.removeEventListener('wheel', this._wheelHandler);
      if (this._mouseDownHandler) this.carousel.removeEventListener('mousedown', this._mouseDownHandler);
      document.removeEventListener('mousemove', this._mouseMoveHandler);
      document.removeEventListener('mouseup', this._mouseUpHandler);
      if (this._touchStartHandler) this.carousel.removeEventListener('touchstart', this._touchStartHandler);
      if (this._touchEndHandler) this.carousel.removeEventListener('touchend', this._touchEndHandler);

      this.posters = Array.from(this.carousel.querySelectorAll('.poster'));

      this._wheelHandler = (e) => { e.preventDefault(); if (this.isMoving) return; this.moveTo(this.center + (e.deltaY > 0 ? 1 : -1), e.deltaY > 0 ? 1 : -1); };
      this.carousel.addEventListener('wheel', this._wheelHandler, { passive: false });

      this._mouseDownHandler = (e) => { e.preventDefault(); this.isDragging = true; this.startX = e.pageX; this.carousel.style.cursor = 'grabbing'; };
      this.carousel.addEventListener('mousedown', this._mouseDownHandler);

      this._mouseMoveHandler = (e) => { if (!this.isDragging) return; e.preventDefault(); };
      document.addEventListener('mousemove', this._mouseMoveHandler);

      this._mouseUpHandler = (e) => {
        if (!this.isDragging) return;
        const deltaX = e.pageX - this.startX;
        this.carousel.style.cursor = 'grab';
        this.isDragging = false;
        if (Math.abs(deltaX) > this.dragThreshold) { this.moveTo(this.center + (deltaX > 0 ? -1 : 1), deltaX > 0 ? -1 : 1); }
      };
      document.addEventListener('mouseup', this._mouseUpHandler);

      this._touchStartHandler = (e) => { this.startTouchX = e.touches[0].pageX; };
      this.carousel.addEventListener('touchstart', this._touchStartHandler, { passive: true });

      this._touchEndHandler = (e) => {
        const endTouchX = e.changedTouches[0].pageX;
        const deltaX = endTouchX - this.startTouchX;
        if (Math.abs(deltaX) > this.dragThreshold) { this.moveTo(this.center + (deltaX > 0 ? -1 : 1), deltaX > 0 ? -1 : 1); }
      };
      this.carousel.addEventListener('touchend', this._touchEndHandler, { passive: true });

      this.posters.forEach((poster, idx) => {
        if(poster._carouselClickHandler) poster.removeEventListener('click', poster._carouselClickHandler);
        poster._carouselClickHandler = () => {
          if (this.isMoving) return;
          if (idx === this.center) {
            if (typeof window.appShowModal === 'function') {
              window.appShowModal(poster, idx);
            }
          } else {
            this.performFastScroll(idx);
          }
        };
        poster.addEventListener('click', poster._carouselClickHandler);
      });
      this.carousel.style.cursor = 'grab';
    }

    setupCategoryJump() {
      const jumpButtons = document.querySelectorAll('.category-jump-btn');
      jumpButtons.forEach(button => {
        if (button._categoryJumpHandler) button.removeEventListener('click', button._categoryJumpHandler);
        button._categoryJumpHandler = () => {
          const category = button.dataset.category;
          if (!category) return;
          const targetIndex = window.projectList.findIndex(p => p.category === category);
          if (targetIndex !== -1 && targetIndex !== this.center) {
            this.performFastScroll(targetIndex);
          }
        };
        button.addEventListener('click', button._categoryJumpHandler);
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
      const jumpItems = document.querySelectorAll('.carousel-category-jump .category-jump-item');
      jumpItems.forEach(item => {
        const button = item.querySelector('.category-jump-btn');
        const label = item.querySelector('.category-jump-label');
        const isActive = button && button.dataset.category === currentCategory;
        item.classList.toggle('active', isActive);
        if (button) button.classList.toggle('active', isActive);
        if (label) label.classList.toggle('active', isActive);
      });
    }

    renderFastScrollFrame(currentCenterFloat) {
      const fastScrollVisibleRange = 7;
      this.posters.forEach((poster, i) => {
        let rel = i - currentCenterFloat;
        if (Math.abs(rel) > this.n / 2) {
          rel = rel < 0 ? rel + this.n : rel - this.n;
        }
        const distance = Math.abs(rel);
        if (distance > fastScrollVisibleRange) {
          gsap.set(poster, { opacity: 0 });
          return;
        }
        const blur = Math.min(8, Math.pow(distance, 2) * 0.5);
        const opacity = Math.max(0, 1 - (distance / fastScrollVisibleRange));
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

    // =================================================================
    // *** 핵심 수정 부분 ***
    // =================================================================
    performFastScroll(targetCenter) {
      if (!this.isEntranceAnimationComplete) return; // 안전장치 2
      if (this.isMoving) return;

      this.isMoving = true;
      this.loadIframeForPoster(this.posters[targetCenter]);
      const oldCenter = this.center;
      const startImageIndex = this.backgroundImageIndex;
      const totalImages = window.appBackgroundChanger?.totalImages || 0;

      const distForward = (targetCenter - oldCenter + this.n) % this.n;
      const distBackward = (oldCenter - targetCenter + this.n) % this.n;

      const isForward = distForward <= distBackward;
      const steps = isForward ? distForward : distBackward;
      const direction = isForward ? 1 : -1;

      const endValue = oldCenter + (steps * direction);
      const animationDuration = Math.max(0.5, steps * 0.1);
      const dummy = { value: oldCenter };
      let lastRenderedBgIndex = startImageIndex;

      // GSAP 타임라인 시작
      const combinedTimeline = gsap.timeline({
        onUpdate: () => {
          this.renderFastScrollFrame(dummy.value);

          if (window.appBackgroundChanger && totalImages > 0) {
            const postersMoved = dummy.value - oldCenter;
            const currentBgImageIndex = Math.round(startImageIndex + (postersMoved * 3));

            if (currentBgImageIndex !== lastRenderedBgIndex) {
              const wrappedIndex = (currentBgImageIndex % totalImages + totalImages) % totalImages;
              window.appBackgroundChanger._setSingleBackgroundImageForCarousel(wrappedIndex, 0.2);
              lastRenderedBgIndex = currentBgImageIndex;
            }
          }
        },
        onComplete: () => {
          this.center = targetCenter;
          const postersMovedTotal = endValue - oldCenter;
          if (totalImages > 0) {
            this.backgroundImageIndex = (startImageIndex + (postersMovedTotal * 3) % totalImages + totalImages) % totalImages;
          }

          this.updateActiveCategoryButton(this.center);
          if (this.labels) this.renderLabels(this.center, 5);
          this.checkAndLoadVisibleIframes(this.center);

          // 도착 애니메이션 (생략되지 않음)
          const targetPoster = this.posters[this.center];
          const { R, verticalOffset, cardAngle, scaleStep } = this.animParams;
          this.posters.forEach((poster, i) => {
            if (i === this.center) return;
            let rel = ((i - this.center + this.n + Math.floor(this.n / 2)) % this.n) - Math.floor(this.n / 2);
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

          const finalX = 0, finalY = verticalOffset - (R * 0.38), finalRotation = 0, finalScale = 1, finalZ = 1000, finalOpacity = 1;
          const minAngle = 2, maxAngle = 12, maxStepsForAngle = 7;
          const angleMultiplier = Math.min(1, (steps - 1) / (maxStepsForAngle - 1));
          const dynamicTiltAngle = minAngle + (maxAngle - minAngle) * angleMultiplier;
          const maxDurationOut = 0.6, minDurationOut = 0.25;
          const dynamicDurationOut = minDurationOut + (maxDurationOut - minDurationOut) * angleMultiplier;
          const maxDurationIn = 0.4, minDurationIn = 0.15;
          const dynamicDurationIn = minDurationIn + (maxDurationIn - minDurationIn) * angleMultiplier;
          const overshootX = finalX + (15 * -direction);
          const overshootRotation = 0 + (dynamicTiltAngle * -direction);

          gsap.timeline()
            .to(targetPoster, { x: overshootX, rotation: overshootRotation, ease: "circ.out", duration: dynamicDurationOut }, 0)
            .to(targetPoster, { y: finalY, scale: finalScale, zIndex: finalZ, opacity: finalOpacity, filter: 'blur(0px)', ease: "power2.out", duration: 0.5, delay: 0.05 }, 0)
            .to(targetPoster, { x: finalX, rotation: finalRotation, ease: "power1.inOut", duration: dynamicDurationIn }, `>`);

          this.isMoving = false;
        }
      });

      combinedTimeline.to(dummy, {
        value: endValue,
        duration: animationDuration,
        ease: "power2.inOut" // 부드러운 Easing으로 변경
      }, 0);
    }
  }
  window.ModernCarousel = ModernCarousel;
})();
