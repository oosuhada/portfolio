document.addEventListener('DOMContentLoaded', () => {
    const workCardsContainer = document.getElementById('work-experience-cards-container');
    const educationCardsContainer = document.getElementById('education-cards-container');
    
    const modalContainer = document.getElementById('experience-modal-container');
    const modalImageElement = document.getElementById('modal-image-element');
    const modalTitle = document.getElementById('modal-title');
    const modalCompany = document.getElementById('modal-company');
    const modalDate = document.getElementById('modal-date');
    const modalField = document.getElementById('modal-field');
    const modalDescription = document.getElementById('modal-description');
    const modalTagsContainer = document.getElementById('modal-tags');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalPrevButton = document.getElementById('modal-prev-button');
    const modalNextButton = document.getElementById('modal-next-button');

    const placeholderImages = [
        ['images/1-1.png', 'images/1-2.png', 'images/1-3.png', 'images/1-4.png', 'images/1-5.png'], // Fixed: Completed the array
        ['images/exp_placeholder_2.jpg'],
        ['images/exp_placeholder_3.jpg'],
        ['images/exp_placeholder_4.jpg'],
        ['images/exp_placeholder_5.jpg'],
        ['images/exp_placeholder_6.jpg']
    ];
    let imageCounter = 0;

    let currentModalImages = [];
    let currentImageIndex = 0;

    function getNextImage(itemTitle = "experience") {
        const assignedImages = placeholderImages[imageCounter % placeholderImages.length] || ['images/default_placeholder.jpg']; // Fallback to default image
        imageCounter++;
        return assignedImages[0]; // Return first image for card
    }

    function populateTimeline() {
        const workDataSource = document.querySelector('#original-work-exp-items');
        let workItemsOriginal = [];
        if (workDataSource && workCardsContainer) {
            workItemsOriginal = workDataSource.querySelectorAll('.timeline-row');
            workItemsOriginal.forEach((item, index) => {
                const cardData = extractItemData(item, false, index);
                const cardId = `work-card-${index}`;
                cardData.id = cardId;
                cardData.images = placeholderImages[index % placeholderImages.length] || ['images/default_placeholder.jpg']; // Fallback for images
                const timelineEntryElement = createTimelineEntry(cardData);
                workCardsContainer.appendChild(timelineEntryElement);
            });
        } else {
            console.warn('Work experience data source or workCardsContainer not found.');
        }

        const eduDataSource = document.querySelector('#original-edu-exp-items');
        if (eduDataSource && educationCardsContainer) {
            const eduItemsOriginal = eduDataSource.querySelectorAll('.edu-row');
            eduItemsOriginal.forEach((item, index) => {
                const cardData = extractItemData(item, true, index);
                const cardId = `edu-card-${index}`;
                cardData.id = cardId;
                cardData.images = placeholderImages[(index + workItemsOriginal.length) % placeholderImages.length] || ['images/default_placeholder.jpg']; // Fallback for images
                const timelineEntryElement = createTimelineEntry(cardData);
                educationCardsContainer.appendChild(timelineEntryElement);
            });
        } else {
            console.warn('Education data source or educationCardsContainer not found.');
        }
    }

    function extractItemData(itemData, isEducation, index) {
        const title = itemData.querySelector(isEducation ? '.timeline-title.edu-title' : '.timeline-title')?.textContent || 'N/A';
        const company = itemData.querySelector(isEducation ? '.company.edu-org' : '.company')?.textContent || 'N/A';
        const date = itemData.querySelector(isEducation ? '.timeline-date.edu-date' : '.timeline-date')?.textContent || 'N/A';
        const field = itemData.querySelector(isEducation ? '.timeline-field.edu-role' : '.timeline-field')?.textContent || '';
        const descriptionHTML = itemData.querySelector(isEducation ? '.timeline-desc.edu-desc' : '.timeline-desc')?.innerHTML || '';
        const tagsSource = itemData.querySelector(isEducation ? '.timeline-tags.edu-tags' : '.timeline-tags');
        const tags = tagsSource ? Array.from(tagsSource.querySelectorAll('span')).map(span => span.textContent) : [];
        const representativeImage = getNextImage(title);
        
        return { title, company, date, field, descriptionHTML, tags, representativeImage, type: isEducation ? 'edu' : 'work', originalIndex: index };
    }

    function createTimelineEntry(data) {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('timeline-entry');

        const dotDiv = document.createElement('div');
        dotDiv.classList.add('timeline-dot-new');
        entryDiv.appendChild(dotDiv);

        const cardElement = createMasonryCard(data);
        entryDiv.appendChild(cardElement);

        return entryDiv;
    }

    function createMasonryCard(data) {
        const card = document.createElement('div');
        card.classList.add('masonry-card');
        card.id = data.id;
        card.setAttribute('tabindex', '0');

        card.innerHTML = `
            <div class="card-image-container">
                <img src="${data.representativeImage}" alt="${data.title}" class="card-image" onerror="this.style.display='none'; if(this.parentElement) this.parentElement.style.backgroundColor='#ddd';">
            </div>
            <div class="card-content">
                <h3 class="card-title">${data.title}</h3>
                <p class="card-company">${data.company}</p>
                <p class="card-date">${data.date}</p>
                <div class="card-tags">
                    ${data.tags.map(tag => `<span>${tag}</span>`).join('')}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log(`Card clicked: ${data.id}`); // Debug log
            const scrollTarget = card.closest('.timeline-entry') || card;
            
            if (window.scrollElementToCenterPromise) {
                window.scrollElementToCenterPromise(scrollTarget)
                    .then(() => {
                        console.log(`Opening modal for: ${data.id}`); // Debug log
                        openModal(data);
                        if (window.activateStageByCardId) {
                            window.activateStageByCardId(data.id, false);
                        }
                    })
                    .catch(error => {
                        console.error("Scroll promise failed:", error);
                        console.log(`Opening modal for: ${data.id}`); // Debug log
                        openModal(data);
                        if (window.activateStageByCardId) {
                            window.activateStageByCardId(data.id, false);
                        }
                    });
            } else if (window.smoothScrollToElement) {
                window.smoothScrollToElement(scrollTarget, 'center');
                setTimeout(() => {
                    console.log(`Opening modal for: ${data.id}`); // Debug log
                    openModal(data);
                    if (window.activateStageByCardId) {
                        window.activateStageByCardId(data.id, false);
                    }
                }, 700);
            } else {
                console.log(`Opening modal for: ${data.id}`); // Debug log
                openModal(data);
                if (window.activateStageByCardId) {
                    window.activateStageByCardId(data.id, false);
                }
            }
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                card.dispatchEvent(clickEvent);
            }
        });
        return card;
    }

    function openModal(data) {
        console.log(`Opening modal with data:`, data); // Debug log
        if (!modalContainer || !modalImageElement || !modalTitle || !modalCompany || !modalDate || !modalField || !modalDescription || !modalTagsContainer) {
            console.warn('Modal elements not found.');
            return;
        }

        // Set modal content
        modalTitle.textContent = data.title;
        modalCompany.textContent = data.company;
        modalDate.textContent = data.date;
        modalField.textContent = data.field;
        modalDescription.innerHTML = data.descriptionHTML;

        // Handle tags
        modalTagsContainer.innerHTML = '';
        data.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.textContent = tag;
            modalTagsContainer.appendChild(tagSpan);
        });

        // Handle images
        currentModalImages = data.images || [data.representativeImage];
        currentImageIndex = 0;
        updateModalImage();

        // Update navigation buttons
        updateNavButtons();

        // Show modal
        modalContainer.classList.add('active');

        // Highlight description chunks
        const descChunks = modalDescription.querySelectorAll('.timeline-chunk');
        descChunks.forEach((chunk, index) => {
            chunk.setAttribute('data-chunk-index', index);
            chunk.addEventListener('click', () => {
                const chunkIndex = parseInt(chunk.getAttribute('data-chunk-index') || '0', 10);
                if (!isNaN(chunkIndex) && chunkIndex >= 0 && chunkIndex < currentModalImages.length) {
                    currentImageIndex = chunkIndex;
                    updateModalImage();
                    updateNavButtons();
                }
            });
        });
    }

    function updateModalImage() {
        if (modalImageElement && currentModalImages.length > 0) {
            modalImageElement.src = currentModalImages[currentImageIndex];
            modalImageElement.alt = `Image ${currentImageIndex + 1} for ${modalTitle.textContent}`;
        }
    }

    function updateNavButtons() {
        if (modalPrevButton && modalNextButton) {
            modalPrevButton.disabled = currentImageIndex === 0;
            modalNextButton.disabled = currentImageIndex === currentModalImages.length - 1;
        }
    }

    function closeModal() {
        if (modalContainer) {
            modalContainer.classList.remove('active');
            currentModalImages = [];
            currentImageIndex = 0;
            modalImageElement.src = '';
            modalImageElement.alt = '';
            modalTitle.textContent = '';
            modalCompany.textContent = '';
            modalDate.textContent = '';
            modalField.textContent = '';
            modalDescription.innerHTML = '';
            modalTagsContainer.innerHTML = '';
        }
    }

    // Event Listeners
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }

    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                console.log('Modal overlay clicked, closing modal'); // Debug log
                closeModal();
            }
        });
    }

    if (modalPrevButton) {
        modalPrevButton.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                updateModalImage();
                updateNavButtons();
            }
        });
    }

    if (modalNextButton) {
        modalNextButton.addEventListener('click', () => {
            if (currentImageIndex < currentModalImages.length - 1) {
                currentImageIndex++;
                updateModalImage();
                updateNavButtons();
            }
        });
    }

    // Initialize
    populateTimeline();

    // Accessibility
    document.addEventListener('keydown', (e) => {
        if (modalContainer && modalContainer.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                currentImageIndex--;
                updateModalImage();
                updateNavButtons();
            } else if (e.key === 'ArrowRight' && currentImageIndex < currentModalImages.length - 1) {
                currentImageIndex++;
                updateModalImage();
                updateNavButtons();
            }
        }
    });
});