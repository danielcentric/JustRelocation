/**
 * JustRelocation Travel & Accommodation Integration
 * Handles travel booking, accommodation search, and temporary housing solutions
 */

class TravelAccommodationManager {
    constructor() {
        this.apiBase = 'http://localhost:8001';
        this.userLocation = null;
        this.destinationLocation = null;
        this.searchResults = [];
        this.selectedServices = [];
        this.init();
    }

    init() {
        this.createTravelInterface();
        this.bindEvents();
        this.loadUserPreferences();
    }

    createTravelInterface() {
        // Add travel search section to existing pages
        this.addTravelSearchWidget();
        this.addAccommodationFilters();
        this.addTemporaryHousingOptions();
    }

    addTravelSearchWidget() {
        const searchContainer = document.querySelector('.search-form');
        if (!searchContainer) return;

        const travelWidget = document.createElement('div');
        travelWidget.id = 'travelWidget';
        travelWidget.className = 'travel-widget';
        travelWidget.innerHTML = `
            <div class="travel-widget-header">
                <h3><i class="fas fa-plane"></i> Travel & Accommodation Assistant</h3>
                <button class="widget-toggle" onclick="window.travelManager.toggleWidget()">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>

            <div class="travel-widget-content" style="display: none;">
                <div class="travel-tabs">
                    <button class="travel-tab active" data-tab="accommodation">
                        <i class="fas fa-home"></i> Accommodation
                    </button>
                    <button class="travel-tab" data-tab="transport">
                        <i class="fas fa-car"></i> Transport
                    </button>
                    <button class="travel-tab" data-tab="temporary">
                        <i class="fas fa-clock"></i> Temporary Stay
                    </button>
                </div>

                <div id="accommodationTab" class="travel-tab-content active">
                    <div class="search-row">
                        <div class="form-group">
                            <label>Destination</label>
                            <input type="text" id="accommodationDestination" placeholder="Enter city or postcode">
                        </div>
                        <div class="form-group">
                            <label>Check-in</label>
                            <input type="date" id="checkInDate">
                        </div>
                        <div class="form-group">
                            <label>Check-out</label>
                            <input type="date" id="checkOutDate">
                        </div>
                    </div>

                    <div class="search-row">
                        <div class="form-group">
                            <label>Guests</label>
                            <select id="guestCount">
                                <option value="1">1 Guest</option>
                                <option value="2">2 Guests</option>
                                <option value="3">3 Guests</option>
                                <option value="4">4+ Guests</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Budget (per night)</label>
                            <select id="accommodationBudget">
                                <option value="">Any Budget</option>
                                <option value="0-50">£0 - £50</option>
                                <option value="50-100">£50 - £100</option>
                                <option value="100-200">£100 - £200</option>
                                <option value="200+">£200+</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <button class="search-btn" onclick="window.travelManager.searchAccommodation()">
                                <i class="fas fa-search"></i> Search Hotels
                            </button>
                        </div>
                    </div>
                </div>

                <div id="transportTab" class="travel-tab-content">
                    <div class="transport-options">
                        <div class="transport-option" data-type="flight">
                            <i class="fas fa-plane"></i>
                            <h4>Flights</h4>
                            <p>Book flights for relocation</p>
                        </div>
                        <div class="transport-option" data-type="train">
                            <i class="fas fa-train"></i>
                            <h4>Train</h4>
                            <p>Rail travel options</p>
                        </div>
                        <div class="transport-option" data-type="car-rental">
                            <i class="fas fa-car"></i>
                            <h4>Car Rental</h4>
                            <p>Rental cars for moving</p>
                        </div>
                        <div class="transport-option" data-type="removal">
                            <i class="fas fa-truck"></i>
                            <h4>Removal Services</h4>
                            <p>Professional moving services</p>
                        </div>
                    </div>
                </div>

                <div id="temporaryTab" class="travel-tab-content">
                    <div class="temporary-housing-info">
                        <h4>Temporary Accommodation Options</h4>
                        <div class="temp-options">
                            <div class="temp-option">
                                <h5>Corporate Apartments</h5>
                                <p>Fully furnished, monthly rates</p>
                                <button class="explore-btn" data-type="corporate">Explore</button>
                            </div>
                            <div class="temp-option">
                                <h5>Extended Stay Hotels</h5>
                                <p>Weekly/monthly discounts</p>
                                <button class="explore-btn" data-type="extended">Explore</button>
                            </div>
                            <div class="temp-option">
                                <h5>NHS Accommodation</h5>
                                <p>Trust-provided housing</p>
                                <button class="explore-btn" data-type="nhs">Check Availability</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="travelResults" class="travel-results" style="display: none;">
                    <div class="results-header">
                        <h4>Search Results</h4>
                        <div class="sort-options">
                            <select id="sortResults">
                                <option value="price">Sort by Price</option>
                                <option value="rating">Sort by Rating</option>
                                <option value="distance">Sort by Distance</option>
                            </select>
                        </div>
                    </div>
                    <div id="resultsContainer"></div>
                </div>
            </div>
        `;

        searchContainer.appendChild(travelWidget);
        this.addTravelStyles();
    }

    addAccommodationFilters() {
        // Enhance existing search with accommodation-specific filters
        const existingFilters = document.querySelector('.filter-section');
        if (!existingFilters) return;

        const accommodationFilters = document.createElement('div');
        accommodationFilters.className = 'filter-section accommodation-filters';
        accommodationFilters.innerHTML = `
            <h4><è Accommodation Filters</h4>
            <div class="filter-group">
                <label>Property Type</label>
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" name="propertyType" value="hotel">
                        <span>Hotels</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="propertyType" value="apartment">
                        <span>Apartments</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="propertyType" value="house">
                        <span>Houses</span>
                    </label>
                </div>
            </div>

            <div class="filter-group">
                <label>Amenities</label>
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" name="amenities" value="parking">
                        <span>Parking</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="amenities" value="wifi">
                        <span>WiFi</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="amenities" value="gym">
                        <span>Gym</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="amenities" value="pet-friendly">
                        <span>Pet Friendly</span>
                    </label>
                </div>
            </div>

            <div class="filter-group">
                <label>Rental Duration</label>
                <select name="duration">
                    <option value="">Any Duration</option>
                    <option value="short">Short-term (< 1 month)</option>
                    <option value="medium">Medium-term (1-6 months)</option>
                    <option value="long">Long-term (6+ months)</option>
                </select>
            </div>
        `;

        existingFilters.appendChild(accommodationFilters);
    }

    addTemporaryHousingOptions() {
        // Add temporary housing section to service listings
        const serviceList = document.querySelector('.services-grid') || document.querySelector('.vendor-listings');
        if (!serviceList) return;

        const tempHousingBanner = document.createElement('div');
        tempHousingBanner.className = 'temp-housing-banner';
        tempHousingBanner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">
                    <i class="fas fa-home"></i>
                </div>
                <div class="banner-text">
                    <h3>Need Temporary Accommodation?</h3>
                    <p>We can help arrange short-term housing while you search for permanent accommodation</p>
                </div>
                <div class="banner-action">
                    <button class="temp-housing-btn" onclick="window.travelManager.showTemporaryOptions()">
                        View Options
                    </button>
                </div>
            </div>
        `;

        serviceList.insertBefore(tempHousingBanner, serviceList.firstChild);
    }

    bindEvents() {
        // Travel tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('travel-tab')) {
                this.switchTravelTab(e.target.dataset.tab);
            }

            if (e.target.classList.contains('transport-option')) {
                this.handleTransportSelection(e.target.dataset.type);
            }

            if (e.target.classList.contains('explore-btn')) {
                this.exploreTemporaryOption(e.target.dataset.type);
            }
        });

        // Date validation
        const checkInInput = document.getElementById('checkInDate');
        const checkOutInput = document.getElementById('checkOutDate');

        if (checkInInput) {
            checkInInput.addEventListener('change', () => {
                this.validateDates();
            });
        }

        if (checkOutInput) {
            checkOutInput.addEventListener('change', () => {
                this.validateDates();
            });
        }
    }

    toggleWidget() {
        const content = document.querySelector('.travel-widget-content');
        const toggle = document.querySelector('.widget-toggle i');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.className = 'fas fa-chevron-up';
        } else {
            content.style.display = 'none';
            toggle.className = 'fas fa-chevron-down';
        }
    }

    switchTravelTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.travel-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.travel-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    async searchAccommodation() {
        const destination = document.getElementById('accommodationDestination').value;
        const checkIn = document.getElementById('checkInDate').value;
        const checkOut = document.getElementById('checkOutDate').value;
        const guests = document.getElementById('guestCount').value;
        const budget = document.getElementById('accommodationBudget').value;

        if (!destination || !checkIn || !checkOut) {
            this.showNotification('Please fill in all required fields', 'warning');
            return;
        }

        try {
            this.showLoading('Searching for accommodation...');

            // Simulate API call to accommodation providers
            const searchParams = {
                destination,
                checkIn,
                checkOut,
                guests: parseInt(guests),
                budget,
                type: 'accommodation'
            };

            // Mock accommodation results
            const mockResults = this.generateMockAccommodation(searchParams);

            this.hideLoading();
            this.displaySearchResults(mockResults);

        } catch (error) {
            this.hideLoading();
            this.showNotification('Search failed. Please try again.', 'error');
            console.error('Accommodation search error:', error);
        }
    }

    generateMockAccommodation(params) {
        const accommodations = [
            {
                id: 'acc_1',
                name: 'Premier Inn London City',
                type: 'hotel',
                price: 85,
                rating: 4.2,
                distance: '0.5 miles from city center',
                amenities: ['WiFi', 'Parking', 'Breakfast'],
                image: 'https://via.placeholder.com/300x200',
                description: 'Modern hotel with comfortable rooms'
            },
            {
                id: 'acc_2',
                name: 'Serviced Apartments Central',
                type: 'apartment',
                price: 120,
                rating: 4.5,
                distance: '0.3 miles from hospital',
                amenities: ['Kitchen', 'WiFi', 'Parking', 'Gym'],
                image: 'https://via.placeholder.com/300x200',
                description: 'Fully furnished apartments for extended stays'
            },
            {
                id: 'acc_3',
                name: 'NHS Trust Accommodation',
                type: 'nhs-housing',
                price: 60,
                rating: 4.0,
                distance: 'On-site',
                amenities: ['WiFi', 'Shared Kitchen', 'Laundry'],
                image: 'https://via.placeholder.com/300x200',
                description: 'Subsidized accommodation for NHS staff'
            }
        ];

        // Filter based on search parameters
        return accommodations.filter(acc => {
            if (params.budget) {
                const [min, max] = params.budget.split('-').map(p => p.replace('+', '').replace('£', ''));
                const minPrice = parseInt(min) || 0;
                const maxPrice = parseInt(max) || Infinity;

                if (acc.price < minPrice || acc.price > maxPrice) {
                    return false;
                }
            }
            return true;
        });
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        const travelResults = document.getElementById('travelResults');

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No accommodation found for your search criteria.</p>';
            travelResults.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = results.map(item => `
            <div class="accommodation-card" data-id="${item.id}">
                <div class="accommodation-image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                    <div class="accommodation-type">${item.type}</div>
                </div>
                <div class="accommodation-details">
                    <h5>${item.name}</h5>
                    <div class="rating">
                        ${this.generateStars(item.rating)}
                        <span class="rating-text">${item.rating}</span>
                    </div>
                    <p class="distance">=Í ${item.distance}</p>
                    <p class="description">${item.description}</p>
                    <div class="amenities">
                        ${item.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
                    </div>
                </div>
                <div class="accommodation-price">
                    <div class="price">£${item.price}<span class="price-unit">/night</span></div>
                    <button class="book-btn" onclick="window.travelManager.selectAccommodation('${item.id}')">
                        Select
                    </button>
                </div>
            </div>
        `).join('');

        travelResults.style.display = 'block';
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    selectAccommodation(accommodationId) {
        this.selectedServices.push({
            type: 'accommodation',
            id: accommodationId
        });

        this.showNotification('Accommodation selected! Contact details will be provided.', 'success');

        // Track selection for lead generation
        this.trackAccommodationSelection(accommodationId);
    }

    handleTransportSelection(transportType) {
        const transportOptions = {
            flight: 'Flight booking services',
            train: 'Railway travel options',
            'car-rental': 'Car rental services',
            removal: 'Professional removal services'
        };

        this.showNotification(`${transportOptions[transportType]} - Feature coming soon!`, 'info');
    }

    exploreTemporaryOption(optionType) {
        const options = {
            corporate: 'Corporate apartment options',
            extended: 'Extended stay hotel options',
            nhs: 'NHS trust accommodation options'
        };

        this.showNotification(`Exploring ${options[optionType]} - Contact our team for assistance.`, 'info');
    }

    validateDates() {
        const checkIn = document.getElementById('checkInDate');
        const checkOut = document.getElementById('checkOutDate');

        if (checkIn.value && checkOut.value) {
            const checkInDate = new Date(checkIn.value);
            const checkOutDate = new Date(checkOut.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (checkInDate < today) {
                this.showNotification('Check-in date cannot be in the past', 'warning');
                checkIn.value = '';
                return false;
            }

            if (checkOutDate <= checkInDate) {
                this.showNotification('Check-out date must be after check-in date', 'warning');
                checkOut.value = '';
                return false;
            }
        }

        return true;
    }

    async trackAccommodationSelection(accommodationId) {
        try {
            await fetch(`${this.apiBase}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: 'accommodation_selected',
                    accommodation_id: accommodationId,
                    user_id: this.getCurrentUserId(),
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Tracking error:', error);
        }
    }

    loadUserPreferences() {
        const preferences = localStorage.getItem('travel_preferences');
        if (preferences) {
            const prefs = JSON.parse(preferences);
            this.applyUserPreferences(prefs);
        }
    }

    applyUserPreferences(prefs) {
        if (prefs.preferredBudget) {
            const budgetSelect = document.getElementById('accommodationBudget');
            if (budgetSelect) budgetSelect.value = prefs.preferredBudget;
        }

        if (prefs.preferredGuests) {
            const guestSelect = document.getElementById('guestCount');
            if (guestSelect) guestSelect.value = prefs.preferredGuests;
        }
    }

    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id || 'anonymous';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `travel-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showLoading(message) {
        const loading = document.createElement('div');
        loading.id = 'travelLoading';
        loading.className = 'travel-loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>${message}</p>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('travelLoading');
        if (loading) {
            document.body.removeChild(loading);
        }
    }

    addTravelStyles() {
        if (document.getElementById('travelStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'travelStyles';
        styles.textContent = `
            .travel-widget {
                background: var(--white);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-large);
                margin: 20px 0;
                box-shadow: var(--shadow-subtle);
            }

            .travel-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
            }

            .travel-widget-header h3 {
                margin: 0;
                color: var(--text-primary);
                font-size: 16px;
            }

            .widget-toggle {
                background: none;
                border: none;
                font-size: 16px;
                color: var(--text-secondary);
                cursor: pointer;
            }

            .travel-widget-content {
                padding: 20px;
            }

            .travel-tabs {
                display: flex;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
            }

            .travel-tab {
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .travel-tab.active {
                color: var(--primary-blue);
                border-bottom-color: var(--primary-blue);
            }

            .travel-tab-content {
                display: none;
            }

            .travel-tab-content.active {
                display: block;
            }

            .search-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }

            .transport-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .transport-option {
                padding: 20px;
                text-align: center;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .transport-option:hover {
                border-color: var(--primary-blue);
                background: rgba(0, 87, 217, 0.05);
            }

            .transport-option i {
                font-size: 32px;
                color: var(--primary-blue);
                margin-bottom: 12px;
            }

            .temp-options {
                display: grid;
                gap: 16px;
            }

            .temp-option {
                padding: 16px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .explore-btn {
                padding: 8px 16px;
                background: var(--primary-blue);
                color: var(--white);
                border: none;
                border-radius: var(--border-radius-small);
                cursor: pointer;
            }

            .accommodation-card {
                display: grid;
                grid-template-columns: 300px 1fr auto;
                gap: 20px;
                padding: 20px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                margin-bottom: 16px;
            }

            .accommodation-image {
                position: relative;
            }

            .accommodation-image img {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: var(--border-radius-medium);
            }

            .accommodation-type {
                position: absolute;
                top: 8px;
                left: 8px;
                background: var(--primary-blue);
                color: var(--white);
                padding: 4px 8px;
                border-radius: var(--border-radius-small);
                font-size: 12px;
            }

            .rating {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 8px 0;
            }

            .rating .fas, .rating .far {
                color: var(--warning-yellow);
            }

            .amenities {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 12px;
            }

            .amenity-tag {
                padding: 4px 8px;
                background: var(--bg-gray);
                border-radius: var(--border-radius-small);
                font-size: 12px;
                color: var(--text-secondary);
            }

            .accommodation-price {
                text-align: center;
            }

            .price {
                font-size: 24px;
                font-weight: 700;
                color: var(--primary-blue);
                margin-bottom: 12px;
            }

            .price-unit {
                font-size: 14px;
                font-weight: 400;
                color: var(--text-secondary);
            }

            .book-btn {
                padding: 12px 24px;
                background: var(--success-green);
                color: var(--white);
                border: none;
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                font-weight: 600;
            }

            .temp-housing-banner {
                background: linear-gradient(135deg, var(--primary-blue), #003d99);
                color: var(--white);
                padding: 20px;
                border-radius: var(--border-radius-large);
                margin-bottom: 24px;
            }

            .banner-content {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .banner-icon {
                font-size: 48px;
                opacity: 0.8;
            }

            .banner-text h3 {
                margin: 0 0 8px 0;
            }

            .temp-housing-btn {
                padding: 12px 24px;
                background: var(--white);
                color: var(--primary-blue);
                border: none;
                border-radius: var(--border-radius-medium);
                font-weight: 600;
                cursor: pointer;
            }

            .travel-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: var(--border-radius-medium);
                color: var(--white);
                font-weight: 500;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }

            .travel-notification.show {
                transform: translateX(0);
            }

            .travel-notification.success {
                background: var(--success-green);
            }

            .travel-notification.error {
                background: var(--action-red);
            }

            .travel-notification.warning {
                background: var(--warning-yellow);
                color: var(--text-primary);
            }

            .travel-notification.info {
                background: var(--primary-blue);
            }

            .travel-loading {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: var(--white);
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid var(--white);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 768px) {
                .accommodation-card {
                    grid-template-columns: 1fr;
                    text-align: center;
                }

                .search-row {
                    grid-template-columns: 1fr;
                }

                .transport-options {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Initialize travel manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.travelManager = new TravelAccommodationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TravelAccommodationManager;
}