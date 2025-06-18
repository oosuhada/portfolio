document.addEventListener('DOMContentLoaded', () => {
  // ==== "Ink" Confetti Effect Function ====
  function triggerInkConfetti(originX, originY) {
      const particleCount = 7;
      const inkColors = ['#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0'];

      for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.classList.add('confetti-particle');
          particle.style.backgroundColor = inkColors[Math.floor(Math.random() * inkColors.length)];
          particle.style.filter = 'blur(0.5px)';

          const type = Math.random();
          let size;

          if (type < 0.4) {
              size = Math.random() * 10 + 6;
              particle.style.width = `${size}px`;
              particle.style.height = `${size}px`;
              particle.style.borderRadius = '50%';
          } else if (type < 0.75) {
              const width = Math.random() * 18 + 7;
              const height = Math.random() * 10 + 4;
              particle.style.width = `${width}px`;
              particle.style.height = `${height}px`;
              particle.style.borderRadius = `${Math.random() * 40 + 30}%`;
              if (Math.random() > 0.5) {
                  particle.style.width = `${height}px`;
                  particle.style.height = `${width}px`;
              }
          } else {
              size = Math.random() * 4 + 2;
              particle.style.width = `${size}px`;
              particle.style.height = `${size}px`;
              particle.style.borderRadius = '50%';
              particle.style.opacity = Math.random() * 0.3 + 0.6;
          }

          document.body.appendChild(particle);

          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 70 + 50;
          const duration = Math.random() * 1.0 + 1.5;
          const initialRotation = Math.random() * 360;
          const finalRotation = initialRotation + (Math.random() * 180 - 90);

          particle.style.left = `${originX}px`;
          particle.style.top = `${originY}px`;
          particle.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';

          particle.animate([
              { transform: `translate(-50%, -50%) scale(1) rotate(${initialRotation}deg)`, opacity: parseFloat(particle.style.opacity || 1) },
              {
                  transform: `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.05) rotate(${finalRotation}deg)`,
                  opacity: 0
              }
          ], {
              duration: duration * 1000,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'forwards'
          });

          setTimeout(() => {
              particle.remove();
          }, duration * 1000);
      }
  }

  // --- 1. Generate Stars ---
  function generateStars() {
      const starField = document.getElementById('starField');
      if (!starField) return;
      for (let i = 0; i < 100; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          star.style.width = Math.random() * 3 + 1 + 'px';
          star.style.height = star.style.width;
          star.style.animationDelay = Math.random() * 3 + 's';
          starField.appendChild(star);
      }
  }

  // --- 2. Element Selection ---
  const galaxyContent = document.getElementById('processGalaxy');
  const galaxyContainer = document.querySelector('.process-galaxy-container');
  const orbitSVG = document.getElementById('processOrbitSVG');
  const orbitPath = document.getElementById('orbitPath');
  const planets = document.querySelectorAll('.process-planet');
  const cards = document.querySelectorAll('.process-card');
  const processSteps = planets;
  const cardsContainer = document.querySelector('.about-process-cols'); // Add this for flexible height

  if (!galaxyContent || !galaxyContainer || !orbitSVG || !orbitPath || planets.length === 0 || cards.length === 0 || !cardsContainer) {
      console.error("Process galaxy elements not found, stopping script. Check IDs, classes, or HTML structure.");
      return;
  }

  // --- 3. Constants and Initial Setup ---
  const totalSteps = planets.length;
  let activeIndex = 0;
  let isLocked = false;

  let ORBIT_WIDTH_PX;
  let ORBIT_HEIGHT_PX;
  let ORBIT_TILT_DEG_GLOBAL = -45; // Global tilt for planet animation

  const PLANET_ORBIT_OFFSET = 0;

  let animationFrameId;
  let startTime;
  const animationDuration = 40000;

  // --- Function to draw the SVG ellipse path ---
  function drawOrbitPath(pathElement) {
      // Get the current dimensions of the container after CSS is applied
      const containerRect = galaxyContainer.getBoundingClientRect();
      let containerWidth = containerRect.width;
      let containerHeight = containerRect.height; // This will correctly reflect the CSS height

      let currentOrbitTiltDeg;

      const currentWindowWidth = window.innerWidth;

      // --- Logic for screens wider than 820px ---
      if (currentWindowWidth > 820) {
          // Set galaxy container height flexible based on process-cards height
          const cardsHeight = cardsContainer.offsetHeight;
          // Add some padding or buffer to the height
          galaxyContainer.style.height = `${cardsHeight + 40}px`; // Set height directly here
          // Update containerHeight for calculations based on the newly set style
          containerHeight = galaxyContainer.offsetHeight;

          // Also adjust the visual and content layers to match the new container height
          galaxyContent.style.height = `calc(100% - 10%)`; // 90% of updated container height
          document.querySelector('.process-galaxy-visual').style.height = `calc(100% - 10%)`; // 90% of updated container height

          // Default orbit aspect ratio for larger screens
          const ORBIT_DEFAULT_ASPECT_RATIO = 2.0;
          const ORBIT_MAX_HEIGHT_RATIO = 0.8;
          const ORBIT_MAX_WIDTH_RATIO = 0.9;

          // Calculate orbit dimensions based on container and aspect ratio
          calculatedOrbitHeight = containerHeight * ORBIT_MAX_HEIGHT_RATIO;
          calculatedOrbitWidth = calculatedOrbitHeight * ORBIT_DEFAULT_ASPECT_RATIO;

          // Ensure width doesn't exceed container bounds
          if (calculatedOrbitWidth > containerWidth * ORBIT_MAX_WIDTH_RATIO) {
              calculatedOrbitWidth = containerWidth * ORBIT_MAX_WIDTH_RATIO;
              calculatedOrbitHeight = calculatedOrbitWidth / ORBIT_DEFAULT_ASPECT_RATIO;
          }
          currentOrbitTiltDeg = -45; // Restore default tilt for wide screens

      // --- Logic for screens 820px or narrower ---
      } else {
          // Height is fixed by CSS for small screens, so no need to set galaxyContainer.style.height here
          // It's already 400px from CSS.
          containerHeight = galaxyContainer.offsetHeight; // Get height from CSS

          galaxyContent.style.height = `calc(100% - 10%)`;
          document.querySelector('.process-galaxy-visual').style.height = `calc(100% - 10%)`;

          // Adjust tilt for narrower screens to make orbit appear wider
          currentOrbitTiltDeg = -60; // More horizontal tilt

          const ORBIT_MIN_WIDTH_RATIO = 0.8; // Use more of the available width
          const ORBIT_MAX_HEIGHT_RATIO_SMALL = 0.6; // Don't take up too much vertical space

          calculatedOrbitWidth = containerWidth * ORBIT_MIN_WIDTH_RATIO;
          calculatedOrbitHeight = containerHeight * ORBIT_MAX_HEIGHT_RATIO_SMALL;

          // Ensure aspect ratio is not too narrow or wide (e.g., 2:1 to 3:1)
          const desiredAspectRatio = 2.5; // Aim for a slightly wider aspect ratio on mobile
          if (calculatedOrbitWidth / calculatedOrbitHeight < desiredAspectRatio) {
              calculatedOrbitWidth = calculatedOrbitHeight * desiredAspectRatio;
              // Re-check width against container
              if (calculatedOrbitWidth > containerWidth * ORBIT_MIN_WIDTH_RATIO) {
                  calculatedOrbitWidth = containerWidth * ORBIT_MIN_WIDTH_RATIO;
                  calculatedOrbitHeight = calculatedOrbitWidth / desiredAspectRatio;
              }
          }
          // Ensure orbit does not exceed its container
          calculatedOrbitWidth = Math.min(calculatedOrbitWidth, containerWidth * 0.95);
          calculatedOrbitHeight = Math.min(calculatedOrbitHeight, containerHeight * 0.95);
      }

      // Assign final orbit dimensions
      ORBIT_WIDTH_PX = calculatedOrbitWidth;
      ORBIT_HEIGHT_PX = calculatedOrbitHeight;
      ORBIT_TILT_DEG_GLOBAL = currentOrbitTiltDeg; // Update global tilt for planet animation

      // Update SVG attributes
      orbitSVG.setAttribute('viewBox', `0 0 ${ORBIT_WIDTH_PX} ${ORBIT_HEIGHT_PX}`);
      orbitSVG.style.width = `${ORBIT_WIDTH_PX}px`;
      orbitSVG.style.height = `${ORBIT_HEIGHT_PX}px`;

      // Update the transform for the SVG element directly
      orbitSVG.style.transform = `translate(-50%, -50%) rotate(${currentOrbitTiltDeg}deg)`;


      const cx = ORBIT_WIDTH_PX / 2;
      const cy = ORBIT_HEIGHT_PX / 2;
      const rx = ORBIT_WIDTH_PX / 2;
      const ry = ORBIT_HEIGHT_PX / 2;

      const pathData = `M ${cx - rx},${cy} ` +
                       `A ${rx},${ry} 0 1,0 ${cx + rx},${cy} ` +
                       `A ${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`;

      pathElement.setAttribute('d', pathData);
      pathElement.dataset.lastDrawnWidth = String(ORBIT_WIDTH_PX);
      pathElement.dataset.lastDrawnHeight = String(ORBIT_HEIGHT_PX);

      // Update planet rotation based on the current orbit tilt
      planets.forEach(planet => {
          const uprightRotation = `rotate(${-currentOrbitTiltDeg}deg)`;
          planet.style.setProperty('--planet-rotate', uprightRotation);
          planet.querySelector('.planet-content').style.transform = `rotate(${-(-ORBIT_TILT_DEG_GLOBAL)}deg)`;
      });
  }

  // --- Function for planet animation and position calculation ---
  function animatePlanets(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % animationDuration) / animationDuration;

      const ORBIT_TILT_RAD_ANIMATION = ORBIT_TILT_DEG_GLOBAL * (Math.PI / 180); // Use the global tilt

      planets.forEach((planet, i) => {
          const initialPhase = i / totalSteps;
          const currentPhase = (progress + initialPhase) % 1;
          const angle = currentPhase * 2 * Math.PI;

          const effectiveWidth = ORBIT_WIDTH_PX + (PLANET_ORBIT_OFFSET * 2);
          const effectiveHeight = ORBIT_HEIGHT_PX + (PLANET_ORBIT_OFFSET * 2);

          const rawX = (effectiveWidth / 2) * Math.cos(angle);
          const rawY = (effectiveHeight / 2) * Math.sin(angle);

          const tiltedX = rawX * Math.cos(ORBIT_TILT_RAD_ANIMATION) - rawY * Math.sin(ORBIT_TILT_RAD_ANIMATION);
          const tiltedY = rawX * Math.sin(ORBIT_TILT_RAD_ANIMATION) + rawY * Math.cos(ORBIT_TILT_RAD_ANIMATION);

          // Ensure planets stay within galaxyContent bounds
          const contentRect = galaxyContent.getBoundingClientRect();
          const maxX = contentRect.width * 0.45; // 90% of half-width of content
          const maxY = contentRect.height * 0.45; // 90% of half-height of content

          // Calculate pixel positions relative to galaxyContent center
          // The orbit path already handles fitting to the SVG size
          // The planets need to be positioned relative to the galaxyContent for correct display
          planet.style.left = `calc(50% + ${Math.max(-maxX, Math.min(maxX, tiltedX))}px)`;
          planet.style.top = `calc(50% + ${Math.max(-maxY, Math.min(maxY, tiltedY))}px)`;

          const uprightRotation = `rotate(${-ORBIT_TILT_DEG_GLOBAL}deg)`; // Use global tilt for upright rotation
          planet.style.setProperty('--planet-rotate', uprightRotation);

          let transformValue = `translate(-50%, -50%) ${uprightRotation}`;

          if (i === activeIndex) {
              transformValue += ' scale(1.2)';
          }

          if (planet.dataset.parallaxX && planet.dataset.parallaxY && !isLocked) {
              transformValue += ` translate(${planet.dataset.parallaxX}px, ${planet.dataset.parallaxY}px)`;
          }

          planet.style.transform = transformValue;
      });

      animationFrameId = requestAnimationFrame(animatePlanets);
  }

  // --- 4. Core Functionality ---
  function toggleProcess(idx, eventSourceElement) {
    const card = cards[idx];
    const planet = planets[idx];

    if (!card || !planet) return;

    const isActive = card.classList.contains('is-active');

    // 우선 전체 해제
    cards.forEach(c => c.classList.remove('is-active', 'is-locked'));
    planets.forEach(p => p.classList.remove('is-active'));
    isLocked = false;

    if (!isActive) {
        // ACTIVATE
        if (eventSourceElement && typeof triggerInkConfetti === 'function') {
            const rect = eventSourceElement.getBoundingClientRect();
            const originX = rect.left + rect.width / 2;
            const originY = rect.top + rect.height / 2;
            triggerInkConfetti(originX, originY);
        }
        card.classList.add('is-active', 'is-locked');
        planet.classList.add('is-active');
        isLocked = true;
        activeIndex = idx;
    } else {
        // DEACTIVATE (스타일만 원복, 공전 위치/애니메이션은 건드리지 않음)
        // is-active, is-locked만 remove
        // 필요하다면 activeIndex를 null 등으로 관리(활성화 항목 없음 표시)
        // activeIndex = null;
    }
    activeIndex = idx; // Update active index
}

  // --- 5. Card Animation on View ---
  const cardObserver = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              const card = entry.target;
              setTimeout(() => { card.classList.add('in-view'); }, Array.from(cards).indexOf(card) * 100);
              observerInstance.unobserve(card);
          }
      });
  }, { threshold: 0.1 });
  cards.forEach(card => cardObserver.observe(card));

  // --- 6. Event Listeners ---
  cards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => {
          if (!isLocked) {
              cards.forEach(c => c.classList.remove('is-active'));
              planets.forEach(p => p.classList.remove('is-active'));
              card.classList.add('is-active');
              planets[index].classList.add('is-active');
          }
      });

      card.addEventListener('mouseleave', () => {
          if (!isLocked) {
              cards.forEach(c => c.classList.remove('is-active'));
              planets.forEach(p => p.classList.remove('is-active'));
              cards[activeIndex].classList.add('is-active');
              planets[activeIndex].classList.add('is-active');
          }
      });

      card.addEventListener('click', (event) => {
          if (event.target.closest('.meaning-chunk')) {
              return;
          }
          toggleProcess(index, event.currentTarget);
      });

      card.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.click();
          }
      });
  });

  planets.forEach((planet, index) => {
      planet.addEventListener('click', () => {
          toggleProcess(index, planet);
      });

      planet.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              planet.click();
          }
      });

      planet.addEventListener('mouseenter', () => {
          if (!isLocked) {
              cards.forEach(c => c.classList.remove('is-active'));
              planets.forEach(p => p.classList.remove('is-active'));
              cards[index].classList.add('is-active');
              planet.classList.add('is-active');
          }
      });

      planet.addEventListener('mouseleave', () => {
          if (!isLocked) {
              cards.forEach(c => c.classList.remove('is-active'));
              planets.forEach(p => p.classList.remove('is-active'));
              cards[activeIndex].classList.add('is-active');
              planets[activeIndex].classList.add('is-active');
          }
      });
  });

  // 마우스 움직임에 따른 패럴랙스 효과 (잠금 상태가 아닐 때만)
  galaxyContainer.addEventListener('mousemove', (e) => {
      if (isLocked) return;

      const rect = galaxyContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      planets.forEach((planet, index) => {
          const contentRect = galaxyContent.getBoundingClientRect();
          const relativeMouseX = e.clientX - contentRect.left - (contentRect.width / 2);
          const relativeMouseY = e.clientY - contentRect.top - (contentRect.height / 2);

          if (index !== activeIndex) {
              const parallaxX = relativeMouseX * 0.05;
              const parallaxY = relativeMouseY * 0.05;
              planet.dataset.parallaxX = parallaxX;
              planet.dataset.parallaxY = parallaxY;
          }
      });
  });

  // 마우스가 갤럭시 영역을 벗어났을 때 패럴랙스 초기화 (잠금 상태가 아닐 때만)
  galaxyContainer.addEventListener('mouseleave', () => {
      if (!isLocked) {
          planets.forEach(planet => {
              delete planet.dataset.parallaxX;
              delete planet.dataset.parallaxY;
          });
      }
  });

  // --- 7. Accessibility ---
  cards.forEach((card, idx) => {
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');
      card.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.click();
          }
      });
  });

  planets.forEach((planet, idx) => {
      planet.setAttribute('role', 'button');
      planet.setAttribute('aria-label', `Activate process step ${idx + 1}`);
      planet.setAttribute('tabindex', '0');
      planet.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              planet.click();
          }
      });
  });

  // --- 8. Initial State ---
  generateStars();
  drawOrbitPath(orbitPath); // Initial call to set up
  toggleProcess(0, cards[0]);
  cards[0].classList.add('in-view');

  startTime = performance.now();
  animationFrameId = requestAnimationFrame(animatePlanets);

  // 윈도우 리사이즈 시 궤도 다시 그리기
  window.addEventListener('resize', () => {
      drawOrbitPath(orbitPath);
  });
});