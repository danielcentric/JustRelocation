// JustRelocation - Main Application JavaScript
class NHSServiceDirectory {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.currentUser = null;
        this.currentLocation = null;
        this.selectedCategory = null;
        this.vendors = [];
        this.hospitals = [];
        this.authToken = localStorage.getItem('nhs_auth_token');

        // Initialize WhatsApp if available
        if (typeof WhatsAppService !== 'undefined') {
            this.whatsappService = new WhatsAppService();
            this.whatsappConfig = new WhatsAppConfig();
        }

        this.init();
    }

    async init() {
        try {
            // Check authentication status
            if (this.authToken) {
                await this.validateToken();
            }

            // Load data from API
            await this.loadHospitals();
            await this.loadVendors();

            // Setup event listeners
            this.setupEventListeners();

            // Render initial content
            this.renderTrusts();
            this.renderFeaturedServices();

            console.log('NHS Service Directory initialized successfully');
        } catch (error) {
            console.error('Error initializing NHS Service Directory:', error);
        }
    }

    async initializeWhatsApp() {
        try {
            const config = this.whatsappConfig.getConfig();
            await this.whatsappService.initialize(config.phoneNumberId, config.accessToken);
        } catch (error) {
            console.error('WhatsApp initialization error:', error);
        }
    }

    // API Integration
    async validateToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
            } else {
                localStorage.removeItem('nhs_auth_token');
                this.authToken = null;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('nhs_auth_token');
            this.authToken = null;
        }
    }

    async loadHospitals() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/hospitals`);

            if (response.ok) {
                this.hospitals = await response.json();
            } else {
                // Fallback to mock data
                this.hospitals = this.getMockHospitals();
            }
        } catch (error) {
            console.error('Error loading hospitals:', error);
            this.hospitals = this.getMockHospitals();
        }
    }

    async loadVendors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/services/search`);

            if (response.ok) {
                const data = await response.json();
                this.vendors = data.results || [];
            } else {
                // Fallback to mock data
                this.vendors = this.getMockVendors();
            }
        } catch (error) {
            console.error('Error loading vendors:', error);
            this.vendors = this.getMockVendors();
        }
    }

    getMockHospitals() {
        return [
            {
                id: 'barts',
                name: 'Barts Health NHS Trust',
                city: 'East London',
                trust: 'Barts Health NHS Trust',
                location: 'East London',
                rating: 4.6,
                hospitals: 5,
                services: 342
            },
            {
                id: 'guys',
                name: "Guy's and St Thomas'",
                city: 'Central London',
                trust: "Guy's and St Thomas' NHS Foundation Trust",
                location: 'Central London',
                rating: 4.8,
                hospitals: 3,
                services: 428
            },
            {
                id: 'manchester',
                name: 'Manchester University NHS',
                city: 'Greater Manchester',
                trust: 'Manchester University NHS Foundation Trust',
                location: 'Greater Manchester',
                rating: 4.7,
                hospitals: 9,
                services: 287
            },
            {
                id: 'leeds',
                name: 'Leeds Teaching Hospitals',
                city: 'West Yorkshire',
                trust: 'Leeds Teaching Hospitals NHS Trust',
                location: 'West Yorkshire',
                rating: 4.5,
                hospitals: 7,
                services: 198
            },
            {
                id: 'birmingham',
                name: 'University Hospitals Birmingham',
                city: 'West Midlands',
                trust: 'University Hospitals Birmingham NHS Foundation Trust',
                location: 'West Midlands',
                rating: 4.6,
                hospitals: 4,
                services: 256
            }
        ];
    }

    getMockVendors() {
        return [
            {
                id: 'safestay',
                business_name: 'SafeStay Housing Ltd',
                service_category: 'Housing',
                description: 'Modern 2-bed flat, 10 min from Royal London Hospital',
                price_range: '£600-1200/month',
                location: 'Central London',
                whatsapp_number: '+447700123456',
                phone_number: '+442071234567',
                rating: 4.8,
                tier: 'premium',
                features: ['NHS Verified', 'Bills included', 'No deposit'],
                is_active: true
            },
            {
                id: 'hsbc',
                business_name: 'HSBC UK',
                service_category: 'Banking',
                description: 'NHS Worker Banking Package - Quick setup guaranteed',
                price_range: 'FREE',
                location: 'Nationwide',
                whatsapp_number: '+447700654321',
                phone_number: '+442087654321',
                rating: 4.6,
                tier: 'featured',
                features: ['Same day account', '£200 bonus', 'No fees'],
                is_active: true
            },
            {
                id: 'quickreg',
                business_name: 'Quick Registration Services',
                service_category: 'Registration',
                description: 'NMC/GMC Registration - Fast track support',
                price_range: '£200-500',
                location: 'Remote/Online',
                whatsapp_number: '+447700987654',
                phone_number: '+442012345678',
                rating: 4.9,
                tier: 'premium',
                features: ['48hr processing', 'Document help', 'Success guarantee'],
                is_active: true
            }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Search functionality
        const searchBtn = document.querySelector('.search-btn');
        const searchInputs = document.querySelectorAll('.search-input');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        });

        // Search tabs
        const searchTabs = document.querySelectorAll('.search-tab');
        searchTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchSearchTab(tab));
        });

        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.filterByCategory(category);
            });
        });

        // List your service button
        const listServiceBtn = document.querySelector('.list-service-btn');
        if (listServiceBtn) {
            listServiceBtn.addEventListener('click', () => {
                window.location.href = 'vendor-registration.html';
            });
        }
    }

    switchSearchTab(activeTab) {
        // Remove active class from all tabs
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active to clicked tab
        activeTab.classList.add('active');

        // Update search placeholder based on tab
        const tabType = activeTab.dataset.tab;
        const hospitalSearch = document.getElementById('hospitalSearch');
        const serviceSearch = document.getElementById('serviceSearch');

        switch (tabType) {
            case 'hospital':
                hospitalSearch.placeholder = 'Search NHS Trust or Hospital';
                serviceSearch.placeholder = 'Any service type';
                break;
            case 'housing':
                hospitalSearch.placeholder = 'Near which hospital?';
                serviceSearch.placeholder = 'Housing type (flat, room, etc.)';
                break;
            case 'banking':
                hospitalSearch.placeholder = 'Your location';
                serviceSearch.placeholder = 'Account type';
                break;
            case 'all-services':
                hospitalSearch.placeholder = 'Location';
                serviceSearch.placeholder = 'What do you need?';
                break;
        }
    }

    async performSearch() {
        const hospital = document.getElementById('hospitalSearch').value;
        const service = document.getElementById('serviceSearch').value;
        const date = document.getElementById('dateSearch').value;

        console.log('Searching for:', { hospital, service, date });

        try {
            // Build search URL with parameters
            const params = new URLSearchParams();
            if (service) params.append('category', service);
            if (hospital) params.append('location', hospital);

            const response = await fetch(`${this.apiBaseUrl}/services/search?${params}`);

            if (response.ok) {
                const data = await response.json();
                this.renderSearchResults(data.results || []);
            } else {
                // Fallback to local filtering
                this.performLocalSearch(hospital, service);
            }
        } catch (error) {
            console.error('Search API error:', error);
            this.performLocalSearch(hospital, service);
        }

        // Scroll to results
        document.querySelector('.featured-services').scrollIntoView({
            behavior: 'smooth'
        });
    }

    performLocalSearch(hospital, service) {
        let filteredVendors = this.vendors;

        if (service) {
            filteredVendors = filteredVendors.filter(vendor =>
                vendor.service_category.toLowerCase().includes(service.toLowerCase()) ||
                vendor.description.toLowerCase().includes(service.toLowerCase())
            );
        }

        if (hospital) {
            filteredVendors = filteredVendors.filter(vendor =>
                vendor.location.toLowerCase().includes(hospital.toLowerCase())
            );
        }

        // Sort by tier priority: premium -> featured -> basic
        const tierPriority = { 'premium': 3, 'featured': 2, 'basic': 1 };
        filteredVendors.sort((a, b) => {
            const tierA = tierPriority[a.tier] || 1;
            const tierB = tierPriority[b.tier] || 1;
            if (tierA !== tierB) return tierB - tierA;
            return b.rating - a.rating; // Then by rating
        });

        this.renderSearchResults(filteredVendors);
    }

    filterByCategory(category) {
        console.log('Filtering by category:', category);
        this.selectedCategory = category;

        const filteredVendors = this.vendors.filter(vendor =>
            vendor.service_category.toLowerCase() === category.toLowerCase()
        );

        // Sort by tier priority
        const tierPriority = { 'premium': 3, 'featured': 2, 'basic': 1 };
        filteredVendors.sort((a, b) => {
            const tierA = tierPriority[a.tier] || 1;
            const tierB = tierPriority[b.tier] || 1;
            if (tierA !== tierB) return tierB - tierA;
            return b.rating - a.rating;
        });

        this.renderSearchResults(filteredVendors);

        // Update section title
        const sectionHeader = document.querySelector('.featured-services .section-header h2');
        if (sectionHeader) {
            sectionHeader.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Services`;
        }

        // Scroll to results
        document.querySelector('.featured-services').scrollIntoView({
            behavior: 'smooth'
        });
    }

    // Rendering Functions
    renderTrusts() {
        const trustsGrid = document.getElementById('trustsGrid');
        if (!trustsGrid) return;

        trustsGrid.innerHTML = this.hospitals.map(trust => `
            <div class="trust-card" onclick="app.selectTrust('${trust.id}')">
                <div class="trust-badge">NHS Partner</div>
                <h3 class="trust-name">${trust.name}</h3>
                <div class="trust-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${trust.location}
                </div>
                <div class="trust-stats">
                    <div class="trust-rating">
                        <i class="fas fa-star"></i>
                        ${trust.rating} (${Math.floor(Math.random() * 500 + 100)})
                    </div>
                    <span>${trust.hospitals || Math.floor(Math.random() * 10 + 1)} Hospitals</span>
                </div>
                <div class="trust-services">${trust.services || Math.floor(Math.random() * 400 + 100)} services available</div>
            </div>
        `).join('');
    }

    renderFeaturedServices() {
        const featuredGrid = document.getElementById('featuredServices');
        if (!featuredGrid) return;

        // Get featured/premium vendors
        const featuredVendors = this.vendors.filter(vendor =>
            vendor.tier === 'featured' || vendor.tier === 'premium'
        );

        featuredGrid.innerHTML = featuredVendors.map(vendor => `
            <div class="service-card" onclick="app.showServiceModal('${vendor.id}')">
                <div class="service-image">
                    ${vendor.tier === 'premium' ? '<div class="service-badge premium">Premium</div>' : ''}
                    ${vendor.tier === 'featured' ? '<div class="service-badge featured">Featured</div>' : ''}
                </div>
                <div class="service-content">
                    <h3 class="service-title">${vendor.business_name}</h3>
                    <p class="service-description">${vendor.description}</p>

                    <div class="service-price">
                        ${vendor.price_range}
                    </div>

                    <div class="service-features">
                        ${vendor.features ? vendor.features.map(feature => `
                            <div class="service-feature">
                                <i class="fas fa-check"></i>
                                ${feature}
                            </div>
                        `).join('') : ''}
                    </div>

                    <div class="service-actions">
                        <button class="view-details-btn">View details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSearchResults(vendors) {
        const featuredGrid = document.getElementById('featuredServices');
        if (!featuredGrid) return;

        if (vendors.length === 0) {
            featuredGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No services found</h3>
                    <p>Try adjusting your search criteria or browse by category above.</p>
                </div>
            `;
            return;
        }

        featuredGrid.innerHTML = vendors.map(vendor => `
            <div class="service-card" onclick="app.showServiceModal('${vendor.id}')">
                <div class="service-image">
                    ${vendor.tier === 'premium' ? '<div class="service-badge premium">Premium</div>' : ''}
                    ${vendor.tier === 'featured' ? '<div class="service-badge featured">Featured</div>' : ''}
                </div>
                <div class="service-content">
                    <h3 class="service-title">${vendor.business_name}</h3>
                    <p class="service-description">${vendor.description}</p>

                    <div class="service-price">
                        ${vendor.price_range}
                    </div>

                    <div class="service-rating">
                        <div class="trust-rating">
                            <i class="fas fa-star"></i>
                            ${vendor.rating}
                        </div>
                        <span class="service-location">${vendor.location}</span>
                    </div>

                    <div class="service-actions">
                        <button class="view-details-btn">View details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Modal Functions
    showServiceModal(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        const modal = document.getElementById('serviceModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        const whatsappBtn = document.getElementById('whatsappContactBtn');
        const phoneBtn = document.getElementById('phoneContactBtn');

        modalTitle.textContent = vendor.business_name;

        modalContent.innerHTML = `
            <div class="service-details">
                <div class="service-meta">
                    <span class="service-category">${vendor.service_category}</span>
                    <span class="service-tier tier-${vendor.tier}">${vendor.tier.toUpperCase()}</span>
                    <div class="service-rating">
                        <i class="fas fa-star"></i>
                        ${vendor.rating} rating
                    </div>
                </div>

                <h4>Service Description</h4>
                <p>${vendor.description}</p>

                <h4>Pricing</h4>
                <div class="pricing-info">
                    <span class="price">${vendor.price_range}</span>
                </div>

                <h4>Location</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${vendor.location}</p>

                ${vendor.features && vendor.features.length > 0 ? `
                    <h4>Features</h4>
                    <ul class="feature-list">
                        ${vendor.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                    </ul>
                ` : ''}

                <h4>Contact Information</h4>
                <div class="contact-info">
                    ${vendor.whatsapp_number ? `<p><i class="fab fa-whatsapp"></i> ${vendor.whatsapp_number}</p>` : ''}
                    ${vendor.phone_number ? `<p><i class="fas fa-phone"></i> ${vendor.phone_number}</p>` : ''}
                    ${vendor.email ? `<p><i class="fas fa-envelope"></i> ${vendor.email}</p>` : ''}
                    ${vendor.website ? `<p><i class="fas fa-globe"></i> <a href="${vendor.website}" target="_blank">${vendor.website}</a></p>` : ''}
                </div>
            </div>
        `;

        // Setup contact buttons
        if (vendor.whatsapp_number) {
            whatsappBtn.style.display = 'flex';
            whatsappBtn.onclick = () => this.contactViaWhatsApp(vendor);
        } else {
            whatsappBtn.style.display = 'none';
        }

        if (vendor.phone_number) {
            phoneBtn.style.display = 'flex';
            phoneBtn.onclick = () => window.open(`tel:${vendor.phone_number}`);
        } else {
            phoneBtn.style.display = 'none';
        }

        modal.style.display = 'block';

        // Track lead (for vendor dashboard)
        this.trackLead(vendorId);
    }

    closeModal() {
        document.getElementById('serviceModal').style.display = 'none';
    }

    // WhatsApp Integration
    async contactViaWhatsApp(vendor) {
        const hospitalName = this.currentUser?.hospital || 'a local hospital';
        const message = `Hi ${vendor.business_name}! I found your services on NHS Service Directory and I'm interested in ${vendor.service_category.toLowerCase()}. I'm an NHS worker at ${hospitalName}. Can you help me with more information?`;

        if (this.authToken) {
            try {
                // Send contact request via API
                const response = await fetch(`${this.apiBaseUrl}/contact-vendor`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authToken}`
                    },
                    body: JSON.stringify({
                        vendor_id: vendor.id,
                        message: message
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    window.open(data.whatsapp_url, '_blank');
                } else {
                    // Fallback to direct WhatsApp
                    this.openDirectWhatsApp(vendor, message);
                }
            } catch (error) {
                console.error('Contact API error:', error);
                this.openDirectWhatsApp(vendor, message);
            }
        } else {
            this.openDirectWhatsApp(vendor, message);
        }

        this.closeModal();
    }

    openDirectWhatsApp(vendor, message) {
        const whatsappUrl = `https://wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    openWhatsAppSupport() {
        const supportMessage = "Hi! I need help with JustRelocation. Can you assist me?";
        const whatsappUrl = `https://wa.me/447700900900?text=${encodeURIComponent(supportMessage)}`;
        window.open(whatsappUrl, '_blank');
    }

    // Analytics & Lead Tracking
    trackLead(vendorId) {
        // Track that someone viewed this vendor's details
        // This would be sent to your analytics/CRM system
        console.log('Lead tracked for vendor:', vendorId);

        // In production, send to backend:
        // fetch('/api/track-lead', { method: 'POST', body: JSON.stringify({ vendorId, timestamp: Date.now() }) });
    }

    selectTrust(trustId) {
        const trust = this.hospitals.find(h => h.id === trustId);
        if (trust) {
            document.getElementById('hospitalSearch').value = trust.name;
            this.performSearch();
        }
    }

    // Utility Functions
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type} show`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NHSServiceDirectory();
});

// Global functions for onclick handlers
function openWhatsAppSupport() {
    if (window.app) {
        window.app.openWhatsAppSupport();
    }
}

function closeModal() {
    if (window.app) {
        window.app.closeModal();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}