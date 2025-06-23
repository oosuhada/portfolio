const SIDE_LENGTH = 15 // 그리드 밀도 증가 (기존 10 -> 15)

function createDomElements() {
    let dom = {
        container: document.querySelector('.container'),
        horizontal: document.querySelector('.horizontal'),
        vertical: document.querySelector('.vertical'),
    }
    
    dom.container.style.setProperty('--side-length', SIDE_LENGTH)

    Array(SIDE_LENGTH * SIDE_LENGTH).fill('').forEach(() => {
        dom.horizontal.appendChild(document.createElement('span'))
    })
    dom.vertical.innerHTML = dom.horizontal.innerHTML
}

function animation() {
    let animation = new TimelineMax({repeat: -1, yoyo: true}); // yoyo: true 추가로 애니메이션이 역재생되도록 설정
    let $horizontalSpan = '.container .horizontal span';
    let $verticalSpan = '.container .vertical span';
    
    // 수평 요소 애니메이션 수정
    animation.to($horizontalSpan, 0.8, {rotation: 90, scaleX: 0.8, scaleY: 1.5, ease: Power1.easeInOut}, 'step1') // 회전 각도 및 스케일 변경, ease 추가
        .to($horizontalSpan, 0.8, {x: '-20px', y: '-20px', backgroundColor: '#FF66B2', ease: Power1.easeInOut}, 'step2') // 이동 거리 및 색상 변경
        .to($horizontalSpan, 0.8, {rotation: 0, x: '0', y: '0', scaleX: 1.2, scaleY: 0.8, ease: Power1.easeInOut}, 'step3') // 원위치 및 스케일 변경
        .to($horizontalSpan, 0.8, {rotation: 180, scaleX: 1, scaleY: 1, backgroundColor: '#66e0da', ease: Power1.easeInOut}, 'step4') // 최종 회전 및 색상 복원
        
    // 수직 요소 애니메이션 수정
    animation.to($verticalSpan, 0.8, {rotation: 90, scaleX: 1.5, scaleY: 0.8, ease: Power1.easeInOut}, 'step1') // 회전 각도 및 스케일 변경, ease 추가
        .to($verticalSpan, 0.8, {x: '20px', y: '20px', backgroundColor: '#B266FF', ease: Power1.easeInOut}, 'step2') // 이동 거리 및 색상 변경
        .to($verticalSpan, 0.8, {x: '0', y: '0', scaleX: 0.8, scaleY: 1.2, ease: Power1.easeInOut}, 'step3') // 원위치 및 스케일 변경
        .to($verticalSpan, 0.8, {rotation: 180, scaleX: 1, scaleY: 1, backgroundColor: '#ff9966', ease: Power1.easeInOut}, 'step4') // 최종 회전 및 색상 복원
    
    animation.timeScale(1.5); // 애니메이션 속도 조절 (기존 2 -> 1.5로 약간 느리게)
}

function init() {
    createDomElements()
    animation()
}

window.onload = init