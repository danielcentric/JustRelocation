/**
 * JustRelocation Advanced Search System
 * Handles location-based search, filters, and enhanced results
 */

class AdvancedSearchManager {
    constructor() {
        this.apiBase = 'http://localhost:8001';
        this.map = null;
        this.markers = [];
        this.userLocation = null;
        this.init();
    }

    init() {
        this.createAdvancedSearchInterface();
        this.bindSearchEvents();
        this.loadGoogleMaps();
        this.getCurrentLocation();
    }

    loadGoogleMaps() {
        if (!document.getElementById('google-maps-js')) {
            const script = document.createElement('script');
            script.id = 'google-maps-js';
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
            script.onload = () => {
                this.initializeMap();
                this.initializeAutocomplete();
            };
            document.head.appendChild(script);
        }
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('User location detected:', this.userLocation);
                },
                (error) => {
                    console.log('Geolocation not available:', error);
                }
            );
        }
    }

    createAdvancedSearchInterface() {
        // Enhance existing search with advanced filters
        const searchContainer = document.querySelector('.search-form');
        if (!searchContainer) return;

        // Add advanced search toggle button
        const advancedToggle = document.createElement('button');
        advancedToggle.type = 'button';
        advancedToggle.className = 'advanced-search-toggle';
        advancedToggle.innerHTML = '🔍 Advanced Search';
        advancedToggle.onclick = () => this.toggleAdvancedSearch();

        searchContainer.appendChild(advancedToggle);

        // Create advanced search panel
        const advancedPanel = document.createElement('div');
        advancedPanel.id = 'advancedSearchPanel';
        advancedPanel.className = 'advanced-search-panel';
        advancedPanel.innerHTML = `
            <div class="advanced-search-header">
                <h3>Advanced Search Filters</h3>
                <button class="close-advanced" onclick="window.searchManager.toggleAdvancedSearch()">&times;</button>
            </div>

            <div class="filter-sections">
                <div class="filter-section">
                    <h4>📍 Location & Distance</h4>
                    <div class="filter-group">
                        <label>Search Location</label>
                        <input type="text" id="locationInput" placeholder="Enter postcode, city or area">
                        <button type="button" id="useMyLocation" class="use-location-btn">Use My Location</button>
                    </div>
                    <div class="filter-group">
                        <label>Search Radius</label>
                        <div class="range-container">
                            <input type="range" id="radiusSlider" min="1" max="50" value="10">
                            <span id="radiusValue">10 km</span>
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>💰 Price Range</h4>
                    <div class="filter-group">
                        <div class="price-inputs">
                            <input type="number" id="minPrice" placeholder="Min £" min="0">
                            <span>to</span>
                            <input type="number" id="maxPrice" placeholder="Max £" min="0">
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>⭐ Rating & Quality</h4>
                    <div class="filter-group">
                        <label>Minimum Rating</label>
                        <div class="rating-selector">
                            <button class="rating-btn" data-rating="0">Any</button>
                            <button class="rating-btn" data-rating="3">3+ ⭐</button>
                            <button class="rating-btn" data-rating="4">4+ ⭐</button>
                            <button class="rating-btn" data-rating="4.5">4.5+ ⭐</button>
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>🏷️ Service Features</h4>
                    <div class="filter-group">
                        <div class="feature-checkboxes">
                            <label class="checkbox-label">
                                <input type="checkbox" value="nhs-discount">NHS Discount Available
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="24-7">24/7 Availability
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="verified">Verified Provider
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="instant-booking">Instant Booking
                            </label>
                        </div>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>📅 Availability</h4>
                    <div class="filter-group">
                        <select id="availabilityFilter">
                            <option value="">Any Availability</option>
                            <option value="available">Available Now</option>
                            <option value="booking-required">Booking Required</option>
                            <option value="waitlist">Waitlist Available</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="filter-actions">
                <button type="button" id="clearFilters" class="filter-btn secondary">Clear All</button>
                <button type="button" id="applyFilters" class="filter-btn primary">Apply Filters</button>
            </div>

            <div class="active-filters">
                <h5>Active Filters:</h5>
                <div id="activeFilterTags"></div>
            </div>
        `;

        searchContainer.appendChild(advancedPanel);

        // Create map modal
        this.createMapModal();

        // Add enhanced search CSS
        this.addAdvancedSearchCSS();
    }

    createMapModal() {
        const mapModal = document.createElement('div');
        mapModal.id = 'mapModal';
        mapModal.className = 'map-modal';
        mapModal.innerHTML = `
            <div class="map-modal-content">
                <div class="map-modal-header">
                    <h3>Service Locations</h3>
                    <div class="map-controls">
                        <button id="listView" class="view-toggle active">List View</button>
                        <button id="mapView" class="view-toggle">Map View</button>
                        <button class="map-modal-close">&times;</button>
                    </div>
                </div>
                <div class="map-container">
                    <div id="servicesList" class="services-list active">
                        <!-- Services list will be populated here -->
                    </div>
                    <div id="googleMap" class="google-map">
                        <!-- Google Map will be initialized here -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(mapModal);
    }

    addAdvancedSearchCSS() {
        const css = `
        <style>
        .advanced-search-toggle {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 12px;
            transition: all 0.2s;
        }

        .advanced-search-toggle:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .advanced-search-panel {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            display: none;
            max-width: 800px;
            margin: 8px auto;
        }

        .advanced-search-panel.show {
            display: block;
        }

        .advanced-search-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
        }

        .advanced-search-header h3 {
            margin: 0;
            color: #003580;
        }

        .close-advanced {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
        }

        .filter-sections {
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
        }

        .filter-section h4 {
            color: #333;
            margin-bottom: 12px;
            font-size: 16px;
        }

        .filter-group {
            margin-bottom: 16px;
        }

        .filter-group label {
            display: block;
            margin-bottom: 6px;
            color: #555;
            font-size: 14px;
            font-weight: 500;
        }

        .filter-group input,
        .filter-group select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }

        .use-location-btn {
            width: 100%;
            margin-top: 8px;
            padding: 8px;
            background: #e3f2fd;
            border: 1px solid #2196f3;
            color: #1976d2;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .range-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .range-container input[type="range"] {
            flex: 1;
        }

        .range-container span {
            font-weight: 600;
            color: #003580;
            min-width: 50px;
        }

        .price-inputs {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .price-inputs input {
            flex: 1;
        }

        .price-inputs span {
            color: #666;
        }

        .rating-selector {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .rating-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .rating-btn.active {
            background: #003580;
            color: white;
            border-color: #003580;
        }

        .feature-checkboxes {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
            width: auto;
        }

        .filter-actions {
            display: flex;
            gap: 12px;
            padding: 16px 20px;
            border-top: 1px solid #eee;
            justify-content: flex-end;
        }

        .filter-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }

        .filter-btn.primary {
            background: #003580;
            color: white;
        }

        .filter-btn.secondary {
            background: #f5f5f5;
            color: #666;
        }

        .active-filters {
            padding: 0 20px 20px;
        }

        .active-filters h5 {
            margin: 0 0 8px 0;
            color: #666;
            font-size: 14px;
        }

        .filter-tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin: 2px;
            cursor: pointer;
        }

        .filter-tag:hover {
            background: #bbdefb;
        }

        .map-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 10000;
        }

        .map-modal.show {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .map-modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            height: 80%;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
        }

        .map-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eee;
        }

        .map-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .view-toggle {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        }

        .view-toggle.active {
            background: #003580;
            color: white;
        }

        .map-container {
            flex: 1;
            position: relative;
        }

        .services-list {
            display: none;
            padding: 20px;
            height: 100%;
            overflow-y: auto;
        }

        .services-list.active {
            display: block;
        }

        .google-map {
            display: none;
            width: 100%;
            height: 100%;
        }

        .google-map.active {
            display: block;
        }

        .service-result-card {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            display: flex;
            gap: 16px;
        }

        .service-result-image {
            width: 120px;
            height: 80px;
            border-radius: 6px;
            object-fit: cover;
        }

        .service-result-content {
            flex: 1;
        }

        .service-result-title {
            font-size: 18px;
            font-weight: 600;
            color: #003580;
            margin-bottom: 8px;
        }

        .service-result-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #666;
        }

        .service-result-price {
            font-size: 20px;
            font-weight: 600;
            color: #d32f2f;
        }

        .distance-badge {
            background: #e8f5e8;
            color: #2e7d2e;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }

        @media (max-width: 768px) {
            .filter-sections {
                grid-template-columns: 1fr;
                padding: 16px;
            }

            .filter-actions {
                flex-direction: column;
            }

            .map-modal-content {
                width: 95%;
                height: 90%;
            }

            .service-result-card {
                flex-direction: column;
            }

            .service-result-image {
                width: 100%;
                height: 150px;
            }
        }
        </style>`;

        document.head.insertAdjacentHTML('beforeend', css);
    }

    bindSearchEvents() {
        // Advanced search panel toggle
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('advancedSearchPanel');
            if (panel && !panel.contains(e.target) && !e.target.classList.contains('advanced-search-toggle')) {
                panel.classList.remove('show');
            }
        });

        // Radius slider
        document.addEventListener('input', (e) => {
            if (e.target.id === 'radiusSlider') {
                document.getElementById('radiusValue').textContent = `${e.target.value} km`;
            }
        });

        // Rating buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('rating-btn')) {
                document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Use my location button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'useMyLocation') {
                this.useCurrentLocation();
            }
        });

        // Apply filters
        document.addEventListener('click', (e) => {
            if (e.target.id === 'applyFilters') {
                this.applyAdvancedFilters();
            }
        });

        // Clear filters
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clearFilters') {
                this.clearAllFilters();
            }
        });

        // Map modal controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('map-modal-close')) {
                this.closeMapModal();
            }
            if (e.target.id === 'listView') {
                this.switchToListView();
            }
            if (e.target.id === 'mapView') {
                this.switchToMapView();
            }
        });
    }

    toggleAdvancedSearch() {
        const panel = document.getElementById('advancedSearchPanel');
        panel.classList.toggle('show');
    }

    useCurrentLocation() {
        if (this.userLocation) {
            // Reverse geocode to get address
            this.reverseGeocode(this.userLocation.lat, this.userLocation.lng);
        } else {
            this.getCurrentLocation();
            alert('Please allow location access to use this feature');
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const address = data.results[0].formatted_address;
                document.getElementById('locationInput').value = address;
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
    }

    async applyAdvancedFilters() {
        const filters = this.collectFilterData();

        try {
            const response = await fetch(`${this.apiBase}/services/advanced-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });

            const results = await response.json();
            this.displaySearchResults(results.services, filters);
            this.updateActiveFilterTags(filters);

        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please try again.');
        }
    }

    collectFilterData() {
        const filters = {};

        // Basic search query
        const hospitalInput = document.getElementById('hospitalInput');
        const serviceInput = document.getElementById('serviceInput');

        if (hospitalInput && hospitalInput.value) filters.location = hospitalInput.value;
        if (serviceInput && serviceInput.value) filters.query = serviceInput.value;

        // Location and distance
        const locationInput = document.getElementById('locationInput');
        if (locationInput && locationInput.value) filters.location = locationInput.value;

        const radiusSlider = document.getElementById('radiusSlider');
        if (radiusSlider) filters.distance_km = parseInt(radiusSlider.value);

        // Price range
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        if (minPrice && minPrice.value) filters.price_min = parseFloat(minPrice.value);
        if (maxPrice && maxPrice.value) filters.price_max = parseFloat(maxPrice.value);

        // Rating
        const activeRating = document.querySelector('.rating-btn.active');
        if (activeRating && activeRating.dataset.rating !== '0') {
            filters.rating_min = parseFloat(activeRating.dataset.rating);
        }

        // Availability
        const availability = document.getElementById('availabilityFilter');
        if (availability && availability.value) filters.availability = availability.value;

        return filters;
    }

    displaySearchResults(services, filters) {
        this.currentResults = services;

        // Create results display
        const resultsContainer = document.getElementById('servicesList');
        resultsContainer.innerHTML = '';

        if (services.length === 0) {
            resultsContainer.innerHTML = '<p>No services found matching your criteria.</p>';
            return;
        }

        services.forEach(service => {
            const card = this.createServiceResultCard(service);
            resultsContainer.appendChild(card);
        });

        // Show map modal
        this.showMapModal();
    }

    createServiceResultCard(service) {
        const card = document.createElement('div');
        card.className = 'service-result-card';

        card.innerHTML = `
            <img src="${service.images?.[0] || 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=150&h=100&fit=crop'}"
                 alt="${service.title}" class="service-result-image">
            <div class="service-result-content">
                <h3 class="service-result-title">${service.title}</h3>
                <div class="service-result-meta">
                    <span>📍 ${service.location}</span>
                    <span>⭐ ${service.rating}</span>
                    ${service.distance_km ? `<span class="distance-badge">${service.distance_km}km away</span>` : ''}
                </div>
                <p>${service.description}</p>
                <div class="service-result-price">£${service.price.toFixed(2)}</div>
            </div>
            <div class="service-result-actions">
                <button class="filter-btn primary" onclick="window.bookService(${JSON.stringify(service).replace(/"/g, '&quot;')})">
                    Book Now
                </button>
            </div>
        `;

        return card;
    }

    updateActiveFilterTags(filters) {
        const tagsContainer = document.getElementById('activeFilterTags');
        tagsContainer.innerHTML = '';

        const tags = [];

        if (filters.location) tags.push(`📍 ${filters.location}`);
        if (filters.distance_km) tags.push(`📏 ${filters.distance_km}km`);
        if (filters.price_min || filters.price_max) {
            const priceRange = `£${filters.price_min || 0} - £${filters.price_max || '∞'}`;
            tags.push(`💰 ${priceRange}`);
        }
        if (filters.rating_min) tags.push(`⭐ ${filters.rating_min}+`);
        if (filters.availability) tags.push(`📅 ${filters.availability}`);

        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'filter-tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }

    clearAllFilters() {
        // Reset all form inputs
        document.querySelectorAll('#advancedSearchPanel input, #advancedSearchPanel select').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'range') {
                input.value = input.defaultValue || 10;
                if (input.id === 'radiusSlider') {
                    document.getElementById('radiusValue').textContent = '10 km';
                }
            } else {
                input.value = '';
            }
        });

        // Reset rating buttons
        document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.rating-btn[data-rating="0"]').classList.add('active');

        // Clear active filters
        document.getElementById('activeFilterTags').innerHTML = '';
    }

    showMapModal() {
        document.getElementById('mapModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeMapModal() {
        document.getElementById('mapModal').classList.remove('show');
        document.body.style.overflow = '';
    }

    switchToListView() {
        document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
        document.getElementById('listView').classList.add('active');
        document.getElementById('servicesList').classList.add('active');
        document.getElementById('googleMap').classList.remove('active');
    }

    switchToMapView() {
        document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
        document.getElementById('mapView').classList.add('active');
        document.getElementById('servicesList').classList.remove('active');
        document.getElementById('googleMap').classList.add('active');

        // Initialize or update map
        if (!this.map) {
            this.initializeMap();
        }
        this.updateMapMarkers();
    }

    initializeMap() {
        if (!window.google) return;

        const defaultCenter = this.userLocation || { lat: 51.5074, lng: -0.1278 }; // London

        this.map = new google.maps.Map(document.getElementById('googleMap'), {
            zoom: 10,
            center: defaultCenter,
            styles: [
                // Custom map styling for better appearance
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [{ "visibility": "off" }]
                }
            ]
        });
    }

    initializeAutocomplete() {
        if (!window.google) return;

        const locationInput = document.getElementById('locationInput');
        if (locationInput) {
            const autocomplete = new google.maps.places.Autocomplete(locationInput);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                console.log('Selected place:', place);
            });
        }
    }

    updateMapMarkers() {
        if (!this.map || !this.currentResults) return;

        // Clear existing markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];

        // Add markers for current results
        this.currentResults.forEach(service => {
            if (service.coordinates) {
                const marker = new google.maps.Marker({
                    position: service.coordinates,
                    map: this.map,
                    title: service.title,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="max-width: 200px;">
                            <h4>${service.title}</h4>
                            <p><strong>£${service.price.toFixed(2)}</strong></p>
                            <p>⭐ ${service.rating} | 📍 ${service.location}</p>
                            <button onclick="window.bookService(${JSON.stringify(service).replace(/"/g, '&quot;')})"
                                    style="background: #003580; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                Book Now
                            </button>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(this.map, marker);
                });

                this.markers.push(marker);
            }
        });

        // Fit map bounds to show all markers
        if (this.markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            this.markers.forEach(marker => bounds.extend(marker.getPosition()));
            this.map.fitBounds(bounds);
        }
    }
}

// Initialize advanced search manager
window.searchManager = new AdvancedSearchManager();