document.addEventListener('DOMContentLoaded', function () {
  // ===== [1] 변수 선언 =====
  const skip = localStorage.getItem('skipPreloader');
  const preloader = document.getElementById("preloader");
  const mainContent = document.querySelector(".main-content");
  const guideOverlay = document.getElementById('guide-overlay');
  const guideTooltip = document.getElementById('guide-tooltip');
  const names = ["Oosu", "우수", "佑守", "優秀", "憂愁"];
  const scales = [1, 1.1, 1.2, 1.3];
  const scalePercents = [10, 30, 60, 100];

  // ===== 수정된 부분 시작 =====
  // profileImgs 배열을 profile/1.png부터 profile/58.png까지 동적으로 생성
  const profileImgs = [];
  for (let i = 1; i <= 58; i++) {
    profileImgs.push(`profile/${i}.png`);
  }
  // ===== 수정된 부분 끝 =====

  const heroBgClasses = [
    "hero-bg-img-small",
    "hero-bg-img-medium",
    "hero-bg-img-large",
    "hero-bg-img-xlarge"
  ];
  const sliderTexts = document.querySelectorAll('.slider-text');
  const sliderDots = document.querySelectorAll('.hero-slider-dots .slider-dot');
  const heroSection = document.getElementById('hero');
  const hoverName = document.querySelector('.hover-name');
  const hoverImg = document.querySelector('.hover-img');
  const gaugeBar = document.querySelector('.gauge-bar');
  const scrollIcon = document.querySelector('.scroll-indicator');
  const projects = Array.from(document.querySelectorAll('.project'));
  const projectInfos = Array.from(document.querySelectorAll('.project-info'));
  const footer = document.querySelector('footer');

  let nameIndex = 0;
  let scaleIndex = 0;
  let currentSlide = 0;
  let sliderInterval = null;
  let sliderPaused = false;
  let onboardingActive = false;
  let guideIndex = 0;

  // 이미지 자동 순환 인덱스
  let profileImgIndex = 0;
  let profileImgInterval = null;

  // ===== [2] 함수 정의 =====
  function setHeroBgClass(bgClass) {
    heroSection.classList.remove(
      "hero-bg-default",
      ...names.map((_, i) => `hero-bg-name-${i}`),
      ...Array.from(sliderDots).map((_, i) => `hero-bg-dot-${i}`),
      ...heroBgClasses
    );
    heroSection.classList.add(bgClass);
  }
  function setGauge(percent) {
    if (gaugeBar) gaugeBar.style.width = `${percent}%`;
  }
  function setImgScaleCustom(idx) {
    if (hoverImg) {
      hoverImg.style.setProperty('--img-scale', scales[idx]);
      hoverImg.style.transform = `scale(${scales[idx]})`;
      setGauge(scalePercents[idx]);
      // 배경 연동 필요시 아래 주석 해제
      setHeroBgClass(heroBgClasses[idx]);
    }
  }
  function resetImgAndGauge() {
    scaleIndex = 0;
    setImgScaleCustom(scaleIndex);
  }
  function showSlide(idx) {
    sliderTexts.forEach((el, i) => el.classList.toggle('active', i === idx));
    sliderDots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
    currentSlide = idx;
    setHeroBgClass(`hero-bg-dot-${idx}`);
  }
  function startSliderAutoPlay() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
      if (!sliderPaused && !onboardingActive) {
        let next = (currentSlide + 1) % sliderTexts.length;
        showSlide(next);
      }
    }, 6000);
  }
  // 이미지 자동 변경
  function startProfileImgAutoPlay() {
    if (profileImgInterval) clearInterval(profileImgInterval);
    profileImgIndex = 0; // 항상 첫 번째 이미지(profile/1.png)부터 시작
    if (hoverImg && profileImgs.length > 0) { // hoverImg와 profileImgs 배열이 유효한지 확인
        hoverImg.src = profileImgs[profileImgIndex];
    }
    profileImgInterval = setInterval(() => {
      profileImgIndex = (profileImgIndex + 1) % profileImgs.length;
      if (hoverImg && profileImgs.length > 0) { // hoverImg와 profileImgs 배열이 유효한지 확인
          hoverImg.src = profileImgs[profileImgIndex];
      }
    }, 1000); // 1초 간격
  }
  function hideAllSparkles() {
    ['#sparkle-name', '#sparkle-dot', '#sparkle-img'].forEach(sel => {
      const sp = document.querySelector(sel);
      if (sp) sp.style.display = 'none';
    });
  }
  function setUnderline(selector, add, extraPx = 0) {
    document.querySelectorAll('.guide-underline').forEach(el => {
      el.classList.remove('guide-underline');
      el.style.setProperty('--underline-extra', '0px');
    });
    if (add && selector) {
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('guide-underline');
        if (extraPx > 0) {
          el.style.setProperty('--underline-extra', extraPx + 'px');
        }
      }
    }
  }
  function getSectionRect(el) {
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    return {
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      bottom: rect.bottom + scrollY,
      right: rect.right + scrollX,
      height: rect.height,
      width: rect.width
    };
  }
  function setProjectActive(idx) {
    projectInfos.forEach((info, i) => {
      info.classList.toggle('active', i === idx);
      info.classList.remove('fade-out', 'fade-in', 'slide-out');
    });
    projects.forEach((proj, i) => {
      proj.classList.toggle('active', i === idx);
    });
  }
  function hideAllProjectInfo() {
    projectInfos.forEach(info => info.classList.remove('active'));
    projects.forEach(proj => proj.classList.remove('active'));
  }
  function onScroll() {
    if (onboardingActive) return;
    const scroll = window.scrollY || window.pageYOffset;
    const heroBottom = getSectionRect(heroSection).bottom;
    const footerTop = getSectionRect(footer).top;
    let foundProject = false;
    projects.forEach((proj, idx) => {
      const rect = getSectionRect(proj);
      if (
        scroll + window.innerHeight / 2 >= rect.top &&
        scroll + window.innerHeight / 2 < rect.bottom
      ) {
        setProjectActive(idx);
        foundProject = true;
      }
    });
    if (scroll < heroBottom - 100 || scroll + 80 > footerTop) {
      hideAllProjectInfo();
    }
  }
  function hideProjectInfoIfFooterVisible() {
    if (!footer) return;
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    document.querySelectorAll('.project-info.active').forEach(info => {
      if (info.closest('#project5')) {
        const isFooterVisible = footerTop < windowHeight - 100;
        if (isFooterVisible) info.classList.remove('active');
      } else {
        const isFooterVisible = footerTop < windowHeight - 10;
        if (isFooterVisible) info.classList.remove('active');
      }
    });
  }
  function setSparkleDisplay(idx) {
    guideSteps.forEach((step, i) => {
      const sp = document.querySelector(step.sparkle);
      if (sp) sp.style.display = (i === idx ? 'inline-block' : 'none');
    });
  }
  function showGuideStep(idx) {
    const step = guideSteps[idx];
    const extraPx = (idx === 1) ? 48 : 0;
    setUnderline(step.target, true, extraPx);
    setSparkleDisplay(idx);
    const el = document.querySelector(step.target);
    if (el && step.pos && guideTooltip) {
      const pos = step.pos(el);
      guideTooltip.style.position = "absolute";
      guideTooltip.style.top = pos.top + 'px';
      guideTooltip.style.left = pos.left + 'px';
    }
    if (guideTooltip) {
      guideTooltip.textContent = step.msg;
      guideTooltip.style.opacity = "1";
    }
  }
  function clearGuide(isSkip) {
    if (guideOverlay) guideOverlay.style.display = "none";
    setUnderline(null, false);
    onboardingActive = false;
    guideIndex = 0;
    setImgScaleCustom(scales.length - 1);
    showSlide(sliderTexts.length - 1);
    startSliderAutoPlay();
    document.body.classList.remove('no-scroll');
    if (isSkip) {
      if (scrollIcon) {
        scrollIcon.classList.add('show');
        scrollIcon.style.opacity = "1";
        scrollIcon.style.pointerEvents = "auto";
      }
      setTimeout(() => {
        onScroll();
        hideProjectInfoIfFooterVisible();
      }, 100);
    }
  }
  function startGuide() {
    onboardingActive = true;
    guideIndex = 0;
    guideOverlay.style.display = "block";
    resetImgAndGauge();
    showGuideStep(guideIndex);
    document.body.classList.add('no-scroll');
  }

  // [3] 온보딩 guideSteps (함수에서 쓸 수 있도록 함수보다 위로 올리면 오류!)
  const guideSteps = [
    {
      msg: "Click 'Oosu'",
      target: '.hover-name',
      sparkle: '#sparkle-name',
      pos: (el) => {
        const r = getSectionRect(el);
        return { top: r.top - 58, left: r.left - 62 };
      }
    },
    {
      msg: "Click slider dots",
      target: '.slider-dot[data-index=\"0\"]',
      sparkle: '#sparkle-dot',
      pos: (el) => {
        const r = getSectionRect(el);
        return { top: r.bottom + 12, left: r.left - 10 };
      }
    },
    {
      msg: "Click profile image",
      target: '.hover-img',
      sparkle: '#sparkle-img',
      pos: (el) => {
        const r = getSectionRect(el);
        return { top: r.top - 10, left: r.left - 1 };
      }
    },
    {
      msg: "Click profile image",
      target: '.hover-img',
      sparkle: '#sparkle-img',
      pos: (el) => {
        const r = getSectionRect(el);
        return { top: r.top - 10, left: r.left - 1 };
      }
    },
    {
      msg: "Click profile image",
      target: '.hover-img',
      sparkle: '#sparkle-img',
      pos: (el) => {
        const r = getSectionRect(el);
        return { top: r.top - 10, left: r.left - 1 };
      }
    }
  ];

  // ===== [4] 이벤트 바인딩/초기화 =====

  // 페이지 진입시 초기상태 및 이미지 자동 재생 시작
  setImgScaleCustom(scaleIndex);
  startProfileImgAutoPlay(); // 여기가 수정된 profileImgs 배열을 사용합니다.

  // 이름 클릭: 이름/배경 전환
  hoverName.addEventListener('click', () => {
    if (!onboardingActive) {
      const sparkleName = document.querySelector('#sparkle-name');
      if (sparkleName && sparkleName.style.display !== "none") {
        sparkleName.style.display = "none";
      }
    }
    nameIndex = (nameIndex + 1) % names.length;
    hoverName.textContent = names[nameIndex];
    setHeroBgClass(`hero-bg-name-${nameIndex}`);
  });

  // 프로필 이미지 클릭: 스케일만 바꿈 (이미지는 자동)
  hoverImg.addEventListener('click', () => {
    if (!onboardingActive) {
      const sparkleImg = document.querySelector('#sparkle-img');
      if (sparkleImg && sparkleImg.style.display !== "none") {
        sparkleImg.style.display = "none";
      }
    }
    scaleIndex = (scaleIndex + 1) % scales.length;
    setImgScaleCustom(scaleIndex);
  });

  // 슬라이더 dot 클릭
  sliderDots.forEach((dot, idx) => {
    dot.addEventListener('click', function () {
      if (!onboardingActive) {
        const sparkleDot = document.querySelector('#sparkle-dot');
        if (sparkleDot && sparkleDot.style.display !== "none" && idx === 0) {
          sparkleDot.style.display = "none";
        }
        showSlide(idx);
        sliderPaused = true;
        setTimeout(() => sliderPaused = false, 4000);
      }
    });
  });

  // scroll-indicator (PORTFOLIO로 이동)
  if (scrollIcon) {
    scrollIcon.addEventListener('click', function () {
      const portfolioSection = document.getElementById('portfolio');
      if (portfolioSection) {
        portfolioSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // PROJECT SECTION 스크롤 연동
  hideAllProjectInfo();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', hideProjectInfoIfFooterVisible);
  setTimeout(() => { onScroll(); }, 100);

  // 온보딩 GUIDE 클릭
  guideOverlay.addEventListener('click', function () {
    if (!onboardingActive) return;
    if (guideIndex === 0) {
      nameIndex = (nameIndex + 1) % names.length;
      hoverName.textContent = names[nameIndex];
      setHeroBgClass(`hero-bg-name-${nameIndex}`);
    } else if (guideIndex === 1) {
      showSlide(1);
    } else if (guideIndex >= 2 && guideIndex <= 4) {
      if (scaleIndex < scales.length - 1) {
        scaleIndex++;
        setImgScaleCustom(scaleIndex);
      }
    }
    guideIndex++;
    if (guideIndex < guideSteps.length) {
      showGuideStep(guideIndex);
    } else {
      clearGuide();
    }
  });
  if (guideTooltip) {
    guideTooltip.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  // ===== [5] 프리로더/온보딩 스킵 분기 =====
  if (skip === '1') {
    if (preloader) preloader.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    if (guideOverlay) guideOverlay.style.display = 'none';
    document.body.classList.remove('no-scroll');
    localStorage.removeItem('skipPreloader');
    clearGuide(true);
    return;
  }

  // ===== [6] 프리로더/온보딩 진행 =====
  document.body.classList.add('no-scroll');
  const loadingText = document.getElementById("loadingText");
  const words = [...names];
  let index = 0;
  const interval = setInterval(() => {
    if (loadingText) loadingText.textContent = words[index = (index + 1) % words.length];
  }, 100);

  if (guideOverlay) guideOverlay.style.display = "none";

  window.addEventListener("load", () => {
    setTimeout(() => {
      if (preloader) {
        preloader.style.opacity = 0;
        preloader.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          preloader.style.display = "none";
          if (mainContent) mainContent.style.display = 'block';
          clearInterval(interval);
          setTimeout(function () {
            startGuide();
          }, 400);
          localStorage.setItem('skipPreloader', '1');
        }, 500);
      }
    }, 300);
  });
});