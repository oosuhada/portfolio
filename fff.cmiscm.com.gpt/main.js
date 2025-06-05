// ===== 프리로더: 0.8초 후 바로 fadeOut, 캐러셀 자동 스크롤 등장 애니메이션 ===== //
$(function() {
  setTimeout(() => {
      $('#preloader').css('opacity', '0');
      setTimeout(() => {
          $('#preloader').hide();
          $('#main').fadeIn(350, function () {
              runCarousel(true); // 자동 스크롤 등장 애니메이션 실행
          });
      }, 100); // fadeOut 시간
  }, 500); // 프리로더 표시 시간
});

function renderLabels(centerIdx, visibleCount = 5) {
  const $carousel = $('.carousel');
  const $labels = $('.carousel-labels');
  const $posters = $carousel.find('.poster');
  const n = $posters.length;
  $labels.empty();

  // 가운데 기준 visibleCount만큼만 표시
  const half = Math.floor(visibleCount / 2);

  // 카드의 곡선/기울기와 동일한 파라미터 (카드 쪽과 동일하게 맞추기)
  const angleStep = 26;      // 기존 28 → 36으로 늘림 (더 벌어짐)
  const curveRadius = 700;   // 기존 550 → 800으로 늘림 (더 벌어짐)
  const verticalOffset = 250; // 세로 높이도 카드 위에 딱 맞추고 싶으면 같이 조정

  for (let i = 0; i < n; i++) {
    let rel = ((i - centerIdx + n) % n + Math.floor(n/2)) % n - Math.floor(n/2); // 카드와 동일한 상대 인덱스
    // 가운데 visibleCount개만 표시, 나머지는 opacity 0
    let opacity = (Math.abs(rel) <= half) ? 1 : 0;

    // 카드와 동일한 위치, 곡선, 기울기 계산
    const rad = rel * angleStep * Math.PI / 180;
    const x = Math.sin(rad) * curveRadius;
    const y = verticalOffset - Math.cos(rad) * (curveRadius * 0.38); // 카드와 동일한 방식
    const rotate = rad * (180 / Math.PI) * 0.55;

    const $label = $(
      `<div class="label" style="
        opacity: ${opacity};
        transform:
          translate(-50%, 0)
          translate(${x}px, ${y}px)
          rotate(${rotate}deg);
        z-index: ${100 - Math.abs(rel)};
      ">${$posters.eq(i).data('title') || ''}</div>`
    );

    $labels.append($label);
  }
}

// ===== 캐러셀 효과 구현 (GSAP) with Directional Bounce =====
function runCarousel(isFirst) {
  const $carousel = $('.carousel');
  const $posters = $carousel.find('.poster');
  const n = $posters.length;
  let center = Math.floor(n / 2);
  let lastCenter = center; // 이전 센터 위치 추적
  const maxVisible = 6;
  let isEntranceAnimation = isFirst; // 등장 애니메이션 플래그 추가
  
  function renderCarousel(centerIdx = center, animate = true) {
    const R = 550;
    const verticalOffset = 190;
    const cardAngle = 28;
    const scaleStep = 0.085;
    
    // 이동 방향 계산 (등장 애니메이션 중이 아닐 때만)
    let moveDirection = 0;
    if (animate && lastCenter !== centerIdx && !isEntranceAnimation) {
      const diff = centerIdx - lastCenter;
      const normalizedDiff = ((diff + Math.floor(n/2)) % n) - Math.floor(n/2);
      moveDirection = normalizedDiff > 0 ? 1 : -1;
    }
    
    $posters.each(function(i) {
      let rel = ((i - centerIdx + n) % n + Math.floor(n/2)) % n - Math.floor(n/2);
      const visible = Math.abs(rel) <= maxVisible;
      const angle = rel * cardAngle * (Math.PI / 180);
      const x = Math.sin(angle) * R;
      const y = verticalOffset - Math.cos(angle) * (R * 0.38);
      const rotation = angle * (180 / Math.PI) * 0.55;
      const scale = 1 - Math.abs(rel) * scaleStep;
      const z = 1000 - Math.abs(rel) * 60;
      const opacity = visible ? 1 : 0;
      
      // 센터 카드인지 확인
      const isCenterCard = rel === 0;
      
      if (animate) {
        // 등장 애니메이션 중이거나 바운스 효과가 필요 없는 경우 일반 애니메이션
        if (isEntranceAnimation || !isCenterCard || moveDirection === 0) {
          gsap.to(this, {
            duration: isEntranceAnimation ? 0.6 : 0.8, // 등장시 조금 더 빠르게
            x: x, 
            y: y, 
            rotation: rotation, 
            scale: scale,
            zIndex: z, 
            opacity: opacity, 
            ease: isEntranceAnimation ? "power2.out" : "expo.out"
          });
        } else {
          // 일반 사용자 조작시에만 바운스 효과 적용
          const timeline = gsap.timeline();
          const bounceMultiplier = moveDirection;
          const overshootX = x + (15 * bounceMultiplier);
          const overshootRotation = rotation + (12 * bounceMultiplier);
          
          timeline
            .to(this, {
              duration: 0.66,
              x: overshootX,
              rotation: overshootRotation,
              ease: "power2.out"
            })
            .to(this, {
              duration: 0.22,
              x: x,
              rotation: rotation,
              ease: "power1.out"
            });
          
          gsap.to(this, {
            duration: 0.38,
            y: y,
            scale: scale,
            zIndex: z,
            opacity: opacity,
            ease: "expo.out"
          });
        }
      } else {
        gsap.set(this, {
          x: x, 
          y: y, 
          rotation: rotation, 
          scale: scale,
          zIndex: z, 
          opacity: opacity
        });
      }
    });
    
    // ==== 라벨 동기화 ====
    renderLabels(centerIdx, 5);
  }

  // 최초 진입: 회전하는 캐러셀 등장 애니메이션
  if (isFirst) {
    // 캐러셀을 먼저 숨김
    $carousel.css('opacity', 0);
    
    // 시작 위치를 왼쪽으로 3칸 이동한 위치로 설정
    let startCenter = (center - 6 + n) % n;
    renderCarousel(startCenter, false);
    $posters.css('opacity', 0);
    
    // 캐러셀 전체가 나타남
    gsap.to($carousel[0], {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    });
    
    // 카드들이 먼저 나타남
    $posters.each(function(i) {
      gsap.to(this, {
        opacity: 1,
        duration: 0.4,
        delay: i * 0.06,
        ease: "power2.out"
      });
    });
    
    // 회전 애니메이션 시작
    setTimeout(() => {
      let currentCenter = startCenter;
      let rotationStep = 0;
      const totalSteps = 6; // 3칸 회전
      
      function rotateStep() {
        const prevCenter = currentCenter;
        currentCenter = (currentCenter + 1) % n;
        rotationStep++;
        
        // lastCenter는 애니메이션 완료 후에 업데이트하도록 지연
        setTimeout(() => {
          lastCenter = prevCenter;
        }, 300); // 애니메이션 절반 시점에서 업데이트
        
        renderCarousel(currentCenter, true);
        
        if (rotationStep < totalSteps) {
          // 일정한 간격으로 회전 (100ms로 통일)
          setTimeout(rotateStep, 100);
        } else {
          // 최종 중앙 위치로 이동
          setTimeout(() => {
            currentCenter = center;
            renderCarousel(center, true);
            
            // 등장 애니메이션 완료
            setTimeout(() => {
              isEntranceAnimation = false; // 등장 애니메이션 완료 플래그
              lastCenter = center; // 최종 위치로 업데이트
              setupCarouselEvents();
            }, 700); // 마지막 애니메이션 완료를 기다림
          }, 600);
        }
      }
      
      rotateStep();
    }, 800);
  } else {
    renderCarousel(center, false);
    setupCarouselEvents();
  }

  function setupCarouselEvents() {
    let isMoving = false;
    let isDragging = false;
    let startX = 0;
    let dragThreshold = 50;
    let pendingMoveQueue = []; // 대기 중인 이동 큐

    function moveTo(newCenter, userDirection = null) {
      const targetCenter = (newCenter + n) % n;
      
      if (isMoving) {
        // 이동 중이면 큐에 추가 (마지막 요청만 유지)
        pendingMoveQueue = [{target: targetCenter, direction: userDirection}];
        return;
      }
      
      isMoving = true;
      
      // 사용자 명시적 방향이 있으면 사용, 없으면 자동 계산
      if (userDirection !== null) {
        renderCarousel(targetCenter, true);
      } else {
        renderCarousel(targetCenter, true);
      }
      
      setTimeout(() => { 
        isMoving = false;
        
        // 대기 중인 이동이 있으면 실행
        if (pendingMoveQueue.length > 0) {
          const nextMove = pendingMoveQueue.shift();
          pendingMoveQueue = []; // 큐 비우기
          setTimeout(() => moveTo(nextMove.target, nextMove.direction), 50);
        }
      }, 900); // 바운스 애니메이션 시간 고려하여 조정
    }

    // 마우스 휠 이벤트 (명확한 방향성 제공)
    $carousel.off('wheel').on('wheel', function(e){
      e.preventDefault();
      if(e.originalEvent.deltaY > 0) {
        moveTo(center + 1, 1); // 명시적으로 시계방향
      } else {
        moveTo(center - 1, -1); // 명시적으로 반시계방향
      }
    });

    // 마우스 드래그 이벤트
    $carousel.off('mousedown').on('mousedown', function(e) {
      e.preventDefault();
      isDragging = true;
      startX = e.pageX;
      $carousel.css('cursor', 'grabbing');
    });

    $(document).off('mousemove.carousel').on('mousemove.carousel', function(e) {
      if (!isDragging) return;
      e.preventDefault();
    });

    $(document).off('mouseup.carousel').on('mouseup.carousel', function(e) {
      if (!isDragging) return;
      
      const deltaX = e.pageX - startX;
      $carousel.css('cursor', 'grab');
      isDragging = false;
      
      if (Math.abs(deltaX) > dragThreshold) {
        if (deltaX > 0) {
          moveTo(center - 1, -1); // 오른쪽 드래그 = 반시계방향
        } else {
          moveTo(center + 1, 1); // 왼쪽 드래그 = 시계방향
        }
      }
    });

    // 터치 이벤트 (모바일 지원)
    let startTouchX = 0;
    $carousel.off('touchstart').on('touchstart', function(e) {
      startTouchX = e.originalEvent.touches[0].pageX;
    });

    $carousel.off('touchend').on('touchend', function(e) {
      const endTouchX = e.originalEvent.changedTouches[0].pageX;
      const deltaX = endTouchX - startTouchX;
      
      if (Math.abs(deltaX) > dragThreshold) {
        if (deltaX > 0) {
          moveTo(center - 1, -1); // 오른쪽 스와이프 = 반시계방향
        } else {
          moveTo(center + 1, 1); // 왼쪽 스와이프 = 시계방향
        }
      }
    });

    // 카드 클릭 이벤트 - 개선된 버전
    $posters.off('click').on('click', function() {
      let idx = $posters.index(this);
      
      if(idx === center) {
        // 중앙 카드 클릭 시 모달 표시
        showModal($(this));
      } else {
        // 중앙이 아닌 카드 클릭 시 중앙으로 이동
        moveTo(idx);
      }
    });    

    // 마우스 커서 스타일
    $carousel.css('cursor', 'grab');
  }
}

// ===== 카드 클릭시 모달 =====
function showModal($poster) {
  const $carousel = $('.carousel');
  const $posters = $carousel.find('.poster');
  const idx = $posters.index($poster);
  const colorClass = $poster.attr('class').split(' ').find(c=>c.startsWith('poster-'));
  const bgColor = $poster.css('background-color');
  const title = $poster.data('title') || $poster.text();

  // 나머지 카드 순차 사라짐 + 좌측 배경 전환
  $posters.each(function(i) {
    if (i !== idx) {
      gsap.to(this, {
        opacity: 0,
        scale: 0.7,
        duration: 0.28 + i*0.05,
        delay: i*0.04,
        x: (i < idx ? -70 : 70),
        ease: "power2.in"
      });
    }
  });
  // 배경 컬러 전환
  gsap.to('.carousel-section', {
    backgroundColor: bgColor,
    duration: 0.38,
    delay: 0.1,
    ease: "power2.inOut"
  });

  // 선택 카드 scale-up → 좌/우 bounce
  gsap.to($poster, {
    scale: 1.18,
    rotate: -5,
    duration: 0.22,
    delay: 0.18,
    ease: "power1.inOut",
    onComplete: () => {
      gsap.to($poster, {
        scale: 1.26,
        rotate: 5,
        duration: 0.19,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to($poster, {
            x: "-64vw",
            opacity: 0,
            duration: 0.46,
            delay: 0.05,
            ease: "power2.in",
            onComplete: () => {
              showCardModalFFF(bgColor, colorClass, title);
            }
          });
        }
      });
    }
  });
}

function showCardModalFFF(bgColor, colorClass, title) {
  const $modal = $('#card-modal');
  const $modalPoster = $('.modal-poster');
  $modalPoster
    .attr('class', 'modal-poster ' + colorClass)
    .html(`${title}<span class="modal-x" style="position:absolute;right:28px;top:18px;font-size:2.1rem;cursor:pointer;">×</span>`)
    .css({background: bgColor, color: "#fff", opacity: 1, scale: 1, x: 0, y: 0});
  $modal.fadeIn(180);

  gsap.fromTo($modalPoster, {scale: 0.72, opacity: 0, y: 100}, {
    scale: 1,
    opacity: 1,
    y: 0,
    duration: 0.49,
    ease: "expo.out"
  });

  // X 클릭, 바깥 클릭 이벤트 바인딩 (1회성)
  $modal.off('click').on('click', '.modal-x, .modal-bg', function(e){
    e.stopPropagation();
    closeModalFFF();
  });
}

function closeModalFFF() {
  const $modal = $('#card-modal');
  const $modalPoster = $('.modal-poster');
  gsap.to($modalPoster, {
    scale: 0.65,
    opacity: 0,
    y: -120,
    duration: 0.5,
    ease: "power2.in",
    onComplete: () => {
      $modal.fadeOut(170, function() {
        $modalPoster.attr('class', 'modal-poster').html('').removeAttr('style');
        restoreCarouselFFF();
      });
    }
  });
  $(document).off('keydown.modal').on('keydown.modal', function(e){
    if(e.key === "Escape") closeModalFFF();
  });
}

function restoreCarouselFFF() {
  const $carousel = $('.carousel');
  const $posters = $carousel.find('.poster');
  $posters.each(function(i) {
    gsap.set(this, {opacity: 0, scale: 1, x: 0});
    gsap.to(this, {
      opacity: 1,
      scale: 1,
      x: 0,
      duration: 0.33,
      delay: 0.13 * i + 0.22,
      ease: "power2.out"
    });
  });
  gsap.to('.carousel-section', {
    backgroundColor: "#fff",
    duration: 0.5,
    delay: 0.2,
    ease: "power2.inOut"
  });
}