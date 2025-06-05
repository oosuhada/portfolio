document.addEventListener('DOMContentLoaded', () => {
    createFloatingDrops();

    // Optional: Initialize GSAP animations for title/subtitle if not handled elsewhere
    if (gsap) {
        gsap.utils.toArray('.section-title, .section-subtitle, .ink-skill-item').forEach(el => {
            if (el.style.animationName && el.style.animationName.includes('fadeInUp')) {
                // If CSS animation is already defined, let it run
                // Or, you could remove CSS animation and control fully with GSAP:
                // gsap.from(el, {
                //     opacity: 0,
                //     y: 30,
                //     duration: 1,
                //     ease: 'power3.out',
                //     delay: parseFloat(el.style.animationDelay) || 0
                // });
            }
        });
    }
});

// 떠다니는 잉크 방울 생성
function createFloatingDrops() {
    const container = document.getElementById('floatingDrops');
    if (!container) return;

    let dropCreationInterval = setInterval(() => {
        if (document.visibilityState === 'visible' && Math.random() > 0.5) { // Create drops less frequently
            const drop = document.createElement('div');
            drop.className = 'floating-drop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.top = '105%'; // Start from below viewport
            const randomDelay = Math.random() * 4; // Longer, more varied delays
            const randomDuration = 4 + Math.random() * 4; // Varied duration

            drop.style.animationDelay = randomDelay + 's';
            drop.style.animationDuration = randomDuration + 's';
            
            // Randomize size slightly
            const size = 8 + Math.random() * 8 + 'px';
            drop.style.width = size;
            drop.style.height = size;
            
            container.appendChild(drop);

            setTimeout(() => {
                if (drop.parentNode) {
                    drop.parentNode.removeChild(drop);
                }
            }, (randomDuration + randomDelay + 1) * 1000); // Adjusted timeout to match animation
        }
    }, 1500); // Create drops less often
}

// 스킬 잉크 확장 효과
function expandInkSkill(element, skillName) {
    const inkBlot = element.querySelector('.ink-blot');
    if (!inkBlot) return;
    const isExpanded = inkBlot.classList.contains('expanded');

    // 모든 잉크 블롭 초기화 (선택된 것 제외)
    document.querySelectorAll('.ink-skill-item .ink-blot.expanded').forEach(expandedBlob => {
        if (expandedBlob !== inkBlot) {
            expandedBlob.classList.remove('expanded');
            // Hide skill details for other cards
             const otherDetails = expandedBlob.closest('.ink-skill-item').querySelector('.skill-details-list');
             if(otherDetails) {
                otherDetails.style.maxHeight = '0';
                otherDetails.style.opacity = '0';
             }
        }
    });

    if (!isExpanded) {
        inkBlot.classList.add('expanded');
        createInkSplash(inkBlot, skillName); // Pass inkBlot for positioning reference
         // Show skill details for this card
        const detailsList = element.querySelector('.skill-details-list');
        if (detailsList) {
            // Ensure display is not none if previously hidden by other means
            detailsList.style.display = 'block'; 
            // Trigger reflow before changing maxHeight for transition
            detailsList.scrollHeight; 
            detailsList.style.maxHeight = detailsList.scrollHeight + 'px';
            detailsList.style.opacity = '1';
        }
    } else {
        inkBlot.classList.remove('expanded');
        // Hide skill details
        const detailsList = element.querySelector('.skill-details-list');
        if (detailsList) {
            detailsList.style.maxHeight = '0';
            detailsList.style.opacity = '0';
        }
    }
}


// 잉크 스플래시 효과
function createInkSplash(element, skillCategory) {
    const splashContainer = document.getElementById('splashEffects');
    if (!splashContainer || !element) return;

    const rect = element.getBoundingClientRect(); // Use the inkBlot itself for position
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = {
        'Strengths': '#e67e22',
        'UXUI': '#2980b9',
        'Frontend': '#27ae60',
        'Tools': '#c0392b',
        'Default': '#7f8c8d' // Fallback color for main explosion
    };
    const baseColor = colors[skillCategory] || colors['Default'];

    for (let i = 0; i < 10; i++) { // Number of splash particles
        const splash = document.createElement('div');
        splash.className = 'splash-drop';
        splash.style.position = 'fixed'; // Critical for viewport positioning

        // Make splashes emanate from the center of the element
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 80 + 20; // Spread radius
        splash.style.left = (centerX + Math.cos(angle) * radius - (Math.random() * 20 + 10)/2) + 'px';
        splash.style.top = (centerY + Math.sin(angle) * radius - (Math.random() * 20 + 10)/2) + 'px';
        
        const size = (Math.random() * 25 + 10) + 'px'; // Particle size
        splash.style.width = size;
        splash.style.height = size;
        splash.style.background = baseColor;
        splash.style.zIndex = '1050'; // Ensure splashes are on top
        
        const duration = 0.6 + Math.random() * 0.4; // Faster splash
        splash.style.animation = `inkSplash ${duration}s ease-out forwards`;
        splash.style.animationDelay = (i * 0.05) + 's'; // Staggered start

        splashContainer.appendChild(splash);

        setTimeout(() => {
            if (splash.parentNode) {
                splash.parentNode.removeChild(splash);
            }
        }, (duration + (i*0.05) + 0.1) * 1000); // Remove after animation
    }
}

// 메인 잉크 폭발 효과
function triggerMainInkExplosion() {
    const mainBlotElement = document.querySelector('.main-ink-blot');
    if (!mainBlotElement) return;
    
    mainBlotElement.classList.toggle('expanded');
    createInkSplash(mainBlotElement.querySelector('.main-ink-shape'), 'Default'); // Use the shape for positioning

    // Example: Extended screen-wide splash for fun
    if (mainBlotElement.classList.contains('expanded')) {
        const splashContainer = document.getElementById('splashEffects');
        const screenColors = ['#e67e22', '#2980b9', '#27ae60', '#c0392b', '#7f8c8d'];
        for (let i = 0; i < 20; i++) { // More particles for screen effect
            setTimeout(() => {
                const explosion = document.createElement('div');
                explosion.className = 'splash-drop';
                explosion.style.position = 'fixed';
                explosion.style.left = Math.random() * window.innerWidth + 'px';
                explosion.style.top = Math.random() * window.innerHeight + 'px';
                const size = (Math.random() * 40 + 20) + 'px';
                explosion.style.width = size;
                explosion.style.height = size;
                explosion.style.background = screenColors[Math.floor(Math.random() * screenColors.length)];
                explosion.style.zIndex = '1000';
                explosion.style.animation = `inkSplash ${1 + Math.random() * 0.5}s ease-out forwards`;
                
                splashContainer.appendChild(explosion);
                setTimeout(() => {
                    if (explosion.parentNode) explosion.parentNode.removeChild(explosion);
                }, 2000);
            }, i * 50); // Staggered creation
        }
    }
    
    // Optionally, auto-collapse main blot after a delay
    if (mainBlotElement.classList.contains('expanded')) {
        setTimeout(() => {
            mainBlotElement.classList.remove('expanded');
        }, 2500);
    }
}