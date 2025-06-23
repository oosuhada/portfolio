(function() {
window.appShowModal = function(poster, carouselInstance) {
const idx = carouselInstance.posters.indexOf(poster);
const bgColor = getComputedStyle(poster).backgroundColor;
const title = poster.dataset.title || poster.textContent;
const num = poster.dataset.num || '??';
const path = poster.dataset.path;

if (!path) {
console.error("Project path (data-path) not found on poster element.");
return;
}

carouselInstance.posters.forEach((p, i) => {
if (i !== idx) {
gsap.to(p, {
opacity: 0, scale: 0.7, duration: 0.28 + i * 0.05,
delay: i * 0.04, x: (i < idx ? -70 : 70), ease: "power2.in"
});
}
});

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
modalCard.innerHTML = `
  <div class="modal-header">
    <span>ISSUE ${num} | ${title}</span>
    <div class="modal-x" title="Close">×</div>
  </div>
  <div class="modal-content">
    <iframe 
      src="${path}" 
      title="${title}" 
      frameborder="0" 
      onerror="this.parentElement.innerHTML = '<div style=\\'padding: 2rem; text-align: center;\\'>Error: Failed to load project.</div>';"
    ></iframe>
  </div>
`;

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

window.appCloseModal = function(carouselInstance) {
const modal = document.getElementById('card-modal');
const modalBg = modal.querySelector('.modal-bg');
if (modal && modalBg && modalBg.classList.contains('active')) {
if (modal._closeHandler) modal.removeEventListener('click', modal._closeHandler);
if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
delete modal._closeHandler;
delete modal._keyHandler;

modalBg.classList.remove('active');
setTimeout(() => {
modal.style.display = 'none';
if (carouselInstance && typeof carouselInstance.restoreCarousel === 'function') {
carouselInstance.restoreCarousel();
} else {
console.error("Carousel instance or restoreCarousel method not found for modal close!");
}
}, 650); 
}
};
})();