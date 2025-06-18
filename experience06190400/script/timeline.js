
// timeline.js

// DOM 요소들을 전역에서 접근할 수 있도록 선언
let timelineTitles = [];
let timelineContents = [];
let sectionRow;

// 모든 동적으로 생성되는 ScrollTrigger 인스턴스를 저장하기 위한 배열.
// 이는 재렌더링 시 기존 ScrollTrigger들을 올바르게 "kill"하여 중복 및 오작동을 방지하는 데 필수적입니다.
let allDynamicScrollTriggers = [];

/**
 * 활성화된 타임라인 섹션을 렌더링하고 DOM 요소를 재정렬합니다.
 * @param {number} activeIdx - 활성화할 섹션의 인덱스.
 */
function renderTimelineSection(activeIdx) {
    // sectionRow가 아직 초기화되지 않았다면, DOM에서 찾아서 초기화합니다.
    if (!sectionRow) {
        sectionRow = document.getElementById('sectionRow');
        if (!sectionRow) {
            console.error("Error: 'sectionRow' element not found. Cannot render timeline sections.");
            return;
        }
    }

    // titles와 contents 배열이 비어있다면, HTML에서 초기화합니다.
    // 이 초기화는 DOMContentLoaded 시점에 한 번만 일어나야 하지만, 안전을 위해 함수 시작 시에도 확인합니다.
    if (timelineTitles.length === 0 || timelineContents.length === 0) {
        document.querySelectorAll('.section-title').forEach(titleElement => {
            timelineTitles.push(titleElement);
        });
        document.querySelectorAll('.section-content-area').forEach(contentElement => {
            timelineContents.push(contentElement);
        });
        console.log("DEBUG: Initialized timelineTitles and timelineContents arrays within renderTimelineSection (secondary init check).");
    }

    // 기존의 모든 ScrollTrigger 인스턴스들을 "kill"하여 중복을 방지합니다.
    // 이는 섹션 전환 또는 창 크기 조정 시 매우 중요합니다.
    allDynamicScrollTriggers.forEach(st => st.kill());
    allDynamicScrollTriggers = [];
    console.log("DEBUG: Killed all previous dynamic ScrollTriggers.");

    // sectionRow의 모든 자식 DOM 요소들을 제거하여 재정렬을 준비합니다.
    while (sectionRow.firstChild) {
        sectionRow.removeChild(sectionRow.firstChild);
    }
    console.log("DEBUG: Cleared sectionRow DOM children.");

    // 모든 섹션 타이틀에서 'active' 클래스를 제거합니다.
    timelineTitles.forEach(t => t.classList.remove('active'));
    console.log("DEBUG: Removed 'active' class from all titles.");

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        console.log("DEBUG: Applying mobile layout logic.");
        // 모바일 레이아웃: 모든 타이틀을 순서대로 추가하고, 활성화된 타이틀 뒤에 활성화된 콘텐츠를 추가합니다.
        for (let i = 0; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            const titleText = timelineTitles[i].querySelector('.section-title-text');
            if (titleText) {
                // 모바일에서는 GSAP 제어를 리셋하고 CSS가 제어하도록 합니다.
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
        // 데스크톱 레이아웃: 콘텐츠와 타이틀을 동적으로 순서를 정하여 배치합니다.
        // 순서: [활성화 섹션 이전의 타이틀들] -> [활성화된 콘텐츠] -> [활성화된 타이틀] -> [활성화 섹션 이후의 타이틀들]

        // 활성화 섹션 이전에 있는 타이틀들을 추가합니다.
        for (let i = 0; i < activeIdx; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.opacity = '0'; // 해당 콘텐츠는 숨깁니다.
            timelineContents[i].style.display = 'none';
            console.log(`DEBUG: Desktop - Appended title ${i} (before active).`);
        }

        // 활성화된 콘텐츠 영역을 추가합니다.
        timelineContents[activeIdx].style.opacity = '1';
        timelineContents[activeIdx].style.display = 'flex';
        sectionRow.appendChild(timelineContents[activeIdx]);
        console.log(`DEBUG: Desktop - Appended active content for section ${activeIdx}.`);

        // 활성화된 타이틀 요소를 추가하고 'active' 클래스를 적용합니다.
        timelineTitles[activeIdx].classList.add('active');
        sectionRow.appendChild(timelineTitles[activeIdx]);
        console.log(`DEBUG: Desktop - Appended active title ${activeIdx} and marked active.`);

        // 활성화 섹션 이후에 있는 타이틀들을 추가합니다.
        for (let i = activeIdx + 1; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.opacity = '0'; // 해당 콘텐츠는 숨깁니다.
            timelineContents[i].style.display = 'none';
            console.log(`DEBUG: Desktop - Appended title ${i} (after active).`);
        }

        // --- 데스크톱 전용: 모든 섹션 타이틀 텍스트에 대한 ScrollTrigger 설정 ---
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

    // --- 활성화된 섹션에 대한 콘텐츠 애니메이션 (메인 타이틀 문구, 설명, 카드) ---
    const currentActiveContentArea = timelineContents[activeIdx];
    const mainTitleElement = currentActiveContentArea.querySelector('.main-title');
    const phraseSpans = mainTitleElement ? mainTitleElement.querySelectorAll('.phrase span span') : [];
    const descriptionP = currentActiveContentArea.querySelector('.main-section-header .sub-description');
    const timelineCards = currentActiveContentArea.querySelectorAll(".item-container.timeline-card");

    // **중요: 애니메이션을 재생하기 전에 애니메이션의 초기 상태를 명시적으로 설정합니다.**
    // 이렇게 해야 애니메이션이 항상 일관된 시작점에서 시작합니다.
    console.log("DEBUG: Setting initial states for active section content animations.");
    gsap.set(phraseSpans, { y: '100%', opacity: 0 });
    if (descriptionP) {
        gsap.set(descriptionP, { opacity: 0, y: '50px' });
    }
    gsap.set(timelineCards, { opacity: 0, y: 50 });


    // 메인 타이틀 문구 애니메이션
    console.log("DEBUG: Playing phrase animation for active section.");
    gsap.to(phraseSpans, {
        y: 0,
        opacity: 1,
        stagger: 0.01,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => console.log("DEBUG: Phrase animation complete for active section.")
    });

    // 설명 문단 애니메이션 - 이 애니메이션은 명시적으로 재생되어야 합니다.
    if (descriptionP) {
        console.log("DEBUG: Playing description animation for active section.");
        gsap.to(descriptionP, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            delay: 0.5, // 문구 애니메이션 시작 후 약간의 지연을 줍니다.
            onComplete: () => console.log("DEBUG: Description animation complete for active section.")
        });
    } else {
        console.warn("DEBUG: sub-description element not found for animation in active section.");
    }

    // 활성화된 콘텐츠 영역 내의 타임라인 카드 ScrollTrigger 애니메이션
    timelineCards.forEach((card, index) => {
        const cardST = ScrollTrigger.create({
            trigger: card,
            start: "top 90%", // 카드가 뷰포트에 90% 들어왔을 때 시작합니다.
            toggleActions: "play none none reverse", // 스크롤 시 재생, 뒤로 스크롤 시 되감기.
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