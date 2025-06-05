// === 로딩 효과 → 캐러셀 전환 ===
window.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hidden');
      document.getElementById('carouselScreen').classList.remove('hidden');
      document.getElementById('carouselScreen').classList.add('visible');
    }, 1800); // 로딩 1.8초
  });
  
  // === sheep screensaver ===
  const sheepSVG = `
  <svg viewBox="0 0 100 50" width="100" height="50">
    <ellipse cx="55" cy="30" rx="32" ry="17" fill="#fff"/>
    <ellipse cx="24" cy="32" rx="12" ry="11" fill="#fff"/>
    <ellipse cx="17" cy="26" rx="8" ry="7" fill="#191919"/>
    <ellipse cx="19" cy="26" rx="4" ry="3" fill="#fff"/>
    <ellipse cx="18" cy="21" rx="2" ry="2" fill="#191919"/>
    <ellipse cx="90" cy="30" rx="3" ry="4" fill="#191919"/>
    <ellipse cx="85" cy="26" rx="2" ry="3" fill="#191919"/>
    <ellipse cx="90" cy="37" rx="2" ry="1.6" fill="#191919"/>
    <ellipse cx="85" cy="36" rx="1.2" ry="1.7" fill="#191919"/>
    <rect class="leg leg1" x="38" y="44" width="4" height="20" rx="2" fill="#191919"/>
    <rect class="leg leg2" x="48" y="44" width="4" height="18" rx="2" fill="#191919"/>
    <rect class="leg leg3" x="60" y="44" width="4" height="20" rx="2" fill="#191919"/>
    <rect class="leg leg4" x="72" y="44" width="4" height="18" rx="2" fill="#191919"/>
  </svg>
  `;
  
  function createSheepField() {
    const sheepField = document.getElementById('sheepField');
    sheepField.innerHTML = '';
    const sheepCount = 5;
    const sheepSpacing = 120;
    for(let i=0;i<sheepCount;i++){
      const wrapper = document.createElement('div');
      wrapper.className = 'sheep-wrap';
      wrapper.style.position = 'absolute';
      wrapper.style.left = `${80 + i * sheepSpacing}px`;
      wrapper.style.bottom = `${40 + Math.random()*20}px`;
      wrapper.style.width = '100px';
      wrapper.style.height = '50px';
      wrapper.innerHTML = sheepSVG;
      sheepField.appendChild(wrapper);
    }
    // 걷기(다리) + 이동 애니메이션
    document.querySelectorAll('.sheep-wrap').forEach((el, idx) => {
      // 다리 흔들기
      const legs = el.querySelectorAll('.leg');
      gsap.to(legs[0], {rotation: 25, yoyo: true, repeat: -1, transformOrigin:"50% 0%", duration: 0.38, ease: "sine.inOut", delay: 0.13 * idx});
      gsap.to(legs[1], {rotation: -25, yoyo: true, repeat: -1, transformOrigin:"50% 0%", duration: 0.42, ease: "sine.inOut", delay: 0.09 * idx});
      gsap.to(legs[2], {rotation: 23, yoyo: true, repeat: -1, transformOrigin:"50% 0%", duration: 0.4, ease: "sine.inOut", delay: 0.15 * idx});
      gsap.to(legs[3], {rotation: -22, yoyo: true, repeat: -1, transformOrigin:"50% 0%", duration: 0.39, ease: "sine.inOut", delay: 0.12 * idx});
      // 양 걷기 이동 (좌→우)
      const startX = 80 + idx * sheepSpacing;
      const endX = window.innerWidth - 120;
      gsap.fromTo(el, 
        {x:0}, 
        {x:endX - startX, duration: 10 + Math.random()*4, ease:"linear", repeat: -1, delay: idx * 0.6,
          onRepeat:()=>{ el.style.bottom = `${40 + Math.random()*20}px`; }
        }
      );
    });
  }
  
  // === Carousel main menu ===
  const N = 7;
  const carousel = document.getElementById('carousel');
  let posters = [];
  let angleStep = 360 / N;
  let current = 0;
  let animating = false;
  
  // 포스터 데이터(양 screensaver도 포함)
  const posterData = [
    {label:"Sheep",      color:"#80d4ff"},
    {label:"Motion",     color:"#f8d857"},
    {label:"WebGL",      color:"#c3a9fa"},
    {label:"Pixi.js",    color:"#aeffe3"},
    {label:"UI Design",  color:"#f7c7c7"},
    {label:"Fun",        color:"#fff"},
    {label:"Canvas",     color:"#b3e5fc"}
  ];
  
  for (let i = 0; i < N; i++) {
    const div = document.createElement('div');
    div.className = 'poster';
    div.innerHTML = posterData[i].label;
    div.style.background = `linear-gradient(135deg, ${posterData[i].color} 85%, #191927 100%)`;
    carousel.appendChild(div);
    posters.push(div);
  
    // Sheep 선택시 screensaver로 전환
    div.addEventListener('click', () => {
      if (animating) return;
      if (i === 0) showSheep();
      else rotateTo(i);
    });
  }
  
  function updatePositions() {
    for (let i = 0; i < N; i++) {
      let angle = ((i - current + N) % N) * angleStep;
      let rad = angle * Math.PI / 180;
      let x = Math.sin(rad) * 210;
      let y = -Math.cos(rad) * 210;
      let scale = (angle === 0) ? 1.17 : 0.92 + 0.14 * Math.cos(rad);
      let z = Math.cos(rad) * 200;
      let opacity = (angle > 180 && angle < 360) ? 0.33 : 0.97;
      posters[i].style.zIndex = Math.round(z) + 200;
      gsap.to(posters[i], 1.0, {
        x: x, y: y, scale: scale,
        opacity: opacity,
        rotationY: angle,
        ease: "power3.inOut"
      });
      if (i === current) posters[i].classList.add('active');
      else posters[i].classList.remove('active');
    }
  }
  function rotateTo(idx) {
    if (animating) return;
    animating = true;
    current = idx;
    updatePositions();
    setTimeout(() => { animating = false; }, 800);
  }
  carousel.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (animating) return;
    let dir = (e.deltaY > 0) ? 1 : -1;
    current = (current + dir + N) % N;
    updatePositions();
  });
  updatePositions();
  
  // === 화면 전환 ===
  const sheepScreen = document.getElementById('sheepScreen');
  const carouselScreen = document.getElementById('carouselScreen');
  const backToCarouselBtn = document.getElementById('backToCarouselBtn');
  
  function showSheep() {
    carouselScreen.classList.remove('visible'); carouselScreen.classList.add('hidden');
    sheepScreen.classList.remove('hidden'); sheepScreen.classList.add('visible');
    createSheepField();
  }
  function backToCarousel() {
    sheepScreen.classList.remove('visible'); sheepScreen.classList.add('hidden');
    carouselScreen.classList.remove('hidden'); carouselScreen.classList.add('visible');
  }
  backToCarouselBtn.addEventListener('click', backToCarousel);
  