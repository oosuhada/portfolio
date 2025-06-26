document.addEventListener('DOMContentLoaded', () => {

  // ===================================================================
  // 온보딩 가이드 기능 (최종 UX 개선 + 생략 없이 전체)
  // ===================================================================

  let onboardingActive = false;
  let guideIndex = 0;
  let guideTooltip = null;
  let guideOverlay = null;
  let profileStepClickCount = 0;
  let isTransitioning = false;

  const getSectionRect = (el) => {
    if (!el) return { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX,
      height: rect.height,
      width: rect.width,
    };
  };

  const guideSteps = [
    {
      msg: "Click keywords to reveal their deeper meaning.",
      target: '.purpose-section.section1 .swap-word'
    },
    {
      msg: "Drag this divider to resize the sections.",
      target: '.about-divider-hitzone',
      action: 'mousedown',
      actionRequired: true,
      pos: (el) => {
        const r = getSectionRect(el);
        return {
          top: r.top + r.height / 2 - (guideTooltip?.offsetHeight / 2 || 30),
          left: r.left + r.width + 25
        };
      }
    },
    {
      msg: "Clicks will reveal another side of me.",
      target: '#profilePhoto',
      customAction: 'handleProfileClicks'
    },
    {
      msg: "Click the ink blots for more details.",
      target: '.skill-card[data-skill-category="Strengths"] .skill-ink-blot'
    },
    {
      msg: "Toggle to see my skills differently.",
      target: '#skills-toggle'
    },
    {
      msg: "Click dots to learn more about me.",
      target: '.about-funfacts',
      pos: (el) => {
        const r = getSectionRect(el);
        return {
          top: r.bottom - 20,
          left: r.left + r.width / 2 - (guideTooltip?.offsetWidth || 280) / 2
        };
      },
      customAction: 'handleFunFactsStep'
    },
    {
      msg: "My AI assistant is here to help.",
      target: '#ai-assistant-FAB',
      hideSkipButton: true
    }
  ];

  function addGuideStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body.onboarding-active {
        overflow: hidden;
      }
      #guide-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.65);
        z-index: 9998;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      #guide-tooltip {
        position: absolute;
        background-color: var(--background-card);
        color: var(--text-primary-color);
        border: 1px solid var(--border-primary-color);
        padding: 18px 24px;
        border-radius: 12px;
        z-index: 10000;
        font-size: 1rem;
        line-height: 1.5;
        max-width: 280px;
        text-align: center;
        box-shadow: 0 10px 35px rgba(0,0,0,0.25);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }
      .onboarding-highlight {
        position: relative;
        z-index: 9999;
        outline: 1px solid rgba(255, 255, 255, 0.1);
        outline-offset: 8px;
        border-radius: 10px;
        transition: all 0.3s ease-in-out;
        transform: scale(1.02);
      }
      #ai-assistant-FAB.onboarding-highlight {
        z-index: 10002 !important;
        animation: pulse 1.2s infinite alternate;
        box-shadow: 0 0 20px 6px #20c2a055, 0 0 2px #1987FA;
        outline: 2px solid #20c2a0;
        outline-offset: 6px;
        background: linear-gradient(90deg, #1987FA22, #10C2A055);
        transition: box-shadow 0.3s, background 0.3s, outline 0.3s, transform 0.3s;
      }
      #ai-assistant-FAB.onboarding-highlight:hover,
      #ai-assistant-FAB.onboarding-highlight:active {
        transform: scale(1.1);
        box-shadow: 0 0 30px 12px #20c2a0aa, 0 0 8px #1987FA;
        outline: 3px solid #1987FA;
        background: linear-gradient(90deg, #10C2A055, #1987FA22);
      }
      @keyframes pulse {
        0% { transform: scale(1.02); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1.02); }
      }
      #guide-close-button {
        position: fixed;
        bottom: 30px;
        right: 40px;
        z-index: 10001;
        padding: 10px 20px;
        background: transparent;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.7);
        border-radius: 20px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: background-color 0.2s, color 0.2s;
      }
      #guide-close-button:hover {
        background-color: rgba(255, 255, 255, 1);
        color: #000;
      }
      .hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function waitForElement(selector, callback, timeout = 3000) {
    let elapsed = 0;
    const interval = 100;
    const timer = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(timer);
        callback();
      } else {
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(timer);
          console.warn(`Onboarding target not found after ${timeout}ms: ${selector}. Skipping step.`);
          progressToNextStep();
        }
      }
    }, interval);
  }

  function changeProfileImage() {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
      let currentImageIndex = parseInt(profileImage.src.match(/profile(\d+)\.png/)?.[1] || 1);
      const totalImages = 8;
      currentImageIndex = (currentImageIndex % totalImages) + 1;
      profileImage.src = `./img/profile${currentImageIndex}.png`;
    }
  }

  function handleProfileStep(e) {
    if (isTransitioning) return;
    profileStepClickCount++;
    changeProfileImage();
    if (profileStepClickCount >= 2) {
      isTransitioning = true;
      guideTooltip.style.opacity = '0';
      document.querySelector('.onboarding-highlight')?.classList.remove('onboarding-highlight');
      guideOverlay.removeEventListener('click', handleProfileStep);
      const profileEl = document.querySelector('#profilePhoto');
      if (profileEl) profileEl.removeEventListener('click', handleProfileStep);
      setTimeout(progressToNextStep, 800);
    }
    if (e && e.target && e.target.id === 'profilePhoto') {
      e.stopPropagation();
    }
  }

  function handleFunFactsStep(e) {
    if (isTransitioning) return;
    if (e.target.closest('#guide-tooltip, #guide-close-button')) return;
    isTransitioning = true;
    document.querySelector('.onboarding-highlight')?.classList.remove('onboarding-highlight');
    guideTooltip.style.opacity = '0';
    document.body.removeEventListener('click', handleFunFactsStep, { capture: true });
    setTimeout(progressToNextStep, 800);
  }

  function progressToNextStep() {
    guideIndex++;
    isTransitioning = false;
    if (guideIndex < guideSteps.length) {
      showGuideStep(guideIndex);
    } else {
      clearGuide();
    }
  }

  function showGuideStep(idx) {
    if (idx >= guideSteps.length) {
      clearGuide();
      return;
    }
    const step = guideSteps[idx];
    const closeButton = document.getElementById('guide-close-button');

    if (step.hideSkipButton) {
      closeButton.classList.add('hidden');
    } else {
      closeButton.classList.remove('hidden');
    }

    waitForElement(step.target, () => {
      const targetElement = document.querySelector(step.target);
      const scrollTargetElement = step.scrollTarget ? document.querySelector(step.scrollTarget) : targetElement;

      document.querySelector('.onboarding-highlight')?.classList.remove('onboarding-highlight');
      scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      setTimeout(() => {
        targetElement.classList.add('onboarding-highlight');

        const pos = step.pos ? step.pos(targetElement) : (() => {
          const rect = getSectionRect(targetElement);
          const tooltipWidth = guideTooltip.offsetWidth || 280;
          const tooltipHeight = guideTooltip.offsetHeight || 80;
          let top = rect.bottom + 15;
          let left = rect.left + rect.width / 2 - tooltipWidth / 2;
          if (rect.top < tooltipHeight + 20) { top = rect.bottom + 15; }
          else if (window.innerHeight - rect.bottom < tooltipHeight + 30) { top = rect.top - tooltipHeight - 15; }
          if (left < 10) left = 10;
          if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;
          return { top, left };
        })();

        guideTooltip.style.top = `${pos.top}px`;
        guideTooltip.style.left = `${pos.left}px`;
        guideTooltip.innerHTML = step.msg;
        guideTooltip.style.opacity = '1';

        // 리스너 정리(모든 디바이더 해제)
        guideOverlay.removeEventListener('click', handleGeneralStep);
        guideOverlay.removeEventListener('click', handleProfileStep);
        document.body.removeEventListener('click', handleFunFactsStep, { capture: true });
        const prevDividerTarget = document.querySelector('.about-divider-hitzone');
        if (prevDividerTarget) prevDividerTarget.removeEventListener('mousedown', handleDividerStep);
        const prevRealDivider = document.querySelector('.about-divider');
        if (prevRealDivider) prevRealDivider.removeEventListener('mousedown', handleDividerStep);
        const prevProfileTarget = document.querySelector('#profilePhoto');
        if (prevProfileTarget) prevProfileTarget.removeEventListener('click', handleProfileStep);
        const prevFabTarget = document.querySelector('#ai-assistant-FAB');
        if (prevFabTarget) prevFabTarget.removeEventListener('click', clearGuide);

        // --- 단계별 리스너 부착 ---
        if (step.actionRequired) {
          guideOverlay.style.cursor = 'default';
          guideOverlay.style.pointerEvents = 'none';
          // 가상 디바이더
          targetElement.addEventListener('mousedown', handleDividerStep, { once: true });
          // 실제 디바이더
          const realDivider = document.querySelector('.about-divider');
          if (realDivider) realDivider.addEventListener('mousedown', handleDividerStep, { once: true });
          // 온보딩 중 실제 디바이더 숨기고 싶다면
          if (realDivider) realDivider.style.visibility = 'visible'; // or 'hidden'으로 바꿔도 됨
        } else if (step.customAction === 'handleProfileClicks') {
          guideOverlay.style.cursor = 'pointer';
          guideOverlay.style.pointerEvents = 'auto';
          profileStepClickCount = 0;
          guideOverlay.addEventListener('click', handleProfileStep);
          targetElement.addEventListener('click', handleProfileStep);
        } else if (step.customAction === 'handleFunFactsStep') {
          guideOverlay.style.cursor = 'pointer';
          guideOverlay.style.pointerEvents = 'auto';
          document.body.addEventListener('click', handleFunFactsStep, { once: true, capture: true });
        } else if (step.target === '#ai-assistant-FAB') {
          guideOverlay.style.pointerEvents = 'none'; // FAB 클릭 허용
          targetElement.addEventListener('click', clearGuide, { once: true });
        } else {
          guideOverlay.style.cursor = 'pointer';
          guideOverlay.style.pointerEvents = 'auto';
          guideOverlay.addEventListener('click', handleGeneralStep, { once: true });
        }

      }, 600);
    });
  }

  function handleGeneralStep() {
    if (isTransitioning) return;
    isTransitioning = true;
    const step = guideSteps[guideIndex];
    const target = document.querySelector(step.target);

    if (target) {
      target.click();
      target.classList.remove('onboarding-highlight');
      guideTooltip.style.opacity = '0';
      setTimeout(progressToNextStep, 800);
    }
  }

  function handleDividerStep() {
    if (isTransitioning) return;
    isTransitioning = true;
    const purpose = document.querySelector('.about-purpose');
    const profile = document.querySelector('.about-profile');
    if (purpose && profile) {
      purpose.style.transition = 'width 0.4s ease-in-out';
      profile.style.transition = 'width 0.4s ease-in-out';
      purpose.style.width = `calc(45% - 2rem - 1.5px)`;
      profile.style.width = `calc(55% - 2rem - 1.5px)`;
    }
    document.querySelector('.onboarding-highlight')?.classList.remove('onboarding-highlight');
    guideTooltip.style.opacity = '0';
    setTimeout(progressToNextStep, 800);
  }

  function clearGuide() {
    document.body.classList.remove('onboarding-active');

    if (guideOverlay) {
      guideOverlay.removeEventListener('click', handleGeneralStep);
      guideOverlay.removeEventListener('click', handleProfileStep);
    }

    const dividerTarget = document.querySelector('.about-divider-hitzone');
    if (dividerTarget) dividerTarget.removeEventListener('mousedown', handleDividerStep);
    const realDivider = document.querySelector('.about-divider');
    if (realDivider) realDivider.removeEventListener('mousedown', handleDividerStep);

    const profileEl = document.querySelector('#profilePhoto');
    if (profileEl) profileEl.removeEventListener('click', handleProfileStep);

    document.body.removeEventListener('click', handleFunFactsStep, { capture: true });

    const fab = document.querySelector('#ai-assistant-FAB');
    if (fab) fab.removeEventListener('click', clearGuide);

    if (guideOverlay) guideOverlay.style.opacity = '0';
    if (guideTooltip) guideTooltip.style.opacity = '0';

      document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight', 'pulse'));

    const closeButton = document.getElementById('guide-close-button');
    if (closeButton) closeButton.classList.add('hidden');

    setTimeout(() => {
      document.getElementById('guide-container')?.remove();
    }, 500);

    sessionStorage.setItem('aboutOnboardingCompleted', 'true');
    onboardingActive = false;

    // 온보딩 종료 시 실제 디바이더 다시 보이게(만약 숨겼다면)
    if (realDivider) realDivider.style.visibility = '';
  }

  function startGuide() {
    if (onboardingActive || sessionStorage.getItem('aboutOnboardingCompleted') === 'true') return;
    onboardingActive = true;

    addGuideStyles();
    document.body.classList.add('onboarding-active');

    const guideContainer = document.createElement('div');
    guideContainer.id = 'guide-container';

    guideOverlay = document.createElement('div');
    guideOverlay.id = 'guide-overlay';
    guideOverlay.style.pointerEvents = 'auto';

    guideTooltip = document.createElement('div');
    guideTooltip.id = 'guide-tooltip';

    const closeButton = document.createElement('button');
    closeButton.id = 'guide-close-button';
    closeButton.textContent = 'Skip Tour';
    closeButton.onclick = clearGuide;

    guideContainer.append(guideOverlay, guideTooltip, closeButton);
    document.body.appendChild(guideContainer);

    // 온보딩 시작 시 실제 디바이더 숨김(원하면)
    const realDivider = document.querySelector('.about-divider');
    if (realDivider) realDivider.style.visibility = 'visible'; // 'hidden'도 가능

    setTimeout(() => {
      if (guideOverlay) guideOverlay.style.opacity = '1';
    }, 50);

    showGuideStep(0);
  }

  setTimeout(startGuide, 500);

  // ===================================================================
  // [기존 코드] about-main.js의 원래 기능들
  // ===================================================================

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP 또는 ScrollTrigger가 로드되지 않았습니다.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.section-background-active').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: () => section.classList.add('background-active'),
      onLeave: () => section.classList.remove('background-active'),
      onEnterBack: () => section.classList.add('background-active'),
      onLeaveBack: () => section.classList.remove('background-active'),
    });
  });

  document.querySelectorAll('.fact-icon, .value-icon, .skill-icon, .process-icon').forEach(icon => {
    icon.style.color = 'var(--gray-dark)';
  });

  const observer = new window.IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            entry.target,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              delay: i * 0.2,
              onComplete: () => entry.target.classList.add('in-view')
            }
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  document.querySelectorAll(
    '.skill-card, .value-card, .process-card, .funfact-card'
  ).forEach(el => observer.observe(el));

  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
      scrollTrigger: {
        trigger: title,
        start: "top bottom-=-100",
        toggleActions: "play none none reverse"
      },
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });
  });

  document.querySelectorAll('.section-toggle-row').forEach(row => {
    row.addEventListener('click', function() {
      const up = row.querySelector('.section-title-wrap.up');
      const down = row.querySelector('.section-title-wrap.down');
      const isOpen = up && up.style.display !== "none";
      if (isOpen) {
        up.style.opacity = 1;
        down.style.opacity = 0;
        up.style.transition = down.style.transition = "opacity 0.36s";
        up.style.opacity = 0;
        down.style.display = "flex";
        setTimeout(() => {
          up.style.display = "none";
          down.style.opacity = 1;
        }, 240);
      } else {
        down.style.opacity = 1;
        up.style.opacity = 0;
        down.style.transition = up.style.transition = "opacity 0.36s";
        down.style.opacity = 0;
        up.style.display = "flex";
        setTimeout(() => {
          down.style.display = "none";
          up.style.opacity = 1;
        }, 240);
      }
      const section = row.closest('section');
      if (section) {
        const content = section.querySelector('.section-content');
        if (content) {
          content.classList.toggle('collapsed', isOpen);
        }
      }
    });
    row.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' ') row.click();
    });
  });

  const aboutSkillsSection = document.querySelector('.about-skills');
  if (aboutSkillsSection) {
    ScrollTrigger.create({
      trigger: aboutSkillsSection,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: () => {
        aboutSkillsSection.classList.add('background-active');
      },
      onLeave: () => {
        aboutSkillsSection.classList.remove('background-active');
      },
      onEnterBack: () => {
        aboutSkillsSection.classList.add('background-active');
      },
      onLeaveBack: () => {
        aboutSkillsSection.classList.remove('background-active');
      },
    });
  }
});
