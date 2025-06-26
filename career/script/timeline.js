// timeline.js (리사이즈 및 메뉴 이동 문제 모두 해결된 최종 버전)

// 전역 변수 선언
let timelineTitles = [];
let timelineContents = [];
let sectionRow;
let allDynamicScrollTriggers = [];
let prevIsMobile = window.matchMedia('(max-width: 768px)').matches;

/**
 * 활성 타임라인 섹션을 렌더링하고 DOM 요소를 재정렬합니다.
 * @param {number} activeIdx - 활성화할 섹션의 인덱스.
 */
function renderTimelineSection(activeIdx) {
    if (!sectionRow) {
        sectionRow = document.getElementById('sectionRow');
        if (!sectionRow) {
            console.error("Error: 'sectionRow' element not found.");
            return;
        }
    }

    if (timelineTitles.length === 0) {
        document.querySelectorAll('.section-title').forEach(el => timelineTitles.push(el));
        document.querySelectorAll('.section-content-area').forEach(el => timelineContents.push(el));
    }

    // --- [메뉴 이동 문제 해결] ---
    // 렌더링 시작 전, 모든 콘텐츠 영역의 잔류 스타일을 초기화하여 깨끗한 상태에서 시작.
    // 이것이 메뉴 이동 시 레이아웃이 깨지는 것을 방지합니다.
    timelineContents.forEach(el => {
        el.style.display = '';
        el.style.opacity = '';
        el.style.height = '';
        el.style.minHeight = '';
    });
    console.log("DEBUG: All content areas styles reset before rendering.");
    // ---

    allDynamicScrollTriggers.forEach(st => st.kill());
    allDynamicScrollTriggers = [];

    while (sectionRow.firstChild) {
        sectionRow.removeChild(sectionRow.firstChild);
    }

    timelineTitles.forEach(t => t.classList.remove('active'));

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        // 모바일 레이아웃 로직
        for (let i = 0; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            const titleText = timelineTitles[i].querySelector('.section-title-text');
            if (titleText) {
                gsap.set(titleText, { clearProps: "all" }); // GSAP 스타일 완전 초기화
            }

            if (i === activeIdx) {
                timelineTitles[i].classList.add('active');
                timelineContents[i].style.display = 'flex';
                timelineContents[i].style.opacity = '1';
                sectionRow.appendChild(timelineContents[i]);
            } else {
                timelineContents[i].style.display = 'none';
            }
        }
    } else {
        // 데스크탑 레이아웃 로직
        for (let i = 0; i < activeIdx; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.display = 'none';
        }

        timelineContents[activeIdx].style.display = 'flex';
        timelineContents[activeIdx].style.opacity = '1';
        sectionRow.appendChild(timelineContents[activeIdx]);

        timelineTitles[activeIdx].classList.add('active');
        sectionRow.appendChild(timelineTitles[activeIdx]);

        for (let i = activeIdx + 1; i < timelineTitles.length; i++) {
            sectionRow.appendChild(timelineTitles[i]);
            timelineContents[i].style.display = 'none';
        }
        
        // 데스크탑 타이틀 스크롤 애니메이션
        setupDesktopTitleAnimations();
    }

    // 활성 콘텐츠 내부 요소 애니메이션
    setupActiveContentAnimations(activeIdx);
}

/**
 * 데스크탑 뷰에서 타이틀 스크롤 애니메이션을 설정합니다.
 */
function setupDesktopTitleAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    const allTitleTexts = [];
    timelineTitles.forEach(titleElement => {
        const titleText = titleElement.querySelector('.section-title-text');
        if (titleText) {
            const parentColHeight = titleElement.offsetHeight;
            const textVisualHeight = titleText.offsetWidth;
            const paddingTop = parseFloat(window.getComputedStyle(titleElement).paddingTop);
            const maxUpwardTranslation = -(parentColHeight - paddingTop - textVisualHeight);
            const startY = maxUpwardTranslation * 0.8;
            gsap.set(titleText, { y: startY });
            allTitleTexts.push({ element: titleText, endY: 0 });
        }
    });

    if (allTitleTexts.length > 0 && timelineContents[0]) {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: timelineContents[0],
                scroller: window,
                start: "top 90%",
                endTrigger: sectionRow,
                end: "bottom top",
                scrub: true,
            }
        });
        allTitleTexts.forEach(item => tl.to(item.element, { y: item.endY, ease: "none" }, 0));
        allDynamicScrollTriggers.push(tl.scrollTrigger);
    }
}

/**
 * 활성 콘텐츠 내부의 요소(타이틀, 설명, 카드)에 대한 애니메이션을 설정합니다.
 * @param {number} activeIdx - 활성화된 섹션의 인덱스.
 */
function setupActiveContentAnimations(activeIdx) {
    const contentArea = timelineContents[activeIdx];
    if (!contentArea) return;

    const mainTitle = contentArea.querySelector('.main-title');
    const phraseSpans = mainTitle ? mainTitle.querySelectorAll('.phrase span span') : [];
    const description = contentArea.querySelector('.main-section-header .sub-description');
    const cards = contentArea.querySelectorAll(".item-container.timeline-card");

    gsap.set(phraseSpans, { y: '100%', opacity: 0 });
    gsap.set(description, { opacity: 0, y: '50px' });
    gsap.set(cards, { opacity: 0, y: 50 });

    gsap.to(phraseSpans, { y: 0, opacity: 1, stagger: 0.01, duration: 0.5, ease: 'power2.out' });
    if (description) {
        gsap.to(description, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.4 });
    }

    cards.forEach(card => {
        const st = ScrollTrigger.create({
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none reverse",
            animation: gsap.to(card, { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" }),
        });
        allDynamicScrollTriggers.push(st);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (!window.gsap || !window.ScrollTrigger) {
        console.error("GSAP or ScrollTrigger not loaded.");
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    renderTimelineSection(0); // 초기 렌더링

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const handleResize = () => {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile !== prevIsMobile) {
            console.log("DEBUG: Breakpoint changed. Forcing re-render.");
            prevIsMobile = isMobile;
            renderTimelineSection(timelineTitles.findIndex(t => t.classList.contains('active')));
        }
    };

    window.addEventListener('resize', debounce(handleResize, 200));

    timelineTitles.forEach((title, i) => {
        title.addEventListener('click', () => {
            if (title.classList.contains('active')) return;
            renderTimelineSection(i);
        });
    });
});