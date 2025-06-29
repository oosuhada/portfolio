// modal.js
// This file exports functions and data related to the project modal.

// projectDetailsHtml: Contains the HTML content for each project's detail page.
// The content is structured to be dynamically inserted into the modal.
export const projectDetailsHtml = {
    '1': `
        <div class="container">
            <div class="card">
                <div class="hero-section">
                    <div class="hero-image">
                        Nomad Market: Empowering Global Commerce
                    </div>
                    <div class="hero-caption">Nomad Market: Empowering Global Commerce</div>
                </div>
                <div class="top-content">
                    <div class="top-main">
                        <div class="header">
                            <div class="project-title">Nomad Market</div>
                            <div class="project-subtitle">Global Commerce App for Digital Nomads</div>
                        </div>
                        <div class="insights">
                            <h3>Key Insights</h3>
                            <ul>
                                <li>Scalable Design System: Created a multilingual interface adaptable to various currencies and cultural contexts.</li>
                                <li>Cross-Platform Success: Successfully implemented Flutter-based solution ensuring consistent UX across devices.</li>
                                <li>Real-Time Integration: Connected Firebase backend for seamless inventory and order management.</li>
                            </ul>
                        </div>
                        <div class="skills-values">
                            <h3>Skills & Values</h3>
                            <div class="tags">
                                <span class="tag">Figma</span>
                                <span class="tag">Flutter</span>
                                <span class="tag">Empathy</span>
                                <span class="tag">Big-Picture</span>
                                <span class="tag">Growth</span>
                            </div>
                        </div>
                    </div>
                    <div class="top-sidebar">
                        <div class="sidebar-section">
                            <span class="sidebar-label">Date</span>
                            <div class="sidebar-value">Dec 2024</div>
                        </div>
                        <div class="sidebar-section">
                            <span class="sidebar-label">Roles</span>
                            <div class="sidebar-value">
                                UX Planning<br>
                                UI Design<br>
                                Frontend Development
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <span class="sidebar-label">Tools Used</span>
                            <div class="sidebar-value">
                                Figma<br>
                                Flutter<br>
                                Notion<br>
                                Firebase
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <span class="sidebar-label">Strengths</span>
                            <div class="sidebar-value">
                                Problem-Solving<br>
                                Fast Learning<br>
                                Creative Intuition<br>
                                Cross-Functional Communication
                            </div>
                        </div>
                        <div class="qr-section">
                            <a href="#">
                                <img src="https://placehold.co/100x100/eeeeee/333333?text=QR+Code" alt="QR Code for GitHub or Figma Prototype">
                                <div class="qr-caption">GitHub or Figma Prototype (Coming Soon)</div>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="process-section discover-section">
                    <h3><span class="number-circle">1</span> Discover</h3>
                    <div class="process-content">
                        <div class="carousel-container">
                            <div class="carousel">
                                <div class="carousel-images">
                                    <div class="carousel-image">
                                        <img src="https://placehold.co/800x450/e0e0e0/333333?text=Discovery+Image+1" alt="Discovery Image 1">
                                    </div>
                                    <div class="carousel-image">
                                        <img src="https://placehold.co/800x450/e0e0e0/333333?text=Discovery+Image+2" alt="Discovery Image 2">
                                    </div>
                                    <div class="carousel-image">
                                        <img src="https://placehold.co/800x450/e0e0e0/333333?text=Discovery+Image+3" alt="Discovery Image 3">
                                    </div>
                                </div>
                            </div>
                            <div class="carousel-nav">
                                <button class="carousel-nav-button prev">←</button>
                                <button class="carousel-nav-button next">→</button>
                            </div>
                            <div class="carousel-caption">Discovery: User Research Visuals</div>
                        </div>
                        <div class="description">
                            Leveraged creative intuition and cross-functional communication to research digital nomads' needs, empathetically defining pain points in global commerce.
                        </div>
                        <div class="discover-content">
                            <div>
                                <h4 style="margin-top: 0; color: #333;">Research Methods</h4>
                                <ul style="color: #666; font-size: 14px;">
                                    <li>User interviews with 15 digital nomads</li>
                                    <li>Competitive analysis of 8 global commerce apps</li>
                                    <li>Cultural context research across 12 countries</li>
                                    <li>Currency and payment method analysis</li>
                                </ul>
                            </div>
                            <div class="mindmap-container">
                                <div class="mindmap-center">Digital Nomads</div>
                                <div class="mindmap-nodes">
                                    <div class="mindmap-node">Currency Issues</div>
                                    <div class="mindmap-node">Language Barriers</div>
                                    <div class="mindmap-node">Trust & Safety</div>
                                    <div class="mindmap-node">Local Regulations</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="process-section define-section">
                    <h3><span class="number-circle">2</span> Define</h3>
                    <div class="process-content">
                        <div class="carousel-container">
                            <div class="carousel">
                                <div class="carousel-images">
                                    <div class="carousel-image">
                                        <img src="https://placehold.co/800x450/e0e0e0/333333?text=Define+Image+1" alt="Define Image 1">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Define+Image+2" alt="Define Image 2">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Define+Image+3" alt="Define Image 3">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="carousel-nav">
                                        <button class="carousel-nav-button prev">←</button>
                                        <button class="carousel-nav-button next">→</button>
                                    </div>
                                    <div class="carousel-caption">Define: Wireframes and Flows</div>
                                </div>
                                <div class="description">
                                    Applied problem-solving skills to create user flows and wireframes in Figma, ensuring big-picture scalability for multilingual and multi-currency support.
                                </div>
                                <div class="flowchart-container">
                                    <div class="flow-step">User Research</div>
                                    <div class="flow-arrow">→</div>
                                    <div class="flow-step">Problem Definition</div>
                                    <div class="flow-arrow">→</div>
                                    <div class="flow-step">User Journey</div>
                                    <div class="flow-arrow">→</div>
                                    <div class="flow-step">Wireframes</div>
                                </div>
                                <div style="margin-top: 20px; background: #fff; border-radius: 12px; padding: 20px;">
                                    <h4 style="margin-top: 0; color: #333;">Key User Journey</h4>
                                    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Primary flow for international purchase:</p>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                                        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; text-align: center; font-size: 12px;">Location Detection</div>
                                        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; text-align: center; font-size: 12px;">Currency Selection</div>
                                        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; text-align: center; font-size: 12px;">Product Browse</div>
                                        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; text-align: center; font-size: 12px;">Secure Checkout</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="process-section design-section">
                            <h3><span class="number-circle">3</span> Design</h3>
                            <div class="process-content">
                                <div class="carousel-container">
                                    <div class="carousel">
                                        <div class="carousel-images">
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Design+Image+1" alt="Design Image 1">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Design+Image+2" alt="Design Image 2">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Design+Image+3" alt="Design Image 3">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="carousel-nav">
                                        <button class="carousel-nav-button prev">←</button>
                                        <button class="carousel-nav-button next">→</button>
                                    </div>
                                    <div class="carousel-caption">Design: UI Mockups</div>
                                </div>
                                <div class="description">
                                    Designed intuitive, culturally adaptive UI with conviction using Figma, balancing aesthetics and usability to create a scalable design system.
                                </div>
                                <div class="design-showcase">
                                    <div>
                                        <div class="color-palette">
                                            <div class="palette-title">Primary Colors</div>
                                            <div class="color-row">
                                                <div class="color-swatch" style="background: #333; color: #fff;">#333333</div>
                                                <div class="color-swatch" style="background: #666; color: #fff;">#666666</div>
                                            </div>
                                            <div class="palette-title" style="margin-top: 15px;">Secondary Colors</div>
                                            <div class="color-row">
                                                <div class="color-swatch" style="background: #999; color: #fff;">#999999</div>
                                                <div class="color-swatch" style="background: #e0e0e0; color: #333;">#e0e0e0</div>
                                            </div>
                                            <div class="palette-title" style="margin-top: 15px;">Neutral Colors</div>
                                            <div class="color-row">
                                                <div class="color-swatch" style="background: #f5f5f5; color: #333;">#f5f5f5</div>
                                                <div class="color-swatch" style="background: #fff; color: #333;">#ffffff</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mockup-container">
                                        <div class="phone-mockup">
                                            <div class="phone-screen">
                                                <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #999; border-radius: 2px;"></div>
                                                <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); width: 30px; height: 3px; background: #999; border-radius: 2px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style="margin-top: 20px; background: #fff; border-radius: 12px; padding: 20px;">
                                    <h4 style="margin-top: 0; color: #333;">Design Principles</h4>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                        <div style="text-align: center;">
                                            <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Adaptability</div>
                                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">Cultural Adaptability</div>
                                            <div style="font-size: 12px; color: #666;">RTL support, neutral colors</div>
                                        </div>
                                        <div style="text-align: center;">
                                            <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Performance</div>
                                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">Performance First</div>
                                            <div style="font-size: 12px; color: #666;">Optimized for slow networks</div>
                                        </div>
                                        <div style="text-align: center;">
                                            <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Security</div>
                                            <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">Trust & Security</div>
                                            <div style="font-size: 12px; color: #666;">Clear security indicators</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="process-section deliver-section">
                            <h3><span class="number-circle">4</span> Deliver</h3>
                            <div class="process-content">
                                <div class="carousel-container">
                                    <div class="carousel">
                                        <div class="carousel-images">
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Deliver+Image+1" alt="Deliver Image 1">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Deliver+Image+2" alt="Deliver Image 2">
                                            </div>
                                            <div class="carousel-image">
                                                <img src="https://placehold.co/800x450/e0e0e0/333333?text=Deliver+Image+3" alt="Deliver Image 3">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="carousel-nav">
                                        <button class="carousel-nav-button prev">←</button>
                                        <button class="carousel-nav-button next">→</button>
                                    </div>
                                    <div class="carousel-caption">Deliver: App Screenshots</div>
                                </div>
                                <div class="description">
                                    Built a cross-platform app with Flutter and integrated Firebase for real-time functionality, iterating rapidly to reflect fast learning and continuous growth.
                                </div>
                                <div class="dashboard-container">
                                    <div class="metrics-grid">
                                        <div class="metric-card">
                                            <div class="metric-value">95%</div>
                                            <div class="metric-label">User Satisfaction</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-value">12</div>
                                            <div class="metric-label">Countries Supported</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-value">8</div>
                                            <div class="metric-label">Languages</div>
                                        </div>
                                    </div>
                                    <div class="progress-section">
                                        <h4 style="margin-bottom: 15px; color: #333;">Development Progress</h4>
                                        <div class="progress-item">
                                            <div class="progress-label">UI Implementation</div>
                                            <div class="progress-bar">
                                                <div class="progress-fill" data-width="100%" style="width: 0;"></div>
                                            </div>
                                        </div>
                                        <div class="progress-item">
                                            <div class="progress-label">Firebase Integration</div>
                                            <div class="progress-bar">
                                                <div class="progress-fill" data-width="90%" style="width: 0;"></div>
                                            </div>
                                        </div>
                                        <div class="progress-item">
                                            <div class="progress-label">Payment Gateway</div>
                                            <div class="progress-bar">
                                                <div class="progress-fill" data-width="85%" style="width: 0;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="nav-buttons">
                            <div class="nav-button prev">
                                <i class="fas fa-arrow-left"></i>
                                <span>Prev</span>
                            </div>
                            <div class="nav-button next">
                                <i class="fas fa-arrow-right"></i>
                                <span>Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            '2': `
                <div class="container">
                    <div class="card">
                        <div class="hero-section">
                            <div class="hero-image">
                                Onjung Project: Content Coming Soon!
                            </div>
                            <div class="hero-caption">We're building something great. Check back soon!</div>
                        </div>
                        <div style="text-align: center; padding: 50px;">
                            <p style="font-size: 1.2rem; color: #555;">Detailed content for <strong>Onjung App</strong> is currently being prepared.</p>
                            <p style="color: #777;">Thank you for your patience!</p>
                        </div>
                        <div class="nav-buttons">
                            <div class="nav-button prev">
                                <i class="fas fa-arrow-left"></i>
                                <span>Prev</span>
                            </div>
                            <div class="nav-button next">
                                <i class="fas fa-arrow-right"></i>
                                <span>Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            '3': `
                <div class="container">
                    <div class="card">
                        <div class="hero-section">
                            <div class="hero-image">
                                Oosu Salon Project: Content Coming Soon!
                            </div>
                            <div class="hero-caption">We're building something great. Check back soon!</div>
                        </div>
                        <div style="text-align: center; padding: 50px;">
                            <p style="font-size: 1.2rem; color: #555;">Detailed content for <strong>Oosu Salon Website</strong> is currently being prepared.</p>
                            <p style="color: #777;">Thank you for your patience!</p>
                        </div>
                        <div class="nav-buttons">
                            <div class="nav-button prev">
                                <i class="fas fa-arrow-left"></i>
                                <span>Prev</span>
                            </div>
                            <div class="nav-button next">
                                <i class="fas fa-arrow-right"></i>
                                <span>Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            '4': `
                <div class="container">
                    <div class="card">
                        <div class="hero-section">
                            <div class="hero-image">
                                Sticks and Stones Project: Content Coming Soon!
                            </div>
                            <div class="hero-caption">We're building something great. Check back soon!</div>
                        </div>
                        <div style="text-align: center; padding: 50px;">
                            <p style="font-size: 1.2rem; color: #555;">Detailed content for <strong>Sticks and Stones Website</strong> is currently being prepared.</p>
                            <p style="color: #777;">Thank you for your patience!</p>
                        </div>
                        <div class="nav-buttons">
                            <div class="nav-button prev">
                                <i class="fas fa-arrow-left"></i>
                                <span>Prev</span>
                            </div>
                            <div class="nav-button next">
                                <i class="fas fa-arrow-right"></i>
                                <span>Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            '5': `
                <div class="container">
                    <div class="card">
                        <div class="hero-section">
                            <div class="hero-image">
                                Skyscanner Redesign Project: Content Coming Soon!
                            </div>
                            <div class="hero-caption">We're building something great. Check back soon!</div>
                        </div>
                        <div style="text-align: center; padding: 50px;">
                            <p style="font-size: 1.2rem; color: #555;">Detailed content for <strong>Skyscanner Redesign</strong> is currently being prepared.</p>
                            <p style="color: #777;">Thank you for your patience!</p>
                        </div>
                        <div class="nav-buttons">
                            <div class="nav-button prev">
                                <i class="fas fa-arrow-left"></i>
                                <span>Prev</span>
                            </div>
                            <div class="nav-button next">
                                <i class="fas fa-arrow-right"></i>
                                <span>Next</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };
        // --- Modal DOM Elements (Queried once for efficiency) ---
const modalElement = document.getElementById('projectModal'); // The main modal container (overlay)
const modalContentBody = document.getElementById('modal-content-body'); // The body where project HTML is injected
const closeModalButton = document.querySelector('.modal .close-button'); // The close button
const projectImageAnchorsAll = Array.from(document.querySelectorAll('.project-image')); // All project image anchors for navigation
const mainContent = document.querySelector(".main-content"); // Added to manage main content visibility

// --- State Variables for Modal Management ---
let originalScrollPosition = 0; // Stores scroll position before modal opens (actual pre-click position)
let lastFocusedElement = null; // Stores the last focused element before modal opens (for accessibility)
let currentOpenedProjectImageAnchor = null; // Stores the specific project-image anchor that opened the modal

// New variable to store the target scroll position *after* the project card is centered
let targetProjectScrollPosition = 0;

/**
 * Initializes interactions within the dynamically loaded modal content.
 * This function should be called every time new content is loaded into the modal.
 * @param {HTMLElement} currentModalContentElement The `.modal-content` element containing the project details.
 */
export function initModalContentInteractions(currentModalContentElement) {
    // Collapsible sections (e.g., Discover, Define sections)
    currentModalContentElement.querySelectorAll('.process-section h3').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            if (content) {
                content.classList.toggle('hidden'); // Toggles a 'hidden' class for collapse effect
            }
        });
    });

    // Carousels inside modal (for image galleries within project details)
    currentModalContentElement.querySelectorAll('.carousel-container').forEach(container => {
        const carouselImages = container.querySelector('.carousel-images');
        const prevButton = container.querySelector('.carousel-nav-button.prev');
        const nextButton = container.querySelector('.carousel-nav-button.next');
        let currentIndex = 0;
        const totalImages = carouselImages ? carouselImages.children.length : 0; // Ensure carouselImages exists

        function updateCarousel() {
            if (carouselImages) {
                carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
            }
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalImages - 1;
                updateCarousel();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentIndex = (currentIndex < totalImages - 1) ? currentIndex + 1 : 0;
                updateCarousel();
            });
        }

        updateCarousel(); // Initialize carousel position on load
    });

    // Progress bar animations (for development progress indicators)
    currentModalContentElement.querySelectorAll('.progress-fill').forEach(fill => {
        const targetWidth = fill.dataset.width;
        // Use a small delay to ensure CSS transitions apply after the element is rendered
        setTimeout(() => {
            fill.style.width = targetWidth;
        }, 100);
    });

    // Navigation buttons within the modal (Prev/Next Project)
    const modalNavButtons = currentModalContentElement.querySelectorAll('.nav-buttons .nav-button');
    modalNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentProjectId = parseInt(modalElement.dataset.currentProjectId);
            let nextProjectId;

            if (this.classList.contains('prev')) {
                nextProjectId = currentProjectId - 1;
                if (nextProjectId < 1) nextProjectId = projectImageAnchorsAll.length;
            } else if (this.classList.contains('next')) {
                nextProjectId = currentProjectId + 1;
                if (nextProjectId > projectImageAnchorsAll.length) nextProjectId = 1;
            }

            const nextProjectAnchor = document.querySelector(`.project-image[data-project-id="${nextProjectId}"]`);
            if (nextProjectAnchor) {
                openModal(nextProjectId.toString(), nextProjectAnchor, true); // Pass true to indicate internal navigation
            }
        });
    });
}

/**
 * Opens the project modal with specified content and animation.
 * @param {string} projectId The ID of the project to display (corresponds to keys in projectDetailsHtml).
 * @param {HTMLElement} triggerAnchorElement The `project-image` anchor element that triggered the modal open.
 * @param {boolean} isInternalNav Indicates if the call is from internal modal navigation (prev/next buttons).
 */
export function openModal(projectId, triggerAnchorElement, isInternalNav = false) {
    if (!modalElement || !modalContentBody || !closeModalButton || !mainContent) {
        console.error("Modal DOM elements are missing. Cannot open modal.");
        return;
    }

    const content = projectDetailsHtml[projectId];
    if (!content) {
        console.warn(`Project details for ID ${projectId} not found in projectDetailsHtml.`);
        return;
    }

    if (!isInternalNav) {
        originalScrollPosition = window.scrollY; // Store the scroll position *before* any new scrolling.
        lastFocusedElement = document.activeElement;
        currentOpenedProjectImageAnchor = triggerAnchorElement;

        const projectCard = triggerAnchorElement.closest('.project');
        if (projectCard) {
            // First, smoothly scroll the project card into view.
            projectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Wait for the scroll animation to complete, then proceed with modal animation.
            // A duration of ~800ms is a good estimate for 'smooth' scroll behavior.
            setTimeout(() => {
                targetProjectScrollPosition = window.scrollY; // Store the scroll position *after* centering the project card.

                // Add no-scroll2 to body to prevent background scrolling
                document.body.classList.add('no-scroll2');
                modalElement.dataset.currentProjectId = projectId; // Set current project ID on the modal

                const modalContentElement = modalElement.querySelector('.modal-content');
                const projectImageElement = triggerAnchorElement;

                // Step 1: Prepare for animations
                mainContent.classList.add('hide-for-modal'); // Hide the main content to prevent flickering

                // Ensure project image transitions correctly by clearing previous inline styles
                // and then setting only the opacity for the fade-out.
                // The CSS defines the 'transform' transition, so `style.transition` only needs 'opacity'.
                projectImageElement.style.cssText = 'transition: opacity 0.4s ease-out; transform: none;';
                void projectImageElement.offsetWidth; // Force reflow to apply 'none' transform and new transition

                projectImageElement.style.opacity = '1'; // Ensure it's opaque before fading out

                // Modal content: starts off-screen right, will slide in
                modalContentElement.style.transition = 'none'; // Disable transition for initial positioning
                modalContentElement.style.transform = 'translate(-50%, -50%) translateX(100%)'; // Start off-screen to the right
                modalContentElement.style.opacity = '0';
                modalContentElement.style.visibility = 'hidden';
                modalContentElement.style.pointerEvents = 'none';
                modalContentElement.style.position = 'fixed'; // Position relative to viewport
                modalContentElement.style.width = 'calc(100% - 80px)'; // Standard modal width
                modalContentElement.style.height = '90vh'; // Standard modal height
                modalContentElement.style.top = '50%';
                modalContentElement.style.left = '50%';

                modalElement.classList.add('active'); // Activate the modal overlay (blur, opacity)

                // Trigger project image fade-out immediately after modal overlay is active
                projectImageElement.style.opacity = '0';

                // Delay modal slide-in after project image starts fading
                setTimeout(() => {
                    modalContentBody.innerHTML = content; // Insert content

                    // Step 2: Trigger modal slide-in animations
                    // Re-enable transition for modal content and slide it into center
                    modalContentElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                    modalContentElement.style.transform = 'translate(-50%, -50%) translateX(0)'; // Slide into center
                    modalContentElement.style.opacity = '1'; // Fade in
                    modalContentElement.style.visibility = 'visible'; // Make visible
                    modalContentElement.style.pointerEvents = 'auto'; // Enable interactions
                    modalContentElement.style.overflowY = 'auto'; // Enable scrolling after transition

                    // Initialize interactions for the newly loaded content
                    // This must be called AFTER content is loaded and modal is visible
                    setTimeout(() => {
                        initModalContentInteractions(modalContentElement);
                        closeModalButton.focus(); // Focus close button for accessibility
                    }, 400); // Wait for modal content slide-in to complete
                }, 300); // Short delay after image fade begins
            }, 500); // Adjust this delay to match your 'smooth' scroll duration
        } else {
            console.error("Project card not found for the given triggerAnchorElement. Cannot scroll.");
            // If projectCard is not found, proceed without scrolling.
            // This case might require different animation choreography or a fallback.
            // For now, we'll assume it's found and proceed only after scroll.
        }
    } else { // isInternalNav = true (internal modal navigation)
        modalElement.dataset.currentProjectId = projectId; // Set current project ID on the modal
        const modalContentElement = modalElement.querySelector('.modal-content');

        modalContentElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        modalContentElement.style.opacity = '0';
        modalContentElement.style.transform = 'translate(-50%, -50%) scale(0.95)'; // Slight scale down for internal transition
        modalContentBody.innerHTML = ''; // Clear previous content immediately for new content

        setTimeout(() => {
            modalContentBody.innerHTML = content;
            modalContentElement.style.transform = 'translate(-50%, -50%) scale(1)';
            modalContentElement.style.opacity = '1';
            initModalContentInteractions(modalContentElement);
            closeModalButton.focus(); // Focus close button for accessibility
        }, 300); // Shorter delay for internal nav
    }
}

/**
 * Closes the project modal with animation.
 */
export function closeModal() {
    if (!modalElement || !modalContentBody || !closeModalButton || !mainContent || !currentOpenedProjectImageAnchor) {
        console.error("Modal DOM elements or currentOpenedProjectImageAnchor are missing. Cannot close modal.");
        return;
    }

    const modalContentElement = modalElement.querySelector('.modal-content');
    const projectImageElement = currentOpenedProjectImageAnchor;

    // Disable scrolling for modal content during close animation
    modalContentElement.style.overflowY = 'hidden';

    // Step 1: Trigger modal slide-out animation to the right
    modalContentElement.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
    modalContentElement.style.transform = 'translate(-50%, -50%) translateX(100%)'; // Slide out to the right
    modalContentElement.style.opacity = '0';
    modalContentElement.style.pointerEvents = 'none'; // Disable interactions immediately

    mainContent.classList.remove('hide-for-modal'); // Re-enable interaction with main content

    // Trigger project image fade-in slightly before modal content is fully gone
    setTimeout(() => {
        if (projectImageElement) {
            // Ensure project image transitions correctly by clearing previous inline styles
            // and then setting only the opacity for the fade-in.
            projectImageElement.style.cssText = 'transition: opacity 0.4s ease-in; transform: none;';
            void projectImageElement.offsetWidth; // Force reflow
            projectImageElement.style.opacity = '1'; // Fade back in
        }
    }, 200); // Start image fade-in after 200ms of modal slide-out

    // Cleanup after all animations complete (based on modal content transition duration)
    // The modal overlay should disappear *after* the modal content has fully slid out.
    setTimeout(() => {
        modalElement.classList.remove('active'); // Deactivate modal overlay (display:none after fade)
        document.body.classList.remove('no-scroll2'); // Re-enable body scrolling

        // Restore scroll position to where the project card was centered
        window.scrollTo({
            top: targetProjectScrollPosition,
            behavior: 'smooth'
        });

        // Restore focus to the element that was focused before opening the modal
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }

        modalContentBody.innerHTML = ''; // Clear modal content
        modalElement.dataset.currentProjectId = ''; // Clear current project ID
        targetProjectScrollPosition = 0; // Reset target scroll position for next open

        // Reset all inline styles on modal content and project image for a clean state
        modalContentElement.style.cssText = '';
        if (projectImageElement) {
            projectImageElement.style.cssText = '';
        }
        currentOpenedProjectImageAnchor = null; // Clear the stored anchor reference
    }, 400); // This should be exactly the duration of modalContentElement's transition (0.4s)
}

// --- Event Listener Setup (Runs once DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners for the modal close button and overlay clicks
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }
    // Listen for clicks on the modal element itself to close it if clicked outside the content
    if (modalElement) {
        modalElement.addEventListener('click', function(event) {
            if (event.target === modalElement) { // Check if the click was directly on the overlay
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        // Check if the modal is currently active before attempting to close
        if (event.key === 'Escape' && modalElement && modalElement.classList.contains('active')) {
            closeModal();
        }
    });
});