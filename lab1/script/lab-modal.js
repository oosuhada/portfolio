(function() {
    // Mapping of poster data-num to pure-css index.html files
    const posterToFileMap = {
        '01': 'pure-css/animation-art/024-waves/index.html',
        '02': 'pure-css/animation-art/036-solar-eclipse/index.html',
        '03': 'pure-css/animation-art/050-newtons-cradle/index.html',
        '04': 'pure-css/animation-art/083-a-ball-climbing-the-stairs/index.html',
        '05': 'pure-css/animation-art/093-lightning-cable/index.html',
        '06': 'pure-css/animation-art/094-polaroid-camera/index.html',
        '07': 'pure-css/animation-art/119-draught-beer/index.html',
        '08': 'pure-css/animation-art/122-apple-photos-icon/index.html',
        '09': 'pure-css/animation-art/124-origami-cranes/index.html',
        '10': 'pure-css/button-effect/001-button-text-staggered-sliding-effects/index.html',
        '11': 'pure-css/button-effect/009-aimed-button-effects/index.html',
        '12': 'pure-css/button-effect/037-stroke-animation-button-effect/index.html',
        '13': 'pure-css/interactive-art/041-pencil/index.html',
        '14': 'pure-css/interactive-art/076-hey-take-it-easy/index.html',
        '15': 'pure-css/loading-effect/065-swaying-loader/index.html'
    };

    // Function to show the modal, now global
    window.appShowModal = function(poster, carouselInstance) {
        const idx = carouselInstance.posters.indexOf(poster);
        const bgColor = getComputedStyle(poster).backgroundColor;
        const num = poster.dataset.num || '??';

        // Get the file path from the mapping
        const filePath = posterToFileMap[num] || 'pure-css/pure-css-index.html'; // Fallback to a default page

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
                                const modalIframe = modal.querySelector('.modal-iframe');
                                if (modal && modalCard && modalBg && modalIframe) {
                                    // Set the iframe source
                                    modalIframe.src = filePath;
                                    modalCard.style.background = '#fff'; // Ensure a neutral background
                                    modal.style.display = 'flex';
                                    modalBg.classList.add('active');

                                    const closeHandler = (e) => {
                                        if (e.target.classList.contains('modal-x') || e.target.classList.contains('modal-bg')) {
                                            e.stopPropagation();
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
        const modalIframe = modal.querySelector('.modal-iframe');
        if (modal && modalBg && modalBg.classList.contains('active')) {
            // Remove event listeners using the stored references
            if (modal._closeHandler) modal.removeEventListener('click', modal._closeHandler);
            if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
            delete modal._closeHandler;
            delete modal._keyHandler;

            // Clear the iframe src to stop loading content
            if (modalIframe) modalIframe.src = '';

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