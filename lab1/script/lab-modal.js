// lab-modal.js
(function() {
    // Function to show the modal, now global
    window.appShowModal = function(poster, carouselInstance) {
        const idx = carouselInstance.posters.indexOf(poster);
        const bgColor = getComputedStyle(poster).backgroundColor;
        const title = poster.dataset.title || poster.textContent;

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
                                    modalCard.innerHTML = `ISSUE ${poster.dataset.num || '??'}<br>${title}<div class="modal-x" style="position:absolute;right:28px;top:18px;font-size:2.1rem;cursor:pointer;">×</div>`;
                                    modalCard.style.background = bgColor;
                                    modalCard.style.color = getComputedStyle(poster).color;
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