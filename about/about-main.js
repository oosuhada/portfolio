// about-main.js
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP 또는 ScrollTrigger가 로드되지 않았습니다.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

   // 주요 섹션 전체 반복 적용
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
  
  // 아이콘 색상 통일 (공통)
  document.querySelectorAll('.fact-icon, .value-icon, .skill-icon, .process-icon').forEach(icon => {
    icon.style.color = 'var(--gray-dark)';
  });

  // 카드 등장 in-view 애니메이션
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

  // 섹션 타이틀 등장 애니메이션
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

  // 토글 타이틀(▲/▼) 전체영역 클릭시 디졸브 전환 및 섹션 접기/펼치기
  document.querySelectorAll('.section-toggle-row').forEach(row => {
    row.addEventListener('click', function() {
      const up = row.querySelector('.section-title-wrap.up');
      const down = row.querySelector('.section-title-wrap.down');
      const isOpen = up && up.style.display !== "none";
      // 디졸브 아웃/인
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
      // section-content 토글
      const section = row.closest('section');
      if (section) {
        const content = section.querySelector('.section-content');
        if (content) {
          content.classList.toggle('collapsed', isOpen);
        }
      }
    });
    // 키보드 접근성 (Enter/Space)
    row.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' ') row.click();
    });
  });

  // =============== 추가된 코드 시작 ===============
  // about-skills 섹션 배경색 활성화 ScrollTrigger
  const aboutSkillsSection = document.querySelector('.about-skills');
  if (aboutSkillsSection) {
    ScrollTrigger.create({
      trigger: aboutSkillsSection,
      start: "top 75%", // 섹션 상단이 뷰포트 상단에서 75% 지점에 도달했을 때
      end: "bottom 25%", // 섹션 하단이 뷰포트 상단에서 25% 지점을 넘어갈 때
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
      // markers: true, // 디버깅용: ScrollTrigger 위치를 시각적으로 표시
    });
  }
  // =============== 추가된 코드 끝 ===============
});