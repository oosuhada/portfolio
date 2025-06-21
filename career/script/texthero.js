// texthero.js

const listItemWrapper = document.getElementById("list-item-wrapper");
const listItems = document.querySelectorAll(".list-item");
// panel1Img is not used, can be removed if not needed.
// const panel1Img = document.getElementById("panel1-img"); // This line can be removed if panel1Img is truly unused
const grapeImg = document.getElementById("grape-img");
const skillsShowcaseSection = document.getElementById("skills-showcase-section");

let listStyleChangeStartY;
let listStyleChangeEndY;
let division;
let currentIndex = -1;

// Flag to control if texthero animations are active
let isTextheroAnimationActive = true;
let animationFrameId = null; // To store the requestAnimationFrame ID

// Define keyframes for grape image animation: "Right position -> Slightly rotated center -> Right position"
const GRAPE_KEYFRAMES = {
    // Initial right position (minimal rotation)
    P0_DEFAULT_RIGHT: { x: 80, y: -13, r: 2 },
    // Center position (slightly left rotation)
    P1_VISIBLE_CENTER: { x: -24, y: 0, r: -5 }
};

const updateListStyleVariables = () => {
    if (!listItemWrapper || !listItems.length || !skillsShowcaseSection) return;

    const startActivationOffsetRatio = 0.8;
    listStyleChangeStartY = skillsShowcaseSection.offsetTop - (window.innerHeight * (1 - startActivationOffsetRatio));
    listStyleChangeStartY = Math.max(0, listStyleChangeStartY);

    const endActivationOffsetRatio = 0.2;
    // FIX: Changed 'skillsShowbox' to 'skillsShowcaseSection'
    listStyleChangeEndY = skillsShowcaseSection.offsetTop + skillsShowcaseSection.offsetHeight - (window.innerHeight * endActivationOffsetRatio);

    // Avoid division by zero: if listItems.length is 1, division would be by 0.
    // If listItems.length <= 1, division should simply be the total scroll range.
    division = (listStyleChangeEndY - listStyleChangeStartY) / Math.max(1, listItems.length - 1);
    if (division <= 0) division = 1; // Fallback to 1 if division is still problematic

    console.log(`DEBUG texthero: listStyleChangeStartY: ${listStyleChangeStartY}, listStyleChangeEndY: ${listStyleChangeEndY}, division: ${division}`);
};

const easeInOut = (t) => t * t * (3 - 2 * t);

const handleScrollAnimation = () => {
    // Check if animation is active at the start of the handler
    if (!isTextheroAnimationActive) {
        // If deactivated, ensure grape image is reset to default right position
        if (grapeImg) grapeImg.style.transform = `translate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x}px, ${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y}px) rotate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r}deg)`;
        cancelAnimationFrame(animationFrameId); // Stop the animation loop
        animationFrameId = null; // Reset the ID
        return;
    }

    const currentScrollY = window.scrollY;

    const sectionRect = skillsShowcaseSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const isSectionVisible = (sectionRect.bottom > 0 && sectionRect.top < viewportHeight);

    if (!isSectionVisible) {
        // If the section is out of the viewport (above or below)
        // The grape should be in its initial right position
        if (grapeImg) grapeImg.style.transform = `translate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x}px, ${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y}px) rotate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r}deg)`;
        // Ensure no item is highlighted
        const currentOn = document.getElementById("on");
        if (currentOn) currentOn.removeAttribute("id");
        currentIndex = -1; // Reset current index
    } else {
        const activationZoneTop = listStyleChangeStartY;
        const activationZoneBottom = listStyleChangeEndY;

        let targetIndex = -1; // Default to no item highlighted

        if (currentScrollY <= activationZoneTop) {
            targetIndex = 0; // Highlight the first item when at or above the activation start
        } else if (currentScrollY >= activationZoneBottom) {
            targetIndex = listItems.length - 1; // Highlight the last item when at or below the activation end
        } else {
            // Within the activation zone: list item animation
            let progress = (currentScrollY - activationZoneTop) / (activationZoneBottom - activationZoneTop);
            progress = Math.max(0, Math.min(1, progress));
            const easedProgress = easeInOut(progress); // Overall section progress (0 to 1)

            targetIndex = Math.round(easedProgress * (listItems.length - 1));
            targetIndex = Math.max(0, Math.min(listItems.length - 1, targetIndex));
        }

        // Apply highlight immediately if targetIndex changes
        if (targetIndex !== currentIndex) {
            const currentOn = document.getElementById("on");
            if (currentOn) currentOn.removeAttribute("id");

            if (targetIndex !== -1 && listItems[targetIndex]) {
                listItems[targetIndex].id = "on";
            }
            currentIndex = targetIndex;
            console.log(`DEBUG texthero: Setting item ${currentIndex} to 'on'.`);
        }

        // Adjust grape animation to progress from the start to the end of the section
        // This part should only execute when the section is visible and within the activation zone.
        if (currentScrollY > activationZoneTop && currentScrollY < activationZoneBottom) {
            let grapeCurrentProgress = (currentScrollY - activationZoneTop) / (activationZoneBottom - activationZoneTop);
            grapeCurrentProgress = Math.max(0, Math.min(1, grapeCurrentProgress)); // Clamp to between 0 and 1
            const easedGrapeProgress = easeInOut(grapeCurrentProgress); // Use eased progress for the grape

            let currentGrapeX, currentGrapeY, currentGrapeR;

            // First half of adjusted grapeCurrentProgress (0 ~ 0.5): animate from right position to slightly rotated center
            if (easedGrapeProgress < 0.5) {
                const segmentProgress = easedGrapeProgress * 2; // Normalize progress for this segment from 0 to 1
                currentGrapeX = GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x + (GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.x - GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x) * segmentProgress;
                currentGrapeY = GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y + (GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.y - GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y) * segmentProgress;
                currentGrapeR = GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r + (GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.r - GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r) * segmentProgress;
            }
            // Second half of adjusted grapeCurrentProgress (0.5 ~ 1): animate from slightly rotated center back to right position
            else {
                const segmentProgress = (easedGrapeProgress - 0.5) * 2; // Normalize progress for this segment from 0 to 1
                currentGrapeX = GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.x + (GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x - GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.x) * segmentProgress;
                currentGrapeY = GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.y + (GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y - GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.y) * segmentProgress;
                currentGrapeR = GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.r + (GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r - GRAPE_KEYFRAMES.P1_VISIBLE_CENTER.r) * segmentProgress;
            }

            grapeImg.style.transform = `translate(${currentGrapeX.toFixed(2)}px, ${currentGrapeY.toFixed(2)}px) rotate(${currentGrapeR.toFixed(2)}deg)`;
        } else {
            // If outside the grape's active animation zone but section is visible, keep it to the right
            if (grapeImg) grapeImg.style.transform = `translate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x}px, ${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y}px) rotate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r}deg)`;
        }
    }

    animationFrameId = requestAnimationFrame(handleScrollAnimation);
};

window.addEventListener("scroll", () => {
    // Only run handleScrollAnimation if active
    if (isTextheroAnimationActive) {
        if (!animationFrameId) { // Prevent multiple requests for the same frame
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

window.addEventListener('load', () => {
    updateListStyleVariables();
    // Only run handleScrollAnimation if active on load
    if (isTextheroAnimationActive) {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

// Expose control methods globally for other scripts (e.g., experience.js)
window.textheroComponent = {
    deactivateScrollAnimation: () => {
        isTextheroAnimationActive = false;
        cancelAnimationFrame(animationFrameId); // Stop the animation loop
        animationFrameId = null; // Reset the ID
        // Reset grape image position when deactivated
        if (grapeImg) grapeImg.style.transform = `translate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.x}px, ${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.y}px) rotate(${GRAPE_KEYFRAMES.P0_DEFAULT_RIGHT.r}deg)`;
        console.log("DEBUG texthero: Deactivated scroll animations.");
    },
    activateScrollAnimation: () => {
        isTextheroAnimationActive = true;
        console.log("DEBUG texthero: Activated scroll animations.");
        if (!animationFrameId) { // Start only if not already running
            animationFrameId = requestAnimationFrame(handleScrollAnimation); // Immediately run to set current state based on scroll
        }
    }
};