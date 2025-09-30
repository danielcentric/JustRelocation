/**
 * Vendor Portal Photos Management
 */

class VendorPhotosManager {
    constructor() {
        this.vendorId = this.getVendorId();
        this.images = [];
        this.currentSlot = null;
        this.deleteImageId = null;
        this.apiBaseUrl = '/api';
        this.hasChanges = false;

        this.init();
    }

    getVendorId() {
        // TODO: Get from session/auth
        return 1; // Demo vendor ID
    }

    async init() {
        await this.loadImages();
        this.renderPhotoSlots();
        this.setupEventListeners();
    }

    async loadImages() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/vendors/${this.vendorId}/images`);
            if (response.ok) {
                const data = await response.json();
                this.images = data.images || [];
            }
        } catch (error) {
            console.error('Failed to load images:', error);
            this.showToast('Failed to load images', 'error');
        }
    }

    renderPhotoSlots() {
        const grid = document.getElementById('photosGrid');
        grid.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const image = this.images[i];
            const slot = this.createPhotoSlot(i, image);
            grid.appendChild(slot);
        }

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    createPhotoSlot(index, image) {
        const slot = document.createElement('div');
        slot.className = 'photo-slot';
        slot.dataset.index = index;

        if (image) {
            slot.classList.add('has-image');
            slot.dataset.imageId = image.id;
            slot.draggable = true;

            slot.innerHTML = `
                <img src="${image.url}" alt="Vendor image ${index + 1}">
                <div class="drag-handle" draggable="false">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                ${image.is_primary ? '<div class="primary-badge">Primary</div>' : ''}
                <div class="photo-slot-overlay">
                    <div class="photo-actions">
                        <button class="photo-action-btn delete" onclick="vendorPhotos.deleteImage('${image.id}')" title="Delete image">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <div class="photo-slot-label">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click to upload</p>
                    <p class="slot-number">Slot ${index + 1}</p>
                </div>
            `;
            slot.onclick = () => this.openFileDialog(index);
        }

        return slot;
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    setupDragAndDrop() {
        const slots = document.querySelectorAll('.photo-slot.has-image');

        slots.forEach(slot => {
            slot.addEventListener('dragstart', this.handleDragStart.bind(this));
            slot.addEventListener('dragover', this.handleDragOver.bind(this));
            slot.addEventListener('drop', this.handleDrop.bind(this));
            slot.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.dataTransfer.setData('index', e.target.dataset.index);
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const draggedIndex = parseInt(e.dataTransfer.getData('index'));
        const targetIndex = parseInt(e.target.closest('.photo-slot').dataset.index);

        if (draggedIndex !== targetIndex) {
            // Swap images
            [this.images[draggedIndex], this.images[targetIndex]] =
            [this.images[targetIndex], this.images[draggedIndex]];

            this.renderPhotoSlots();
            this.showSaveButton();
        }

        return false;
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    openFileDialog(index) {
        this.currentSlot = index;
        document.getElementById('fileInput').click();
    }

    async handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Upload file
        await this.uploadImage(file);

        // Clear file input
        e.target.value = '';
    }

    validateFile(file) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Invalid file type. Please upload JPEG, PNG, or WebP images.', 'error');
            return false;
        }

        // Check file size (5 MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('File size exceeds 5 MB limit.', 'error');
            return false;
        }

        return true;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.apiBaseUrl}/vendors/${this.vendorId}/images/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Add auth token if needed
                    // 'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Upload failed');
            }

            const data = await response.json();
            this.images = data;
            this.renderPhotoSlots();
            this.showToast('Image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(error.message || 'Failed to upload image', 'error');
        }
    }

    deleteImage(imageId) {
        this.deleteImageId = imageId;
        document.getElementById('deleteModal').classList.add('show');
    }

    async confirmDelete() {
        if (!this.deleteImageId) return;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/vendors/${this.vendorId}/images/${this.deleteImageId}`,
                {
                    method: 'DELETE',
                    headers: {
                        // Add auth token if needed
                        // 'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            // Remove image from local array
            this.images = this.images.filter(img => img.id !== this.deleteImageId);
            this.renderPhotoSlots();
            this.showToast('Image deleted successfully', 'success');
            this.closeDeleteModal();
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Failed to delete image', 'error');
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.deleteImageId = null;
    }

    showSaveButton() {
        document.getElementById('btnSaveOrder').classList.add('show');
        this.hasChanges = true;
    }

    async saveImageOrder() {
        if (!this.hasChanges) return;

        const imageIds = this.images.map(img => img.id);

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/vendors/${this.vendorId}/images/order`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add auth token if needed
                        // 'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ image_ids: imageIds })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save order');
            }

            const data = await response.json();
            this.images = data;
            this.renderPhotoSlots();
            this.showToast('Image order saved successfully', 'success');
            document.getElementById('btnSaveOrder').classList.remove('show');
            this.hasChanges = false;
        } catch (error) {
            console.error('Save order error:', error);
            this.showToast('Failed to save image order', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toast.className = `toast ${type}`;
        toastMessage.textContent = message;

        // Update icon
        const icon = toast.querySelector('i');
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else {
            icon.className = 'fas fa-exclamation-circle';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Global instance
let vendorPhotos;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    vendorPhotos = new VendorPhotosManager();
});

// Global functions for inline onclick handlers
function saveImageOrder() {
    vendorPhotos.saveImageOrder();
}

function closeDeleteModal() {
    vendorPhotos.closeDeleteModal();
}

function confirmDelete() {
    vendorPhotos.confirmDelete();
}