document.addEventListener('DOMContentLoaded', () => {
    // GSAP 및 ScrollTrigger 로드 확인
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error('GSAP or ScrollTrigger is not loaded.');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const skillsInkBlotView = document.getElementById('skills-sortable'); // 기존 잉크 블롭 컨테이너
    const skillsIconView = document.getElementById('skills-icon-view');   // 새 아이콘 뷰 컨테이너
    const toggleButton = document.getElementById('skills-toggle');        // 뷰 전환 버튼 (섹션 제목)
    const toggleDescription = document.getElementById('skills-toggle-description'); // 설명 텍스트 요소

    let isIconViewActive = false; // 현재 아이콘 뷰가 활성화되어 있는지 여부
    let sortableInstance = null; // Sortable 인스턴스를 저장할 변수

    // 꾹 누르기 관련 상태 변수들
    const PRESS_DURATION = 800; // 0.8초로 단축, 테스트 해보세요.
    let pressTimer = null;
    let isJiggleModeActive = false;
    let clickBlockedByLongPress = false; // 롱프레스가 성공하면 이어지는 클릭을 막기 위한 플래그

    // Sortable 초기화 (잉크 블롭 뷰에서만 활성화)
    if (skillsInkBlotView) {
        sortableInstance = Sortable.create(skillsInkBlotView, {
            animation: 250,
            ghostClass: 'drag-ghost',
            chosenClass: 'drag-chosen',
            dragClass: 'drag-dragging',
            direction: 'horizontal',
            forceFallback: true, // 터치 기기에서도 드래그 가능하게
            handle: '.skill-ink-blot', // 잉크 블롭 영역에서만 드래그 가능
            disabled: true, // 기본적으로 비활성화
        });
    }

    // 재정렬 모드를 활성화하는 함수
    function enableJiggleMode() {
        if (isJiggleModeActive) return; // 이미 활성화되어 있으면 중복 방지

        // 아이콘 뷰에서는 재정렬 모드 진입 불가
        if (isIconViewActive) return;

        isJiggleModeActive = true;
        clickBlockedByLongPress = true; // 롱프레스가 성공했으므로 다음 클릭은 막음

        // Sortable 활성화
        if (sortableInstance) {
            sortableInstance.option('disabled', false);
        }

        // 카드 흔들림 애니메이션 추가
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.add('is-jiggling');
            // 재정렬 모드 진입 시 열려있는 카드 모두 닫기
            if (card.classList.contains('expanded')) {
                collapseCard(card);
            }
        });
        console.log('Jiggle mode enabled!'); // 디버깅
    }

    // 재정렬 모드를 비활성화하는 함수
    function disableJiggleMode() {
        if (!isJiggleModeActive) return; // 이미 비활성화되어 있으면 중복 방지
        isJiggleModeActive = false;

        // Sortable 비활성화
        if (sortableInstance) {
            sortableInstance.option('disabled', true);
        }

        // 카드 흔들림 애니메이션 제거
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.remove('is-jiggling');
        });
        console.log('Jiggle mode disabled!'); // 디버깅
    }

    const skillCards = document.querySelectorAll('.skill-card'); // 잉크 블롭 뷰의 스킬 카드들

    // 잉크 블롭 모양을 위한 클래스 배열 (CSS와 일치해야 함)
    const cardSpecificClosedShapes = ['strengths-closed-shape', 'uxui-closed-shape', 'frontend-closed-shape', 'tools-closed-shape'];
    const cardSpecificOpenedShapes = ['strengths-opened-shape', 'uxui-opened-shape', 'frontend-opened-shape', 'tools-opened-shape'];
    const fixedOpacityClass = 'ink-opacity-high'; // CSS에 정의된 opacity 클래스
    const fixedFilterID = 'classicWetInk'; // CSS에 정의된 SVG 필터 ID

    // 확장된 카드 스타일 (각 카드 유형에 따라 다를 수 있음)
    const expandedCardStyles = [
        { inkBlotHeight: '460px', contentLeft: '-1.2rem', contentTop: '-10px' },
        { inkBlotHeight: '460px', contentLeft: '-1.7rem', contentTop: '0px' },
        { inkBlotHeight: '460px', contentLeft: '-1.7rem', contentTop: '20px' },
        { inkBlotHeight: '460px', contentLeft: '-1.2rem', contentTop: '10px' }
    ];

    skillCards.forEach((card, index) => {
        card.dataset.originalIndex = index; // 원래 인덱스 저장

        const inkBlot = card.querySelector('.skill-ink-blot');
        const inkShape = card.querySelector('.skill-ink-shape');
        const initialContent = card.querySelector('.skill-initial-content');
        const expandedContent = card.querySelector('.skill-expanded-content');

        // 초기 잉크 블롭 모양 설정
        if (inkShape) {
            // 모든 shape 클래스를 제거하고 현재 카드의 닫힌 모양 클래스를 추가
            [...cardSpecificClosedShapes, ...cardSpecificOpenedShapes,
             'closed-blot-shape-1', 'closed-blot-shape-2', 'closed-blot-shape-3', 'closed-blot-shape-4',
             'opened-blot-shape-1', 'opened-blot-shape-2', 'opened-blot-shape-3', 'opened-blot-shape-4'
            ].forEach(cls => inkShape.classList.remove(cls));

            const closedShapeClass = cardSpecificClosedShapes[index % cardSpecificClosedShapes.length];
            const openedShapeClass = cardSpecificOpenedShapes[index % cardSpecificOpenedShapes.length];

            if (closedShapeClass) {
                inkShape.classList.add(closedShapeClass);
                card.dataset.closedShape = closedShapeClass; // 데이터셋에 저장
            }
            if (openedShapeClass) {
                card.dataset.openedShape = openedShapeClass; // 데이터셋에 저장
            }

            // 고정된 투명도 클래스 및 필터 적용
            ['ink-opacity-low', 'ink-opacity-medium', 'ink-opacity-high'].forEach(cls => inkShape.classList.remove(cls));
            inkShape.classList.add(fixedOpacityClass);
            inkShape.style.filter = `url(#${fixedFilterID})`;
            inkShape.style.removeProperty('--hover-rotate'); // 필요한 경우 제거
        }

        // 확장된 콘텐츠 초기 숨김 설정
        if (expandedContent) {
            gsap.set(expandedContent, { display: 'none', opacity: 0 });
        }

        // 잉크 블롭 클릭 이벤트 리스너
        if (inkBlot) {
            // mousedown (꾹 누르기 시작)
            inkBlot.addEventListener('mousedown', (e) => {
                if (isIconViewActive || isJiggleModeActive) {
                    clearTimeout(pressTimer);
                    return;
                }
                clickBlockedByLongPress = false; // mousedown 시작 시 플래그 초기화
                pressTimer = setTimeout(enableJiggleMode, PRESS_DURATION);
            });

            // mouseup (꾹 누르기 종료 또는 클릭)
            inkBlot.addEventListener('mouseup', () => {
                clearTimeout(pressTimer); // 타이머 클리어
            });

            // mouseleave (꾹 누르기 중 마우스 이탈)
            inkBlot.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer); // 타이머 클리어
            });

            // click 이벤트 (확장/축소 처리)
            inkBlot.addEventListener('click', (e) => {
                if (clickBlockedByLongPress) {
                    clickBlockedByLongPress = false; // 한 번 사용 후 플래그 초기화
                    return;
                }

                // 아이콘 뷰이거나, 재정렬 모드인 경우 잉크 블롭 클릭 기능 비활성화
                if (isIconViewActive || isJiggleModeActive) {
                    return;
                }

                // 이미 확장된 상태에서 세부 목록 클릭 시 확장 해제 방지
                if (card.classList.contains('expanded') && e.target.closest('.skill-details-list')) {
                    return;
                }
                // Sortable 라이브러리의 드래그 중인 요소나 고스트 요소 클릭 방지
                if (e.target.closest('.sortable-ghost') || e.target.closest('.sortable-chosen') || card.classList.contains('drag-dragging')) {
                    return;
                }

                // 카드 확장 전 잉크 스플래시 효과 생성
                if (!card.classList.contains('expanded')) {
                    createInkSplash(inkBlot);
                }
                handleSkillCardInteraction(card); // 카드 확장/축소 처리
            });
        }
    });

    // 문서 전체 클릭 리스너 (확장된 카드 외부 클릭 시 닫기 또는 재정렬 모드 해제)
    document.addEventListener('click', function(e) {
        if (isJiggleModeActive && !e.target.closest('#skills-sortable')) {
            setTimeout(() => {
                disableJiggleMode();
            }, 0); // 0ms 지연으로 다음 이벤트 루프 틱에서 실행
            return; // 모드 해제 후 추가 동작 방지
        }

        // 아이콘 뷰 모드일 때는 잉크 블롭 카드 확장/축소 로직을 스킵
        if (isIconViewActive) {
             return;
        }

        const expandedCards = document.querySelectorAll('.skill-card.expanded');
        if (expandedCards.length === 0) return; // 확장된 카드가 없으면 종료

        // 클릭이 확장된 카드 내부에서 발생했는지 확인
        const clickInsideAnExpandedCard = Array.from(expandedCards).some(card => card.contains(e.target));

        // 확장된 카드 내부를 클릭했다면 카드를 닫지 않음
        if (clickInsideAnExpandedCard) {
            return;
        }

        // 그 외의 경우, 모든 확장된 카드를 닫기
        expandedCards.forEach(card => {
            collapseCard(card);
        });
    }, true); // capture: true 로 설정하여 이벤트 캡처링 단계에서 먼저 처리

    // Marquee-specific elements (outside the main marquee-container variable due to multiple marquees)
    const allMarqueeContainers = document.querySelectorAll('.marquee-container');
    const allMarqueeContents = document.querySelectorAll('.marquee-content');
    
    const fadeWidthPercentage = 0.15; // Fade region at each side (15% of container width)
    let marqueeAnimationFrameId; // For the fade effect animation frame

    // Function to update opacity for items in ALL marquees
    function updateMarqueeFade() {
        if (!isIconViewActive) {
            if (marqueeAnimationFrameId) {
                cancelAnimationFrame(marqueeAnimationFrameId);
                marqueeAnimationFrameId = null;
            }
            return;
        }

        allMarqueeContainers.forEach(marqueeContainer => {
            const containerWidth = marqueeContainer.offsetWidth;
            const marqueeContent = marqueeContainer.querySelector('.marquee-content');
            if (!marqueeContent) return;

            const skills = marqueeContent.querySelectorAll('.skill');
            const fadePixelWidth = containerWidth * fadeWidthPercentage;

            skills.forEach(skill => {
                const skillRect = skill.getBoundingClientRect();
                const containerRect = marqueeContainer.getBoundingClientRect();

                let opacity = 1;

                // Fade out when entering the left fade region
                if (skillRect.right < containerRect.left + fadePixelWidth) {
                    const progress = (skillRect.right - containerRect.left) / fadePixelWidth;
                    opacity = Math.max(0, Math.min(1, progress));
                }
                // Fade out when entering the right fade region
                else if (skillRect.left > containerRect.right - fadePixelWidth) {
                    const progress = (containerRect.right - skillRect.left) / fadePixelWidth;
                    opacity = Math.max(0, Math.min(1, progress));
                }

                skill.style.opacity = opacity;
            });
        });

        marqueeAnimationFrameId = requestAnimationFrame(updateMarqueeFade);
    }

    // GSAP Marquee Animation Control for multiple marquees
    let marqueeTimelines = []; // Store GSAP timeline instances for all marquees

    function startMarqueeAnimations() {
        stopMarqueeAnimations(); // Stop any existing animations

        allMarqueeContents.forEach(content => {
            if (!content) {
                console.error('Marquee content element not found. Skipping animation for this instance.');
                return;
            }

            const isReverse = content.classList.contains('reverse-marquee');
            const animationDuration = 20; // Total animation time (seconds) - adjust as needed

            // Calculate the distance to move for one full "set" of content
            // This assumes each `marquee-content` has its content duplicated at least twice.
            // `scrollWidth` gives the total width of all children including overflow.
            // If the content is duplicated exactly twice, distanceToMove is half of scrollWidth.
            const distanceToMove = content.scrollWidth / 2;
            
            // console.log(`Marquee: ${content.parentElement.previousElementSibling.textContent.trim()}, Distance: ${distanceToMove}, ScrollWidth: ${content.scrollWidth}`); // Debugging each marquee

            let tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });

            if (isReverse) {
                // Right-to-Left (reverse)
                tl.fromTo(content,
                    { x: 0 }, // Start at 0 (content aligned to the left of its container)
                    { x: -distanceToMove, duration: animationDuration, ease: "none" } // Move left by one set's width
                );
            } else {
                // Left-to-Right (normal)
                tl.fromTo(content,
                    { x: -distanceToMove }, // Start left, pre-shifted to fill the view from the right
                    { x: 0, duration: animationDuration, ease: "none" } // Move right to its original position
                );
            }
            marqueeTimelines.push(tl);
        });

        // Start the fade effect animation loop (only if not already running)
        if (!marqueeAnimationFrameId) {
            marqueeAnimationFrameId = requestAnimationFrame(updateMarqueeFade);
        }
    }

    function stopMarqueeAnimations() {
        marqueeTimelines.forEach(tl => tl.kill()); // Kill all GSAP timelines
        marqueeTimelines = []; // Clear the array

        // Reset transform and opacity for all marquee items
        document.querySelectorAll('.marquee-content').forEach(content => {
            gsap.set(content, { x: 0 }); // Reset GSAP 'x' transform
            content.querySelectorAll('.skill').forEach(skill => skill.style.opacity = '1'); // Reset opacity
        });

        // Stop the fade effect animation
        if (marqueeAnimationFrameId) {
            cancelAnimationFrame(marqueeAnimationFrameId);
            marqueeAnimationFrameId = null;
        }
    }

    // View Toggle Function
    function toggleView() {
        // Collapse any expanded cards
        document.querySelectorAll('.skill-card.expanded').forEach(card => {
            collapseCard(card);
        });
        // Disable jiggle mode if active
        disableJiggleMode();

        // Toggle view state
        isIconViewActive = !isIconViewActive;

        const tl = gsap.timeline({
            onComplete: () => {
                // Removed AOS.refresh() as per user's preference (not using AOS)
                ScrollTrigger.refresh(); // Refresh ScrollTrigger for layout changes

                // Start/stop marquee animations based on the new view state
                if (isIconViewActive) {
                    startMarqueeAnimations(); // Start marquee animations when icon view is active
                    if (toggleDescription) toggleDescription.textContent = '(Click to switch to Card View)';
                } else {
                    stopMarqueeAnimations(); // Stop marquee animations when card view is active
                    if (toggleDescription) toggleDescription.textContent = '(Click to switch to Icon View)';
                }
            }
        });

        if (isIconViewActive) {
            // Hide Ink Blot View, Show Icon View
            tl.to(skillsInkBlotView, { opacity: 0, duration: 0.3, clearProps: "all" })
              .set(skillsInkBlotView, { display: 'none' })
              .set(skillsIconView, { display: 'block' }) // Set display to block for icon view
              .to(skillsIconView, { opacity: 1, duration: 0.3 });

            if (sortableInstance) sortableInstance.option('disabled', true); // Disable Sortable in icon view

        } else {
            // Hide Icon View, Show Ink Blot View
            tl.to(skillsIconView, { opacity: 0, duration: 0.3, clearProps: "all" })
              .set(skillsIconView, { display: 'none' })
              .set(skillsInkBlotView, { display: 'flex' }) // Set display to flex for ink blot view
              .to(skillsInkBlotView, { opacity: 1, duration: 0.3, clearProps: "all" });

            // Reset GSAP and inline styles for all ink blot cards
            document.querySelectorAll('.skill-card').forEach(card => {
                gsap.set(card, { clearProps: "all" });
                const inkBlot = card.querySelector('.skill-ink-blot');
                const inkShape = card.querySelector('.skill-ink-shape');
                const initialContent = card.querySelector('.skill-initial-content');
                const expandedContent = card.querySelector('.skill-expanded-content');
                const mainTitle = card.querySelector('.skill-main-title');
                const clickDragHint = card.querySelector('.click-drag-hint');

                gsap.set(inkBlot, { clearProps: "all" });
                gsap.set(inkShape, { clearProps: "all" });
                gsap.set(initialContent, { clearProps: "all" });
                gsap.set(expandedContent, { clearProps: "all", display: 'none' });
                gsap.set(mainTitle, { clearProps: "all" });
                gsap.set(clickDragHint, { clearProps: "all" });

                // Restore CSS classes
                if (inkShape && card.dataset.closedShape) {
                    inkShape.classList.add(card.dataset.closedShape);
                }
                card.classList.remove('expanded');
                if (inkBlot) inkBlot.classList.remove('expanded');
                card.classList.remove('is-jiggling');
            });

            if (sortableInstance) sortableInstance.option('disabled', false); // Enable Sortable in ink blot view
        }
    }

    // Toggle button click listener
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleView);
    }

    // Ink splash effect function (unchanged)
    function createInkSplash(inkBlotElement) {
        let splashContainer = inkBlotElement.querySelector('.ink-splash-container');
        if (!splashContainer) {
            splashContainer = document.createElement('div');
            splashContainer.className = 'ink-splash-container';
            inkBlotElement.appendChild(splashContainer);
        }

        const numberOfDrops = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numberOfDrops; i++) {
            const drop = document.createElement('div');
            drop.className = 'ink-splash-drop';
            const size = Math.random() * 50 + 30;
            drop.style.width = `${size}px`;
            drop.style.height = `${size * (Math.random() * 0.4 + 0.8)}px`;

            const blotRect = inkBlotElement.getBoundingClientRect();
            const blotCenterXInContainer = (blotRect.width / 2);
            const blotCenterYInContainer = (blotRect.height / 2);
            drop.style.left = `calc(${blotCenterXInContainer}px + ${(Math.random() - 0.5) * (blotRect.width * 0.3)}px - ${size/2}px)`;
            drop.style.top = `calc(${blotCenterYInContainer}px + ${(Math.random() - 0.5) * (blotRect.height * 0.3)}px - ${size/2}px)`;

            drop.style.animationDelay = `${Math.random() * 0.1}s`;
            const baseShade = Math.floor(Math.random() * 20) + 20;
            drop.style.backgroundColor = `rgb(${baseShade}, ${baseShade}, ${baseShade})`;
            drop.style.filter = `url(#${fixedFilterID})`;
            splashContainer.appendChild(drop);

            drop.addEventListener('animationend', () => {
                drop.remove();
            });
        }
    }

    // Skill card expansion function (unchanged)
    function handleSkillCardInteraction(clickedCard) {
        const isExpanded = clickedCard.classList.contains('expanded');
        if (isExpanded) {
            collapseCard(clickedCard);
        } else {
            expandCard(clickedCard);
        }
    }

    // Card expand animation (unchanged)
    function expandCard(card) {
        const inkBlot = card.querySelector('.skill-ink-blot');
        const inkShape = card.querySelector('.skill-ink-shape');
        const initialContent = card.querySelector('.skill-initial-content');
        const expandedContent = card.querySelector('.skill-expanded-content');
        const mainTitle = card.querySelector('.skill-main-title');
        const clickDragHint = card.querySelector('.click-drag-hint');

        const originalIndex = parseInt(card.dataset.originalIndex);
        const stylesForThisCard = expandedCardStyles[originalIndex % expandedCardStyles.length];

        if (inkShape && card.dataset.closedShape && card.dataset.openedShape) {
            inkShape.classList.remove(card.dataset.closedShape);
            inkShape.classList.add(card.dataset.openedShape);
        }

        card.classList.add('expanded');
        if (inkBlot) {
             inkBlot.classList.add('expanded');
             if (stylesForThisCard && stylesForThisCard.inkBlotHeight) {
                gsap.to(inkBlot, { height: stylesForThisCard.inkBlotHeight, duration: 0.7, ease: 'cubic-bezier(.23,1.12,.67,1.08)' });
             }
        }
        card.style.zIndex = '10';

        const tl = gsap.timeline({
            defaults: { duration: 0.3, ease: "power2.out" },
            onComplete: () => {
                if (expandedContent) expandedContent.style.pointerEvents = 'auto';
                ScrollTrigger.refresh();
            }
        });

        tl.to(initialContent, { opacity: 0, y: -24, scale: 0.8, duration: 0.3 }, 0)
          .to(mainTitle, {
              opacity: 1,
              marginTop: mainTitle ? '2.2rem' : '',
              duration: 0.2,
          }, 0.05)
          .to(clickDragHint, {
              opacity: 0,
              duration: 0.2
          }, 0.05);

        if (expandedContent) {
            if (stylesForThisCard) {
                gsap.set(expandedContent, {
                    left: stylesForThisCard.contentLeft || '0px',
                    top: stylesForThisCard.contentTop || '0px'
                });
            }
            tl.set(expandedContent, { display: 'flex' });
            tl.to(expandedContent, { opacity: 1, duration: 0.3 }, 0.1);
        }
    }

    // Card collapse animation (unchanged)
    function collapseCard(card) {
        const inkBlot = card.querySelector('.skill-ink-blot');
        const inkShape = card.querySelector('.skill-ink-shape');
        const initialContent = card.querySelector('.skill-initial-content');
        const expandedContent = card.querySelector('.skill-expanded-content');
        const mainTitle = card.querySelector('.skill-main-title');
        const clickDragHint = card.querySelector('.click-drag-hint');

        if (expandedContent) expandedContent.style.pointerEvents = 'none';

        const tl = gsap.timeline({
            defaults: { duration: 0.4, ease: "power2.inOut" },
            onComplete: () => {
                card.classList.remove('expanded');
                if (inkBlot) {
                    inkBlot.classList.remove('expanded');
                    gsap.to(inkBlot, { height: '180px', duration: 0.4, ease: 'cubic-bezier(.23,1.12,.67,1.08)' });
                }
                if (inkShape && card.dataset.closedShape && card.dataset.openedShape) {
                    inkShape.classList.remove(card.dataset.openedShape);
                    inkShape.classList.add(card.dataset.closedShape);
                }
                if (expandedContent) {
                    gsap.set(expandedContent, { display: 'none' });
                }
                card.style.zIndex = '1';
                if (initialContent) initialContent.style.pointerEvents = 'auto';
                ScrollTrigger.refresh();
            }
        });

        if (expandedContent) {
            tl.to(expandedContent, { opacity: 0, duration: 0.2 }, 0);
        }
        tl.to(initialContent, { opacity: 1, y: 0, scale: 1, duration: 0.3 }, 0.1);
        if (mainTitle) {
            tl.to(mainTitle, { opacity: 1, marginTop: '1.4rem', duration: 0.3 }, 0.1);
        }
        if (clickDragHint) {
            tl.to(clickDragHint, { opacity: 0.6, marginTop: '0.4rem', duration: 0.3 }, 0.1);
        }
    }

    // Initial skill card reveal animation on scroll (unchanged)
    gsap.utils.toArray('.skill-card').forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, y: 60 },
            {
                opacity: 1, y: 0,
                duration: 0.7,
                ease: 'power3.out',
                delay: i * 0.12,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse',
                },
                onComplete: () => {
                    card.classList.add('in-view');
                }
            }
        );
    });

    // Overlay related functions (unchanged)
    const overlay = document.getElementById('skill-overlay');
    const overlayContent = overlay?.querySelector('.skill-overlay-content');
    const closeBtn = overlay?.querySelector('.skill-overlay-close');

    document.querySelectorAll('.skill-card').forEach(card => {
        const detailsList = card.querySelector('.skill-details-list');
        if (detailsList) {
            detailsList.addEventListener('click', function (e) {
                if (!card.classList.contains('expanded') || !overlay || !overlayContent) return;

                if (e.target.closest('[data-highlight-id]')) {
                    return;
                }

                const clickedLi = e.target.closest('li');
                if (!clickedLi) return;

                const title = card.querySelector('.skill-expanded-title')?.innerText || card.querySelector('.skill-main-title').innerText;
                const iconHTML = card.querySelector('.skill-icon.expanded-icon')?.outerHTML || card.querySelector('.skill-initial-content .skill-icon')?.outerHTML || '';
                const expandedDetailsList = card.querySelector('.skill-details-list');
                let liArr = Array.from(expandedDetailsList?.children || []);
                let html = `
                    <div class="skill-header">
                        ${iconHTML}
                        <h3>${title}</h3>
                    </div>
                    <ul>
                        ${liArr.map(liItem => `<li>${liItem.innerHTML}</li>`).join('')}
                    </ul>
                `;
                overlayContent.innerHTML = html;
                gsap.to(overlay, {
                    opacity: 1, display: 'flex', duration: 0.3,
                    onComplete: () => { if (overlay) document.body.style.overflow = 'hidden'; }
                });
            });
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            if (!overlay) return;
            gsap.to(overlay, {
                opacity: 0, duration: 0.3,
                onComplete: () => {
                    overlay.style.display = 'none';
                    if (overlayContent) overlayContent.innerHTML = '';
                    document.body.style.overflow = '';
                }
            });
        });
    }
    if (overlay) {
        overlay.addEventListener('mousedown', function (e) {
            if (e.target === overlay) {
                gsap.to(overlay, {
                    opacity: 0, duration: 0.3,
                    onComplete: () => {
                        overlay.style.display = 'none';
                        if (overlayContent) overlayContent.innerHTML = '';
                        document.body.style.overflow = '';
                    }
                });
            }
            e.stopPropagation();
        });
    }

    // Window resize handler
    window.addEventListener('resize', () => {
        if (isIconViewActive) {
            stopMarqueeAnimations();
            startMarqueeAnimations();
        }
        ScrollTrigger.refresh();
    });

    // Initial state setup on page load
    // Check if icon view is initially active based on its CSS display property
    if (skillsIconView && window.getComputedStyle(skillsIconView).display !== 'none') {
        isIconViewActive = true;
        startMarqueeAnimations(); // Start marquee animation immediately if icon view is active
    }

    // Set initial toggle description text
    if (toggleDescription) {
        toggleDescription.textContent = isIconViewActive ? '(Click to switch to Card View)' : '(Click to switch to Icon View)';
    }
});