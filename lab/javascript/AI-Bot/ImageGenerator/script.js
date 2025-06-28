// Application state
class ImageGenerator {
    constructor() {
        // 로컬 저장소 -> 시스템 설정 -> 기본(light) 순으로 테마를 결정하도록 수정
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        this.images = JSON.parse(localStorage.getItem('generated-images') || '[]');
        this.isGenerating = false;
        this.showingGallery = false;
        this.currentMode = 'generate';
        this.uploadedImage = null;
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.initializeTheme();
        this.bindEventListeners();
        this.initializeLucideIcons();
        this.updateGallery();
    }

    initializeElements() {
        // Get all DOM elements
        this.elements = {
            themeToggle: document.getElementById('themeToggle'),
            galleryToggle: document.getElementById('galleryToggle'),
            generateMode: document.getElementById('generateMode'),
            enhanceMode: document.getElementById('enhanceMode'),
            generatorSection: document.getElementById('generatorSection'),
            enhancementSection: document.getElementById('enhancementSection'),
            generatorForm: document.getElementById('generatorForm'),
            promptInput: document.getElementById('promptInput'),
            charCount: document.getElementById('charCount'),
            generateBtn: document.getElementById('generateBtn'),
            sizeSelect: document.getElementById('sizeSelect'),
            qualitySelect: document.getElementById('qualitySelect'),
            uploadArea: document.getElementById('uploadArea'),
            imageUpload: document.getElementById('imageUpload'),
            browseBtn: document.getElementById('browseBtn'),
            enhancementSettings: document.getElementById('enhancementSettings'),
            enhanceResolution: document.getElementById('enhanceResolution'),
            enhanceType: document.getElementById('enhanceType'),
            enhanceBtn: document.getElementById('enhanceBtn'),
            imagePreview: document.getElementById('imagePreview'),
            originalImage: document.getElementById('originalImage'),
            originalDimensions: document.getElementById('originalDimensions'),
            originalSize: document.getElementById('originalSize'),
            generationStatus: document.getElementById('generationStatus'),
            statusMessage: document.getElementById('statusMessage'),
            imageResult: document.getElementById('imageResult'),
            generatedImage: document.getElementById('generatedImage'),
            downloadBtn: document.getElementById('downloadBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            generationTime: document.getElementById('generationTime'),
            imageService: document.getElementById('imageService'),
            imagePrompt: document.getElementById('imagePrompt'),
            gallerySection: document.getElementById('gallerySection'),
            galleryGrid: document.getElementById('galleryGrid'),
            galleryEmpty: document.getElementById('galleryEmpty'),
            clearGalleryBtn: document.getElementById('clearGalleryBtn'),
            imageModal: document.getElementById('imageModal'),
            modalBackdrop: document.getElementById('modalBackdrop'),
            modalClose: document.getElementById('modalClose'),
            modalImage: document.getElementById('modalImage'),
            modalDownloadBtn: document.getElementById('modalDownloadBtn'),
            modalPrompt: document.getElementById('modalPrompt'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    initializeLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    bindEventListeners() {
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Gallery toggle
        this.elements.galleryToggle.addEventListener('click', () => this.toggleGallery());

        // Mode toggles
        this.elements.generateMode.addEventListener('click', () => this.switchMode('generate'));
        this.elements.enhanceMode.addEventListener('click', () => this.switchMode('enhance'));

        // Form submission
        this.elements.generatorForm.addEventListener('submit', (e) => this.handleSubmit(e));

        // Character count
        this.elements.promptInput.addEventListener('input', () => this.updateCharCount());

        // Upload area events
        this.elements.uploadArea.addEventListener('click', () => this.elements.imageUpload.click());
        this.elements.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.imageUpload.click();
        });
        this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));

        // Drag and drop
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Enhancement button
        this.elements.enhanceBtn.addEventListener('click', () => this.enhanceImage());

        // Image actions
        this.elements.downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
        this.elements.fullscreenBtn.addEventListener('click', () => this.showFullscreen());

        // Clear gallery
        this.elements.clearGalleryBtn.addEventListener('click', () => this.clearGallery());

        // Modal controls
        this.elements.modalBackdrop.addEventListener('click', () => this.closeModal());
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modalDownloadBtn.addEventListener('click', () => this.downloadModalImage());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Initial character count
        this.updateCharCount();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.initializeLucideIcons(); // Reinitialize icons after theme change
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        this.elements[mode + 'Mode'].classList.add('active');
        
        // Show/hide sections
        if (mode === 'generate') {
            this.elements.generatorSection.style.display = 'block';
            this.elements.enhancementSection.style.display = 'none';
        } else {
            this.elements.generatorSection.style.display = 'none';
            this.elements.enhancementSection.style.display = 'block';
        }
        
        this.initializeLucideIcons();
    }

    toggleGallery() {
        this.showingGallery = !this.showingGallery;
        this.elements.gallerySection.style.display = this.showingGallery ? 'block' : 'none';
        
        // Update toggle button text
        const span = this.elements.galleryToggle.querySelector('span');
        if (span) {
            span.textContent = this.showingGallery ? 'Generator' : 'Gallery';
        }
    }

    updateCharCount() {
        const count = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = `${count}/500`;
        
        if (count > 450) {
            this.elements.charCount.style.color = 'hsl(var(--destructive))';
        } else {
            this.elements.charCount.style.color = 'hsl(var(--muted-foreground))';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isGenerating) return;

        const prompt = this.elements.promptInput.value.trim();
        if (!prompt) {
            this.showToast('Error', 'Please enter a prompt', 'error');
            return;
        }

        await this.generateImage(prompt);
    }

    async generateImage(prompt) {
        this.isGenerating = true;
        this.updateUI('generating');

        try {
            const startTime = Date.now();
            
            // Get user-selected settings
            const selectedSize = this.elements.sizeSelect.value;
            const selectedQuality = this.elements.qualitySelect.value;
            const [width, height] = selectedSize.split('x');
            
            // Quality parameters
            const qualityParams = {
                'standard': '&enhance=false',
                'enhanced': '&enhance=true',
                'premium': '&enhance=true&hd=true'
            };
            
            // Try multiple services for image generation with user settings
            const services = [
                {
                    name: "Pollinations AI Clean",
                    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 1000000)}&nologo=1${qualityParams[selectedQuality]}`
                },
                {
                    name: "Alternative Pollinations",
                    url: `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 1000000)}&model=flux`
                },
                {
                    name: "Pollinations Direct",
                    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&seed=${Math.floor(Math.random() * 1000000)}`
                }
            ];

            let imageData = null;
            let usedService = '';
            let serviceWorked = false;

            for (const service of services) {
                try {
                    this.elements.statusMessage.textContent = `Trying ${service.name}...`;
                    
                    const response = await fetch(service.url, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; AI-Image-Generator/1.0)',
                            'Accept': 'image/*'
                        }
                    });

                    if (response.ok) {
                        const imageBlob = await response.blob();
                        imageData = await this.blobToDataURL(imageBlob);
                        usedService = service.name;
                        serviceWorked = true;
                        break;
                    }
                } catch (error) {
                    console.log(`${service.name} failed, trying next service...`);
                    continue;
                }
            }

            if (!serviceWorked) {
                throw new Error('Unable to generate image at this time. Please try again later.');
            }

            const generationTime = Math.round((Date.now() - startTime) / 1000);

            // Save to local storage with settings info
            const imageRecord = {
                id: Date.now(),
                prompt: `${prompt} (${selectedSize}, ${selectedQuality} quality)`,
                imageUrl: imageData,
                generationTime,
                service: usedService,
                size: selectedSize,
                quality: selectedQuality,
                createdAt: new Date().toISOString()
            };

            this.images.unshift(imageRecord);
            this.saveImages();

            // Update UI with generated image
            this.displayGeneratedImage(imageRecord);
            this.updateGallery();
            
            this.showToast('Success', 'Image generated successfully!', 'success');

        } catch (error) {
            console.error('Image generation error:', error);
            this.showToast('Error', error.message || 'Failed to generate image', 'error');
            this.updateUI('error');
        } finally {
            this.isGenerating = false;
        }
    }

    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    updateUI(status) {
        switch (status) {
            case 'generating':
                this.elements.generateBtn.disabled = true;
                this.elements.generateBtn.innerHTML = '<i data-lucide="loader"></i><span>Generating...</span>';
                this.elements.generationStatus.style.display = 'block';
                this.elements.imageResult.style.display = 'none';
                this.initializeLucideIcons();
                break;
            case 'success':
                this.elements.generateBtn.disabled = false;
                this.elements.generateBtn.innerHTML = '<i data-lucide="sparkles"></i><span>Generate</span>';
                this.elements.generationStatus.style.display = 'none';
                this.elements.imageResult.style.display = 'block';
                this.initializeLucideIcons();
                break;
            case 'error':
                this.elements.generateBtn.disabled = false;
                this.elements.generateBtn.innerHTML = '<i data-lucide="sparkles"></i><span>Generate</span>';
                this.elements.generationStatus.style.display = 'none';
                this.initializeLucideIcons();
                break;
        }
    }

    displayGeneratedImage(imageRecord) {
        this.currentImage = imageRecord;
        
        this.elements.generatedImage.src = imageRecord.imageUrl;
        this.elements.generatedImage.alt = imageRecord.prompt;
        this.elements.generationTime.textContent = `Generated in ${imageRecord.generationTime}s`;
        this.elements.imageService.textContent = imageRecord.service;
        this.elements.imagePrompt.textContent = imageRecord.prompt;
        
        this.updateUI('success');
    }

    downloadCurrentImage() {
        if (this.currentImage) {
            this.downloadImage(this.currentImage.imageUrl, this.currentImage.prompt);
        }
    }

    downloadImage(dataURL, prompt) {
        const link = document.createElement('a');
        link.download = `ai-generated-${Date.now()}.jpg`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Success', 'Image downloaded successfully!', 'success');
    }

    showFullscreen() {
        if (this.currentImage) {
            this.elements.modalImage.src = this.currentImage.imageUrl;
            this.elements.modalImage.alt = this.currentImage.prompt;
            this.elements.modalPrompt.textContent = this.currentImage.prompt;
            this.currentModalImage = this.currentImage;
            this.elements.imageModal.style.display = 'flex';
        }
    }

    closeModal() {
        this.elements.imageModal.style.display = 'none';
        this.currentModalImage = null;
    }

    downloadModalImage() {
        if (this.currentModalImage) {
            this.downloadImage(this.currentModalImage.imageUrl, this.currentModalImage.prompt);
        }
    }

    updateGallery() {
        if (this.images.length === 0) {
            this.elements.galleryGrid.style.display = 'none';
            this.elements.galleryEmpty.style.display = 'block';
            return;
        }

        this.elements.galleryGrid.style.display = 'grid';
        this.elements.galleryEmpty.style.display = 'none';

        this.elements.galleryGrid.innerHTML = '';

        this.images.forEach(image => {
            const item = this.createGalleryItem(image);
            this.elements.galleryGrid.appendChild(item);
        });
    }

    createGalleryItem(image) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.addEventListener('click', () => this.openGalleryImage(image));

        const img = document.createElement('img');
        img.src = image.imageUrl;
        img.alt = image.prompt;

        const info = document.createElement('div');
        info.className = 'gallery-item-info';

        const prompt = document.createElement('p');
        prompt.className = 'gallery-item-prompt';
        prompt.textContent = image.prompt;

        const meta = document.createElement('div');
        meta.className = 'gallery-item-meta';
        const date = new Date(image.createdAt).toLocaleDateString();
        meta.textContent = `${date} • ${image.generationTime}s`;

        info.appendChild(prompt);
        info.appendChild(meta);
        item.appendChild(img);
        item.appendChild(info);

        return item;
    }

    openGalleryImage(image) {
        this.elements.modalImage.src = image.imageUrl;
        this.elements.modalImage.alt = image.prompt;
        this.elements.modalPrompt.textContent = image.prompt;
        this.currentModalImage = image;
        this.elements.imageModal.style.display = 'flex';
    }

    clearGallery() {
        if (confirm('Are you sure you want to clear all images? This action cannot be undone.')) {
            this.images = [];
            this.saveImages();
            this.updateGallery();
            this.showToast('Success', 'Gallery cleared successfully', 'success');
        }
    }

    saveImages() {
        // Keep only the last 50 images to prevent localStorage bloat
        if (this.images.length > 50) {
            this.images = this.images.slice(0, 50);
        }
        localStorage.setItem('generated-images', JSON.stringify(this.images));
    }

    showToast(title, message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = title;

        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;

        toast.appendChild(titleEl);
        toast.appendChild(messageEl);
        this.elements.toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // Upload and drag-drop handlers
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processUploadedImage(file);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processUploadedImage(files[0]);
        }
    }

    processUploadedImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImage = {
                file: file,
                dataURL: e.target.result,
                name: file.name,
                size: file.size
            };

            // Show image preview
            this.elements.originalImage.src = e.target.result;
            this.elements.originalImage.onload = () => {
                const img = this.elements.originalImage;
                this.elements.originalDimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                this.elements.originalSize.textContent = this.formatFileSize(file.size);
            };

            this.elements.imagePreview.style.display = 'block';
            this.elements.enhancementSettings.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async enhanceImage() {
        if (!this.uploadedImage) {
            this.showToast('Error', 'Please upload an image first', 'error');
            return;
        }

        this.isGenerating = true;
        this.updateUI('generating');
        this.elements.statusMessage.textContent = 'Enhancing your image...';

        try {
            const startTime = Date.now();
            const resolution = this.elements.enhanceResolution.value;
            const type = this.elements.enhanceType.value;

            // Use multiple enhancement services
            const services = [
                {
                    name: "Waifu2x Enhancement",
                    url: `https://api.waifu2x.udp.jp/api`,
                    method: "POST"
                },
                {
                    name: "Real-ESRGAN Enhancement",
                    url: `https://api.replicate.com/v1/predictions`,
                    method: "POST"
                }
            ];

            let enhancedImageData = null;
            let usedService = '';
            let serviceWorked = false;

            // Try enhancement via canvas upscaling as fallback
            enhancedImageData = await this.performCanvasEnhancement(this.uploadedImage.dataURL, resolution);
            usedService = 'Canvas Enhancement';
            serviceWorked = true;

            const generationTime = Math.round((Date.now() - startTime) / 1000);

            // Create enhanced image record
            const imageRecord = {
                id: Date.now(),
                prompt: `Enhanced ${this.uploadedImage.name} (${resolution} enhancement, ${type} type)`,
                imageUrl: enhancedImageData,
                generationTime,
                service: usedService,
                type: 'enhancement',
                originalSize: this.elements.originalDimensions.textContent,
                enhancement: resolution,
                enhancementType: type,
                createdAt: new Date().toISOString()
            };

            this.images.unshift(imageRecord);
            this.saveImages();

            // Display enhanced image
            this.displayGeneratedImage(imageRecord);
            this.updateGallery();
            
            this.showToast('Success', 'Image enhanced successfully!', 'success');

        } catch (error) {
            console.error('Image enhancement error:', error);
            this.showToast('Error', 'Failed to enhance image. Please try again.', 'error');
            this.updateUI('error');
        } finally {
            this.isGenerating = false;
        }
    }

    async performCanvasEnhancement(imageDataURL, resolution) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions based on enhancement level
                const multiplier = parseInt(resolution.replace('x', ''));
                const newWidth = img.width * multiplier;
                const newHeight = img.height * multiplier;
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Use high-quality image rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw and enhance the image
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Apply sharpening filter
                const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
                const sharpened = this.applySharpenFilter(imageData);
                ctx.putImageData(sharpened, 0, 0);
                
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.src = imageDataURL;
        });
    }

    applySharpenFilter(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new ImageData(width, height);
        const outputData = output.data;
        
        // Sharpening kernel
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                    const outputIdx = (y * width + x) * 4 + c;
                    outputData[outputIdx] = Math.max(0, Math.min(255, sum));
                }
                const outputIdx = (y * width + x) * 4 + 3;
                const inputIdx = (y * width + x) * 4 + 3;
                outputData[outputIdx] = data[inputIdx]; // Copy alpha
            }
        }
        
        return output;
    }

    handleKeydown(e) {
        // Close modal with Escape key
        if (e.key === 'Escape' && this.elements.imageModal.style.display === 'flex') {
            this.closeModal();
        }
        
        // Generate with Ctrl+Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !this.isGenerating) {
            e.preventDefault();
            if (this.currentMode === 'generate') {
                this.elements.generatorForm.dispatchEvent(new Event('submit'));
            } else if (this.currentMode === 'enhance' && this.uploadedImage) {
                this.enhanceImage();
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageGenerator();
});