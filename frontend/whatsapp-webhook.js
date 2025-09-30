class WhatsAppWebhookHandler {
    constructor() {
        this.whatsappService = new WhatsAppService();
        this.whatsappConfig = new WhatsAppConfig();
        this.isListening = false;
    }

    async initialize() {
        // Initialize WhatsApp service
        const config = this.whatsappConfig.getConfig();
        await this.whatsappService.initialize(config.phoneNumberId, config.accessToken);

        // Start listening for webhook events
        this.startListening();
    }

    startListening() {
        if (this.isListening) return;

        this.isListening = true;

        // In a real implementation, this would be handled by the backend
        // This is a simulation for frontend testing
        console.log('WhatsApp webhook handler listening for incoming messages...');

        // Simulate periodic message checking
        this.simulateIncomingMessages();
    }

    stopListening() {
        this.isListening = false;
        console.log('WhatsApp webhook handler stopped');
    }

    // Simulate incoming messages for demo purposes
    simulateIncomingMessages() {
        const simulatedMessages = [
            {
                from: '447700123456',
                text: { body: 'ACCEPT lead_1' },
                timestamp: Date.now(),
                type: 'text'
            },
            {
                from: '447700654321',
                text: { body: 'INFO lead_2' },
                timestamp: Date.now() + 30000,
                type: 'text'
            },
            {
                from: '447700789012',
                text: { body: 'STATUS' },
                timestamp: Date.now() + 60000,
                type: 'text'
            },
            {
                from: '447700111222',
                text: { body: 'HELP' },
                timestamp: Date.now() + 90000,
                type: 'text'
            }
        ];

        // Process simulated messages with delays
        simulatedMessages.forEach((message, index) => {
            setTimeout(() => {
                if (this.isListening) {
                    this.processIncomingMessage(message);
                }
            }, index * 30000); // 30 second intervals
        });
    }

    async processIncomingMessage(messageData) {
        try {
            console.log('Processing incoming WhatsApp message:', messageData);

            const { from, text, type, timestamp } = messageData;

            if (type === 'text' && text?.body) {
                // Categorize the message
                const category = this.whatsappConfig.categorizeMessage(text.body);

                // Process based on category
                switch (category) {
                    case 'leadAcceptance':
                        await this.handleLeadAcceptance(from, text.body);
                        break;

                    case 'infoRequest':
                        await this.handleInfoRequest(from, text.body);
                        break;

                    case 'statusCheck':
                        await this.handleStatusCheck(from);
                        break;

                    case 'helpRequest':
                        await this.handleHelpRequest(from);
                        break;

                    case 'booking':
                        await this.handleBookingInquiry(from, text.body);
                        break;

                    case 'emergency':
                        await this.handleEmergencyMessage(from, text.body);
                        break;

                    default:
                        await this.handleGeneralMessage(from, text.body);
                        break;
                }

                // Update UI if we're on the vendor portal
                this.updateVendorPortalUI(category, from, text.body);

                // Log interaction
                await this.logInteraction(from, text.body, category);
            }
        } catch (error) {
            console.error('Error processing incoming message:', error);

            // Send error response
            await this.whatsappService.sendMessage(
                messageData.from,
                "Sorry, we're experiencing technical difficulties. Please try again later or contact support at support@nhsservicehub.com"
            );
        }
    }

    async handleLeadAcceptance(vendorPhone, message) {
        // Extract lead ID from message
        const leadIdMatch = message.match(/lead.*?(\w+)/i);

        if (!leadIdMatch) {
            return this.whatsappService.sendMessage(
                vendorPhone,
                'Please include the Lead ID to accept. Reply: "ACCEPT [Lead ID]"'
            );
        }

        const leadId = leadIdMatch[1];

        try {
            // Simulate lead acceptance in backend
            const leadData = await this.mockAcceptLead(leadId, vendorPhone);

            if (leadData) {
                // Send confirmation to vendor
                await this.whatsappService.sendMessage(
                    vendorPhone,
                    `✅ Lead ${leadId} accepted!\n\nCustomer: ${leadData.customerName}\nService: ${leadData.serviceType}\nBudget: ${leadData.budget}\n\nCustomer contact: ${leadData.customerPhone}\n\nPlease contact them within 2 hours.`
                );

                // Send notification to customer
                await this.whatsappService.sendMessage(
                    leadData.customerPhone,
                    `Great news! Your ${leadData.serviceType} request has been accepted by a qualified provider. They will contact you shortly. Reference: ${leadId}`
                );

                // Update vendor portal if open
                this.notifyVendorPortal('leadAccepted', { leadId, leadData });
            } else {
                await this.whatsappService.sendMessage(
                    vendorPhone,
                    `Lead ${leadId} is no longer available or already accepted.`
                );
            }
        } catch (error) {
            console.error('Error accepting lead:', error);
            await this.whatsappService.sendMessage(
                vendorPhone,
                'Error processing your request. Please try again later.'
            );
        }
    }

    async handleInfoRequest(vendorPhone, message) {
        const leadIdMatch = message.match(/lead.*?(\w+)/i);

        if (!leadIdMatch) {
            return this.whatsappService.sendMessage(
                vendorPhone,
                'Please specify Lead ID. Reply: "INFO [Lead ID]"'
            );
        }

        const leadId = leadIdMatch[1];

        try {
            const leadData = await this.mockGetLeadInfo(leadId);

            if (leadData) {
                const infoMessage = `📋 Lead ${leadId} Details\n\n👤 ${leadData.customerName}\n🏥 ${leadData.hospital}\n📧 ${leadData.email}\n🏠 ${leadData.serviceType}\n💰 ${leadData.budget}\n📅 ${leadData.preferredDate}\n📍 ${leadData.location}\n⭐ Score: ${leadData.score}/100\n\nReply "ACCEPT ${leadId}" to claim`;

                await this.whatsappService.sendMessage(vendorPhone, infoMessage);
            } else {
                await this.whatsappService.sendMessage(
                    vendorPhone,
                    `Lead ${leadId} not found or no longer available.`
                );
            }
        } catch (error) {
            console.error('Error getting lead info:', error);
            await this.whatsappService.sendMessage(
                vendorPhone,
                'Error retrieving lead information.'
            );
        }
    }

    async handleStatusCheck(phone) {
        try {
            const status = await this.mockGetUserStatus(phone);

            let statusMessage = '📊 Your Status Update\n\n';

            if (status.role === 'vendor') {
                statusMessage += `🔄 Active Leads: ${status.activeLeads}\n`;
                statusMessage += `✅ Completed Jobs: ${status.completedJobs}\n`;
                statusMessage += `💰 This Month: £${status.earnings}\n`;
                statusMessage += `⭐ Rating: ${status.rating}/5\n`;
            } else {
                statusMessage += `📋 Active Bookings: ${status.activeBookings}\n`;
                statusMessage += `⏳ Pending Requests: ${status.pendingRequests}\n`;
                statusMessage += `✅ Completed Services: ${status.completedServices}\n`;
            }

            await this.whatsappService.sendMessage(phone, statusMessage);
        } catch (error) {
            console.error('Error checking status:', error);
            await this.whatsappService.sendMessage(
                phone,
                'Error retrieving status. Please ensure your number is registered.'
            );
        }
    }

    async handleHelpRequest(phone) {
        const helpMessage = `🤖 NHS Service Hub Help\n\nQuick Commands:\n📱 ACCEPT [ID] - Accept lead\n📋 INFO [ID] - Lead details\n📊 STATUS - Check status\n🆘 HELP - This message\n\nSupport:\n🌐 nhsservicehub.com\n📧 support@nhsservicehub.com\n📞 0800 NHS HELP\n\nReply with any question! 👋`;

        await this.whatsappService.sendMessage(phone, helpMessage);
    }

    async handleBookingInquiry(phone, message) {
        const inquiryResponse = `Thank you for your booking inquiry! 📋\n\nTo make a booking:\n1. Visit nhsservicehub.com\n2. Search for services\n3. Select your preferred provider\n4. Complete booking form\n\nOr reply with your specific requirements and we'll help you find the right service! 🏥`;

        await this.whatsappService.sendMessage(phone, inquiryResponse);
    }

    async handleEmergencyMessage(phone, message) {
        const emergencyResponse = `🚨 For medical emergencies:\n\n📞 Emergency: 999\n📞 NHS 111: 111\n\nFor urgent non-medical service requests, our team will prioritize your message. Expected response: 30 minutes.\n\nStay safe! 🏥`;

        await this.whatsappService.sendMessage(phone, emergencyResponse);

        // Alert customer service team
        this.alertCustomerService(phone, message, 'emergency');
    }

    async handleGeneralMessage(phone, message) {
        let response;

        if (this.whatsappConfig.isOfficeHours()) {
            response = this.whatsappConfig.getAutoResponse('defaultResponse');
        } else {
            response = this.whatsappConfig.getAutoResponse('outOfOfficeMessage');
        }

        await this.whatsappService.sendMessage(phone, response);

        // Forward to customer service
        this.forwardToCustomerService(phone, message);
    }

    async mockAcceptLead(leadId, vendorPhone) {
        // Simulate backend lead acceptance
        const mockLeads = {
            'lead_1': {
                customerName: 'Dr. Sarah Johnson',
                serviceType: 'Temporary Accommodation',
                budget: '£1,200-£1,500',
                customerPhone: '447700987654'
            },
            'lead_2': {
                customerName: 'Nurse Emma Wilson',
                serviceType: 'Vehicle Rental',
                budget: '£300-£500',
                customerPhone: '447700876543'
            }
        };

        return mockLeads[leadId] || null;
    }

    async mockGetLeadInfo(leadId) {
        // Simulate backend lead info retrieval
        const mockLeads = {
            'lead_1': {
                customerName: 'Dr. Sarah Johnson',
                hospital: 'St Thomas\' Hospital',
                email: 'sarah.johnson@nhs.uk',
                serviceType: 'Temporary Accommodation',
                budget: '£1,200-£1,500',
                preferredDate: '2024-01-15',
                location: 'Near St Thomas\' Hospital',
                score: 92
            },
            'lead_2': {
                customerName: 'Nurse Emma Wilson',
                hospital: 'Guy\'s Hospital',
                email: 'emma.wilson@nhs.uk',
                serviceType: 'Vehicle Rental',
                budget: '£300-£500',
                preferredDate: '2024-01-10',
                location: 'Central London',
                score: 88
            }
        };

        return mockLeads[leadId] || null;
    }

    async mockGetUserStatus(phone) {
        // Simulate user status lookup
        const mockStatuses = {
            '447700123456': {
                role: 'vendor',
                activeLeads: 5,
                completedJobs: 23,
                earnings: 3450,
                rating: 4.8
            },
            '447700654321': {
                role: 'customer',
                activeBookings: 2,
                pendingRequests: 1,
                completedServices: 8
            }
        };

        return mockStatuses[phone] || {
            role: 'customer',
            activeBookings: 0,
            pendingRequests: 0,
            completedServices: 0
        };
    }

    updateVendorPortalUI(category, phone, message) {
        // Update vendor portal UI if it's open
        if (typeof vendor !== 'undefined' && vendor) {
            vendor.handleWhatsAppMessage(category, phone, message);
        }
    }

    notifyVendorPortal(event, data) {
        // Notify vendor portal of events
        if (typeof vendor !== 'undefined' && vendor) {
            vendor.handleWhatsAppEvent(event, data);
        }
    }

    async logInteraction(phone, message, category) {
        try {
            // Log interaction for analytics
            const logData = {
                phone: phone,
                message: message,
                category: category,
                timestamp: new Date().toISOString(),
                platform: 'whatsapp'
            };

            console.log('WhatsApp interaction logged:', logData);

            // In real implementation, send to backend analytics
            // await fetch('/api/analytics/whatsapp', { method: 'POST', body: JSON.stringify(logData) });
        } catch (error) {
            console.error('Error logging interaction:', error);
        }
    }

    alertCustomerService(phone, message, priority) {
        console.log(`🚨 Customer Service Alert [${priority.toUpperCase()}]:`, {
            phone,
            message,
            timestamp: new Date().toISOString()
        });

        // In real implementation, would integrate with customer service system
    }

    forwardToCustomerService(phone, message) {
        console.log('📝 Message forwarded to customer service:', {
            phone,
            message,
            timestamp: new Date().toISOString()
        });

        // In real implementation, would integrate with customer service system
    }
}

// Initialize webhook handler when script loads
let whatsappWebhook;

document.addEventListener('DOMContentLoaded', () => {
    whatsappWebhook = new WhatsAppWebhookHandler();
    whatsappWebhook.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppWebhookHandler;
} else {
    window.WhatsAppWebhookHandler = WhatsAppWebhookHandler;
}