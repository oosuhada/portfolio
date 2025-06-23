// lab-modal.js
(function() {
    // 1. 포스터와 데모 파일 매핑 (매우 중요!)
    // 여기에 poster의 data-num과 pure-css 폴더 내 실제 데모 파일 경로를 1:1로 매핑합니다.
    window.posterDemoMap = {
      1: 'pure-css/animation-art/024-waves/index.html',
      2: 'pure-css/animation-art/036-solar-eclipse/index.html',
      3: 'pure-css/animation-art/050-newtons-cradle/index.html',
      4: 'pure-css/animation-art/083-a-ball-climbing-the-stairs/index.html',
      5: 'pure-css/interactive-art/041-pencil/index.html',
      6: 'pure-css/interactive-art/076-hey-take-it-easy/index.html',
      7: 'pure-css/interactive-art/131-scissors/index.html',
      8: 'pure-css/interactive-art/145-power-switch/index.html',
      9: 'pure-css/button-effect/001-button-text-staggered-sliding-effects/index.html',
      10: 'pure-css/button-effect/009-aimed-button-effects/index.html',
      11: 'pure-css/button-effect/037-stroke-animation-button-effect/index.html',
      12: 'pure-css/button-effect/072-bubble-coloring-button/index.html',
      13: 'pure-css/button-effect/112-button-hover-effect/index.html',
      14: 'pure-css/text-effect/022-stripy-rainbow-text-effects/index.html',
      15: 'pure-css/text-effect/033-milk-text-effect/index.html',
      // 필요에 따라 더 많은 매핑을 추가하세요.
    };

    // Function to show the modal, now global
    window.appShowModal = function(poster, carouselInstance) {
        const idx = carouselInstance.posters.indexOf(poster);
        const bgColor = getComputedStyle(poster).backgroundColor;
        const title = poster.dataset.title || poster.textContent;

        // 매핑 테이블에서 데모 URL 가져오기
        const demoUrl = window.posterDemoMap[poster.dataset.num];

        carouselInstance.posters.forEach((p, i) => {
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
                                    // 2. 모달에 iframe으로 데모 띄우기 (JS 수정)
                                    modalCard.innerHTML = `
                                        <div class="modal-x" style="position:absolute;right:28px;top:18px;font-size:2.1rem;cursor:pointer;">×</div>
                                        <div style="margin-bottom:1.1rem;font-size:1.4rem;font-weight:bold;color:inherit;">ISSUE ${poster.dataset.num || '??'}<br>${title}</div>
                                        <div class="modal-iframe-wrapper">
                                            ${
                                              demoUrl
                                                ? `<iframe src="${demoUrl}" frameborder="0" style="width:100%;height:320px;border-radius:18px;background:#222;" loading="lazy" allowfullscreen></iframe>`
                                                : `<div style="color:#c22;margin-top:2.5rem;text-align:center;">No demo available for this poster.</div>`
                                            }
                                        </div>
                                    `;
                                    modalCard.style.background = bgColor;
                                    modalCard.style.color = getComputedStyle(poster).color; // 포스터의 텍스트 색상을 모달에도 적용
                                    modal.style.display = 'flex';
                                    modalBg.classList.add('active');

                                    const closeHandler = (e) => {
                                        if (e.target.classList.contains('modal-x') || e.target.classList.contains('modal-bg')) {
                                            e.stopPropagation();
                                            // Call the global closeModal function
                                            window.appCloseModal(carouselInstance);
                                        }
                                    };
                                    const keyHandler = (e) => { if (e.key === 'Escape') window.appCloseModal(carouselInstance); };

                                    modal.addEventListener('click', closeHandler);
                                    document.addEventListener('keydown', keyHandler);
                                    // Store handlers for later removal
                                    modal._closeHandler = closeHandler;
                                    modal._keyHandler = keyHandler;
                                }
                            }
                        });
                    }
                });
            }
        });
    };

    // Function to close the modal, now global
    window.appCloseModal = function(carouselInstance) {
        const modal = document.getElementById('card-modal');
        const modalBg = modal.querySelector('.modal-bg');
        if (modal && modalBg && modalBg.classList.contains('active')) {
            // Remove event listeners using the stored references
            if (modal._closeHandler) modal.removeEventListener('click', modal._closeHandler);
            if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
            delete modal._closeHandler;
            delete modal._keyHandler;

            modalBg.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                // Call restoreCarousel on the provided carousel instance
                if (carouselInstance && typeof carouselInstance.restoreCarousel === 'function') {
                    carouselInstance.restoreCarousel();
                } else {
                    console.error("Carousel instance or restoreCarousel method not found for modal close!");
                }
            }, 650);
        }
    };
})();