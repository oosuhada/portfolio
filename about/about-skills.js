document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error('GSAP or ScrollTrigger is not loaded.');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const skillsContainer = document.getElementById('skills-sortable');
    if (skillsContainer) {
        Sortable.create(skillsContainer, {
            animation: 250,
            ghostClass: 'drag-ghost',
            chosenClass: 'drag-chosen',
            dragClass: 'drag-dragging',
            direction: 'horizontal',
            forceFallback: true,
            handle: '.skill-ink-blot',
        });
    }

    const skillCards = document.querySelectorAll('.skill-card');

    const cardSpecificClosedShapes = [
        'strengths-closed-shape',
        'uxui-closed-shape',
        'frontend-closed-shape',
        'tools-closed-shape'
    ];
    const cardSpecificOpenedShapes = [
        'strengths-opened-shape',
        'uxui-opened-shape',
        'frontend-opened-shape',
        'tools-opened-shape'
    ];

    const fixedOpacityClass = 'ink-opacity-high';
    const fixedFilterID = 'classicWetInk';

    // 각 카드의 원래 인덱스에 따른 확장 스타일 정의
    const expandedCardStyles = [
        { inkBlotHeight: '480px', contentLeft: '-0.5rem', contentTop: '2rem' }, // 원래 첫 번째 카드
        { inkBlotHeight: '480px', contentLeft: '-1.2rem', contentTop: '0px' },    // 원래 두 번째 카드
        { inkBlotHeight: '340px', contentLeft: '-1.7rem', contentTop: '0px' },    // 원래 세 번째 카드
        { inkBlotHeight: '340px', contentLeft: '-2.3rem', contentTop: '0px' }     // 원래 네 번째 카드
        // 카드 개수가 더 많다면 여기에 추가
    ];

    skillCards.forEach((card, index) => {
        // 각 카드에 원래 인덱스를 저장
        card.dataset.originalIndex = index;

        const inkBlot = card.querySelector('.skill-ink-blot');
        const inkShape = card.querySelector('.skill-ink-shape');
        const initialContent = card.querySelector('.skill-initial-content');
        const expandedContent = card.querySelector('.skill-expanded-content');

        if (inkShape) {
            [
                ...cardSpecificClosedShapes, ...cardSpecificOpenedShapes,
                'closed-blot-shape-1', 'closed-blot-shape-2', 'closed-blot-shape-3', 'closed-blot-shape-4',
                'opened-blot-shape-1', 'opened-blot-shape-2', 'opened-blot-shape-3', 'opened-blot-shape-4'
            ].forEach(cls => inkShape.classList.remove(cls));

            // closed/opened shape 클래스는 인덱스에 따라 할당
            const closedShapeClass = cardSpecificClosedShapes[index % cardSpecificClosedShapes.length]; // 순환 참조
            const openedShapeClass = cardSpecificOpenedShapes[index % cardSpecificOpenedShapes.length]; // 순환 참조

            if (closedShapeClass) {
                inkShape.classList.add(closedShapeClass);
                card.dataset.closedShape = closedShapeClass;
            }
            if (openedShapeClass) {
                card.dataset.openedShape = openedShapeClass;
            }

            ['ink-opacity-low', 'ink-opacity-medium', 'ink-opacity-high'].forEach(cls => inkShape.classList.remove(cls));
            inkShape.classList.add(fixedOpacityClass);
            inkShape.style.filter = `url(#${fixedFilterID})`;
            inkShape.style.removeProperty('--hover-rotate');
        }

        if (expandedContent) {
            gsap.set(expandedContent, { display: 'none', opacity: 0 });
        }

        if (inkBlot) {
            inkBlot.addEventListener('click', (e) => {
                if (e.target.closest('.sortable-ghost') || e.target.closest('.sortable-chosen') || card.classList.contains('drag-dragging')) return;
                createInkSplash(inkBlot);
                handleSkillCardInteraction(card);
            });
        }
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

        // 원래 인덱스 가져오기
        const originalIndex = parseInt(card.dataset.originalIndex);
        const stylesForThisCard = expandedCardStyles[originalIndex % expandedCardStyles.length]; // 순환 참조 또는 인덱스 범위 확인 필요

        if (inkShape && card.dataset.closedShape && card.dataset.openedShape) {
            inkShape.classList.remove(card.dataset.closedShape);
            inkShape.classList.add(card.dataset.openedShape);
        }

        card.classList.add('expanded');
        if (inkBlot) {
             inkBlot.classList.add('expanded');
             // inkBlot 높이 설정
             if (stylesForThisCard && stylesForThisCard.inkBlotHeight) {
                gsap.to(inkBlot, { height: stylesForThisCard.inkBlotHeight, duration: 0.7, ease: 'cubic-bezier(.23,1.12,.67,1.08)' });
             }
        }
        card.style.zIndex = '10';

        const tl = gsap.timeline({
            defaults: { duration: 0.5, ease: "power2.out" },
            onComplete: () => {
                if (expandedContent) expandedContent.style.pointerEvents = 'auto';
                ScrollTrigger.refresh();
            }
        });

        tl.to(initialContent, { opacity: 0, y: -24, scale: 0.8, duration: 0.3 }, 0)
          .to([mainTitle, clickDragHint], {
              opacity: 1,
              marginTop: mainTitle ? '2.2rem' : '',
              duration: 0.3,
          }, 0.1);

        if (expandedContent) {
            // expandedContent 위치 설정
            if (stylesForThisCard) {
                gsap.set(expandedContent, {
                    left: stylesForThisCard.contentLeft || '0px', // 기본값
                    top: stylesForThisCard.contentTop || '0px'    // 기본값
                });
            }
            tl.set(expandedContent, { display: 'flex' });
            tl.to(expandedContent, { opacity: 1, duration: 0.4 }, 0.3);
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
                    // inkBlot 높이 원래대로 (180px은 CSS 기본값으로 가정)
                    gsap.to(inkBlot, { height: '180px', duration: 0.7, ease: 'cubic-bezier(.23,1.12,.67,1.08)' });
                }
                if (inkShape && card.dataset.closedShape && card.dataset.openedShape) {
                    inkShape.classList.remove(card.dataset.openedShape);
                    inkShape.classList.add(card.dataset.closedShape);
                }
                if (expandedContent) {
                    gsap.set(expandedContent, { display: 'none' /*, left: '', top: '' */ }); // left, top 초기화는 선택적
                }
                card.style.zIndex = '1';
                if (initialContent) initialContent.style.pointerEvents = 'auto';
                ScrollTrigger.refresh();
            }
        });

        if (expandedContent) {
            tl.to(expandedContent, { opacity: 0, duration: 0.3 }, 0);
        }
        tl.to(initialContent, { opacity: 1, y: 0, scale: 1, duration: 0.4 }, 0.2);
        if (mainTitle) {
            tl.to(mainTitle, { opacity: 1, marginTop: '1.4rem', duration: 0.4 }, 0.25);
        }
        if (clickDragHint) {
            tl.to(clickDragHint, { opacity: 0.6, marginTop: '0.4rem', duration: 0.4 }, 0.25);
        }
    }

    gsap.utils.toArray('.skill-card').forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, y: 60 },
            {
                opacity: 1, y: 0,
                duration: 0.7,
                ease: 'power3.out',
                delay: i * 0.12, // 이 delay는 초기 등장 애니메이션이므로 DOM 순서대로 해도 괜찮습니다.
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

    // Overlay 관련 코드는 그대로 유지
    const overlay = document.getElementById('skill-overlay');
    const overlayContent = overlay?.querySelector('.skill-overlay-content');
    const closeBtn = overlay?.querySelector('.skill-overlay-close');

    document.querySelectorAll('.skill-card').forEach(card => {
        const detailsList = card.querySelector('.skill-details-list');
        if (detailsList) {
            detailsList.addEventListener('click', function (e) {
                if (!card.classList.contains('expanded') || !overlay || !overlayContent) return;
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
                e.stopPropagation();
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