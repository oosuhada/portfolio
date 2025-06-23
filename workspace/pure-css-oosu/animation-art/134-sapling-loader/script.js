let $branch = '.branch';
let $leaves = '.leaves span';
let animation = new TimelineMax({repeat: -1, repeatDelay: 1}); // repeatDelay를 약간 늘려 여유를 줍니다.

animation.from($branch, 5, {scaleY: 0, ease: Power2.easeOut}, 'branch') // 나뭇가지 등장 시간과 이징을 부드럽게
    .staggerFrom($leaves, 0.7, {scale: 0, rotation: -90, opacity: 0, ease: Back.easeOut.config(1.7)}, 0.2, 0.5, 'branch') // 잎사귀 애니메이션에 회전과 투명도, 좀 더 탄력적인 이징 추가
    .to([$branch, $leaves], 3, {backgroundColor: '#a3d900', ease: Power1.easeInOut}) // 성장 후 활기찬 밝은 연두색으로 변경
    .to([$branch, $leaves], 1.5, {autoAlpha: 0, ease: Power1.easeOut}); // 사라지는 시간 약간 늘림