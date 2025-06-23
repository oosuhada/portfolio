(function() {
    const modalElement = document.getElementById('card-modal');
    // Module-scoped variables to manage state and event handlers
    let currentModalIndex = -1;
    let eventHandlers = {};

    /**
     * Navigates to a new project within the modal.
     * @param {number} newIndex - The index of the new project to display.
     */
    function navigateToProjectInModal(newIndex) {
        // Ensure projectList is available
        if (!window.projectList || window.projectList.length === 0) {
            console.error("[Modal] projectList is not available.");
            return;
        }

        const totalProjects = window.projectList.length;
        // Wrap around the index if it goes out of bounds
        currentModalIndex = (newIndex + totalProjects) % totalProjects;

        const project = window.projectList[currentModalIndex];
        if (!project) {
            console.error(`[Modal] Project not found at index: ${currentModalIndex}`);
            return;
        }

        console.log(`[Modal] Navigating to index ${currentModalIndex}: ${project.path}`);

        // Update the iframe src and the index counter text
        const iframe = modalElement.querySelector('iframe');
        const indexCounter = modalElement.querySelector('.modal-index-counter');

        if (iframe) {
            iframe.src = project.path;
        }
        if (indexCounter) {
            indexCounter.textContent = `${currentModalIndex + 1} / ${totalProjects}`;
        }
    }

    /**
     * Shows the fullscreen modal for a given poster.
     * @param {HTMLElement} poster - The clicked poster element.
     * @param {number} index - The index of the clicked poster in the projectList.
     */
    window.appShowModal = function(poster, index) {
        if (!modalElement) {
            console.error("Modal element #card-modal not found.");
            return;
        }

        const path = poster.dataset.path;
        if (!path) {
            console.error("Project path (data-path) not found on poster element.");
            return;
        }
        
        currentModalIndex = index; // Set the initial index
        const totalProjects = window.projectList.length;

        console.log(`[Modal] Showing modal for index ${currentModalIndex}: ${path}`);
        
        // Build the inner HTML for the fullscreen modal with new UI elements
        modalElement.innerHTML = `
            <div class="modal-iframe-container">
                <iframe src="${path}" title="${poster.dataset.title}" frameborder="0"></iframe>
            </div>
            <div class="modal-close-btn" title="Close">×</div>
            <div class="modal-nav-btn prev" title="Previous Project">&lt;</div>
            <div class="modal-nav-btn next" title="Next Project">&gt;</div>
            <div class="modal-index-counter">${currentModalIndex + 1} / ${totalProjects}</div>
        `;

        document.body.classList.add('modal-is-open');
        modalElement.style.display = 'flex';
        gsap.to(modalElement, { opacity: 1, duration: 0.4, ease: 'power2.out' });

        // --- Setup Event Listeners ---
        eventHandlers.close = () => window.appCloseModal();
        eventHandlers.key = (e) => {
            if (e.key === 'Escape') window.appCloseModal();
            if (e.key === 'ArrowLeft') navigateToProjectInModal(currentModalIndex - 1);
            if (e.key === 'ArrowRight') navigateToProjectInModal(currentModalIndex + 1);
        };
        eventHandlers.prev = () => navigateToProjectInModal(currentModalIndex - 1);
        eventHandlers.next = () => navigateToProjectInModal(currentModalIndex + 1);

        modalElement.querySelector('.modal-close-btn').addEventListener('click', eventHandlers.close);
        modalElement.querySelector('.modal-nav-btn.prev').addEventListener('click', eventHandlers.prev);
        modalElement.querySelector('.modal-nav-btn.next').addEventListener('click', eventHandlers.next);
        document.addEventListener('keydown', eventHandlers.key);
    };

    /**
     * Closes the fullscreen modal.
     */
    window.appCloseModal = function() {
        if (!modalElement) return;

        console.log("[Modal] Closing modal.");

        // --- Remove Event Listeners ---
        const closeBtn = modalElement.querySelector('.modal-close-btn');
        const prevBtn = modalElement.querySelector('.modal-nav-btn.prev');
        const nextBtn = modalElement.querySelector('.modal-nav-btn.next');

        if (closeBtn) closeBtn.removeEventListener('click', eventHandlers.close);
        if (prevBtn) prevBtn.removeEventListener('click', eventHandlers.prev);
        if (nextBtn) nextBtn.removeEventListener('click', eventHandlers.next);
        document.removeEventListener('keydown', eventHandlers.key);
        eventHandlers = {}; // Clear handlers

        // Animate out and hide
        gsap.to(modalElement, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                modalElement.style.display = 'none';
                modalElement.innerHTML = ''; // Clear content to stop iframe
                document.body.classList.remove('modal-is-open');
                currentModalIndex = -1; // Reset index
            }
        });
    };
})();