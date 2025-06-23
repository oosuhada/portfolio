(function() {
class ModernCarousel {
constructor() {
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
if (this.carousel) return; 
this.carousel = document.querySelector('.carousel');
this.labels = document.querySelector('.carousel-labels');
this.posters = Array.from(this.carousel?.querySelectorAll('.poster') || []);
this.n = this.posters.length;
if (this.n > 0) {
this.center = 0;
this.lastCenter = 0;
} else { this.center = 0; this.lastCenter = 0; }
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
this.carousel.style.opacity = '0';

const entranceOffset = Math.min(6, Math.max(0, Math.floor(this.n / 2) - 1));
let startCenter = (this.center - entranceOffset + this.n) % this.n;
this.lastCenter = startCenter;
this.renderCarousel(startCenter, false);
this.posters.forEach(poster => gsap.set(poster, { opacity: 0 }));

gsap.to(this.carousel, { opacity: 1, duration: 0.3, ease: "power2.out" });
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
if (window.appBackgroundChanger) window.appBackgroundChanger.initializeCarouselModeBackground(this.center);
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
return;
}
}
this.isMoving = true;
this.lastCenter = oldActualCenter;
this.center = targetCenter;

if (window.appBackgroundChanger) {
window.appBackgroundChanger._setSingleBackgroundImageForCarousel(this.center, 0.8);
}

this.renderCarousel(this.center, true);

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
if (typeof window.appShowModal === 'function') {
window.appShowModal(poster, this);
} else {
console.error("window.appShowModal is not defined!");
}
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

const BACKGROUND_TRANSITION_DURATION_PER_CARD = 0.1;
const animationDuration = Math.max(0.5, steps * BACKGROUND_TRANSITION_DURATION_PER_CARD);
const dummy = { value: oldCenter };
let lastRenderedBgImageIndex = oldCenter;

const combinedTimeline = gsap.timeline({
onUpdate: () => {
const currentCarouselIndexFloat = dummy.value;
this.renderFastScrollFrame(currentCarouselIndexFloat);

const currentBgImageIndex = Math.round(currentCarouselIndexFloat);
if (window.appBackgroundChanger && currentBgImageIndex !== lastRenderedBgImageIndex) {
window.appBackgroundChanger._setSingleBackgroundImageForCarousel(currentBgImageIndex, 0.2);
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

combinedTimeline.to(dummy, {
value: endValue,
duration: animationDuration,
ease: "power3.easeInOut"
}, 0);
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
} 

window.ModernCarousel = ModernCarousel;
})();