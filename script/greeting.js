// script/greeting.js

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
                radius: endScale, opacity: 0, grayscale: endGrayscale, ease: "power2.out",
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

// 프리로더 컨테이너에서 메인 포트폴리오 슬라이더로 전환
const showMainPortfolio = () => {
    const preloaderContainer = document.getElementById('preloaderContainer');
    const mainPortfolio = document.getElementById('mainPortfolio');
    const backgroundImage = document.querySelector('.background-image');

    if (mainPortfolio) {
        gsap.to(preloaderContainer, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                preloaderContainer.style.display = 'none';
                mainPortfolio.style.display = 'block';
                gsap.fromTo(mainPortfolio, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" });
                gsap.set(backgroundImage, { opacity: 0 }); // Hide background image
                if (window.initializeMainPortfolio) {
                    window.initializeMainPortfolio();
                }
            }
        });
    }
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

    tl = gsap.timeline({
        onComplete: () => {
            // showMainPortfolio가 최종 전환을 처리하므로 추가 작업 불필요
        }
    });

    tl
        .to(".container", 0.1, { visibility: "visible" })
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

        // 채팅 박스: "Ask AI" 단계 (초기 텍스트 설정)
        .set(".fake-btn", {
            onStart: () => {
                document.querySelector("[data-node-name='sendButtonLabel']").innerText = customizeData.sendButtonLabel;
                gsap.set(".fake-btn", { backgroundColor: "rgb(136, 136, 136)" }); // Ensure initial color
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
                gsap.set(".fake-btn", { backgroundColor: "rgb(136, 136, 136)" });
            }
        })
        // 3. 다시 opacity 1로 나타나면서 "Let's Talk" 텍스트 보장 및 배경색 변경
        .fromTo(".fake-btn", 0.3,
            { opacity: 0 },
            {
                opacity: 1,
                backgroundColor: "#333333", // "Let's Talk" 상태의 배경색
                onStart: () => {
                    // 다시 나타날 때 현재 text 보장 (Let's Talk)
                    const target = document.querySelector("[data-node-name='sendButtonLabel']");
                    if (target.innerText !== customizeData.sendButtonLabelAlt)
                        target.innerText = customizeData.sendButtonLabelAlt;
                },
                onReverseComplete: () => {
                    // 역방향으로 이 트윈을 완료할 때 텍스트를 "Ask AI"로 되돌림
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
            { opacity: 0, y: -50, rotationY: 180, skewX: "30deg", color: "#333" },   // 등장 시 플립+기본색
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
        .to([".image-path", ".lightbulb", ".heading-main", ".wish-message h5"], 0.7, { opacity: 0, y: -50 }, "+=1.5")
        .to(".uxui-design-section", 0.5, { zIndex: "-1" }, "<")
        .addLabel("uxuiDesignSectionGone")
        // 최종 메시지 섹션 등장
        .staggerFrom(".final-message-section p", 0.5, ideaTextTrans, 0.2, "uxuiDesignSectionGone+=0.5")
        .to(".last-smile", 0.5, { rotation: 90 }, "+=0.5")
        .addLabel("finalTextStart")

        // 풍선 애니메이션 (이제 finalTextStart 직후 시작)
        .staggerFromTo(".baloons-animate img", 2, {
            opacity: 0.9, y: 1400
        }, {
            opacity: 1, y: -1000
        }, 0.1, "finalTextStart+=0.5") // 이전보다 빠르게 붙여줌
        .addLabel("balloonsAnimate")

        // 풍선과 함께 최종 메시지 & 컨트롤 제거
        .to([".final-message-section", ".controls"], {
            opacity: 0,
            y: -50,
            duration: 0.5
        }, "balloonsAnimate+=1.0") // 풍선 중간쯤에 사라지게
        .addLabel("finalMessageGone")

        // Blank interlude - 매우 짧게 보여짐
        .to(".blank-interlude", {
            opacity: 1,
            visibility: "visible",
            zIndex: 5,
            duration: 0.08
        }, "finalMessageGone+=0.5")
        .to(".blank-interlude", {
            opacity: 0,
            duration: 0.05
        }, "<+=0.08")
        .set(".blank-interlude", { visibility: "hidden", zIndex: 4 })
        .addLabel("blankScreenInterlude")

        // Circle animation (2회) - 이제 Canvas 함수 호출
        .add(animateCirclesCanvas(0, 1000, 0, 0.6, 1.5, 0.3, "blankScreenInterlude+=0"), "circlesFirstPassStart")
        .add(animateCirclesCanvas(0, 1000, 0.65, 0.95, 1.5, 0.4, "circlesFirstPassStart+=0"), "circlesSecondPassStart") // Overlap

        // Reveal portfolio before the second animation fully finishes
        .call(showMainPortfolio, null, "circlesSecondPassStart+=1.6") // Adjust timing based on circle animation duration
        .to(".blank-interlude", 1, {
            opacity: 0,
            zIndex: 4
        }, "<+=0.2")
        .to(".blank-interlude", {
            visibility: "hidden"
        }, "<+=0")
        .addLabel("mainPortfolioRevealed")

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

        // "chatboxLetsTalk" 라벨 지점 또는 그 이후에 있으면 "Let's Talk" 상태
        if (idxCurrent >= idxLetsTalk) {
            sendBtnLabel.innerText = customizeData.sendButtonLabelAlt;
            gsap.set(fakeBtn, { backgroundColor: "#333333" });
        }
        // "chatboxAskAI" 라벨 지점부터 "chatboxLetsTalk" 라벨 지점 직전까지면 "Ask AI" 상태
        else if (idxCurrent >= idxAskAI && idxCurrent < idxLetsTalk) {
            sendBtnLabel.innerText = customizeData.sendButtonLabel;
            gsap.set(fakeBtn, { backgroundColor: "rgb(136, 136, 136)" });
        }
        // 그 외 (예: "start" 등 완전히 초기 상태)
        else {
            sendBtnLabel.innerText = customizeData.sendButtonLabel; // Default to Ask AI
            gsap.set(fakeBtn, { backgroundColor: "rgb(136, 136, 136)" });
        }
    }


    // 재생 버튼
    const replayBtn = document.getElementById("replay");
    if (replayBtn) {
        replayBtn.addEventListener("click", () => {
            tl.restart();
            syncChatboxButtonState("start"); // Restarting goes to 'start'
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
                // Determine actual current label based on time if it's between labels
                for (let i = labelsInOrder.length - 1; i >= 0; i--) {
                    if (tl.labels[labelsInOrder[i]] <= currentTime) {
                        currentLabel = labelsInOrder[i];
                        break;
                    }
                }
                if (!currentLabel) {
                    currentLabel = "start"; // Fallback to start
                }
            }

            const currentLabelTime = tl.labels[currentLabel];
            if (!tl.paused() && (currentTime - currentLabelTime > 0.5)) {
                // If currently playing and past the current segment's start, jump to current segment start
                tl.play(currentLabel);
                console.log("Rewinding to the beginning of the current segment:", currentLabel);
                syncChatboxButtonState(currentLabel); // Sync state after jump
                return;
            }

            const currentIndex = labelsInOrder.indexOf(currentLabel);
            if (currentIndex > 0) {
                const prevLabel = labelsInOrder[currentIndex - 1];
                tl.play(prevLabel);
                console.log("Rewinding to previous segment:", prevLabel);
                syncChatboxButtonState(prevLabel); // Sync state after jump
            } else {
                tl.restart();
                console.log("Rewinding to the very beginning.");
                syncChatboxButtonState("start"); // Sync state for restart
            }
        });
    }

    if (fastForwardBtn) {
        fastForwardBtn.addEventListener("click", () => {
            tl.timeScale(1);
            let currentLabel = tl.currentLabel();
            const currentTime = tl.time();

            // Determine actual current label based on time
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
                syncChatboxButtonState(nextLabel); // Sync state after jump
            } else {
                tl.play("end");
                console.log("Fast-forwarding to the end.");
                syncChatboxButtonState("end"); // Sync state for end
            }
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener("click", () => {
            tl.timeScale(1);
            tl.play("blankScreenInterlude");
            console.log("Skipping to blankScreenInterlude.");
            syncChatboxButtonState("blankScreenInterlude"); // Sync state after jump
        });
    }

    // 컨트롤 드래그 가능 설정
    const controls = document.querySelector(".controls");
    const handle = document.querySelector(".controls .handle");

    if (controls && handle) {
        let isDragging = false;
        let initialMouseX, initialMouseY;
        let initialControlX, initialControlY;

        const controlsRect = controls.getBoundingClientRect();
        const initialClientX = controlsRect.left;
        const initialClientY = controlsRect.top;

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

            let targetTranslateX = initialControlX + deltaX;
            let targetTranslateY = initialControlY + deltaY;

            const controlsWidth = controls.offsetWidth;
            const controlsHeight = controls.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const currentAbsX = initialClientX + targetTranslateX;
            const currentAbsY = initialClientY + targetTranslateY;

            if (currentAbsX < 0) targetTranslateX = -initialClientX;
            if (currentAbsX + controlsWidth > viewportWidth) targetTranslateX = viewportWidth - initialClientX - controlsWidth;
            if (currentAbsY < 0) targetTranslateY = -initialClientY;
            if (currentAbsY + controlsHeight > viewportHeight) targetTranslateY = viewportHeight - initialClientY - controlsHeight;


            gsap.to(controls, {
                x: targetTranslateX,
                y: targetTranslateY,
                duration: 0
            });
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            controls.style.cursor = "grab";
        });

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

            let targetTranslateX = initialControlX + deltaX;
            let targetTranslateY = initialControlY + deltaY;

            const controlsWidth = controls.offsetWidth;
            const controlsHeight = controls.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const currentAbsX = initialClientX + targetTranslateX;
            const currentAbsY = initialClientY + targetTranslateY;

            if (currentAbsX < 0) targetTranslateX = -initialClientX;
            if (currentAbsX + controlsWidth > viewportWidth) targetTranslateX = viewportWidth - initialClientX - controlsWidth;
            if (currentAbsY < 0) targetTranslateY = -initialClientY;
            if (currentAbsY + controlsHeight > viewportHeight) targetTranslateY = viewportHeight - initialClientY - controlsHeight;


            gsap.to(controls, {
                x: targetTranslateX,
                y: targetTranslateY,
                duration: 0
            });
            e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchend", () => {
            isDragging = false;
            controls.style.cursor = "grab";
        });
    }
};

// Initialize Canvas before fetching data and starting animations
document.addEventListener('DOMContentLoaded', initCanvas);

// 데이터 가져오기 및 애니메이션 실행
fetchData();