// texthero.js (바닐라 JS와 Three.js 및 GSAP 활용)

// --- Three.js 관련 모듈 임포트 ---
// 라이브러리 파일은 모두 ../lib/ 폴더에 있다고 가정합니다.
import * as THREE from '../lib/three-module-min.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

// GSAP 플러그인 등록 (HTML에서 CDN으로 로드되므로 여기에 import는 필요 없음)
// 그러나 GSAP 관련 기능을 사용하기 위해 아래에서 gsap.registerPlugin(ScrollTrigger)를 호출합니다.

// DOM 요소 참조
const listItemWrapper = document.getElementById("list-item-wrapper"); // 목록 항목 래퍼 요소
const listItems = document.querySelectorAll(".list-item"); // 모든 목록 항목 요소
const skillsShowcaseSection = document.getElementById("skills-showcase-section"); // 스킬 쇼케이스 섹션 요소
const threeDContainer = document.querySelector('.skills-3d-container'); // 3D 컨테이너 요소

let listStyleChangeStartY; // 목록 스타일 변경 시작 스크롤 Y 위치
let listStyleChangeEndY; // 목록 스타일 변경 종료 스크롤 Y 위치
let division; // 각 목록 항목 활성화 영역의 높이
let currentIndex = -1; // 현재 활성화된 목록 항목의 인덱스
let isTextheroAnimationActive = true; // 텍스트 히어로 애니메이션 활성화 상태 (true: 활성, false: 비활성)
let animationFrameId = null; // 목록 항목 하이라이팅을 위한 requestAnimationFrame ID

// --- Three.js 변수 ---
let scene, camera, renderer; // Three.js 씬, 카메라, 렌더러
let grapeModel; // 3D 애니메이션에 필요한 포도 모델
let scrollTimeline; // GSAP ScrollTrigger 타임라인

// 전역 변수로 조명들을 선언하여 나중에 접근할 수 있도록 합니다.
let ambientLight, dirLight1, dirLight2, dirLight3;

// 포도 애니메이션 경로 정의 (모델 위치, 스케일, 회전)
// modelY 값은 위에서 아래로 움직이도록 변경되었고, modelScale은 기본값보다 크게 설정되었습니다.
const GRAPE_ANIMATION_PATH = [
    // 등장: 작고 투명하게 시작
    { modelX: 0, modelY: 2, modelZ: 0, modelScale: 0.25, modelRotY: 0, opacity: 0.25 },
    // 중간1: 점점 커지고 선명하게
    { modelX: 0.3, modelY: 0.5, modelZ: 0, modelScale: 0.7, modelRotY: Math.PI, opacity: 1 },
    // 중간2: 계속 커진 상태 유지 (optional, 아니면 삭제)
    { modelX: -0.3, modelY: -0.8, modelZ: 0, modelScale: 0.6, modelRotY: Math.PI * 1.5, opacity: 1 },
    // 하단: 다시 작아지고 투명하게
    { modelX: 0, modelY: -2, modelZ: 0, modelScale: 0.25, modelRotY: Math.PI * 2, opacity: 0.25 }
];

// --- Three.js 씬 초기화 ---
function init3DScene() {
    console.log("init3DScene: 3D 씬 초기화 시작.");
    if (!threeDContainer) {
        console.error("init3DScene: '.skills-3d-container' 요소를 찾을 수 없습니다. HTML에 있는지 확인하세요.");
        return;
    }

    // 씬 생성
    scene = new THREE.Scene();
    console.log("init3DScene: THREE.Scene 생성됨.");

    // 카메라 생성
    camera = new THREE.PerspectiveCamera(
        40, // 시야각 (Field of View): 40도
        threeDContainer.clientWidth / threeDContainer.clientHeight, // 종횡비 (Aspect Ratio)
        0.1, // 니어 클리핑 플레인 (Near Clipping Plane)
        1000 // 파 클리핑 플레인 (Far Clipping Plane)
    );
    camera.position.set(0, 0, 5); // 카메라 기본 위치 (X:0, Y:0, Z:5)
    console.log("init3DScene: THREE.PerspectiveCamera 생성됨. 위치:", camera.position);

    // 렌더러 생성
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // antialias: 계단 현상 방지, alpha: true = 투명한 배경
    renderer.setPixelRatio(window.devicePixelRatio); // 디바이스 픽셀 비율 설정 (고해상도 디스플레이 지원)
    renderer.setSize(threeDContainer.clientWidth, threeDContainer.clientHeight); // 렌더러 크기 설정
    renderer.shadowMap.enabled = true; // 그림자 활성화
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자 타입 설정
    threeDContainer.appendChild(renderer.domElement); // 렌더러의 DOM 요소를 컨테이너에 추가
    console.log("init3DScene: THREE.WebGLRenderer 생성 및 '.skills-3d-container'에 추가됨.");
    console.log("렌더러 크기:", renderer.getSize(new THREE.Vector2()));

    // 조명 추가 (전역 변수에 할당)
    ambientLight = new THREE.AmbientLight(0xffffff, 1); // 백색 주변광 (색상, 강도) - 자연스러운 조명 효과
    scene.add(ambientLight);
    console.log("init3DScene: 주변광 추가됨.");

    dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4); // 백색 방향성 광원 (색상, 강도)
    dirLight1.position.set(-5, 15, -10); // 광원 위치
    dirLight1.castShadow = true; // 그림자 생성 활성화
    scene.add(dirLight1);
    console.log("init3DScene: 방향성 광원 1 추가됨.");

    dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(4, 10, -4);
    dirLight2.castShadow = true;
    scene.add(dirLight2);
    console.log("init3DScene: 방향성 광원 2 추가됨.");

    dirLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight3.position.set(-10, -15, -10);
    dirLight3.castShadow = true;
    scene.add(dirLight3);
    console.log("init3DScene: 방향성 광원 3 추가됨.");

    // 초기 테마에 따른 조명 설정
    const initialTheme = document.body.getAttribute('data-theme') || 'dark';
    updateModelLightingForTheme(initialTheme);


    // 포도 모델 로드 및 스크롤 애니메이션 설정
    loadGrapeModel(() => {
        if (grapeModel) {
            // 디버깅을 위해 초기 로딩 시 모델 가시성 및 위치 설정
            grapeModel.position.set(0, 0, 0); // 모델 초기 위치
            grapeModel.scale.set(0.5, 0.5, 0.5); // 모델 초기 스케일 (0.5배)
            grapeModel.visible = true; // 모델을 강제로 보이게 함
            grapeModel.traverse((child) => {
                if (child.isMesh) {
                    child.material.opacity = 1; // 재질의 불투명도를 1 (완전 불투명)로 설정
                    // 투명도 조절은 CSS 오버레이로 처리하므로 transparent는 false로 설정하여 성능 최적화
                    child.material.transparent = false;
                    child.material.needsUpdate = true; // 재질 업데이트 필요 플래그 설정
                    child.castShadow = true; // 그림자 생성
                    child.receiveShadow = true; // 그림자 받기
                }
            });
            camera.lookAt(0, 0, 0); // 카메라가 모델의 중심을 바라보도록 설정
            console.log("디버그: 포도 모델이 (0,0,0)에 스케일 0.5, 불투명도 1로 디버깅용으로 강제 표시됨.");
        }
        setupScrollAnimation(); // 모델 로드 완료 후 스크롤 애니메이션 설정
    });

    // 창 크기 변경 이벤트 리스너 등록
    window.addEventListener('resize', onWindowResize);

    // 렌더링 루프 시작
    animate3DScene();
    console.log("init3DScene: Three.js 씬 초기화 완료. 애니메이션 루프 시작됨.");
}

// --- GLB 모델 로드 ---
function loadGrapeModel(onLoadCallback) {
    console.log("loadGrapeModel: 포도 모델 로딩 시작.");
    const loader = new GLTFLoader(); // GLTF 로더 인스턴스 생성
    loader.load('./asset/grape.glb', (gltf) => { // 'grape.glb' 모델 로드
        grapeModel = gltf.scene; // 로드된 씬을 포도 모델 변수에 할당
        console.log("loadGrapeModel: grape.glb 성공적으로 로드됨.", grapeModel);
        if (!grapeModel) {
            console.error("loadGrapeModel: 로드된 GLTF 씬이 null 또는 undefined입니다.");
            return;
        }

        grapeModel.visible = true; // 로드 직후 모델을 강제로 보이게 함
        grapeModel.traverse((child) => { // 모델의 모든 자식 요소를 순회
            if (child.isMesh) { // 자식이 메쉬(3D 객체)인 경우
                child.castShadow = true; // 그림자 생성
                child.receiveShadow = true; // 그림자 받기
                // 모델 자체의 투명도를 다루지 않고 CSS 오버레이로 명암을 조절하므로,
                // 모델의 기본 투명도는 1로 유지하고 transparent를 false로 설정하여 성능 최적화
                child.material.opacity = 1; // 재질 불투명도 1로 설정
                child.material.transparent = false; // 투명도 비활성화 (성능에 도움)
                child.material.needsUpdate = true; // 재질 업데이트 필요 플래그 설정
            }
        });

        // 초기 위치, 스케일, 회전 설정 (스크롤 애니메이션에 의해 덮어씌워질 것임)
        grapeModel.position.set(
            GRAPE_ANIMATION_PATH[0].modelX,
            GRAPE_ANIMATION_PATH[0].modelY,
            GRAPE_ANIMATION_PATH[0].modelZ
        );
        grapeModel.scale.set(
            GRAPE_ANIMATION_PATH[0].modelScale,
            GRAPE_ANIMATION_PATH[0].modelScale,
            GRAPE_ANIMATION_PATH[0].modelScale
        );
        grapeModel.rotation.y = GRAPE_ANIMATION_PATH[0].modelRotY; // Y축 회전 설정

        scene.add(grapeModel); // 씬에 포도 모델 추가
        console.log("loadGrapeModel: grape.glb가 씬에 추가됨.");

        // 모델 로드가 완료되면 콜백 실행
        if (onLoadCallback) {
            onLoadCallback();
        }
    }, (xhr) => { // 로딩 진행률 콜백
        console.log(`loadGrapeModel: ${ (xhr.loaded / xhr.total * 100).toFixed(2) }% 로드됨`);
    }, (error) => { // 오류 콜백
        console.error('loadGrapeModel: 포도 모델 로드 중 오류 발생:', error);
        if (error.target && error.target.status === 404) {
            console.error("loadGrapeModel: 파일을 찾을 수 없습니다 (404). grape.glb 경로를 확인하세요.");
        }
    });
}

// --- 3D 모델을 위한 GSAP ScrollTrigger 설정 ---
function setupScrollAnimation() {
    console.log("setupScrollAnimation: ScrollTrigger 설정 시도.");
    if (!grapeModel || !skillsShowcaseSection) {
        console.warn("setupScrollAnimation: 포도 모델 또는 skillsSection이 준비되지 않았습니다. ScrollTrigger 설정 건너뛰기.");
        return;
    }

    // 중복 방지를 위해 기존 ScrollTrigger 종료 (리사이즈/재초기화 시 중요)
    if (scrollTimeline) {
        console.log("setupScrollAnimation: 기존 ScrollTrigger 타임라인 종료.");
        scrollTimeline.kill();
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.trigger === skillsShowcaseSection) {
                // 이 섹션과 관련된 트리거만 종료
                trigger.kill();
            }
        });
    }

    gsap.registerPlugin(ScrollTrigger); // ScrollTrigger 플러그인 등록

    scrollTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: skillsShowcaseSection, // 트리거 요소
            start: "top bottom", // 트리거 요소의 상단이 뷰포트 하단에 도달했을 때 시작
            end: "bottom top+=10%", // 트리거 요소의 하단이 뷰포트 상단에서 뷰포트 높이의 10% 아래에 도달했을 때 종료 (즉, 완전히 사라진 후)
            markers: false, // 디버깅용 마커 표시 (배포 시 false 권장)
            scrub: 1, // 스크롤과 애니메이션을 부드럽게 동기화 (1초 딜레이)
            onUpdate: (self) => { // 스크롤 진행 상황 업데이트 시 실행
                const progress = self.progress; // ScrollTrigger 진행률 (0에서 1 사이)
                const pathLength = GRAPE_ANIMATION_PATH.length - 1; // 애니메이션 경로 배열의 마지막 인덱스
                const segment = Math.floor(progress * pathLength); // 현재 위치한 경로 세그먼트 (정수)
                const segmentProgress = (progress * pathLength) - segment; // 현재 세그먼트 내에서의 진행률 (0에서 1 사이)

                const startPoint = GRAPE_ANIMATION_PATH[segment]; // 현재 세그먼트의 시작점
                const endPoint = GRAPE_ANIMATION_PATH[Math.min(segment + 1, pathLength)]; // 현재 세그먼트의 끝점

                // 선형 보간 함수 (시작 값, 끝 값, 진행률)
                const interp = (start, end, p) => start + (end - start) * p;

                // 현재 스크롤 진행률에 따른 모델의 X, Y, Z 위치, 스케일, Y축 회전 계산
                const currentX = interp(startPoint.modelX, endPoint.modelX, segmentProgress);
                const currentY = interp(startPoint.modelY, endPoint.modelY, segmentProgress);
                const currentZ = interp(startPoint.modelZ, endPoint.modelZ, segmentProgress);
                const currentScale = interp(startPoint.modelScale, endPoint.modelScale, segmentProgress);
                const currentRotY = interp(startPoint.modelRotY, endPoint.modelRotY, segmentProgress);

                // 계산된 속성을 포도 모델에 적용
                grapeModel.position.set(currentX, currentY, currentZ);
                grapeModel.scale.set(currentScale, currentScale, currentScale);
                grapeModel.rotation.y = currentRotY;

                // ** 투명도(opacity)는 CSS 오버레이로 제어하므로 여기서는 모델 자체의 opacity를 조절하지 않습니다. **
                // (만약 모델 자체의 투명도를 조절하려면 아래 주석 해제 후 currentOpacity 계산하여 적용)
                // grapeModel.traverse((child) => {
                //     if (child.isMesh && child.material) {
                //         child.material.opacity = currentOpacity;
                //         child.material.transparent = currentOpacity < 1;
                //         child.material.needsUpdate = true;
                //     }
                // });
            },
            onEnter: () => { // 트리거가 시작 지점에 진입할 때 실행 (아래로 스크롤)
                if (grapeModel) {
                    grapeModel.visible = true; // 모델을 보이게 함
                    console.log("ScrollTrigger: 스킬 섹션에 진입. 포도 모델 표시됨.");
                }
            },
            onLeave: () => { // 트리거가 끝 지점을 벗어날 때 실행 (아래로 스크롤)
                if (grapeModel) {
                    grapeModel.visible = false; // 모델을 숨김
                    console.log("ScrollTrigger: 스킬 섹션 벗어남. 포도 모델 숨겨짐.");
                }
            },
            onEnterBack: () => { // 트리거가 끝 지점에서 다시 진입할 때 실행 (위로 스크롤)
                if (grapeModel) {
                    grapeModel.visible = true; // 모델을 보이게 함
                    console.log("ScrollTrigger: 스킬 섹션 재진입 (뒤로). 포도 모델 표시됨.");
                }
            },
            onLeaveBack: () => { // 트리거가 시작 지점을 다시 벗어날 때 실행 (위로 스크롤)
                if (grapeModel) {
                    grapeModel.visible = false; // 모델을 숨김
                    console.log("ScrollTrigger: 스킬 섹션 벗어남 (뒤로). 포도 모델 숨겨짐.");
                }
            }
        }
    });

    // 페이지 로드 시 초기 상태를 올바르게 처리하기 위해 스크롤 외부에서 초기 상태 설정
    requestAnimationFrame(() => {
        const initialProgress = scrollTimeline.scrollTrigger?.progress || 0; // 안전하게 ScrollTrigger 진행률 가져오기
        scrollTimeline.progress(initialProgress); // 타임라인의 진행률을 초기 진행률로 설정
        console.log("setupScrollAnimation: 3D 포도 ScrollTrigger 설정 완료. 초기 진행률:", initialProgress);
    });
}

// --- Three.js 애니메이션 루프 ---
function animate3DScene() {
    requestAnimationFrame(animate3DScene); // 다음 프레임 요청
    if (renderer && scene && camera) {
        renderer.render(scene, camera); // 씬을 카메라를 통해 렌더링
    }
}

// --- 창 크기 변경 핸들러 ---
function onWindowResize() {
    console.log("onWindowResize: 창 크기 변경됨. 3D 씬 조정.");
    if (camera && renderer && threeDContainer) {
        const width = threeDContainer.clientWidth; // 컨테이너의 현재 너비
        const height = threeDContainer.clientHeight; // 컨테이너의 현재 높이
        camera.aspect = width / height; // 카메라 종횡비 업데이트
        camera.updateProjectionMatrix(); // 투영 행렬 업데이트
        renderer.setSize(width, height); // 렌더러 크기 업데이트
        setupScrollAnimation(); // 레이아웃 변경에 맞춰 ScrollTrigger 재설정
        console.log("onWindowResize: 3D 씬 및 ScrollTrigger가 새 크기로 조정됨:", width, height);
    }
}

// --- 테마 변경 시 3D 모델 조명 밝기 조절 함수 ---
function updateModelLightingForTheme(theme) {
    if (!ambientLight || !dirLight1 || !dirLight2 || !dirLight3) {
        console.warn("updateModelLightingForTheme: 조명 객체가 아직 초기화되지 않았습니다. 밝기 조절을 건너뜁니다.");
        return;
    }

    if (theme === 'light') {
        ambientLight.intensity = 4;    // 라이트 모드에서 더 밝게
        dirLight1.intensity = 0.7;
        dirLight2.intensity = 0.7;
        dirLight3.intensity = 0.7;
        console.log("Theme updated to LIGHT: 3D model lighting increased.");
    } else {
        ambientLight.intensity = 1;      // 다크 모드에서 기본 밝기
        dirLight1.intensity = 0.4;
        dirLight2.intensity = 0.4;
        dirLight3.intensity = 0.4;
        console.log("Theme updated to DARK: 3D model lighting reset to default.");
    }
}

// --- MutationObserver를 통한 data-theme 속성 변화 감지 ---
const themeObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'data-theme') {
            const currentTheme = document.body.getAttribute('data-theme');
            updateModelLightingForTheme(currentTheme);
        }
    });
});

// body 요소의 data-theme 속성 변화를 감지하도록 설정
themeObserver.observe(document.body, { attributes: true });


// --- 기존 texthero.js 로직 (목록 항목 하이라이팅) ---
const updateListStyleVariables = () => {
    if (!listItemWrapper || !listItems.length || !skillsShowcaseSection) return;

    const startActivationOffsetRatio = 0.8; // 활성화 영역 시작 지점 오프셋 비율 (뷰포트 높이의 80% 위)
    listStyleChangeStartY = skillsShowcaseSection.offsetTop - (window.innerHeight * (1 - startActivationOffsetRatio));
    listStyleChangeStartY = Math.max(0, listStyleChangeStartY); // 0보다 작아지지 않도록 보정

    const endActivationOffsetRatio = 0.4; // 활성화 영역 종료 지점 오프셋 비율 (뷰포트 높이의 40% 아래)
    listStyleChangeEndY = skillsShowcaseSection.offsetTop + skillsShowcaseSection.offsetHeight - (window.innerHeight * endActivationOffsetRatio);

    // 각 목록 항목에 할당될 스크롤 범위 (나눗셈 오류 방지를 위해 1 이상 보장)
    division = (listStyleChangeEndY - listStyleChangeStartY) / Math.max(1, listItems.length - 1);
    if (division <= 0) division = 1; // division이 0이하인 경우 (예: 항목이 하나뿐일 때) 1로 설정

    console.log(`디버그 texthero: listStyleChangeStartY: ${listStyleChangeStartY}, listStyleChangeEndY: ${listStyleChangeEndY}, division: ${division}`);
};

// 이징 함수 (부드러운 전환 효과)
const easeInOut = (t) => t * t * (3 - 2 * t);

const handleScrollAnimation = () => {
    if (!isTextheroAnimationActive) {
        cancelAnimationFrame(animationFrameId); // 애니메이션 루프 중지
        animationFrameId = null; // ID 초기화
        return;
    }

    const currentScrollY = window.scrollY; // 현재 스크롤 Y 위치
    const sectionRect = skillsShowcaseSection.getBoundingClientRect(); // 섹션의 현재 뷰포트 상대 위치
    const viewportHeight = window.innerHeight; // 뷰포트 높이

    // 섹션이 뷰포트에 보이는지 확인
    const isSectionVisible = (sectionRect.bottom > 0 && sectionRect.top < viewportHeight);

    if (!isSectionVisible) {
        // 섹션이 뷰포트에 없으면 'on' ID 제거 및 인덱스 초기화
        const currentOn = document.getElementById("on");
        if (currentOn) currentOn.removeAttribute("id");
        currentIndex = -1; // 현재 인덱스 초기화
    } else {
        const activationZoneTop = listStyleChangeStartY; // 활성화 영역 시작 스크롤 위치
        const activationZoneBottom = listStyleChangeEndY; // 활성화 영역 종료 스크롤 위치
        let targetIndex = -1; // 기본값: 항목 하이라이트 없음

        if (currentScrollY <= activationZoneTop) {
            targetIndex = 0; // 활성화 시작 지점보다 위이면 첫 번째 항목 하이라이트
        } else if (currentScrollY >= activationZoneBottom) {
            targetIndex = listItems.length - 1; // 활성화 종료 지점보다 아래이면 마지막 항목 하이라이트
        } else {
            // 활성화 영역 내에서 스크롤 진행률 계산
            let progress = (currentScrollY - activationZoneTop) / (activationZoneBottom - activationZoneTop);
            progress = Math.max(0, Math.min(1, progress)); // 진행률을 0에서 1 사이로 제한
            const easedProgress = easeInOut(progress); // 이징 함수 적용
            targetIndex = Math.round(easedProgress * (listItems.length - 1)); // 진행률에 따라 목표 인덱스 계산
            targetIndex = Math.max(0, Math.min(listItems.length - 1, targetIndex)); // 인덱스를 유효 범위로 제한
        }

        // 목표 인덱스가 변경되었을 경우 즉시 하이라이트 적용
        if (targetIndex !== currentIndex) {
            const currentOn = document.getElementById("on");
            if (currentOn) currentOn.removeAttribute("id"); // 기존 하이라이트 제거
            if (targetIndex !== -1 && listItems[targetIndex]) {
                listItems[targetIndex].id = "on"; // 새 항목에 'on' ID 부여하여 하이라이트
            }
            currentIndex = targetIndex; // 현재 인덱스 업데이트
            console.log(`디버그 texthero: ${currentIndex}번째 항목을 'on'으로 설정.`);
        }
    }
    animationFrameId = requestAnimationFrame(handleScrollAnimation); // 다음 애니메이션 프레임 요청
};

// 스크롤 이벤트 리스너: 애니메이션 활성화 상태일 때 handleScrollAnimation 요청
window.addEventListener("scroll", () => {
    if (isTextheroAnimationActive) {
        if (!animationFrameId) { // 같은 프레임에 여러 요청 방지
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

// 페이지 로드 이벤트 리스너
window.addEventListener('load', () => {
    updateListStyleVariables(); // 목록 스타일 변수 업데이트
    init3DScene(); // Three.js 씬 초기화
    // 로드 시 애니메이션 활성화 상태일 때 handleScrollAnimation 실행
    if (isTextheroAnimationActive) {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

// 외부 스크립트 (예: career.js)에서 제어할 수 있도록 메소드를 전역으로 노출
window.textheroComponent = {
    /**
     * 스크롤 애니메이션을 비활성화합니다 (목록 하이라이팅, 3D 모델).
     */
    deactivateScrollAnimation: () => {
        isTextheroAnimationActive = false; // 애니메이션 활성 상태를 false로 설정
        cancelAnimationFrame(animationFrameId); // 목록 하이라이팅 애니메이션 루프 중지
        animationFrameId = null; // ID 초기화
        if (scrollTimeline && scrollTimeline.scrollTrigger) { // ScrollTrigger가 유효한지 확인
            scrollTimeline.scrollTrigger.disable(); // 3D 포도 모델의 ScrollTrigger 비활성화
            console.log("3D ScrollTrigger 비활성화됨.");
        }
        if (grapeModel) {
            grapeModel.visible = false; // 3D 모델 숨김
            console.log("3D 포도 모델 숨겨짐.");
        }
        console.log("디버그 texthero: 스크롤 애니메이션 비활성화됨.");
    },
    /**
     * 스크롤 애니메이션을 활성화합니다 (목록 하이라이팅, 3D 모델).
     */
    activateScrollAnimation: () => {
        isTextheroAnimationActive = true; // 애니메이션 활성 상태를 true로 설정
        console.log("디버그 texthero: 스크롤 애니메이션 활성화됨.");
        if (scrollTimeline && scrollTimeline.scrollTrigger) { // ScrollTrigger가 유효한지 확인
            scrollTimeline.scrollTrigger.enable(); // 3D 포도 모델의 ScrollTrigger 활성화
            console.log("3D ScrollTrigger 활성화됨.");
        }
        // 모델 가시성은 ScrollTrigger의 onEnter/onEnterBack에 의해 처리됩니다.
        if (!animationFrameId) { // 이미 실행 중이 아니라면 시작
            animationFrameId = requestAnimationFrame(handleScrollAnimation); // 스크롤에 따라 현재 상태를 설정하기 위해 즉시 실행
        }
    }
};

// 스크롤 이벤트 리스너는 window.scroll 이벤트가 발생할 때마다 handleScrollAnimation을 요청하도록 유지
window.addEventListener("scroll", () => {
    if (isTextheroAnimationActive) {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});