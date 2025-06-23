// texthero.js (Vanilla JS with Three.js and GSAP)

// --- Three.js 관련 모듈 임포트 ---
import * as THREE from '../script/three-module-min.js';
import { GLTFLoader } from '../script/GLTFLoader.js';

// --- GSAP 및 ScrollTrigger 임포트 및 플러그인 등록 ---
// Assuming gsap and ScrollTrigger are globally available or imported elsewhere.
// If not, uncomment and ensure paths are correct:
// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(ScrollTrigger); // This should typically be called once globally.


const listItemWrapper = document.getElementById("list-item-wrapper");
const listItems = document.querySelectorAll(".list-item");
const skillsShowcaseSection = document.getElementById("skills-showcase-section");
const threeDContainer = document.querySelector('.skills-3d-container');

let listStyleChangeStartY;
let listStyleChangeEndY;
let division;
let currentIndex = -1;
let isTextheroAnimationActive = true;
let animationFrameId = null; // For list item highlighting

// --- Three.js Variables ---
let scene, camera, renderer;
let grapeModel; // Only grapeModel needed, no seed
let scrollTimeline;     // GSAP timeline (animation holder)
let scrollTriggerInstance; // GSAP ScrollTrigger instance (controls the timeline)

// --- Constants for 3D Model ---
// 이 상수들은 실제 애니메이션에 사용되지만, 디버깅을 위해 임시로 무시됩니다.
// 디버깅 성공 후에는 다시 이 상수를 기반으로 조정해야 합니다.
const MODEL_SCALE_START = 0.005; // Initial smaller scale for grape
const MODEL_SCALE_END = 0.02; // Final larger scale for grape

// Define the path for the grape animation (model positions, scale, rotation, opacity)
const GRAPE_ANIMATION_PATH = [
    { modelX: 0, modelY: -2, modelZ: 0, modelScale: MODEL_SCALE_START, modelRotY: 0, opacity: 0 }, // Start below view, hidden, small
    { modelX: 0, modelY: -0.5, modelZ: 0, modelScale: MODEL_SCALE_START * 1.5, modelRotY: Math.PI * 0.5, opacity: 1 }, // Enters view, grows, rotates
    { modelX: 0.3, modelY: 0.5, modelZ: 0, modelScale: MODEL_SCALE_END * 0.8, modelRotY: Math.PI * 1.5, opacity: 1 }, // Moves across, grows more, grows, rotates
    { modelX: -0.3, modelY: 0.8, modelZ: 0, modelScale: MODEL_SCALE_END * 1.2, modelRotY: Math.PI * 2.5, opacity: 1 }, // Moves further, largest, rotates
    { modelX: 0, modelY: -2, modelZ: 0, modelScale: MODEL_SCALE_END, modelRotY: Math.PI * 3, opacity: 0 } // Exits below view, hidden
];

// --- Initialization for Three.js Scene ---
function init3DScene() {
    console.log("init3DScene: Starting 3D scene initialization.");
    if (!threeDContainer) {
        console.error("init3DScene: .skills-3d-container element not found. Make sure it's in your HTML.");
        return;
    }

    // Scene
    scene = new THREE.Scene();
    console.log("init3DScene: THREE.Scene created.");

    // Camera
    // DEBUGGING STEP: Increase FOV to capture a wider view
    camera = new THREE.PerspectiveCamera(75, threeDContainer.clientWidth / threeDContainer.clientHeight, 0.1, 1000); // FOV 40 -> 75
    // DEBUGGING STEP: Place camera closer to the origin
    camera.position.set(0, 0, 2); // Camera at (0,0,2), very close to the origin (0,0,0)
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // Ensure camera looks at the origin
    console.log("init3DScene: THREE.PerspectiveCamera created. Position:", camera.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(threeDContainer.clientWidth, threeDContainer.clientHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    threeDContainer.appendChild(renderer.domElement);
    console.log("init3DScene: THREE.WebGLRenderer created and appended to .skills-3d-container.");
    console.log("Renderer size:", renderer.getSize(new THREE.Vector2()));
    console.log("DEBUG: Canvas element added to .skills-3d-container. Check its dimensions in DevTools.");


    // Lights (similar to Light.jsx)
    // DEBUGGING STEP: Add a strong white ambient light to ensure visibility even without directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Strong white ambient light (intensity 1 -> 2)
    scene.add(ambientLight);
    console.log("init3DScene: Ambient light added.");

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4); // White directional light
    dirLight1.position.set(-5, 15, -10);
    dirLight1.castShadow = true;
    scene.add(dirLight1);
    console.log("init3DScene: Directional light 1 added.");

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(4, 10, -4);
    dirLight2.castShadow = true;
    scene.add(dirLight2);
    console.log("init3DScene: Directional light 2 added.");

    const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight3.position.set(-10, -15, -10);
    dirLight3.castShadow = true;
    scene.add(dirLight3);
    console.log("init3DScene: Directional light 3 added.");

    // Load Models
    loadGrapeModel();

    // Event Listeners for Resize
    window.addEventListener('resize', onWindowResize);

    // Start rendering loop
    animate3DScene();
    console.log("init3DScene: Three.js scene initialization complete. Animation loop started.");
}

// --- Load GLB Model ---
function loadGrapeModel() {
    console.log("loadGrapeModel: Starting grape model loading.");
    const loader = new GLTFLoader();

    loader.load('./asset/grape.glb', (gltf) => { // Load the grape GLB model
        grapeModel = gltf.scene;
        console.log("loadGrapeModel: grape.glb loaded successfully.", grapeModel);
        if (!grapeModel) {
            console.error("loadGrapeModel: Loaded GLTF scene is null or undefined.");
            return;
        }

        grapeModel.traverse((child) => {
            if (child.isMesh && child.material) { // Ensure child has a material
                child.castShadow = true;
                child.receiveShadow = true;
                // --- DEBUGGING STEP: FORCE OPAQUE MATERIAL ---
                // If other GLB files work, but this grape doesn't,
                // its default material might be transparent or have 0 opacity.
                // Force it to be opaque and visible for testing.
                child.material.transparent = false; // Disable transparency
                child.material.opacity = 1;        // Set opacity to fully opaque
                child.material.needsUpdate = true; // Crucial for material changes to take effect
                // --- END DEBUGGING STEP ---

                // Keep the original opacity from GRAPE_ANIMATION_PATH for normal operation,
                // but for debugging, the above lines will temporarily override it.
                // child.material.opacity = GRAPE_ANIMATION_PATH[0].opacity; // Original line
                console.log(`loadGrapeModel: Mesh found: ${child.name}, material transparent: ${child.material.transparent}, opacity: ${child.material.opacity}`);
            }
        });

        // --- DEBUGGING STEP: FORCE EXTREMELY LARGE SCALE AND VISIBILITY AT ORIGIN ---
        // This is the most crucial test if other GLBs show.
        // Try increasing these values even further if it's still not visible.
        grapeModel.position.set(0, 0, 0); // Position at the center of the scene (camera at Z=2)
        // Adjust these numbers based on what you find from GLB viewers (e.g., if bounding box is 0.0001, scale by 10000)
        grapeModel.scale.set(500, 500, 500); // Try a significantly larger scale (e.g., 100, 500, 1000)
        grapeModel.visible = true; // Force visibility
        console.log("DEBUG: Grape model forced to be visible at (0,0,0) with large scale.");
        // --- END DEBUGGING STEP ---

        // The original lines for initial position/scale/rotation (commented out for forced debug values):
        /*
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
        grapeModel.rotation.y = GRAPE_ANIMATION_PATH[0].modelRotY;
        grapeModel.visible = false; // Initially hidden (original state)
        console.log("loadGrapeModel: grapeModel initial transform set and visibility to false.");
        */

        scene.add(grapeModel);
        console.log("loadGrapeModel: grape.glb added to scene. Current scene children:", scene.children);

        // Once model is loaded, setup GSAP ScrollTrigger
        // Keep this here, but note that the forced debug settings above will override ScrollTrigger's initial state
        // until ScrollTrigger's onUpdate starts manipulating it.
        setupScrollAnimation();
    }, (xhr) => {
        // Progress callback
        console.log(`loadGrapeModel: ${ (xhr.loaded / xhr.total * 100) }% loaded`);
    }, (error) => {
        // Error callback
        console.error('loadGrapeModel: An error occurred while loading the grape model:', error);
        if (error.target && error.target.status === 404) {
            console.error("loadGrapeModel: File not found (404). Check the path to grape.glb.");
        }
    });
}

// --- GSAP ScrollTrigger Setup for 3D Model ---
function setupScrollAnimation() {
    console.log("setupScrollAnimation: Attempting to set up ScrollTrigger.");
    if (!grapeModel || !skillsShowcaseSection) {
        console.warn("setupScrollAnimation: Grape model or skillsSection not ready. Skipping ScrollTrigger setup.");
        return;
    }

    // Clean up existing ScrollTrigger and timeline
    if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
        scrollTriggerInstance = null;
    }
    if (scrollTimeline) {
        scrollTimeline.kill();
        scrollTimeline = null;
    }

    // GSAP plugin registration (can be removed if done globally)
    // Ensure gsap and ScrollTrigger are loaded and available here.
    gsap.registerPlugin(ScrollTrigger);

    // 1. Create GSAP Timeline (defines the animation)
    scrollTimeline = gsap.timeline({ paused: true }); // Create paused initially

    // 2. Create ScrollTrigger instance and link it to the timeline
    scrollTriggerInstance = ScrollTrigger.create({
        animation: scrollTimeline, // Link to the created timeline
        trigger: skillsShowcaseSection,
        start: "top bottom", // Section top hits viewport bottom
        end: "bottom top", // Section bottom hits viewport top
        scrub: 1, // Smoothly link to scroll
        // markers: true, // Uncomment for debugging
        onUpdate: (self) => {
            const progress = self.progress; // Use ScrollTrigger's progress
            const pathLength = GRAPE_ANIMATION_PATH.length - 1;
            const segment = Math.floor(progress * pathLength);
            const segmentProgress = (progress * pathLength) - segment;

            const startPoint = GRAPE_ANIMATION_PATH[segment];
            const endPoint = GRAPE_ANIMATION_PATH[Math.min(segment + 1, pathLength)];

            const interp = (start, end, p) => start + (end - start) * p;

            const currentX = interp(startPoint.modelX, endPoint.modelX, segmentProgress);
            const currentY = interp(startPoint.modelY, endPoint.modelY, segmentProgress);
            const currentZ = interp(startPoint.modelZ, endPoint.modelZ, segmentProgress);
            const currentScale = interp(startPoint.modelScale, endPoint.modelScale, segmentProgress);
            const currentRotY = interp(startPoint.modelRotY, endPoint.modelRotY, segmentProgress);
            const currentOpacity = interp(startPoint.opacity, endPoint.opacity, segmentProgress);

            // Apply transformed properties to the grape model
            grapeModel.position.set(currentX, currentY, currentZ);
            grapeModel.scale.set(currentScale, currentScale, currentScale);
            grapeModel.rotation.y = currentRotY;

            // Update material opacity for fade effect
            grapeModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = currentOpacity;
                    // Material needs to be transparent if opacity is < 1, or if it starts transparent
                    child.material.transparent = currentOpacity < 1 || startPoint.opacity < 1;
                    child.material.needsUpdate = true; // Ensure material updates
                }
            });
            // console.log(`Scroll progress: ${progress.toFixed(2)}, modelY: ${currentY.toFixed(2)}, opacity: ${currentOpacity.toFixed(2)}`);
        },
        onEnter: () => {
            if (grapeModel) {
                grapeModel.visible = true; // Make model visible when entering
                console.log("ScrollTrigger: Entered skills section. Grape model visible.");
            }
        },
        onLeave: () => {
            if (grapeModel) {
                grapeModel.visible = false; // Hide model when leaving
                console.log("ScrollTrigger: Left skills section. Grape model hidden.");
            }
        },
        onEnterBack: () => {
            if (grapeModel) {
                grapeModel.visible = true; // Make model visible when entering from back
                console.log("ScrollTrigger: Entered skills section (back). Grape model visible.");
            }
        },
        onLeaveBack: () => {
            if (grapeModel) {
                grapeModel.visible = false; // Hide model when leaving back
                console.log("ScrollTrigger: Left skills section (back). Grape model hidden.");
            }
        }
    });

    // Refresh ScrollTrigger and set initial state
    ScrollTrigger.refresh(); // Ensure ScrollTrigger calculates correctly
    if (scrollTriggerInstance) {
        // Apply initial progress to the timeline
        scrollTimeline.progress(scrollTriggerInstance.progress);
        console.log("setupScrollAnimation: 3D grape ScrollTrigger setup completed. Initial progress:", scrollTriggerInstance.progress);
    } else {
        console.error("setupScrollAnimation: scrollTriggerInstance is null after creation. Something went wrong.");
    }
}

// --- Three.js Animation Loop ---
function animate3DScene() {
    requestAnimationFrame(animate3DScene);
    // console.log("Rendering..."); // Uncomment to verify render loop is active
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// --- Window Resize Handler ---
function onWindowResize() {
    console.log("onWindowResize: Window resized. Adjusting 3D scene.");
    if (camera && renderer && threeDContainer) {
        const width = threeDContainer.clientWidth;
        const height = threeDContainer.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        // Re-setup ScrollTrigger on resize to adjust to new layout
        setupScrollAnimation(); // Re-setup ScrollTrigger for new layout
        console.log("onWindowResize: 3D scene and ScrollTrigger adjusted to new size:", width, height);
    }
}

// --- Original texthero.js Logic (List Item Highlighting) ---
const updateListStyleVariables = () => {
    if (!listItemWrapper || !listItems.length || !skillsShowcaseSection) return;
    const startActivationOffsetRatio = 0.8;
    listStyleChangeStartY = skillsShowcaseSection.offsetTop - (window.innerHeight * (1 - startActivationOffsetRatio));
    listStyleChangeStartY = Math.max(0, listStyleChangeStartY);
    const endActivationOffsetRatio = 0.4;
    listStyleChangeEndY = skillsShowcaseSection.offsetTop + skillsShowcaseSection.offsetHeight - (window.innerHeight * endActivationOffsetRatio);
    division = (listStyleChangeEndY - listStyleChangeStartY) / Math.max(1, listItems.length - 1);
    if (division <= 0) division = 1;
    console.log(`List Highlight: StartY: ${listStyleChangeStartY}, EndY: ${listStyleChangeEndY}, Division: ${division}`);
};

const easeInOut = (t) => t * t * (3 - 2 * t);

const handleScrollAnimation = () => {
    if (!isTextheroAnimationActive) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    const currentScrollY = window.scrollY;
    const sectionRect = skillsShowcaseSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const activationThresholdTop = viewportHeight * 0.9;
    const activationThresholdBottom = viewportHeight * 0.1;

    const isSectionActivelyVisible = (sectionRect.top < activationThresholdTop && sectionRect.bottom > activationThresholdBottom);

    if (!isSectionActivelyVisible) {
        const currentOn = document.getElementById("on");
        if (currentOn) currentOn.removeAttribute("id");
        currentIndex = -1;
    } else {
        const activationZoneTop = listStyleChangeStartY;
        const activationZoneBottom = listStyleChangeEndY;
        let targetIndex = -1;

        if (currentScrollY <= activationZoneTop) {
            targetIndex = 0;
        } else if (currentScrollY >= activationZoneBottom) {
            targetIndex = listItems.length - 1;
        } else {
            let progress = (currentScrollY - activationZoneTop) / (activationZoneBottom - activationZoneTop);
            progress = Math.max(0, Math.min(1, progress));
            const easedProgress = easeInOut(progress);
            targetIndex = Math.round(easedProgress * (listItems.length - 1));
            targetIndex = Math.max(0, Math.min(listItems.length - 1, targetIndex));
        }

        if (targetIndex !== currentIndex) {
            const currentOn = document.getElementById("on");
            if (currentOn) currentOn.removeAttribute("id");
            if (targetIndex !== -1 && listItems[targetIndex]) {
                listItems[targetIndex].id = "on";
            }
            currentIndex = targetIndex;
            console.log(`List Highlight: Setting item ${currentIndex} to 'on'.`);
        }
    }
    animationFrameId = requestAnimationFrame(handleScrollAnimation);
};

// --- Event Listeners and Global Controls ---
window.addEventListener("scroll", () => {
    if (isTextheroAnimationActive) {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

// Initialize 3D scene and list item highlighting on window load
window.addEventListener('load', () => {
    console.log("Window loaded. Starting initialization.");
    updateListStyleVariables();
    init3DScene(); // Initialize 3D scene
    if (isTextheroAnimationActive) {
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
});

// Re-calculate list item variables and re-setup 3D scene on window resize
window.addEventListener('resize', () => {
    console.log("Window resize detected.");
    updateListStyleVariables();
    // 3D scene resize is handled by onWindowResize which calls setupScrollAnimation again
    // Resume list item highlighting animation
    if (isTextheroAnimationActive) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(handleScrollAnimation);
    }
});

// Global control methods to activate/deactivate animations
window.textheroComponent = {
    deactivateScrollAnimation: () => {
        isTextheroAnimationActive = false;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        if (scrollTriggerInstance) { // Use scrollTriggerInstance
            scrollTriggerInstance.disable(); // Disable ScrollTrigger
            console.log("3D ScrollTrigger disabled.");
        }
        if (grapeModel) {
            grapeModel.visible = false; // Hide 3D model
            console.log("3D grape model hidden.");
        }
        console.log("All scroll animations deactivated.");
    },
    activateScrollAnimation: () => {
        isTextheroAnimationActive = true;
        if (scrollTriggerInstance) { // Use scrollTriggerInstance
            scrollTriggerInstance.enable(); // Enable ScrollTrigger
            console.log("3D ScrollTrigger enabled.");
        }
        // Model visibility is handled by ScrollTrigger's onEnter/onEnterBack
        console.log("All scroll animations activated.");
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(handleScrollAnimation);
        }
    }
};