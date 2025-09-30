/**
 * JustRelocation API Integration - Localhost Only
 * Connects frontend to local FastAPI backend
 */

class JustRelocationAPI {
    constructor() {
        this.baseUrl = window.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        this.authToken = localStorage.getItem('justrelocation_token');
    }

    // Helper method for making API requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.makeRequest('/health');
    }

    // Vendor endpoints
    async getVendors(filters = {}) {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const endpoint = `/vendors${params.toString() ? '?' + params.toString() : ''}`;
        return this.makeRequest(endpoint);
    }

    async getVendor(vendorId) {
        return this.makeRequest(`/vendors/${vendorId}`);
    }

    // Metadata endpoints
    async getRegions() {
        return this.makeRequest('/meta/regions');
    }

    async getTrusts() {
        return this.makeRequest('/meta/trusts');
    }

    async getCategories() {
        return this.makeRequest('/meta/categories');
    }

    // Event tracking
    async trackEvent(eventType, vendorId, metadata = null) {
        return this.makeRequest('/events', {
            method: 'POST',
            body: JSON.stringify({
                event_type: eventType,
                vendor_id: vendorId,
                metadata: metadata
            })
        });
    }

    // Admin endpoints (require authentication)
    async adminLogin(email, password) {
        const response = await this.makeRequest('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.access_token) {
            this.authToken = response.access_token;
            localStorage.setItem('justrelocation_token', this.authToken);
        }

        return response;
    }

    async adminCreateVendor(vendorData) {
        return this.makeRequest('/admin/vendors', {
            method: 'POST',
            body: JSON.stringify(vendorData)
        });
    }

    async adminListVendors() {
        return this.makeRequest('/admin/vendors');
    }

    async adminUpdateVendor(vendorId, vendorData) {
        return this.makeRequest(`/admin/vendors/${vendorId}`, {
            method: 'PUT',
            body: JSON.stringify(vendorData)
        });
    }

    async adminDeleteVendor(vendorId) {
        return this.makeRequest(`/admin/vendors/${vendorId}`, {
            method: 'DELETE'
        });
    }

    // Logout
    logout() {
        this.authToken = null;
        localStorage.removeItem('justrelocation_token');
    }
}

// Initialize global API instance
window.JustRelocationAPI = new JustRelocationAPI();

// DOM Helper Functions
class JustRelocationUI {
    constructor() {
        this.api = window.JustRelocationAPI;
        this.currentFilters = {};
        this.vendors = [];
        this.trusts = [];
        this.categories = [];
        this.regions = [];
    }

    async init() {
        try {
            // Load metadata
            await this.loadMetadata();

            // Load initial vendors
            await this.loadVendors();

            // Setup event listeners
            this.setupEventListeners();

            // Render initial UI
            this.renderVendors();
            this.populateFilters();

            console.log('JustRelocation UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UI:', error);
            this.showError('Failed to load data. Please check if the API is running.');
        }
    }

    async loadMetadata() {
        try {
            [this.regions, this.trusts, this.categories] = await Promise.all([
                this.api.getRegions(),
                this.api.getTrusts(),
                this.api.getCategories()
            ]);
        } catch (error) {
            console.error('Failed to load metadata:', error);
        }
    }

    async loadVendors(filters = {}) {
        try {
            this.vendors = await this.api.getVendors(filters);
            this.currentFilters = filters;
        } catch (error) {
            console.error('Failed to load vendors:', error);
            this.vendors = [];
        }
    }

    setupEventListeners() {
        // Search form handling
        const searchButton = document.querySelector('.search-button');
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Filter handling for category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryName = card.querySelector('.category-name')?.textContent;
                if (categoryName) {
                    this.handleCategoryFilter(categoryName);
                }
            });
        });

        // Trust card handling
        document.querySelectorAll('.trust-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const trustName = card.querySelector('.trust-name')?.textContent;
                if (trustName) {
                    this.handleTrustFilter(trustName);
                }
            });
        });
    }

    async handleSearch() {
        const hospitalInput = document.getElementById('hospitalInput');
        const serviceInput = document.getElementById('serviceInput');

        const filters = {};

        if (hospitalInput && hospitalInput.value) {
            filters.trust = hospitalInput.value;
        }

        if (serviceInput && serviceInput.value) {
            filters.category = serviceInput.value;
        }

        await this.loadVendors(filters);
        this.renderVendors();
        this.showSearchResults();
    }

    async handleCategoryFilter(categoryName) {
        await this.loadVendors({ category: categoryName });
        this.renderVendors();
        this.showSearchResults();
    }

    async handleTrustFilter(trustName) {
        await this.loadVendors({ trust: trustName });
        this.renderVendors();
        this.showSearchResults();
    }

    renderVendors() {
        const container = this.getOrCreateVendorContainer();

        if (!this.vendors || this.vendors.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <h3>No vendors found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        const vendorCards = this.vendors.map(vendor => this.createVendorCard(vendor)).join('');
        container.innerHTML = vendorCards;
    }

    createVendorCard(vendor) {
        const regions = vendor.regions?.join(', ') || 'Multiple regions';
        const trusts = vendor.trusts?.slice(0, 3).join(', ') || 'Multiple trusts';
        const hasMore = vendor.trusts?.length > 3;

        return `
            <div class="vendor-card" data-vendor-id="${vendor.id}">
                <div class="vendor-content">
                    <div class="vendor-category">${vendor.category || 'Service'}</div>
                    <h3 class="vendor-name">${vendor.name}</h3>
                    <p class="vendor-description">${vendor.description || ''}</p>
                    <div class="vendor-coverage">
                        <div class="coverage-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${regions}</span>
                        </div>
                        <div class="coverage-item">
                            <i class="fas fa-hospital"></i>
                            <span>${trusts}${hasMore ? ` +${vendor.trusts.length - 3} more` : ''}</span>
                        </div>
                    </div>
                    <div class="vendor-actions">
                        ${vendor.website ? `<button class="btn-contact" onclick="window.justRelocationUI.handleVendorContact('${vendor.id}', '${vendor.website}')">Visit Website</button>` : ''}
                        ${vendor.phone ? `<button class="btn-phone" onclick="window.justRelocationUI.handleVendorContact('${vendor.id}', 'tel:${vendor.phone}')">Call Now</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async handleVendorContact(vendorId, contactUrl) {
        try {
            // Track the click event
            await this.api.trackEvent('outbound_click', parseInt(vendorId), contactUrl);

            // Open the contact URL
            if (contactUrl.startsWith('tel:')) {
                window.location.href = contactUrl;
            } else {
                window.open(contactUrl, '_blank');
            }
        } catch (error) {
            console.error('Failed to track vendor contact:', error);
            // Still open the URL even if tracking fails
            if (contactUrl.startsWith('tel:')) {
                window.location.href = contactUrl;
            } else {
                window.open(contactUrl, '_blank');
            }
        }
    }

    getOrCreateVendorContainer() {
        let container = document.getElementById('vendor-results');
        if (!container) {
            // Create vendor results container if it doesn't exist
            const mainContent = document.querySelector('main') || document.body;
            container = document.createElement('div');
            container.id = 'vendor-results';
            container.className = 'vendor-results-container';
            mainContent.appendChild(container);
        }
        return container;
    }

    showSearchResults() {
        const container = this.getOrCreateVendorContainer();
        container.scrollIntoView({ behavior: 'smooth' });
    }

    populateFilters() {
        // Populate trust dropdown if it exists
        const trustSelect = document.getElementById('trustSelect');
        if (trustSelect && this.trusts.length > 0) {
            trustSelect.innerHTML = '<option value="">Select NHS Trust</option>' +
                this.trusts.map(trust => `<option value="${trust.name}">${trust.name}</option>`).join('');
        }

        // Populate category dropdown if it exists
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect && this.categories.length > 0) {
            categorySelect.innerHTML = '<option value="">Select Category</option>' +
                this.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.insertBefore(errorDiv, document.body.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.justRelocationUI = new JustRelocationUI();
    window.justRelocationUI.init();
});

// Add CSS for vendor results
const vendorResultsCSS = `
<style>
.vendor-results-container {
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 20px;
}

.vendor-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.vendor-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.vendor-content {
    padding: 24px;
}

.vendor-category {
    background: #0057d9;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    display: inline-block;
    margin-bottom: 12px;
}

.vendor-name {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1a202c;
}

.vendor-description {
    color: #4a5568;
    margin-bottom: 16px;
    line-height: 1.5;
}

.vendor-coverage {
    margin-bottom: 20px;
}

.coverage-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 14px;
    color: #4a5568;
}

.coverage-item i {
    color: #0057d9;
    width: 16px;
}

.vendor-actions {
    display: flex;
    gap: 12px;
}

.btn-contact, .btn-phone {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-contact {
    background: #0057d9;
    color: white;
}

.btn-contact:hover {
    background: #003580;
}

.btn-phone {
    background: #10b981;
    color: white;
}

.btn-phone:hover {
    background: #059669;
}

.no-results {
    text-align: center;
    padding: 60px 20px;
    color: #4a5568;
}

.error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    z-index: 1000;
}

.error-content {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', vendorResultsCSS);