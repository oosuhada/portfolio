// 전역 타임라인 변수
let tl;
// 타임라인 레이블을 순서대로 저장하는 변수
let labelsInOrder = [];
// 커스터마이징 데이터를 저장하는 전역 변수
let customizeData = {};

// Canvas animation variables
let canvas, ctx;
let circles = [];
const circleColors = [
    "#bd6ecf", "#7dd175", "#349d8b", "#347a9d", "#c66053",
    "#bfaa40", "#e3bae8", "#8762cb", "#9a90da"
];
const circleInitialPositions = [
    { x: 0.05, y: 0.07 }, // 5vw, 7vh
    { x: 0.35, y: 0.23 }, // 35vw, 23vh
    { x: 0.23, y: 0.33 }, // 23vw, 33vh
    { x: 0.57, y: 0.43 }, // 57vw, 43vh
    { x: 0.07, y: 0.68 }, // 7vw, 68vh
    { x: 0.77, y: 0.42 }, // 77vw, 42vh
    { x: 0.83, y: 0.68 }, // 83vw, 68vh
    { x: 0.37, y: 0.86 }, // 37vw, 86vh
    { x: 0.87, y: 0.94 }  // 87vw, 94vh
];

// Initialize Canvas
const initCanvas = () => {
    canvas = document.getElementById('circlesCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create circle objects
    for (let i = 0; i < circleInitialPositions.length; i++) {
        circles.push({
            x: circleInitialPositions[i].x * canvas.width,
            y: circleInitialPositions[i].y * canvas.height,
            radius: 0,
            opacity: 0,
            color: circleColors[i % circleColors.length],
            grayscale: 0 // 0% grayscale initially
        });
    }
};

// Resize Canvas
const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Update circle positions based on new canvas size
    circles.forEach((circle, i) => {
        circle.x = circleInitialPositions[i].x * canvas.width;
        circle.y = circleInitialPositions[i].y * canvas.height;
    });
};

// Draw circles on Canvas
const drawCircles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circles.forEach(circle => {
        if (circle.opacity > 0 && circle.radius > 0) {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

            // Apply grayscale effect
            const originalColor = hexToRgb(circle.color);
            const grayValue = (originalColor.r * 0.299 + originalColor.g * 0.587 + originalColor.b * 0.114);
            const mixedR = originalColor.r * (1 - circle.grayscale) + grayValue * circle.grayscale;
            const mixedG = originalColor.g * (1 - circle.grayscale) + grayValue * circle.grayscale;
            const mixedB = originalColor.b * (1 - circle.grayscale) + grayValue * circle.grayscale;

            ctx.fillStyle = `rgba(${mixedR}, ${mixedG}, ${mixedB}, ${circle.opacity})`;
            ctx.fill();
        }
    });
};

// Helper to convert hex to RGB for grayscale calculation
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// Function to animate circles using GSAP
const animateCirclesCanvas = (startScale, endScale, startGrayscale, endGrayscale, duration, stagger, delay) => {
    return gsap.timeline()
        .set(canvas, { zIndex: 1, autoAlpha: 1 }) // Make canvas visible
        .staggerFromTo(circles, duration,
            { radius: startScale, opacity: 1, grayscale: startGrayscale },
            {
                radius: endScale, opacity: 0, grayscale: endGrayscale, ease: "power1.out",
                onUpdate: drawCircles, // Redraw on each frame
                onStart: () => gsap.set(canvas, { visibility: "visible" }),
                onComplete: () => gsap.set(canvas, { visibility: "hidden" })
            },
            stagger, delay
        );
};

// JSON 데이터 가져오기 및 페이지에 삽입
const fetchData = () => {
    fetch("customize.json")
        .then(data => data.json())
        .then(data => {
            customizeData = data; // 데이터 전역 저장
            const dataArr = Object.keys(customizeData);
            dataArr.map(customData => {
                const targetElement = document.querySelector(`[data-node-name="${customData}"]`);
                if (targetElement && customizeData[customData] !== undefined && customizeData[customData] !== null) {
                    if (customData === "imagePath") {
                        targetElement.setAttribute("src", customizeData[customData]);
                    } else if (customData === "wishHeadingPart1" || customData === "wishHeadingPart2") {
                        // 개별 문자에 span 태그 적용
                        targetElement.innerHTML = `<span>${customizeData[customData].split("").join("</span><span>")}</span>`;
                    } else {
                        targetElement.innerText = customizeData[customData];
                    }
                }
                if (dataArr.length === dataArr.indexOf(customData) + 1) {
                    animationTimeline();
                }
            });
        });
};

// 애니메이션 타임라인
const animationTimeline = () => {
    const textBoxChars = document.getElementsByClassName("portfolio-chatbox")[0];
    if (textBoxChars) {
        textBoxChars.innerHTML = `<span>${textBoxChars.innerHTML
            .split("")
            .join("</span><span>")}</span>`;
    }

    const ideaTextTrans = {
        opacity: 0,
        y: -20,
        rotationX: 5,
        skewX: "15deg"
    };

    const ideaTextTransLeave = {
        opacity: 0,
        y: 20,
        rotationY: 5,
        skewX: "-15deg"
    };

    // If a timeline already exists, kill it to prevent conflicts before re-creating
    if (tl) {
        tl.kill();
        console.log("Existing greeting timeline killed."); // Debugging
    }

    tl = gsap.timeline({
        onComplete: () => {
            console.log("Greeting timeline completed. Returning to initial state."); // Debugging
            // 메인 포트폴리오 화면으로 돌아가기
            const preloaderContainer = document.getElementById('preloaderContainer');
            const mainPortfolio = document.getElementById('mainPortfolio');
            const controls = document.getElementById('controls');
            const inboxIconContainer = document.getElementById('inboxIconContainer');
            const darkModeToggleWrapper = document.getElementById('darkModeToggleWrapper'); // Get wrapper here too
            const darkModeToggleContainer = document.getElementById('darkModeToggleContainer'); // Get Lottie container here too

            // Fade out greeting elements (preloaderContainer, controls, darkModeToggleWrapper)
            // Note: darkModeToggleContainer will hide with its parent wrapper.
            gsap.to([preloaderContainer, controls, darkModeToggleWrapper], { // Added darkModeToggleWrapper
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    preloaderContainer.style.display = 'none';
                    controls.style.display = 'none';
                    if (darkModeToggleWrapper) { // Check before setting display
                        darkModeToggleWrapper.style.display = 'none'; // Hide the wrapper
                    }
                    if (darkModeToggleContainer) { // Ensure Lottie container is also hidden
                        darkModeToggleContainer.style.display = 'none';
                    }

                    // Show main portfolio elements
                    mainPortfolio.style.display = 'block';
                    gsap.fromTo(mainPortfolio, { opacity: 0 }, { opacity: 1, duration: 0.5 });

                    // Show Lottie inbox icon
                    if (inboxIconContainer) {
                        inboxIconContainer.style.display = 'block';
                        gsap.fromTo(inboxIconContainer, { opacity: 0 }, { opacity: 1, duration: 0.5 });
                    }

                    // Restart balloons (if they were stopped)
                    if (window.startBalloonInterval) {
                        window.startBalloonInterval();
                    }
                    console.log("Returned to initial main portfolio state."); // Debugging
                }
            });
        },
        // IMPORTANT: Ensure elements are reset on reverse/restart
        onReverseComplete: () => {
            console.log("Greeting timeline reverse completed. Resetting elements for main portfolio."); // Debugging
            gsap.set("#preloaderContainer", { visibility: "hidden", opacity: 0, display: 'none' });
            gsap.set("#controls", { visibility: "hidden", opacity: 0, display: 'none' });
            gsap.set("#mainPortfolio", { visibility: "visible", opacity: 1, display: 'block' });
            const inboxIconContainer = document.getElementById('inboxIconContainer');
            if (inboxIconContainer) {
                 gsap.set(inboxIconContainer, { opacity: 1, display: 'block' });
            }
            const darkModeToggleWrapper = document.getElementById('darkModeToggleWrapper'); // Get wrapper here
            const darkModeToggleContainer = document.getElementById('darkModeToggleContainer'); // Get Lottie container here
            if (darkModeToggleWrapper) {
                 gsap.set(darkModeToggleWrapper, { opacity: 0, display: 'none' }); // Hide dark mode toggle on reverse
            }
            if (darkModeToggleContainer) {
                gsap.set(darkModeToggleContainer, { opacity: 0, display: 'none' }); // Ensure Lottie container is hidden too
            }
            if (window.startBalloonInterval) {
                window.startBalloonInterval();
            }
        }
    });

    tl
        .to(".container", 0.1, { visibility: "visible", opacity: 1, display: 'block' }) // Ensure it becomes visible and opaque
        .addLabel("start")

        // 첫 번째 섹션: 인사말
        .from(".intro-greeting", 0.7, { opacity: 0, y: 10 })
        .from(".intro-text[data-node-name='greetingText1']", 0.4, { opacity: 0, y: 10 }, "<+=0.7")
        .from(".intro-text[data-node-name='greetingText2']", 0.4, { opacity: 0, y: 10 }, "<+=0.9")
        .to(".intro-greeting", 0.7, { opacity: 0, y: 10 }, "+=3")
        .to(".intro-text-wrapper", 0.7, { opacity: 0, y: 10 }, "<")
        .addLabel("introDone")

        // 두 번째 섹션: 제품 설명
        .from(".product-statement", 0.7, { opacity: 0, y: 10 })
        .to(".product-statement", 0.7, { opacity: 0, y: 10 }, "+=2")
        .addLabel("productStatementDone")

        // 세 번째 섹션: 아이디어 1
        .from(".idea-1", 0.7, ideaTextTrans)
        .to(".idea-1", 0.7, ideaTextTransLeave, "+=2")
        .addLabel("idea1Done")

        // 네 번째 섹션: 아이디어 2
        .from(".idea-2", 0.7, ideaTextTrans)
        .to(".idea-2", 0.7, ideaTextTransLeave, "+=2.5")
        .addLabel("idea2Done")

        // 채팅 박스 섹션: 초기 등장
        .from(".chatbox-section", 0.7, {
            scale: 0.2,
            opacity: 0,
            onStart: () => {
                gsap.set(".chatbox-section", { visibility: "visible" });
            }
        })
        .from(".fake-btn", 0.3, { scale: 0.2, opacity: 0 })
        .staggerTo(".portfolio-chatbox span", 0.5, { visibility: "visible" }, 0.05)
        .addLabel("chatboxTextComplete")

        // 채팅 박스: "Ask AI" 단계 (초기 텍스트 설정 및 색상 설정)
        .set(".fake-btn", {
            onStart: () => {
                document.querySelector("[data-node-name='sendButtonLabel']").innerText = customizeData.sendButtonLabel;
                gsap.set(".fake-btn", {
                    backgroundColor: "#888888", // Ask AI: Dark grey background
                    color: "#ffffff"             // Ask AI: White text
                });
            }
        })
        .addLabel("chatboxAskAI")

        // 텍스트 전환 시점 명확히 분리 및 .set() 사용
        // 1. fake-btn opacity 0으로 페이드아웃
        .to(".fake-btn", 0.3, { opacity: 0 })
        // 2. opacity 0인 상태에서 텍스트를 "Let's Talk"로 변경 (역방향 시 "Ask AI"로 복구)
        .set(".fake-btn", {
            onStart: () => {
                document.querySelector("[data-node-name='sendButtonLabel']").innerText = customizeData.sendButtonLabelAlt;
            },
            onReverseComplete: () => {
                document.querySelector("[data-node-name='sendButtonLabel']").innerText = customizeData.sendButtonLabel;
                // 역방향으로 돌아올 때 버튼 색상도 초기 상태로 복구
                gsap.set(".fake-btn", {
                    backgroundColor: "#888888", // Reset to Ask AI background
                    color: "#ffffff"             // Reset to Ask AI text color
                });
            }
        })
        // 3. 다시 opacity 1로 나타나면서 "Let's Talk" 텍스트 보장 및 배경색 변경
        .fromTo(".fake-btn", 0.3,
            { opacity: 0 },
            {
                opacity: 1,
                backgroundColor: "#333333", // Let's Talk: Darker background
                color: "#ffffff",            // Let's Talk: White text
                onStart: () => {
                    const target = document.querySelector("[data-node-name='sendButtonLabel']");
                    if (target.innerText !== customizeData.sendButtonLabelAlt)
                        target.innerText = customizeData.sendButtonLabelAlt;
                },
                onReverseComplete: () => {
                    document.querySelector("[data-node-name='sendButtonLabel']").innerText = customizeData.sendButtonLabel;
                }
            }
        )
        .addLabel("chatboxLetsTalk") // "Let's Talk" 상태가 완전히 확립된 지점

        .to(".chatbox-section", 0.5, {
            scale: 0.2,
            opacity: 0,
            y: -150,
            onComplete: () => {
                gsap.set(".chatbox-section", { visibility: "hidden" });
            }
        }, "+=0.7")
        .addLabel("chatboxDone")

        // 아이디어 3
        .from(".idea-3", 0.7, ideaTextTrans)
        .to(".idea-3 strong", 0.5, { scale: 1.2, x: 10, backgroundColor: "#333333", color: "#fff" })
        .to(".idea-3", 0.7, ideaTextTransLeave, "+=1.5")
        .addLabel("idea3Done")

        // 아이디어 4
        .from(".idea-4", 0.2, ideaTextTrans)
        .to(".idea-4", 0.2, ideaTextTransLeave, "+=1.5")
        .addLabel("idea4Done")

        // 아이디어 5
        .from([
            ".idea-5 [data-node-name='text5ContentPart1']",
            ".idea-5 [data-node-name='text5ContentPart2']",
            ".idea-5 .smiley"
        ], 0.7, {
            opacity: 0,
            y: 50,
            rotationX: 15,
            rotationZ: -10,
            skewY: "-5deg",
            z: 10,
            ease: "power2.out"
        }, "+=0.5")
        .addLabel("idea5PartsAppear")
        .to(".idea-5 [data-node-name='text5ContentPart2']", 0.5, { textDecoration: "underline" }, "idea5PartsAppear+=0.6")
        .to(".idea-5 .smiley", 0.5, { rotation: 90, ease: "back.out(1.7)" }, "<")
        .to(".idea-5", 0.7, { opacity: 0, y: -50, scale: 0.2 }, "+=1")
        .addLabel("idea5Done")

        // 아이디어 6 (UX) 등장
        .staggerFrom(".idea-6 span", 0.8, { scale: 3, opacity: 0, rotation: 15, ease: "Expo.easeOut" }, 0.2)
        .addLabel("idea6Appears")

        // UXUI 디자인 섹션 및 위시 메시지 등장
        .from(".uxui-design-section", 0.5, { opacity: 0, scale: 0.8 }, "idea6Appears+=0.2")
        .from(".image-path", 0.5, { scale: 3.5, opacity: 0, x: 25, y: -25, rotationZ: -45 }, "<")
        .from(".lightbulb", 0.5, { x: -100, y: 350, rotation: -180, opacity: 0 }, "<")

        // Wish message appears flipped, then unflips with color change
        // 1단계: 플립된 상태로 등장 (초기 opacity와 y도 애니메이션)
        .staggerFromTo(
            ".heading-main .heading-part1 span, .heading-main .heading-part2 span", 0.7,
            { opacity: 0, y: -50, rotationY: 180, skewX: "30deg", color: "#666" },   // 등장 시 플립+기본색
            { opacity: 1, y: 0, rotationY: 180, skewX: "0deg", ease: "elastic.out(1, 0.5)" },  // 플립된 상태로 등장 (색상 변경 없음)
            0.1, "<"
        )
        .addLabel("uxuiWishFlipAppear")

        // 2단계: 색상 변경과 함께 정방향으로 플립 해제
        .staggerTo(
            ".heading-main .heading-part1 span", 0.7,
            { rotationY: 0, color: "#F78FAD", ease: "Expo.easeOut" },
            0.1, "+=0.3" // uxuiWishFlipAppear 이후 시작
        )
        .staggerTo(
            ".heading-main .heading-part2 span", 0.7,
            { rotationY: 0, color: "#3AD29F", ease: "Expo.easeOut" },
            0.1, "<" // 이전 스태거와 동시에 시작
        )
        .addLabel("uxuiWishFlipTransition")

        // Reset colors and rotation on reverse for consistency
        .set(
            ".heading-main .heading-part1 span, .heading-main .heading-part2 span",
            {
                onReverseComplete: () => {
                    gsap.set(".heading-main .heading-part1 span", { color: "#333", rotationY: 180 });
                    gsap.set(".heading-main .heading-part2 span", { color: "#333", rotationY: 180 });
                }
            },
            "uxuiWishFlipAppear" // 이 트윈은 uxuiWishFlipAppear 라벨 위치에 배치하여 역재생 시점 조절
        )

        .from(".wish-message h5", 0.5, { opacity: 0, y: 10, skewX: "-15deg" }, "uxuiWishFlipTransition") // H5는 플립 애니메이션 완료 후 등장
        .addLabel("uxuiAndWishAppears")

        // 아이디어 6 (UX) 페이드 아웃
        .staggerTo(".idea-6 span", 0.8, { scale: 3, opacity: 0, rotation: -15, ease: "Expo.easeOut" }, 0.2, "uxuiAndWishAppears+=1")
        .addLabel("idea6Gone")

        // UXUI 섹션 및 위시 메시지 숨김
        .to([".image-path", ".lightbulb", ".heading-main", ".wish-message h5"], 0.7, { opacity: 0, y: -50 }, "idea6Gone+=0.1")
        .to(".uxui-design-section", 0.5, { zIndex: "-1" }, "<")
        .addLabel("uxuiDesignSectionGone")

        // --- 최종 메시지 섹션의 P 태그들이 등장하는 부분 수정 ---
        // 먼저 final-message-section 컨테이너의 visibility를 visible로 설정 (내부 P태그들이 보일 수 있도록)
        .set(".final-message-section", { visibility: "visible", y: 0 }, "uxuiDesignSectionGone-=0.2") // Y 위치만 초기화

        // 각 p 태그를 staggerFromTo를 사용하여 나타나게 합니다.
        .staggerFromTo(".final-message-section p", 0.5,
            { opacity: 0, y: -20, rotationX: 5, skewX: "15deg", visibility: "hidden" }, // 시작 시 숨김
            { opacity: 1, y: 0, rotationX: 0, skewX: "0deg", visibility: "visible" },   // 나타나면서 보이게 함
            0.2, "uxuiDesignSectionGone-=0.2" // uxuiDesignSectionGone 라벨 시작 0.2초 전에 시작
        )
        // .last-smile (p 태그 중 하나) 애니메이션은 여전히 개별적으로 줄 수 있습니다.
        .to(".last-smile", 0.5, { rotation: 90 }, "<") // 위 staggerFromTo와 동시에 시작
        .addLabel("finalTextStart")
        // --- 최종 메시지 섹션 P 태그 등장 부분 수정 끝 ---

        // 풍선 애니메이션
        .staggerFromTo(".baloons-animate img", 1.6, {
            opacity: 0.9, y: 1400
        }, {
            opacity: 1, y: -1000
        }, 0.1, "finalTextStart+=0.5")
        .addLabel("balloonsAnimate")

        // #replay (Let's create together!)에 GSAP 두근거리는 효과
        // 풍선 애니메이션이 시작하는 시점과 함께 시작
        .to("#replay", {
            scale: 1.2,
            opacity: 0.9,
            repeat: -1,
            yoyo: true,
            duration: 0.8,
            ease: "power1.inOut"
        }, "finalTextStart+=0.5")

        // 최종 메시지 컨테이너 숨김 (Controls는 별도 처리)
        .to(".final-message-section", {
            opacity: 0,
            y: -50,
            duration: 0.5,
            onComplete: () => {
                gsap.set(".final-message-section", { visibility: "hidden" });
            }
        }, "balloonsAnimate+=0.5")
        .addLabel("finalMessageGone")

        // Blank interlude
        .to(".blank-interlude", {
            opacity: 1,
            visibility: "hidden",
            zIndex: 5,
            duration: 0.08
        }, "finalMessageGone+=0.1")
        .to(".blank-interlude", {
            opacity: 0,
            duration: 0.05
        }, "<+=0")
        .set(".blank-interlude", { visibility: "hidden", zIndex: -1 }) // Ensure it is hidden after the fade out
        .addLabel("blankScreenInterlude")

        // Circle animation (2회) - blank-interlude가 완전히 사라진 후 시작하도록 조정
        .add(animateCirclesCanvas(0, 600, 0, 0.6, 1.5, 0.3, "blankScreenInterlude+=0.2"), "circlesFirstPassStart")
        .add(animateCirclesCanvas(0, 700, 0.65, 0.95, 1.5, 0.4, "circlesFirstPassStart+=1.4"), "circlesSecondPassStart")
        // --- controls 서서히 사라지는 애니메이션 ---
        .to("#controls", {
            opacity: 0.3,
            duration: 1.5,
            ease: "power1.out"
        }, "circlesFirstPassStart+=0") // 적절히 1차 애니메이션 후쯤 시작

        .to("#controls", {
            opacity: 0,
            duration: 1.5,
            ease: "power1.out"
        }, "circlesFirstPassStart+=2.5") // 바로 이어서 시작

        .set("#controls", {
            visibility: "hidden"
        }, "circlesFirstPassStart+=3.5") // opacity=0과 동시에 visibility도 hidden

        .addLabel("endAnimation") // 애니메이션 종료 지점

        .call(() => {
            console.log("🔁 Greeting complete – reloading page.");
            location.reload();
        });

    // 타임라인 레이블 순서 저장
    labelsInOrder = Object.keys(tl.labels).sort((a, b) => tl.labels[a] - tl.labels[b]);
    console.log("Labels in order:", labelsInOrder);

    // 상태 동기화 함수
    function syncChatboxButtonState(labelName) {
        const fakeBtn = document.querySelector(".fake-btn");
        const sendBtnLabel = document.querySelector("[data-node-name='sendButtonLabel']");
        if (!fakeBtn || !sendBtnLabel) return;

        const idxAskAI = labelsInOrder.indexOf("chatboxAskAI");
        const idxLetsTalk = labelsInOrder.indexOf("chatboxLetsTalk");
        const idxCurrent = labelsInOrder.indexOf(labelName);

        if (idxCurrent >= idxLetsTalk) {
            sendBtnLabel.innerText = customizeData.sendButtonLabelAlt;
            gsap.set(fakeBtn, { backgroundColor: "#333333", color: "#fff"});
        } else if (idxCurrent >= idxAskAI && idxCurrent < idxLetsTalk) {
            sendBtnLabel.innerText = customizeData.sendButtonLabel;
            gsap.set(fakeBtn, { backgroundColor: "rgb(136, 136, 136)", color: "#fff"});
        } else {
            sendBtnLabel.innerText = customizeData.sendButtonLabel;
            gsap.set(fakeBtn, { backgroundColor: "rgb(136, 136, 136)" ,color: "#fff"});
        }
    }

    // 재생 버튼
    const replayBtn = document.getElementById("replay");
    if (replayBtn) {
        replayBtn.addEventListener("click", () => {
            tl.restart(true); // Ensure full restart when "replay" is clicked
            // #replay 요소의 GSAP 애니메이션을 강제로 중지하고 초기 상태로 재설정
            gsap.killTweensOf("#replay");
            gsap.set("#replay", { scale: 1, opacity: 1, rotation: 0 });

            // final-message-section 컨테이너와 그 안의 p 태그들을 확실히 보이게 재설정
            gsap.set(".final-message-section", { opacity: 1, y: 0, visibility: "visible" });
            gsap.set(".final-message-section p", { opacity: 1, y: 0, rotationX: 0, skewX: "0deg", visibility: "visible" });

            // Ensure controls are visible when replaying
            gsap.to("#controls", { opacity: 1, visibility: "visible", duration: 0.3 });

            syncChatboxButtonState("start");
        });
    }

    // 재생 제어 버튼
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const rewindBtn = document.getElementById("rewindBtn");
    const fastForwardBtn = document.getElementById("fastForwardBtn");
    const skipBtn = document.getElementById("skipBtn");

    if (playBtn) {
        playBtn.addEventListener("click", () => {
            tl.timeScale(1);
            tl.play();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            tl.timeScale(1);
            tl.pause();
        });
    }

    if (rewindBtn) {
        rewindBtn.addEventListener("click", () => {
            tl.timeScale(1);
            const currentTime = tl.time();
            let currentLabel = tl.currentLabel();

            if (!currentLabel || tl.labels[currentLabel] > currentTime) {
                for (let i = labelsInOrder.length - 1; i >= 0; i--) {
                    if (tl.labels[labelsInOrder[i]] <= currentTime) {
                        currentLabel = labelsInOrder[i];
                        break;
                    }
                }
                if (!currentLabel) {
                    currentLabel = "start";
                }
            }

            const currentLabelTime = tl.labels[currentLabel];
            if (!tl.paused() && (currentTime - currentLabelTime > 0.5)) {
                tl.play(currentLabel);
                console.log("Rewinding to the beginning of the current segment:", currentLabel);
                syncChatboxButtonState(currentLabel);
                return;
            }

            const currentIndex = labelsInOrder.indexOf(currentLabel);
            if (currentIndex > 0) {
                const prevLabel = labelsInOrder[currentIndex - 1];
                tl.play(prevLabel);
                console.log("Rewinding to previous segment:", prevLabel);
                syncChatboxButtonState(prevLabel);
            } else {
                tl.restart(true); // Full restart for rewind to very beginning
                console.log("Rewinding to the very beginning.");
                syncChatboxButtonState("start");
            }
        });
    }

    if (fastForwardBtn) {
        fastForwardBtn.addEventListener("click", () => {
            tl.timeScale(1);
            let currentLabel = tl.currentLabel();
            const currentTime = tl.time();

            if (!currentLabel || tl.labels[currentLabel] > currentTime) {
                for (let i = labelsInOrder.length - 1; i >= 0; i--) {
                    if (tl.labels[labelsInOrder[i]] <= currentTime) {
                        currentLabel = labelsInOrder[i];
                        break;
                    }
                }
                if (!currentLabel) {
                    currentLabel = "start";
                }
            }

            const currentIndex = labelsInOrder.indexOf(currentLabel);
            if (currentIndex < labelsInOrder.length - 1) {
                const nextLabel = labelsInOrder[currentIndex + 1];
                tl.play(nextLabel);
                console.log("Fast-forwarding to next segment:", nextLabel);
                syncChatboxButtonState(nextLabel);
            } else {
                tl.play("endAnimation"); // Make sure to play to the *actual* end label
                console.log("Fast-forwarding to the end.");
                syncChatboxButtonState("endAnimation");
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener("click", () => {
            tl.timeScale(1);
            tl.play("blankScreenInterlude");
            console.log("Skipping to blankScreenInterlude.");
            syncChatboxButtonState("blankScreenInterlude");
        });
    }

    // Controls drag functionality
    const controls = document.getElementById("controls"); // Get by ID
    const handle = document.querySelector(".controls .handle");

    if (controls && handle) {
        // JS에서 처음에 수동 위치 보정 (드래그 전에)
        // CSS의 right: 0; bottom: 0;와 함께 사용 시 초기 위치를 정확히 맞추고
        // transform: translate(x, y)로 이동 가능하게 합니다.
        // 이렇게 하면 드래그가 좌측 상단 기준으로 다시 작동할 수 있게 됩니다.
        gsap.set(controls, {
            // x: window.innerWidth - controls.offsetWidth,
            y: window.innerHeight - controls.offsetHeight*1.8
        });

        let isDragging = false;
        let initialMouseX, initialMouseY;
        let initialControlX, initialControlY;
        let controlsWidth, controlsHeight; // Store these values once

        const updateControlBounds = () => {
            controlsWidth = controls.offsetWidth;
            controlsHeight = controls.offsetHeight;
        };

        // Update bounds on window resize
        window.addEventListener('resize', updateControlBounds);
        // Initial call to set bounds
        updateControlBounds();

        handle.addEventListener("mousedown", (e) => {
            isDragging = true;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            initialControlX = gsap.getProperty(controls, "x");
            initialControlY = gsap.getProperty(controls, "y");
            controls.style.cursor = "grabbing";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - initialMouseX;
            const deltaY = e.clientY - initialMouseY;

            let newX = initialControlX + deltaX;
            let newY = initialControlY + deltaY;

            // Apply boundaries
            newX = Math.max(0, Math.min(window.innerWidth - controlsWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight - controlsHeight, newY));

            gsap.set(controls, {
                x: newX,
                y: newY
            });
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                controls.style.cursor = "grab";
            }
        });

        // Touch events for mobile
        handle.addEventListener("touchstart", (e) => {
            isDragging = true;
            const touch = e.touches[0];
            initialMouseX = touch.clientX;
            initialMouseY = touch.clientY;
            initialControlX = gsap.getProperty(controls, "x");
            initialControlY = gsap.getProperty(controls, "y");
            controls.style.cursor = "grabbing";
            e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchmove", (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - initialMouseX;
            const deltaY = touch.clientY - initialMouseY;

            let newX = initialControlX + deltaX;
            let newY = initialControlY + deltaY;

            // Apply boundaries
            newX = Math.max(0, Math.min(window.innerWidth - controlsWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight - controlsHeight, newY));

            gsap.set(controls, {
                x: newX,
                y: newY
            });
            e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchend", () => {
            if (isDragging) {
                isDragging = false;
                controls.style.cursor = "grab";
            }
        });
    }
};

// Global variable to hold the dark mode Lottie animation instance
let animationDarkMode;

// Expose fetchData, animationTimeline, and tl to the global scope
window.fetchData = fetchData;
window.animationTimeline = animationTimeline;
// Make sure 'tl' is accessible globally, it's defined in animationTimeline
Object.defineProperty(window, 'tl', {
    get: function() { return tl; },
    set: function(value) { tl = value; }
});

// Initial setup for Lottie animations on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initCanvas(); // Initialize canvas as before

    const darkModeToggleContainer = document.getElementById('darkModeToggleContainer');
    if (darkModeToggleContainer) {
        // Initialize Lottie animation for dark mode toggle
        animationDarkMode = lottie.loadAnimation({
            container: darkModeToggleContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'https://gist.githubusercontent.com/oosuhada/e2e69d3068f11292a0a03c142cc7d0af/raw/4152a2dd79071530a4dec1926c904a12605cd06e/darkmodetoggle.json'
        });

        let isDarkMode = false;
        const midFrame = 77; // Sun to Moon transition midpoint
        animationDarkMode.goToAndStop(0, true); // Start at frame 0 (sun)

        // Apply initial styles for the Lottie container directly here
        darkModeToggleContainer.style.display = 'block'; // Make sure it's block for Lottie to render
        darkModeToggleContainer.style.opacity = '1';
        darkModeToggleContainer.style.width = '100%';
        darkModeToggleContainer.style.height = '100%';
        darkModeToggleContainer.style.position = 'absolute'; // Position absolute relative to wrapper

        // Trigger resize after a small delay to ensure correct rendering
        setTimeout(() => {
            animationDarkMode.resize();
        }, 100);

        const darkModeToggleWrapper = document.getElementById('darkModeToggleWrapper');
        if (darkModeToggleWrapper) {
            darkModeToggleWrapper.addEventListener('click', () => {
                const preloaderContainer = document.getElementById('preloaderContainer');

                if (!animationDarkMode) return;

                if (!isDarkMode) {
                    // Light → Dark: Play from frame 0 to 77 (sun → moon)
                    animationDarkMode.setDirection(1); // Forward direction
                    animationDarkMode.playSegments([0, midFrame], true);
                    preloaderContainer.classList.add('dark-theme');
                } else {
                    // Dark → Light: Play from frame 77 to 0 (moon → sun)
                    animationDarkMode.setDirection(-1); // Reverse direction
                    animationDarkMode.playSegments([midFrame, 0], true);
                    preloaderContainer.classList.remove('dark-theme');
                }

                isDarkMode = !isDarkMode; // Toggle state
            });
        }
    }

    // Expose animationDarkMode globally for use in other scripts
    window.animationDarkMode = animationDarkMode;
});