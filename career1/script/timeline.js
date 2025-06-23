// timeline.js

// Declare DOM elements for global access
let timelineTitles = [];
let timelineContents = [];
let sectionRow;

// Array to store all dynamically created ScrollTrigger instances.
// This is crucial for correctly killing existing ScrollTriggers during re-rendering
// to prevent duplicates and malfunctions.
let allDynamicScrollTriggers = [];

/**
 * Renders the active timeline section and reorders DOM elements.
 * @param {number} activeIdx - The index of the section to activate.
 */
function renderTimelineSection(activeIdx) {
    // If sectionRow is not yet initialized, find and initialize it from the DOM.
    if (!sectionRow) {
        sectionRow = document.getElementById('sectionRow');
        if (!sectionRow) {
            console.error("Error: 'sectionRow' element not found. Cannot render timeline sections.");
            return;
        }
    }

    // If titles and contents arrays are empty, initialize them from HTML.
    // This initialization should ideally happen once on DOMContentLoaded, but
    // a check is included here for safety at the start of the function.
    if (timelineTitles.length === 0 || timelineContents.length === 0) {
        document.querySelectorAll('.section-title').forEach(titleElement => {
            timelineTitles.push(titleElement);
        });
        document.querySelectorAll('.section-content-area').forEach(contentElement => {
            timelineContents.push(contentElement);
        });
        console.log("DEBUG: Initialized timelineTitles and timelineContents arrays within renderTimelineSection (secondary init check).");
    }

    // "Kill" all existing ScrollTrigger instances to prevent duplication.
    // This is very important during section transitions or window resizing.
    allDynamicScrollTriggers.forEach(st => st.kill());
    allDynamicScrollTriggers = [];
    console.log("DEBUG: Killed all previous dynamic ScrollTriggers.");

    // Remove all child DOM elements from sectionRow to prepare for reordering.
    while (sectionRow.firstChild) {
        sectionRow.removeChild(sectionRow.firstChild);
    }
    console.log("DEBUG: Cleared sectionRow DOM children.");

    // Remove the 'active' class from all section titles.
    timelineTitles.forEach(t => t.classList.remove('active'));
    console.log("DEBUG: Removed 'active' class from all titles.");

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        console.log("DEBUG: Applying mobile layout logic.");
        // Mobile layout: Add all titles in order, then add the active content after the active title.
        for (let i = 0; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            const titleText = timelineTitles[i].querySelector('.section-title-text');
            if (titleText) {
                // For mobile, reset GSAP control to let CSS take over.
                gsap.set(titleText, { left: 'auto', top: 'auto', bottom: 'auto', position: 'static', margin: 0, x: 0, y: 0, translateY: 0, scale: 1 });
                console.log(`DEBUG: Mobile - Resetting position for titleText ${i} to static.`);
            }

            if (i === activeIdx) {
                timelineTitles[i].classList.add('active');
                timelineContents[i].style.opacity = '1';
                timelineContents[i].style.display = 'flex';
                sectionRow.appendChild(timelineContents[i]);
                console.log(`DEBUG: Mobile - Activated section ${i} and appended its content.`);
            } else {
                timelineContents[i].style.opacity = '0';
                timelineContents[i].style.display = 'none';
                console.log(`DEBUG: Mobile - Hid inactive content for section ${i}.`);
            }
        }
    } else {
        console.log("DEBUG: Applying desktop layout logic.");
        // Desktop layout: Dynamically order content and titles.
        // Order: [Titles before active section] -> [Active Content] -> [Active Title] -> [Titles after active section]

        // Add titles before the active section.
        for (let i = 0; i < activeIdx; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.opacity = '0'; // Hide corresponding content.
            timelineContents[i].style.display = 'none';
            console.log(`DEBUG: Desktop - Appended title ${i} (before active).`);
        }

        // Add the active content area.
        timelineContents[activeIdx].style.opacity = '1';
        timelineContents[activeIdx].style.display = 'flex';
        sectionRow.appendChild(timelineContents[activeIdx]);
        console.log(`DEBUG: Desktop - Appended active content for section ${activeIdx}.`);

        // Add the active title element and apply the 'active' class.
        timelineTitles[activeIdx].classList.add('active');
        sectionRow.appendChild(timelineTitles[activeIdx]);
        console.log(`DEBUG: Desktop - Appended active title ${activeIdx} and marked active.`);

        // Add titles after the active section.
        for (let i = activeIdx + 1; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.opacity = '0'; // Hide corresponding content.
            timelineContents[i].style.display = 'none';
            console.log(`DEBUG: Desktop - Appended title ${i} (after active).`);
        }

        // --- Desktop only: ScrollTrigger setup for all section title texts ---
        if (window.gsap && window.ScrollTrigger) {
            console.log("DEBUG: Setting up ScrollTriggers for ALL section title texts on desktop.");

            const allTitleTexts = [];
            const titleMovementBounds = []; // Store calculated movement bounds for each title

            timelineTitles.forEach((titleElement, idx) => {
                const titleText = titleElement.querySelector('.section-title-text');
                if (titleText) {
                    allTitleTexts.push(titleText);

                    // Ensure CSS is set for positioning before getting dimensions
                    // For vertical-rl, offsetWidth is visual height, offsetHeight is visual width.
                    // Assuming .section-title-text has 'bottom: 0' and its parent has 'position: relative'.
                    const parentColHeight = titleElement.offsetHeight; // The height of the parent .section-title
                    const textVisualHeight = titleText.offsetWidth; // The visual height of the text (in vertical-rl)

                    // The top padding of the .section-title element.
                    // Get computed style for accurate padding values.
                    const computedStyle = window.getComputedStyle(titleElement);
                    const paddingTop = parseFloat(computedStyle.paddingTop);
                    const paddingBottom = parseFloat(computedStyle.paddingBottom);

                    // Max upward movement from bottom:0 (negative translateY) before hitting top padding
                    const maxUpwardTranslation = -(parentColHeight - paddingTop - textVisualHeight);

                    // Max downward movement from bottom:0 (positive translateY) before hitting bottom padding
                    // If bottom:0 is the lowest, then maxDownwardTranslation is 0.
                    // If you want it to go slightly beyond bottom:0 but still within the parent,
                    // you could allow a small positive value, e.g., paddingBottom.
                    const maxDownwardTranslation = 0; // Keeping it simple: 0 means it stops at bottom:0.

                    // Define the range of motion for this specific title text.
                    // startTranslateY: Where the text should be when ScrollTrigger starts (e.g., further up)
                    // endTranslateY: Where the text should be when ScrollTrigger ends (e.g., at bottom:0 or slightly below)
                    // We want it to start higher up, so it comes down into view.
                    // Let's make the start point relative to its max allowed upward movement.
                    // For example, start at 80% of its max upward translation range.
                    const startY = maxUpwardTranslation * 0.8; // Adjust this multiplier (e.g., 0.5 to 1.0)
                    // We want it to end at or slightly below its natural bottom:0 position.
                    // A small positive value could make it go slightly beyond bottom:0, but still within parent.
                    const endY = maxDownwardTranslation; // Sticking to 0 for ending at bottom:0

                    titleMovementBounds.push({
                        titleText: titleText,
                        minTranslateY: maxUpwardTranslation, // The absolute highest (most negative translateY) it can go
                        maxTranslateY: maxDownwardTranslation, // The absolute lowest (most positive translateY) it can go
                        initialTranslateY: startY, // The translateY when the animation starts
                        finalTranslateY: endY // The translateY when the animation ends
                    });

                    // Set initial position immediately with GSAP to prevent FOUC
                    gsap.set(titleText, { translateY: startY });
                    console.log(`DEBUG: Initial GSAP set for titleText ${idx} to translateY: ${startY.toFixed(2)}px.`);
                }
            });

            if (allTitleTexts.length > 0) {
                const mainContentArea = timelineContents[0]; // Using the first content area as the trigger basis
                if (mainContentArea) {
                    // Create a single GSAP timeline for all title texts
                    const tl = gsap.timeline({ paused: true });

                    allTitleTexts.forEach((titleText, idx) => {
                        const bounds = titleMovementBounds.find(b => b.titleText === titleText);
                        if (bounds) {
                            // Add a tween for each title to the main timeline.
                            // The '0' for position ensures all these tweens start at the same time
                            // within this main timeline, ensuring synchronized movement.
                            tl.to(titleText, {
                                translateY: bounds.finalTranslateY,
                                duration: 1, // Duration within the GSAP timeline (will be stretched by ScrollTrigger)
                                ease: "none"
                            }, 0); // Start all these tweens at the very beginning of 'tl'
                        }
                    });

                    // Now, link this GSAP timeline to ScrollTrigger
                    const st = ScrollTrigger.create({
                        trigger: mainContentArea,
                        scroller: window,
                        start: "top 90%", // Starts when the top of mainContentArea is 90% down from viewport top
                        endTrigger: sectionRow,
                        end: "bottom top", // Ends when the bottom of sectionRow hits the top of the viewport
                        scrub: true, // Smoothly link animation to scroll position
                        animation: tl, // Associate the GSAP timeline directly with ScrollTrigger
                        // markers: true // For debugging: shows start/end markers
                    });
                    allDynamicScrollTriggers.push(st);
                    console.log(`DEBUG: Main ScrollTrigger created for all title texts, linked to a single GSAP timeline.`);

                } else {
                    console.warn("DEBUG: First content area not found. Cannot create main title text ScrollTrigger.");
                }
            } else {
                console.warn("DEBUG: No title texts found for ScrollTrigger animation.");
            }
        } else {
            console.warn("DEBUG: GSAP or ScrollTrigger not loaded for all title text animations on desktop.");
        }
    }

    // --- Content animations for the active section (main title phrase, description, cards) ---
    const currentActiveContentArea = timelineContents[activeIdx];
    const mainTitleElement = currentActiveContentArea.querySelector('.main-title');
    const phraseSpans = mainTitleElement ? mainTitleElement.querySelectorAll('.phrase span span') : [];
    const descriptionP = currentActiveContentArea.querySelector('.main-section-header .sub-description');
    const timelineCards = currentActiveContentArea.querySelectorAll(".item-container.timeline-card");

    // **Important: Explicitly set the initial state of animations before playing them.**
    // This ensures that animations always start from a consistent point.
    console.log("DEBUG: Setting initial states for active section content animations.");
    gsap.set(phraseSpans, { y: '100%', opacity: 0 });
    if (descriptionP) {
        gsap.set(descriptionP, { opacity: 0, y: '50px' });
    }
    gsap.set(timelineCards, { opacity: 0, y: 50 });


    // Main title phrase animation
    console.log("DEBUG: Playing phrase animation for active section.");
    gsap.to(phraseSpans, {
        y: 0,
        opacity: 1,
        stagger: 0.01,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => console.log("DEBUG: Phrase animation complete for active section.")
    });

    // Description paragraph animation - This animation must be explicitly played.
    if (descriptionP) {
        console.log("DEBUG: Playing description animation for active section.");
        gsap.to(descriptionP, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            delay: 0.5, // Give a slight delay after the phrase animation starts.
            onComplete: () => console.log("DEBUG: Description animation complete for active section.")
        });
    } else {
        console.warn("DEBUG: sub-description element not found for animation in active section.");
    }

    // ScrollTrigger animation for timeline cards within the active content area
    timelineCards.forEach((card, index) => {
        const cardST = ScrollTrigger.create({
            trigger: card,
            start: "top 90%", // Starts when the card is 90% into the viewport.
            toggleActions: "play none none reverse", // Play on scroll down, reverse on scroll back up.
            scroller: window,
            animation: gsap.to(card, { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" }),
            onEnter: () => console.log(`DEBUG: Card ${index} entered view for active section.`),
            onLeaveBack: () => console.log(`DEBUG: Card ${index} left view (scrolling back) for active section.`)
        });
        allDynamicScrollTriggers.push(cardST);
    });
    console.log("DEBUG: Card ScrollTriggers created for active section.");
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        console.log("DEBUG: GSAP and ScrollTrigger registered.");
    } else {
        console.error("DEBUG: GSAP or ScrollTrigger not loaded. Please check your script imports.");
    }

    sectionRow = document.getElementById('sectionRow');
    document.querySelectorAll('.section-title').forEach(titleElement => {
        timelineTitles.push(titleElement);
    });
    document.querySelectorAll('.section-content-area').forEach(contentElement => {
        timelineContents.push(contentElement);
    });
    console.log("DEBUG: DOM elements (titles and contents) initialized.");

    timelineTitles.forEach((t, i) => {
        t.addEventListener('click', () => {
            if (t.classList.contains('active')) {
                console.log(`DEBUG: Clicked already active tab ${i}. Ignoring.`);
                return;
            }
            console.log(`DEBUG: Tab ${i} clicked. Calling renderTimelineSection.`);
            renderTimelineSection(i);
        });
    });

    console.log("DEBUG: Initial render of section 0.");
    renderTimelineSection(0);

    window.addEventListener('resize', () => {
        console.log("DEBUG: Window resized. Re-rendering current section.");
        let currentActiveIdx = 0;
        timelineTitles.forEach((t, i) => {
            if (t.classList.contains('active')) {
                currentActiveIdx = i;
            }
        });
        ScrollTrigger.refresh();
        renderTimelineSection(currentActiveIdx);
    });

    window.timelineComponent = {
        titles: timelineTitles,
        contents: timelineContents,
        renderSection: renderTimelineSection
    };
    console.log("DEBUG: timelineComponent exposed globally.");
});