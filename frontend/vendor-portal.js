// Vendor Portal JavaScript
class VendorPortal {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.vendorId = 'vendor_001'; // Demo vendor ID
        this.currentSection = 'dashboard';
        this.leads = [];
        this.services = [];
        this.commissions = [];

        // Initialize WhatsApp Service
        this.whatsappService = new WhatsAppService();
        this.whatsappConfig = new WhatsAppConfig();

        this.init();
    }

    async init() {
        // Initialize portal
        await this.loadVendorData();
        await this.initializeWhatsApp();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.renderDashboard();

        console.log('Vendor Portal initialized');
    }

    async initializeWhatsApp() {
        try {
            // Get configuration
            const config = this.whatsappConfig.getConfig();

            // Initialize WhatsApp service with credentials
            await this.whatsappService.initialize(
                config.phoneNumberId,
                config.accessToken
            );

            console.log('Vendor Portal WhatsApp integration initialized');
        } catch (error) {
            console.error('Error initializing WhatsApp service for vendor portal:', error);
        }
    }

    // Data Loading
    async loadVendorData() {
        try {
            // Load vendor dashboard data
            this.leads = await this.getLeads();
            this.services = await this.getServices();
            this.commissions = await this.getCommissions();
        } catch (error) {
            console.error('Error loading vendor data:', error);
            // Use mock data for demo
            this.loadMockData();
        }
    }

    loadMockData() {
        this.leads = [
            {
                id: 'lead_1',
                customerName: 'Dr. Sarah Johnson',
                customerType: 'Doctor',
                serviceRequested: 'Temporary Accommodation',
                budgetRange: '£1,200-£1,500',
                location: 'Near St Thomas\' Hospital',
                urgency: 'urgent',
                status: 'new',
                matchScore: 92,
                distance: 2.3,
                responseDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
                contactDetails: {
                    email: 'sarah.johnson@nhs.uk',
                    phone: '+447700123456',
                    whatsapp: '+447700123456'
                },
                requirements: {
                    duration: '3-6 months',
                    startDate: '20 January 2025',
                    specialRequirements: 'Pet-friendly, parking space required'
                }
            },
            {
                id: 'lead_2',
                customerName: 'Nurse Emma Wilson',
                customerType: 'Nurse',
                serviceRequested: 'Housing',
                budgetRange: '£1,000-£1,300',
                location: 'Near Guy\'s Hospital',
                urgency: 'high',
                status: 'new',
                matchScore: 87,
                distance: 1.8,
                contactDetails: {
                    email: 'emma.wilson@nhs.uk',
                    phone: '+447700654321',
                    whatsapp: '+447700654321'
                }
            }
        ];

        this.services = [
            {
                id: 'service_1',
                name: 'Temporary Accommodation',
                description: 'Fully furnished apartments near major London hospitals',
                priceRange: '£1,200 - £1,500/month',
                commissionRate: 0.15,
                active: true,
                totalBookings: 156,
                rating: 4.8,
                views: 342,
                leads: 28
            },
            {
                id: 'service_2',
                name: 'Long-term Housing',
                description: 'Permanent rental properties for NHS staff',
                priceRange: '£1,000 - £1,800/month',
                commissionRate: 0.12,
                active: true,
                totalBookings: 89,
                rating: 4.6,
                views: 256,
                leads: 15
            },
            {
                id: 'service_3',
                name: 'House Shares',
                description: 'Shared accommodation with other healthcare professionals',
                priceRange: '£600 - £900/month',
                commissionRate: 0.10,
                active: false,
                totalBookings: 45,
                rating: 4.4,
                views: 178,
                leads: 8
            }
        ];

        this.commissions = [
            {
                id: 'comm_1',
                bookingId: 'BOOK_20250115_001',
                customerName: 'Dr. Sarah Johnson',
                serviceName: 'Temporary Accommodation',
                serviceAmount: 1200,
                commissionAmount: 180,
                commissionRate: 0.15,
                status: 'confirmed',
                date: '2025-01-15'
            }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Lead pipeline drag and drop (simplified)
        this.setupPipelineDragDrop();

        // Real-time notifications
        this.setupNotificationHandlers();
    }

    setupPipelineDragDrop() {
        // Simplified drag and drop for pipeline cards
        document.querySelectorAll('.pipeline-card').forEach(card => {
            card.draggable = true;

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.leadId);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        document.querySelectorAll('.pipeline-column').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData('text/plain');
                const newStatus = this.getStatusFromColumn(column);
                this.updateLeadStatus(leadId, newStatus);
                column.classList.remove('drag-over');
            });
        });
    }

    setupNotificationHandlers() {
        // Check for new leads every 30 seconds
        setInterval(() => {
            this.checkForNewLeads();
        }, 30000);
    }

    // Navigation
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'leads':
                this.renderLeadPipeline();
                break;
            case 'services':
                this.renderServices();
                break;
            case 'commissions':
                this.renderCommissions();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    // Dashboard Rendering
    renderDashboard() {
        this.updateMetrics();
        this.renderRecentLeads();
        this.renderConversionChart();
    }

    updateMetrics() {
        const newLeadsToday = this.leads.filter(lead =>
            new Date(lead.createdAt || Date.now()).toDateString() === new Date().toDateString()
        ).length;

        const activeBookings = this.leads.filter(lead =>
            ['contacted', 'quoted'].includes(lead.status)
        ).length;

        const thisMonthEarnings = this.commissions
            .filter(comm => new Date(comm.date).getMonth() === new Date().getMonth())
            .reduce((sum, comm) => sum + comm.commissionAmount, 0);

        const conversionRate = this.calculateConversionRate();

        // Update stat cards
        const statNumbers = document.querySelectorAll('.stat-card .stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = newLeadsToday;
            statNumbers[1].textContent = activeBookings;
            statNumbers[2].textContent = `£${thisMonthEarnings.toLocaleString()}`;
            statNumbers[3].textContent = `${conversionRate}%`;
        }
    }

    renderRecentLeads() {
        const recentLeads = this.leads.slice(0, 5);
        const container = document.getElementById('recentLeads');

        if (container) {
            container.innerHTML = recentLeads.map(lead => this.createLeadListItem(lead)).join('');
        }
    }

    createLeadListItem(lead) {
        const timeAgo = this.getTimeAgo(lead.createdAt || Date.now());
        const urgencyClass = lead.urgency.toLowerCase();

        return `
            <div class="lead-item ${urgencyClass}">
                <div class="lead-avatar">
                    <i class="fas fa-${lead.customerType === 'Doctor' ? 'user-md' : 'user-nurse'}"></i>
                </div>
                <div class="lead-info">
                    <h4>${lead.customerName}</h4>
                    <p>${lead.serviceRequested} - ${lead.location}</p>
                    <div class="lead-meta">
                        <span class="urgency ${urgencyClass}">${lead.urgency}</span>
                        <span class="time">${timeAgo}</span>
                    </div>
                </div>
                <div class="lead-actions">
                    <button class="btn-whatsapp-sm" onclick="vendor.contactViaWhatsApp('${lead.id}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Lead Management
    async contactViaWhatsApp(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        try {
            // Send professional message via WhatsApp Business API
            const message = this.generateWhatsAppMessage(lead);

            await this.whatsappService.sendMessage(
                lead.contactDetails.whatsapp,
                message
            );

            // Also open WhatsApp web/app for immediate conversation
            const whatsappUrl = `https://wa.me/${lead.contactDetails.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // Update lead status to contacted
            await this.updateLeadStatus(leadId, 'contacted');

            this.showSuccess('WhatsApp message sent successfully!');
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            // Fallback to direct WhatsApp link
            const message = this.generateWhatsAppMessage(lead);
            const whatsappUrl = `https://wa.me/${lead.contactDetails.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            await this.updateLeadStatus(leadId, 'contacted');
        }
    }

    generateWhatsAppMessage(lead) {
        return `Hi ${lead.customerName}! I'm reaching out from NHS Service Hub regarding your ${lead.serviceRequested} requirements. I have some great options that match your needs near ${lead.location}. When would be a good time to discuss your requirements in detail?`;
    }

    async sendNewLeadNotification(leadData) {
        try {
            // Send WhatsApp notification to vendor about new lead
            await this.whatsappService.sendVendorNotification(
                '+447700123456', // Vendor's WhatsApp number - should come from vendor profile
                {
                    name: leadData.customerName,
                    hospital: leadData.location,
                    serviceType: leadData.serviceRequested,
                    score: leadData.matchScore,
                    preferredDate: leadData.preferredDate || 'ASAP',
                    budget: leadData.budgetRange,
                    id: leadData.id,
                    priority: leadData.urgency
                }
            );

            console.log('Lead notification sent via WhatsApp');
        } catch (error) {
            console.error('Error sending lead notification:', error);
        }
    }

    async acceptLeadViaWhatsApp(leadId) {
        try {
            const lead = this.leads.find(l => l.id === leadId);
            if (!lead) return;

            // Update lead status to accepted
            await this.updateLeadStatus(leadId, 'contacted');

            // Send confirmation message to customer
            await this.whatsappService.sendMessage(
                lead.contactDetails.whatsapp,
                `Great news! Your ${lead.serviceRequested} request has been accepted by a qualified provider through NHS Service Hub. We'll be in touch shortly to arrange the details. Thank you for choosing NHS Service Hub! 🏥`
            );

            // Send confirmation to vendor
            await this.whatsappService.sendMessage(
                '+447700123456', // Vendor's number
                `✅ Lead ${leadId} accepted successfully!\n\nCustomer: ${lead.customerName}\nService: ${lead.serviceRequested}\nBudget: ${lead.budgetRange}\n\nCustomer's WhatsApp: ${lead.contactDetails.whatsapp}\n\nPlease contact them within 2 hours to discuss requirements.`
            );

            this.showSuccess('Lead accepted! Customer has been notified via WhatsApp.');
        } catch (error) {
            console.error('Error accepting lead via WhatsApp:', error);
            this.showError('Error processing lead acceptance. Please try again.');
        }
    }

    async updateLeadStatus(leadId, newStatus) {
        try {
            // Update lead status in backend
            const response = await fetch(`${this.apiBaseUrl}/vendor/leads/${leadId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local data
                const lead = this.leads.find(l => l.id === leadId);
                if (lead) {
                    lead.status = newStatus;
                }

                // Refresh current view
                this.loadSectionData(this.currentSection);

                this.showNotification('Lead status updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating lead status:', error);
            this.showNotification('Failed to update lead status', 'error');
        }
    }

    viewLeadDetails(leadId) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        this.populateLeadDetailsModal(lead);
        document.getElementById('leadDetailsModal').style.display = 'block';
    }

    populateLeadDetailsModal(lead) {
        const modal = document.getElementById('leadDetailsModal');

        // Update lead info
        modal.querySelector('h3').textContent = lead.customerName;
        modal.querySelector('.profile-info p').textContent = `${lead.customerType}, ${lead.serviceRequested}`;

        // Update contact details
        const contactInfo = modal.querySelector('.contact-info');
        contactInfo.innerHTML = `
            <span><i class="fas fa-envelope"></i> ${lead.contactDetails.email}</span>
            <span><i class="fas fa-phone"></i> ${lead.contactDetails.phone}</span>
            <span><i class="fab fa-whatsapp"></i> ${lead.contactDetails.whatsapp}</span>
        `;

        // Update requirements if available
        if (lead.requirements) {
            const requirementsGrid = modal.querySelector('.requirements-grid');
            requirementsGrid.innerHTML = `
                <div class="requirement-item">
                    <label>Service Type:</label>
                    <span>${lead.serviceRequested}</span>
                </div>
                <div class="requirement-item">
                    <label>Budget Range:</label>
                    <span>${lead.budgetRange}</span>
                </div>
                <div class="requirement-item">
                    <label>Location:</label>
                    <span>${lead.location}</span>
                </div>
                <div class="requirement-item">
                    <label>Duration:</label>
                    <span>${lead.requirements.duration || 'Not specified'}</span>
                </div>
                <div class="requirement-item">
                    <label>Start Date:</label>
                    <span>${lead.requirements.startDate || 'Flexible'}</span>
                </div>
                <div class="requirement-item">
                    <label>Special Requirements:</label>
                    <span>${lead.requirements.specialRequirements || 'None'}</span>
                </div>
            `;
        }

        // Update matching score
        modal.querySelector('.lead-matching h4').textContent = `Lead Matching Score: ${lead.matchScore}/100`;
    }

    // Availability Management
    async toggleAvailability() {
        const button = document.querySelector('.quick-actions .btn-primary');
        const isAvailable = button.innerHTML.includes('Available');

        try {
            const response = await fetch(`${this.apiBaseUrl}/vendor/${this.vendorId}/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ available: !isAvailable })
            });

            if (response.ok) {
                // Update button state
                if (isAvailable) {
                    button.innerHTML = '<i class="fas fa-toggle-off"></i> Unavailable';
                    button.classList.add('inactive');
                } else {
                    button.innerHTML = '<i class="fas fa-toggle-on"></i> Available';
                    button.classList.remove('inactive');
                }

                this.showNotification(`Status changed to ${!isAvailable ? 'Available' : 'Unavailable'}`, 'success');
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            this.showNotification('Failed to update availability', 'error');
        }
    }

    // WhatsApp Business Integration
    openWhatsAppBusiness() {
        // Open WhatsApp Business with vendor's number
        const vendorWhatsApp = '+447700123456'; // Demo number
        const whatsappBusinessUrl = `https://wa.me/${vendorWhatsApp.replace(/\D/g, '')}`;
        window.open(whatsappBusinessUrl, '_blank');
    }

    // Commission Management
    renderCommissions() {
        const tableBody = document.querySelector('.commission-table tbody');

        tableBody.innerHTML = this.commissions.map(commission => `
            <tr>
                <td>${commission.bookingId}</td>
                <td>${commission.customerName}</td>
                <td>${commission.serviceName}</td>
                <td>£${commission.serviceAmount.toLocaleString()}</td>
                <td>£${commission.commissionAmount}</td>
                <td><span class="status ${commission.status}">${commission.status}</span></td>
                <td>${new Date(commission.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn-sm" onclick="vendor.viewCommissionDetails('${commission.id}')">Details</button>
                </td>
            </tr>
        `).join('');
    }

    markAsCompleted(commissionId) {
        const commission = this.commissions.find(c => c.id === commissionId);
        if (commission) {
            commission.status = 'completed';
            this.renderCommissions();
            this.showNotification('Commission marked as completed', 'success');
        }
    }

    // Real-time Updates
    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.updateNotificationBadges();
        }, 10000);
    }

    async checkForNewLeads() {
        // In a real implementation, this would check the API for new leads
        const newLeadsCount = Math.floor(Math.random() * 3); // Simulate 0-2 new leads

        if (newLeadsCount > 0) {
            this.showNotification(`${newLeadsCount} new lead${newLeadsCount > 1 ? 's' : ''} received!`, 'info');
            this.updateNotificationBadges();
        }
    }

    updateNotificationBadges() {
        const newLeadsCount = this.leads.filter(lead => lead.status === 'new').length;
        const badge = document.querySelector('.nav-item[data-section="leads"] .notification-badge');
        if (badge) {
            badge.textContent = newLeadsCount;
            badge.style.display = newLeadsCount > 0 ? 'block' : 'none';
        }
    }

    // Chart Rendering
    renderConversionChart() {
        const canvas = document.getElementById('conversionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Simple chart implementation (in production, use Chart.js or similar)
        this.drawSimpleChart(ctx, canvas.width, canvas.height);
    }

    drawSimpleChart(ctx, width, height) {
        // Mock data for the last 7 days
        const data = [65, 72, 68, 78, 74, 82, 76];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        ctx.clearRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;

        // Y axis
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, height - 40);
        ctx.stroke();

        // X axis
        ctx.beginPath();
        ctx.moveTo(40, height - 40);
        ctx.lineTo(width - 20, height - 40);
        ctx.stroke();

        // Draw data line
        ctx.strokeStyle = '#003087';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const stepX = (width - 60) / (data.length - 1);
        const maxY = Math.max(...data);

        data.forEach((value, index) => {
            const x = 40 + index * stepX;
            const y = height - 40 - (value / maxY) * (height - 80);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#003087';
        data.forEach((value, index) => {
            const x = 40 + index * stepX;
            const y = height - 40 - (value / maxY) * (height - 80);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Utility Functions
    calculateConversionRate() {
        const totalLeads = this.leads.length;
        const convertedLeads = this.leads.filter(lead => lead.status === 'won').length;
        return totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 60) {
            return `${minutes} mins ago`;
        } else if (minutes < 1440) {
            return `${Math.floor(minutes / 60)} hours ago`;
        } else {
            return `${Math.floor(minutes / 1440)} days ago`;
        }
    }

    getStatusFromColumn(column) {
        const columnHeader = column.querySelector('.column-header h3').textContent.toLowerCase();
        const statusMap = {
            'new leads': 'new',
            'contacted': 'contacted',
            'quoted': 'quoted',
            'won': 'won'
        };
        return statusMap[columnHeader] || 'new';
    }

    getAuthToken() {
        return localStorage.getItem('vendor_auth_token') || 'demo_token';
    }

    // UI Helpers
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Service Management
    addService() {
        this.showNotification('Add service functionality would be implemented here', 'info');
    }

    editService(serviceId) {
        this.showNotification(`Edit service ${serviceId} functionality would be implemented here`, 'info');
    }

    activateService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            service.status = 'active';
            this.showNotification('Service activated successfully', 'success');
        }
    }

    // Additional Lead Actions
    sendQuote(leadId) {
        this.showNotification(`Quote sending functionality for lead ${leadId} would be implemented here`, 'info');
    }

    scheduleFollowUp(leadId) {
        this.showNotification(`Follow-up scheduling for lead ${leadId} would be implemented here`, 'info');
    }

    requestReview(leadId) {
        this.showNotification(`Review request for lead ${leadId} sent successfully`, 'success');
    }

    // Render Lead Pipeline
    renderLeadPipeline() {
        const tableBody = document.getElementById('leadsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.leads.map(lead => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            ${lead.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <div style="font-weight: 600;">${lead.customerName}</div>
                            <div style="font-size: 12px; color: #6c757d;">${lead.customerType}</div>
                        </div>
                    </div>
                </td>
                <td>${lead.serviceRequested}</td>
                <td>${lead.location}</td>
                <td>
                    <span class="priority-badge ${lead.urgency}">${lead.urgency.toUpperCase()}</span>
                </td>
                <td>${this.getTimeAgo(lead.createdAt || Date.now())}</td>
                <td>
                    <button class="action-btn-small" onclick="vendor.viewLead('${lead.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn-small" onclick="vendor.contactLead('${lead.id}')">
                        <i class="fas fa-comment"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Render Services
    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        servicesGrid.innerHTML = this.services.map(service => `
            <div class="service-card">
                <div class="service-header">
                    <h3>${service.name}</h3>
                    <span class="service-status ${service.active ? 'active' : 'inactive'}">
                        ${service.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="service-stats">
                    <div class="stat-item">
                        <i class="fas fa-eye"></i>
                        <span>${service.views || 0} views</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <span>${service.leads || 0} leads</span>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn-secondary" onclick="vendor.editService('${service.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="vendor.toggleService('${service.id}')">
                        <i class="fas fa-toggle-${service.active ? 'on' : 'off'}"></i>
                        ${service.active ? 'Disable' : 'Enable'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    editService(serviceId) {
        this.showNotification('Service editing coming soon!', 'info');
    }

    toggleService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            service.active = !service.active;
            this.renderServices();
            this.showNotification(`Service ${service.active ? 'enabled' : 'disabled'} successfully`, 'success');
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('vendor_auth_token');
        window.location.href = '/login';
    }
}

// Initialize vendor portal
const vendor = new VendorPortal();

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};