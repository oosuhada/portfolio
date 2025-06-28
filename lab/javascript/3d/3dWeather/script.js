
// script.js
import * as THREE from "https://esm.sh/three";
import { OrbitControls } from "https://esm.sh/three/examples/jsm/controls/OrbitControls.js";

// Get the date and time element from the HTML
const dateTimeEl = document.getElementById('dateTime');

/**
 * Updates the current date and time displayed in the widget.
 * Formats the date as "Weekday, HH:MM".
 */
function updateDateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
    // Check if the element exists before updating its text content
    if (dateTimeEl) {
        dateTimeEl.textContent = `${now.toLocaleDateString(undefined, optionsDate)}, ${now.toLocaleTimeString([], optionsTime)}`;
    }
}

// Initial call to update date and time on load
updateDateTime();
// Update date and time every minute
setInterval(updateDateTime, 60000);

// Get the cloud container element where the 3D animation will be rendered
const container = document.getElementById('cloud-container');

// Check if the cloud container exists to prevent errors
if (container) {
    // Get the bounding rectangle of the container for setting up the Three.js renderer size
    const containerRect = container.getBoundingClientRect();

    // Create a new Three.js scene
    const scene = new THREE.Scene();

    // Calculate camera aspect ratio based on container dimensions, defaulting to 1 if dimensions are invalid
    const cameraAspect = (containerRect.width > 0 && containerRect.height > 0) ? containerRect.width / containerRect.height : 1;
    // Create a perspective camera
    const camera = new THREE.PerspectiveCamera(60, cameraAspect, 0.1, 1000);
    // Set camera position
    camera.position.set(0, 0.5, 4.5);

    // Create a WebGL renderer with antialiasing and transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Set renderer size to match container
    renderer.setSize(containerRect.width, containerRect.height);
    // Set clear color to transparent
    renderer.setClearColor(0x000000, 0);
    // Append the renderer's DOM element to the container
    container.appendChild(renderer.domElement);

    // Add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    // Add a directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 3, 2);
    scene.add(directionalLight);
    // Add a point light for additional lighting
    const pointLight = new THREE.PointLight(0xaabbee, 0.8, 15);
    pointLight.position.set(-1, 1, 3);
    scene.add(pointLight);

    // Initialize OrbitControls for interactive camera control
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      // Enable smooth camera movement
    controls.dampingFactor = 0.07;      // Damping factor for controls
    controls.rotateSpeed = 0.8;         // Rotation speed
    controls.enableZoom = false;        // Disable zooming
    controls.enablePan = false;         // Disable panning
    controls.minPolarAngle = Math.PI / 3; // Restrict vertical rotation
    controls.maxPolarAngle = Math.PI / 1.8; // Restrict vertical rotation
    controls.target.set(0, 0, 0);       // Set the camera target to the origin

    // Create a group to hold all cloud parts
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup); // Add the cloud group to the scene

    // Define the material for the clouds with PhysicalMaterial for realistic appearance
    const cloudMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f8ff,            // Off-white color for clouds
        transparent: true, opacity: 0.85, // Make clouds slightly transparent
        roughness: 0.6, metalness: 0.0, // Non-metallic, slightly rough
        transmission: 0.1,          // Slight light transmission
        ior: 1.3,                   // Index of refraction
        specularIntensity: 0.2,     // Specular highlight intensity
        sheen: 0.2, sheenColor: 0xffffff, sheenRoughness: 0.5, // Sheen effect
        clearcoat: 0.05, clearcoatRoughness: 0.3, // Clearcoat layer
    });

    /**
     * Creates a single spherical part of a cloud.
     * @param {number} radius - The radius of the sphere.
     * @param {THREE.Vector3} position - The position of the sphere.
     * @returns {THREE.Mesh} - The created sphere mesh.
     */
    function createCloudPart(radius, position) {
        const geometry = new THREE.SphereGeometry(radius, 20, 20); // Sphere geometry
        const mesh = new THREE.Mesh(geometry, cloudMaterial); // Mesh with cloud material
        mesh.position.copy(position); // Set position
        return mesh;
    }

    /**
     * Creates a detailed cloud composed of multiple spherical parts.
     * @param {number} x - X position of the cloud group.
     * @param {number} y - Y position of the cloud group.
     * @param {number} z - Z position of the cloud group.
     * @param {number} scale - Overall scale of the cloud.
     * @returns {THREE.Group} - The created cloud group.
     */
    function createDetailedCloud(x, y, z, scale) {
        const singleCloudGroup = new THREE.Group();
        singleCloudGroup.position.set(x, y, z);
        singleCloudGroup.scale.set(scale, scale, scale);
        // Define parts of the cloud with varying sizes and positions
        const parts = [
            { radius: 0.8, position: new THREE.Vector3(0, 0, 0) },
            { radius: 0.6, position: new THREE.Vector3(0.7, 0.2, 0.1) },
            { radius: 0.55, position: new THREE.Vector3(-0.6, 0.1, -0.2) },
            { radius: 0.7, position: new THREE.Vector3(0.1, 0.4, -0.3) },
            { radius: 0.5, position: new THREE.Vector3(0.3, -0.3, 0.2) },
            { radius: 0.6, position: new THREE.Vector3(-0.4, -0.2, 0.3) },
            { radius: 0.45, position: new THREE.Vector3(0.8, -0.1, -0.2) },
            { radius: 0.5, position: new THREE.Vector3(-0.7, 0.3, 0.3) },
        ];
        // Add each part to the cloud group
        parts.forEach(part => singleCloudGroup.add(createCloudPart(part.radius, part.position)));
        // Store cloud-specific data for animation and rain effects
        singleCloudGroup.userData = {
            isRaining: false,
            rainColor: Math.random() > 0.5 ? 0x87CEFA : 0xB0E0E6, // Random rain color
            originalPosition: singleCloudGroup.position.clone(), // Store original position for bobbing
            bobOffset: Math.random() * Math.PI * 2, // Random offset for bobbing animation
            bobSpeed: 0.0005 + Math.random() * 0.0003, // Random speed for bobbing
            bobAmount: 0.15 + Math.random() * 0.1, // Random amount for bobbing
        };
        return singleCloudGroup;
    }

    // Create two detailed clouds and add them to the cloud group
    const cloud1 = createDetailedCloud(-0.7, 0.2, 0, 1.0);
    const cloud2 = createDetailedCloud(0.7, -0.1, 0.3, 0.9);
    cloudGroup.add(cloud1, cloud2);
    cloudGroup.position.y = -0.2; // Adjust vertical position of the cloud group

    let autoRotateSpeed = 0.002; // Speed for automatic cloud rotation

    /**
     * Creates raindrops for a given cloud.
     * @param {THREE.Group} cloud - The cloud group to which raindrops will be added.
     * @returns {Array<THREE.Mesh>} - An array of created raindrop meshes.
     */
    function createRaindropsForCloud(cloud) {
        const rainGroup = new THREE.Group();
        cloud.add(rainGroup); // Add the rain group as a child of the cloud
        cloud.userData.rainGroup = rainGroup; // Store reference to the rain group
        // Material for raindrops
        const raindropMaterial = new THREE.MeshBasicMaterial({ color: cloud.userData.rainColor, transparent: true, opacity: 0.7 });
        const localRaindrops = [];
        // Create multiple raindrops
        for (let i = 0; i < 30; i++) {
            const raindropGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6); // Cylinder geometry for raindrops
            const raindrop = new THREE.Mesh(raindropGeom, raindropMaterial);
            // Random initial position for raindrops
            raindrop.position.set( (Math.random() - 0.5) * 1.8, -0.8 - Math.random() * 1.5, (Math.random() - 0.5) * 1.8 );
            // Store original Y position and speed for animation
            raindrop.userData = { originalY: raindrop.position.y - Math.random() * 0.5, speed: 0.08 + Math.random() * 0.05 };
            localRaindrops.push(raindrop);
            rainGroup.add(raindrop);
        }
        rainGroup.visible = false; // Hide raindrops initially
        return localRaindrops;
    }

    // Create raindrops for both clouds
    const raindrops1 = createRaindropsForCloud(cloud1);
    const raindrops2 = createRaindropsForCloud(cloud2);

    // Initialize Raycaster and Mouse vector for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Add click event listener to the renderer's DOM element
    renderer.domElement.addEventListener('click', (event) => {
        // Get normalized device coordinates from mouse click
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Find intersecting objects with the raycaster from the cloud group's children
        const intersects = raycaster.intersectObjects(cloudGroup.children, true);

        if (intersects.length > 0) {
            let clickedObj = intersects[0].object;
            let physicallyClickedCloud = null;

            // Traverse up the hierarchy to find the main cloud group that was clicked
            while (clickedObj.parent && clickedObj.parent !== cloudGroup) {
                clickedObj = clickedObj.parent;
            }

            // If a main cloud group was clicked
            if (clickedObj.parent === cloudGroup) {
                physicallyClickedCloud = clickedObj;

                const isCloud1Raining = cloud1.userData.isRaining;
                const isCloud2Raining = cloud2.userData.isRaining;

                let newGlobalRainState;
                // Toggle global rain state: if both are raining, stop; otherwise, start raining
                if (isCloud1Raining && isCloud2Raining) {
                    newGlobalRainState = false;
                } else {
                    newGlobalRainState = true;
                }

                // Apply the new rain state to cloud1 and its raindrops
                cloud1.userData.isRaining = newGlobalRainState;
                if (cloud1.userData.rainGroup) {
                    cloud1.userData.rainGroup.visible = newGlobalRainState;
                }

                // Apply the new rain state to cloud2 and its raindrops
                cloud2.userData.isRaining = newGlobalRainState;
                if (cloud2.userData.rainGroup) {
                    cloud2.userData.rainGroup.visible = newGlobalRainState;
                }

                // Add a temporary scale animation to the clicked cloud
                if (physicallyClickedCloud) {
                    const originalScale = physicallyClickedCloud.scale.clone();
                    physicallyClickedCloud.scale.multiplyScalar(1.15); // Scale up
                    setTimeout(() => {
                        physicallyClickedCloud.scale.copy(originalScale); // Revert scale after a short delay
                    }, 150);
                }
            }
        }
    });

    // Get the tooltip element
    const tooltip = document.getElementById('cloud-tooltip');
    // Show tooltip briefly after a delay
    setTimeout(() => {
        if (tooltip) tooltip.classList.add('opacity-100');
        setTimeout(() => { if (tooltip) tooltip.classList.remove('opacity-100'); }, 3500);
    }, 1500);

    /**
     * Animation loop for Three.js scene.
     */
    function animate() {
        requestAnimationFrame(animate); // Request next animation frame

        const time = Date.now(); // Get current time for animations

        cloudGroup.rotation.y += autoRotateSpeed; // Rotate the entire cloud group

        // Animate individual clouds and their raindrops
        [cloud1, cloud2].forEach(cloud => {
            if (cloud) {
                // Apply bobbing animation to each cloud
                cloud.position.y = cloud.userData.originalPosition.y + Math.sin(time * cloud.userData.bobSpeed + cloud.userData.bobOffset) * cloud.userData.bobAmount;

                // If cloud is raining, animate raindrops
                if (cloud.userData.isRaining && cloud.userData.rainGroup) {
                    const currentRaindrops = cloud === cloud1 ? raindrops1 : raindrops2; // Get specific raindrops for current cloud
                    currentRaindrops.forEach(raindrop => {
                        raindrop.position.y -= raindrop.userData.speed; // Move raindrop downwards
                        // Reset raindrop position if it goes too far down
                        if (raindrop.position.y < -5) {
                            raindrop.position.y = -0.8;
                            raindrop.position.x = (Math.random() - 0.5) * 1.8 * cloud.scale.x;
                            raindrop.position.z = (Math.random() - 0.5) * 1.8 * cloud.scale.z;
                        }
                    });
                }
            }
        });

        controls.update(); // Update OrbitControls
        renderer.render(scene, camera); // Render the scene
    }

    // Handle window resize events to adjust camera aspect ratio and renderer size
    window.addEventListener('resize', () => {
        const newRect = container.getBoundingClientRect();
        if (newRect.width > 0 && newRect.height > 0) {
            camera.aspect = newRect.width / newRect.height;
            camera.updateProjectionMatrix();
            renderer.setSize(newRect.width, newRect.height);
        }
    });

    // Start the animation loop
    animate();

} else {
    // Log an error if the cloud container is not found
    console.error("Cloud container (id: 'cloud-container') not found! 3D cloud animation will not be initialized.");
}
