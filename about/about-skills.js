document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error('GSAP or ScrollTrigger is not loaded.');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const skillsContainer = document.getElementById('skills-sortable');
    let sortableInstance = null; // [추가] Sortable 인스턴스를 저장할 변수

    // [추가] 꾹 누르기 관련 상태 변수들
    const PRESS_DURATION = 1200; // 1.2초. 이 값을 조절하여 꾹 누르는 시간 변경
    let pressTimer = null;
    let isJiggleModeActive = false;
    let longPressOccurred = false;

    if (skillsContainer) {
        // [수정] Sortable을 비활성화된 상태로 초기화
        sortableInstance = Sortable.create(skillsContainer, {
            animation: 250,
            ghostClass: 'drag-ghost',
            chosenClass: 'drag-chosen',
            dragClass: 'drag-dragging',
            direction: 'horizontal',
            forceFallback: true,
            handle: '.skill-ink-blot',
            disabled: true, // 기본적으로 비활성화
        });
    }

    // [추가] 재정렬 모드를 활성화하는 함수
    function enableJiggleMode() {
        if (isJiggleModeActive) return;
        isJiggleModeActive = true;
        longPressOccurred = true; // 꾹 누르기 액션이 발생했음을 기록
        sortableInstance.option('disabled', false); // 드래그 기능 활성화
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.add('is-jiggling');
        });
    }

    // [추가] 재정렬 모드를 비활성화하는 함수
    function disableJiggleMode() {
        if (!isJiggleModeActive) return;
        isJiggleModeActive = false;
        sortableInstance.option('disabled', true); // 드래그 기능 비활성화
        document.querySelectorAll('.skill-card').forEach(card => {
            card.classList.remove('is-jiggling');
        });
    }

    const skillCards = document.querySelectorAll('.skill-card');

    const cardSpecificClosedShapes = ['strengths-closed-shape', 'uxui-closed-shape', 'frontend-closed-shape', 'tools-closed-shape'];
    const cardSpecificOpenedShapes = ['strengths-opened-shape', 'uxui-opened-shape', 'frontend-opened-shape', 'tools-opened-shape'];
    const fixedOpacityClass = 'ink-opacity-high';
    const fixedFilterID = 'classicWetInk';
    const expandedCardStyles = [
        { inkBlotHeight: '460px', contentLeft: '-1.2rem', contentTop: '-10px' },
        { inkBlotHeight: '460px', contentLeft: '-1.7rem', contentTop: '0px' },
        { inkBlotHeight: '460px', contentLeft: '-1.7rem', contentTop: '20px' },
        { inkBlotHeight: '460px', contentLeft: '-1.2rem', contentTop: '10px' }
    ];

    skillCards.forEach((card, index) => {
        card.dataset.originalIndex = index;

        const inkBlot = card.querySelector('.skill-ink-blot');
        const inkShape = card.querySelector('.skill-ink-shape');
        const initialContent = card.querySelector('.skill-initial-content');
        const expandedContent = card.querySelector('.skill-expanded-content');

        if (inkShape) {
            [...cardSpecificClosedShapes,...cardSpecificOpenedShapes,'closed-blot-shape-1','closed-blot-shape-2','closed-blot-shape-3','closed-blot-shape-4','opened-blot-shape-1','opened-blot-shape-2','opened-blot-shape-3','opened-blot-shape-4'].forEach(cls=>inkShape.classList.remove(cls));
            const closedShapeClass=cardSpecificClosedShapes[index%cardSpecificClosedShapes.length];const openedShapeClass=cardSpecificOpenedShapes[index%cardSpecificOpenedShapes.length];
            if(closedShapeClass){inkShape.classList.add(closedShapeClass);card.dataset.closedShape=closedShapeClass;}
            if(openedShapeClass){card.dataset.openedShape=openedShapeClass;}
            ['ink-opacity-low','ink-opacity-medium','ink-opacity-high'].forEach(cls=>inkShape.classList.remove(cls));
            inkShape.classList.add(fixedOpacityClass);inkShape.style.filter=`url(#${fixedFilterID})`;inkShape.style.removeProperty('--hover-rotate');
        }

        if (expandedContent) {
            gsap.set(expandedContent, { display: 'none', opacity: 0 });
        }

        if (inkBlot) {
            // [수정] 'click' 대신 'mousedown', 'mouseup', 'mouseleave' 이벤트로 꾹 누르기 구현
            inkBlot.addEventListener('mousedown', (e) => {
                if (isJiggleModeActive || card.classList.contains('expanded')) return;
                longPressOccurred = false; // 마우스 누를 때 초기화
                pressTimer = setTimeout(enableJiggleMode, PRESS_DURATION);
            });

            inkBlot.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });
            
            inkBlot.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });

            inkBlot.addEventListener('click', (e) => {
                // [수정] 꾹 누르기가 방금 발생했다면, 카드 확장 로직을 실행하지 않음
                if (longPressOccurred) {
                    longPressOccurred = false; // 플래그 초기화 후 종료
                    return;
                }
                
                // 재정렬 모드일 때는 카드 확장/축소 기능 비활성화
                if (isJiggleModeActive) return;

                if (card.classList.contains('expanded') && e.target.closest('.skill-details-list')) {
                    return;
                }
                if (e.target.closest('.sortable-ghost') || e.target.closest('.sortable-chosen') || card.classList.contains('drag-dragging')) return;
                
                if (!card.classList.contains('expanded')) {
                    createInkSplash(inkBlot);
                }
                handleSkillCardInteraction(card);
            });
        }
    });

    // [수정] document 클릭 리스너 로직 변경
    document.addEventListener('click', function(e) {
        // 재정렬 모드일 때 외부를 클릭하면 재정렬 모드 해제
        if (isJiggleModeActive && !e.target.closest('#skills-sortable')) {
            disableJiggleMode();
            return; // 모드 해제 후 다른 동작 방지
        }

        const expandedCards = document.querySelectorAll('.skill-card.expanded');
        if (expandedCards.length === 0) return;

        const clickInsideAnExpandedCard = Array.from(expandedCards).some(card => card.contains(e.target));
        const clickOnHighlightMenu = e.target.closest('#highlight-menu');

        if (clickInsideAnExpandedCard || clickOnHighlightMenu) {
            return;
        }

        expandedCards.forEach(card => {
            collapseCard(card);
        });
    });

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

    function handleSkillCardInteraction(clickedCard) {
        const isExpanded = clickedCard.classList.contains('expanded');
        if (isExpanded) {
            collapseCard(clickedCard);
        } else {
            expandCard(clickedCard);
        }
    }

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
        });
    }
});