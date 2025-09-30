// JustRelocation - Favorites Management
// Handles saving and managing favorite services across the platform

class FavoritesManager {
    constructor() {
        this.storageKey = 'justrelocation_favorites';
        this.favorites = this.loadFavorites();
    }

    // Load favorites from localStorage
    loadFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    // Save favorites to localStorage
    saveFavorites() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    // Check if a service is favorited
    isFavorited(vendorId) {
        return this.favorites.some(fav => fav.id === vendorId);
    }

    // Add a service to favorites
    addFavorite(vendor) {
        if (!this.isFavorited(vendor.id)) {
            this.favorites.push({
                id: vendor.id,
                business_name: vendor.business_name,
                category: vendor.category,
                image: vendor.image,
                rating: vendor.rating,
                distance_from_hospital: vendor.distance_from_hospital,
                description: vendor.description,
                savedAt: new Date().toISOString()
            });
            this.saveFavorites();
            return true;
        }
        return false;
    }

    // Remove a service from favorites
    removeFavorite(vendorId) {
        const initialLength = this.favorites.length;
        this.favorites = this.favorites.filter(fav => fav.id !== vendorId);
        if (this.favorites.length < initialLength) {
            this.saveFavorites();
            return true;
        }
        return false;
    }

    // Toggle favorite status
    toggleFavorite(vendor) {
        if (this.isFavorited(vendor.id)) {
            this.removeFavorite(vendor.id);
            return false;
        } else {
            this.addFavorite(vendor);
            return true;
        }
    }

    // Get all favorites
    getAllFavorites() {
        return this.favorites;
    }

    // Get favorites by category
    getFavoritesByCategory(category) {
        return this.favorites.filter(fav => fav.category === category);
    }

    // Get favorites count
    getCount() {
        return this.favorites.length;
    }

    // Clear all favorites
    clearAll() {
        this.favorites = [];
        this.saveFavorites();
    }
}

// Initialize global favorites manager
const favoritesManager = new FavoritesManager();

// Function to toggle favorite when button is clicked
function toggleFavorite(button, vendor) {
    const isFavorited = favoritesManager.toggleFavorite(vendor);

    // Update button appearance
    if (isFavorited) {
        button.classList.add('favorited');
        showToast('Added to saved services!', 'success');
    } else {
        button.classList.remove('favorited');
        showToast('Removed from saved services', 'info');
    }

    // Update favorites count if displayed
    updateFavoritesCount();
}

// Function to initialize favorite buttons on page load
function initializeFavoriteButtons() {
    document.querySelectorAll('.favorite-button').forEach(button => {
        const vendorId = parseInt(button.dataset.vendorId);
        if (favoritesManager.isFavorited(vendorId)) {
            button.classList.add('favorited');
        }
    });
}

// Function to update favorites count display
function updateFavoritesCount() {
    const countElements = document.querySelectorAll('.favorites-count');
    const count = favoritesManager.getCount();
    countElements.forEach(el => {
        el.textContent = count;
    });
}

// Toast notification function
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                font-weight: 500;
            }

            .toast-success {
                border-left: 4px solid #28a745;
            }

            .toast-success i {
                color: #28a745;
            }

            .toast-info {
                border-left: 4px solid #0057d9;
            }

            .toast-info i {
                color: #0057d9;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add toast to page
    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeFavoriteButtons();
        updateFavoritesCount();
    });
} else {
    initializeFavoriteButtons();
    updateFavoritesCount();
}