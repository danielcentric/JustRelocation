/**
 * JustRelocation Data Export Utility
 * Handles data export functionality for admin dashboard and user data
 */

class DataExporter {
    constructor() {
        this.apiBase = 'http://localhost:8001';
        this.exportFormats = ['csv', 'json', 'xlsx'];
        this.init();
    }

    init() {
        this.createExportModal();
        this.bindEvents();
    }

    createExportModal() {
        const modal = document.createElement('div');
        modal.id = 'exportModal';
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-modal-content">
                <div class="export-modal-header">
                    <h3>Export Data</h3>
                    <button class="modal-close" onclick="window.dataExporter.closeModal()">&times;</button>
                </div>

                <div class="export-modal-body">
                    <div class="export-section">
                        <h4>Select Data Type</h4>
                        <div class="export-options">
                            <label class="export-option">
                                <input type="radio" name="dataType" value="users" checked>
                                <span class="option-content">
                                    <i class="fas fa-users"></i>
                                    <div>
                                        <strong>Users</strong>
                                        <small>Healthcare workers and providers</small>
                                    </div>
                                </span>
                            </label>

                            <label class="export-option">
                                <input type="radio" name="dataType" value="services">
                                <span class="option-content">
                                    <i class="fas fa-list"></i>
                                    <div>
                                        <strong>Services</strong>
                                        <small>All platform services</small>
                                    </div>
                                </span>
                            </label>

                            <label class="export-option">
                                <input type="radio" name="dataType" value="bookings">
                                <span class="option-content">
                                    <i class="fas fa-calendar"></i>
                                    <div>
                                        <strong>Bookings</strong>
                                        <small>Service bookings and reservations</small>
                                    </div>
                                </span>
                            </label>

                            <label class="export-option">
                                <input type="radio" name="dataType" value="analytics">
                                <span class="option-content">
                                    <i class="fas fa-chart-bar"></i>
                                    <div>
                                        <strong>Analytics</strong>
                                        <small>Platform performance data</small>
                                    </div>
                                </span>
                            </label>

                            <label class="export-option">
                                <input type="radio" name="dataType" value="leads">
                                <span class="option-content">
                                    <i class="fas fa-star"></i>
                                    <div>
                                        <strong>Leads</strong>
                                        <small>Lead scoring and conversion data</small>
                                    </div>
                                </span>
                            </label>

                            <label class="export-option">
                                <input type="radio" name="dataType" value="commissions">
                                <span class="option-content">
                                    <i class="fas fa-pound-sign"></i>
                                    <div>
                                        <strong>Commissions</strong>
                                        <small>Payment and commission tracking</small>
                                    </div>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>Export Format</h4>
                        <div class="format-options">
                            <label class="format-option">
                                <input type="radio" name="format" value="csv" checked>
                                <span>CSV <small>(Excel compatible)</small></span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="format" value="json">
                                <span>JSON <small>(For developers)</small></span>
                            </label>
                            <label class="format-option">
                                <input type="radio" name="format" value="xlsx">
                                <span>XLSX <small>(Excel format)</small></span>
                            </label>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>Date Range</h4>
                        <div class="date-range">
                            <div class="date-input">
                                <label>From Date</label>
                                <input type="date" id="exportFromDate">
                            </div>
                            <div class="date-input">
                                <label>To Date</label>
                                <input type="date" id="exportToDate">
                            </div>
                        </div>
                        <div class="date-presets">
                            <button class="preset-btn" data-preset="today">Today</button>
                            <button class="preset-btn" data-preset="week">This Week</button>
                            <button class="preset-btn" data-preset="month">This Month</button>
                            <button class="preset-btn" data-preset="quarter">This Quarter</button>
                            <button class="preset-btn" data-preset="year">This Year</button>
                            <button class="preset-btn" data-preset="all">All Time</button>
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>Filters</h4>
                        <div id="exportFilters">
                            <!-- Dynamic filters will be added here based on data type -->
                        </div>
                    </div>

                    <div class="export-section">
                        <h4>Advanced Options</h4>
                        <div class="advanced-options">
                            <label class="checkbox-option">
                                <input type="checkbox" id="includePersonalData">
                                <span>Include personal data (admin only)</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="includeArchivedData">
                                <span>Include archived/deleted records</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" id="compressData" checked>
                                <span>Compress large files</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="export-modal-footer">
                    <button class="btn-secondary" onclick="window.dataExporter.closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="window.dataExporter.startExport()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addExportStyles();
    }

    bindEvents() {
        // Data type change handler
        document.addEventListener('change', (e) => {
            if (e.target.name === 'dataType') {
                this.updateFiltersForDataType(e.target.value);
            }
        });

        // Date preset handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-btn')) {
                this.applyDatePreset(e.target.dataset.preset);
            }
        });
    }

    openModal(dataType = 'users') {
        const modal = document.getElementById('exportModal');
        modal.style.display = 'flex';

        // Set default data type
        const radioButton = document.querySelector(`input[name="dataType"][value="${dataType}"]`);
        if (radioButton) {
            radioButton.checked = true;
            this.updateFiltersForDataType(dataType);
        }

        // Set default date to last 30 days
        this.applyDatePreset('month');
    }

    closeModal() {
        const modal = document.getElementById('exportModal');
        modal.style.display = 'none';
    }

    updateFiltersForDataType(dataType) {
        const filtersContainer = document.getElementById('exportFilters');

        const filterConfigs = {
            users: `
                <div class="filter-group">
                    <label>User Type</label>
                    <select id="userTypeFilter">
                        <option value="">All Types</option>
                        <option value="healthcare_worker">Healthcare Workers</option>
                        <option value="provider">Providers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status</label>
                    <select id="userStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>NHS Trust</label>
                    <select id="nhsTrustFilter">
                        <option value="">All Trusts</option>
                        <option value="guy-st-thomas">Guy's and St Thomas'</option>
                        <option value="kings-college">King's College Hospital</option>
                        <option value="imperial-college">Imperial College Healthcare</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            `,
            services: `
                <div class="filter-group">
                    <label>Category</label>
                    <select id="serviceCategoryFilter">
                        <option value="">All Categories</option>
                        <option value="housing">Housing</option>
                        <option value="transport">Transport</option>
                        <option value="banking">Banking</option>
                        <option value="schools">Schools</option>
                        <option value="healthcare">Healthcare</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status</label>
                    <select id="serviceStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Price Range</label>
                    <div class="price-range">
                        <input type="number" placeholder="Min £" id="minPrice">
                        <input type="number" placeholder="Max £" id="maxPrice">
                    </div>
                </div>
            `,
            bookings: `
                <div class="filter-group">
                    <label>Booking Status</label>
                    <select id="bookingStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Service Category</label>
                    <select id="bookingCategoryFilter">
                        <option value="">All Categories</option>
                        <option value="housing">Housing</option>
                        <option value="transport">Transport</option>
                        <option value="banking">Banking</option>
                        <option value="schools">Schools</option>
                    </select>
                </div>
            `,
            analytics: `
                <div class="filter-group">
                    <label>Metrics</label>
                    <select id="analyticsMetricsFilter" multiple>
                        <option value="user_signups">User Signups</option>
                        <option value="service_views">Service Views</option>
                        <option value="bookings">Bookings</option>
                        <option value="revenue">Revenue</option>
                        <option value="conversion_rates">Conversion Rates</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Granularity</label>
                    <select id="analyticsGranularityFilter">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                </div>
            `,
            leads: `
                <div class="filter-group">
                    <label>Lead Status</label>
                    <select id="leadStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Score Range</label>
                    <div class="score-range">
                        <input type="number" placeholder="Min Score" min="0" max="100" id="minScore">
                        <input type="number" placeholder="Max Score" min="0" max="100" id="maxScore">
                    </div>
                </div>
            `,
            commissions: `
                <div class="filter-group">
                    <label>Payment Status</label>
                    <select id="commissionStatusFilter">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                        <option value="disputed">Disputed</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Amount Range</label>
                    <div class="amount-range">
                        <input type="number" placeholder="Min £" id="minAmount">
                        <input type="number" placeholder="Max £" id="maxAmount">
                    </div>
                </div>
            `
        };

        filtersContainer.innerHTML = filterConfigs[dataType] || '';
    }

    applyDatePreset(preset) {
        const fromDate = document.getElementById('exportFromDate');
        const toDate = document.getElementById('exportToDate');
        const today = new Date();

        let from, to;

        switch (preset) {
            case 'today':
                from = to = today;
                break;
            case 'week':
                from = new Date(today);
                from.setDate(today.getDate() - 7);
                to = today;
                break;
            case 'month':
                from = new Date(today);
                from.setDate(today.getDate() - 30);
                to = today;
                break;
            case 'quarter':
                from = new Date(today);
                from.setMonth(today.getMonth() - 3);
                to = today;
                break;
            case 'year':
                from = new Date(today);
                from.setFullYear(today.getFullYear() - 1);
                to = today;
                break;
            case 'all':
                from = null;
                to = null;
                break;
        }

        if (from) {
            fromDate.value = from.toISOString().split('T')[0];
        } else {
            fromDate.value = '';
        }

        if (to) {
            toDate.value = to.toISOString().split('T')[0];
        } else {
            toDate.value = '';
        }
    }

    async startExport() {
        const exportConfig = this.getExportConfig();

        if (!this.validateExportConfig(exportConfig)) {
            return;
        }

        try {
            window.showLoading('Preparing your export...', 'export');

            const response = await fetch(`${this.apiBase}/admin/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                },
                body: JSON.stringify(exportConfig)
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.download_url) {
                // Direct download
                this.downloadFile(result.download_url, result.filename);
                window.showSuccess('Export completed successfully!');
            } else if (result.job_id) {
                // Async processing
                this.pollExportStatus(result.job_id);
            }

        } catch (error) {
            console.error('Export error:', error);
            window.showError('Export failed. Please try again.');
        } finally {
            window.hideLoading('export');
            this.closeModal();
        }
    }

    getExportConfig() {
        const dataType = document.querySelector('input[name="dataType"]:checked')?.value;
        const format = document.querySelector('input[name="format"]:checked')?.value;
        const fromDate = document.getElementById('exportFromDate')?.value;
        const toDate = document.getElementById('exportToDate')?.value;

        const config = {
            data_type: dataType,
            format: format,
            date_range: {
                from: fromDate || null,
                to: toDate || null
            },
            filters: this.getActiveFilters(dataType),
            options: {
                include_personal_data: document.getElementById('includePersonalData')?.checked,
                include_archived_data: document.getElementById('includeArchivedData')?.checked,
                compress_data: document.getElementById('compressData')?.checked
            }
        };

        return config;
    }

    getActiveFilters(dataType) {
        const filters = {};

        // Get filters based on data type
        const filterMappings = {
            users: ['userTypeFilter', 'userStatusFilter', 'nhsTrustFilter'],
            services: ['serviceCategoryFilter', 'serviceStatusFilter', 'minPrice', 'maxPrice'],
            bookings: ['bookingStatusFilter', 'bookingCategoryFilter'],
            analytics: ['analyticsMetricsFilter', 'analyticsGranularityFilter'],
            leads: ['leadStatusFilter', 'minScore', 'maxScore'],
            commissions: ['commissionStatusFilter', 'minAmount', 'maxAmount']
        };

        const filterIds = filterMappings[dataType] || [];

        filterIds.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element && element.value) {
                const filterKey = filterId.replace('Filter', '').replace(/([A-Z])/g, '_$1').toLowerCase();
                filters[filterKey] = element.value;
            }
        });

        return filters;
    }

    validateExportConfig(config) {
        if (!config.data_type) {
            window.showWarning('Please select a data type to export.');
            return false;
        }

        if (!config.format) {
            window.showWarning('Please select an export format.');
            return false;
        }

        // Date range validation
        if (config.date_range.from && config.date_range.to) {
            const fromDate = new Date(config.date_range.from);
            const toDate = new Date(config.date_range.to);

            if (fromDate > toDate) {
                window.showWarning('From date cannot be later than To date.');
                return false;
            }

            const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 365) {
                window.showWarning('Date range cannot exceed 1 year. Please select a smaller range.');
                return false;
            }
        }

        return true;
    }

    async pollExportStatus(jobId) {
        window.showLoading('Processing export... This may take a few minutes.', 'export_poll');

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBase}/admin/export/status/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to check export status');
                }

                const status = await response.json();

                if (status.status === 'completed') {
                    clearInterval(pollInterval);
                    window.hideLoading('export_poll');

                    if (status.download_url) {
                        this.downloadFile(status.download_url, status.filename);
                        window.showSuccess('Export completed! Download started.');
                    }
                } else if (status.status === 'failed') {
                    clearInterval(pollInterval);
                    window.hideLoading('export_poll');
                    window.showError(`Export failed: ${status.error || 'Unknown error'}`);
                }
                // Continue polling for 'processing' status

            } catch (error) {
                clearInterval(pollInterval);
                window.hideLoading('export_poll');
                window.showError('Failed to check export status.');
                console.error('Poll error:', error);
            }
        }, 5000); // Poll every 5 seconds

        // Timeout after 10 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            window.hideLoading('export_poll');
            window.showWarning('Export is taking longer than expected. Check back later or contact support.');
        }, 600000);
    }

    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'export.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Quick export functions for common use cases
    async quickExportUsers() {
        return this.quickExport('users', 'csv');
    }

    async quickExportServices() {
        return this.quickExport('services', 'csv');
    }

    async quickExportBookings() {
        return this.quickExport('bookings', 'csv');
    }

    async quickExport(dataType, format = 'csv') {
        const config = {
            data_type: dataType,
            format: format,
            date_range: { from: null, to: null },
            filters: {},
            options: {
                include_personal_data: false,
                include_archived_data: false,
                compress_data: true
            }
        };

        try {
            window.showLoading(`Exporting ${dataType}...`);

            const response = await fetch(`${this.apiBase}/admin/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.download_url) {
                this.downloadFile(result.download_url, result.filename);
                window.showSuccess(`${dataType} export completed!`);
            }

        } catch (error) {
            console.error('Quick export error:', error);
            window.showError(`Failed to export ${dataType}.`);
        } finally {
            window.hideLoading();
        }
    }

    addExportStyles() {
        if (document.getElementById('exportStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'exportStyles';
        styles.textContent = `
            .export-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }

            .export-modal-content {
                background: var(--white);
                border-radius: var(--border-radius-large);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .export-modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .export-modal-body {
                padding: 24px;
            }

            .export-section {
                margin-bottom: 32px;
            }

            .export-section h4 {
                margin: 0 0 16px 0;
                color: var(--text-primary);
                font-size: 16px;
            }

            .export-options {
                display: grid;
                gap: 12px;
            }

            .export-option {
                display: flex;
                align-items: center;
                padding: 16px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .export-option:hover {
                background: var(--bg-gray);
            }

            .export-option input[type="radio"] {
                margin-right: 16px;
            }

            .option-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .option-content i {
                font-size: 24px;
                color: var(--primary-blue);
                width: 32px;
                text-align: center;
            }

            .format-options {
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
            }

            .format-option {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                min-width: 120px;
            }

            .format-option input[type="radio"] {
                margin-right: 8px;
            }

            .date-range {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 16px;
            }

            .date-input label {
                display: block;
                margin-bottom: 4px;
                font-weight: 500;
                font-size: 14px;
            }

            .date-input input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-small);
            }

            .date-presets {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .preset-btn {
                padding: 6px 12px;
                background: var(--bg-gray);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-small);
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
            }

            .preset-btn:hover {
                background: var(--primary-blue);
                color: var(--white);
                border-color: var(--primary-blue);
            }

            .filter-group {
                margin-bottom: 16px;
            }

            .filter-group label {
                display: block;
                margin-bottom: 4px;
                font-weight: 500;
                font-size: 14px;
            }

            .filter-group select,
            .filter-group input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-small);
                font-size: 14px;
            }

            .price-range,
            .score-range,
            .amount-range {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            .advanced-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .checkbox-option {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .checkbox-option input[type="checkbox"] {
                margin-right: 12px;
            }

            .export-modal-footer {
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            .btn-primary {
                padding: 12px 24px;
                background: var(--primary-blue);
                color: var(--white);
                border: none;
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-secondary {
                padding: 12px 24px;
                background: var(--white);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-medium);
                cursor: pointer;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .export-modal-content {
                    width: 95%;
                    max-height: 95vh;
                }

                .date-range {
                    grid-template-columns: 1fr;
                }

                .format-options {
                    flex-direction: column;
                }

                .export-modal-footer {
                    flex-direction: column;
                }

                .btn-primary,
                .btn-secondary {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Initialize data exporter
window.dataExporter = new DataExporter();

// Export functions for global use
window.exportData = (dataType) => window.dataExporter.openModal(dataType);
window.quickExportUsers = () => window.dataExporter.quickExportUsers();
window.quickExportServices = () => window.dataExporter.quickExportServices();
window.quickExportBookings = () => window.dataExporter.quickExportBookings();