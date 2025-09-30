class WhatsAppService {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.businessApiUrl = 'https://graph.facebook.com/v18.0';
        this.phoneNumberId = null;
        this.accessToken = null;
        this.webhookToken = 'nhs_service_hub_webhook_token_2024';
        this.isInitialized = false;
    }

    async initialize(phoneNumberId, accessToken) {
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
        this.isInitialized = true;

        // Set up webhook listener
        this.setupWebhookListener();

        // Initialize message templates
        this.initializeMessageTemplates();

        console.log('WhatsApp Business API initialized successfully');
    }

    async sendMessage(to, message, type = 'text', templateName = null) {
        if (!this.isInitialized) {
            throw new Error('WhatsApp service not initialized');
        }

        const payload = {
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: type
        };

        if (type === 'template' && templateName) {
            payload.template = {
                name: templateName,
                language: { code: 'en' }
            };
        } else {
            payload.text = { body: message };
        }

        try {
            const response = await fetch(`${this.businessApiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
            }

            // Log message to backend
            await this.logMessage(to, message, 'outbound');

            return result;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            throw error;
        }
    }

    async sendBookingConfirmation(customerPhone, vendorName, serviceType, bookingDetails) {
        const message = `🏥 NHS Service Hub - Booking Confirmation

Hi! Your booking has been confirmed:

📋 Service: ${serviceType}
🏢 Provider: ${vendorName}
📅 Date: ${bookingDetails.date}
⏰ Time: ${bookingDetails.time}
📍 Location: ${bookingDetails.location}
💰 Price: £${bookingDetails.price}

Booking Reference: ${bookingDetails.reference}

Your provider will contact you shortly to confirm details. If you have any questions, reply to this message!

Best regards,
NHS Service Hub Team 🩺`;

        return this.sendMessage(customerPhone, message);
    }

    async sendVendorNotification(vendorPhone, leadDetails) {
        const message = `🚨 New Lead Alert - NHS Service Hub

You have a new lead:

👤 Healthcare Worker: ${leadDetails.name}
🏥 Hospital: ${leadDetails.hospital}
🔍 Service Needed: ${leadDetails.serviceType}
⭐ Lead Score: ${leadDetails.score}/100
📅 Required Date: ${leadDetails.preferredDate}
💰 Budget: £${leadDetails.budget}

📱 Reply "ACCEPT" to claim this lead
📱 Reply "INFO" for more details

Lead ID: ${leadDetails.id}
Priority: ${leadDetails.priority}`;

        return this.sendMessage(vendorPhone, message);
    }

    async sendQuickReply(to, message, quickReplies) {
        const payload = {
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: message },
                action: {
                    buttons: quickReplies.map((reply, index) => ({
                        type: 'reply',
                        reply: {
                            id: `btn_${index}`,
                            title: reply
                        }
                    }))
                }
            }
        };

        try {
            const response = await fetch(`${this.businessApiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Error sending quick reply:', error);
            throw error;
        }
    }

    async handleIncomingMessage(messageData) {
        const { from, text, type } = messageData;

        // Log incoming message
        await this.logMessage(from, text?.body || '', 'inbound');

        // Process message based on content
        if (text?.body) {
            const messageText = text.body.toLowerCase();

            if (messageText.includes('accept')) {
                return this.handleLeadAcceptance(from, messageText);
            } else if (messageText.includes('info')) {
                return this.handleInfoRequest(from, messageText);
            } else if (messageText.includes('status')) {
                return this.handleStatusCheck(from, messageText);
            } else if (messageText.includes('help')) {
                return this.sendHelpMessage(from);
            } else {
                return this.handleGeneralInquiry(from, text.body);
            }
        }
    }

    async handleLeadAcceptance(vendorPhone, message) {
        // Extract lead ID from message
        const leadIdMatch = message.match(/lead.*?(\d+)/i);
        if (!leadIdMatch) {
            return this.sendMessage(vendorPhone, 'Please include the Lead ID to accept a lead. Reply with "ACCEPT [Lead ID]"');
        }

        const leadId = leadIdMatch[1];

        try {
            // Update lead status in backend
            const response = await fetch(`${this.apiBaseUrl}/vendor/leads/${leadId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vendorPhone })
            });

            if (response.ok) {
                const leadData = await response.json();
                return this.sendMessage(vendorPhone,
                    `✅ Lead accepted successfully!\n\nLead ID: ${leadId}\nCustomer: ${leadData.customerName}\nService: ${leadData.serviceType}\n\nCustomer contact details have been sent to your email. Please contact them within 2 hours.`
                );
            } else {
                return this.sendMessage(vendorPhone, 'Sorry, this lead is no longer available or has already been accepted.');
            }
        } catch (error) {
            console.error('Error accepting lead:', error);
            return this.sendMessage(vendorPhone, 'Error processing your request. Please try again later.');
        }
    }

    async handleInfoRequest(vendorPhone, message) {
        const leadIdMatch = message.match(/lead.*?(\d+)/i);
        if (!leadIdMatch) {
            return this.sendMessage(vendorPhone, 'Please specify Lead ID. Reply with "INFO [Lead ID]"');
        }

        const leadId = leadIdMatch[1];

        try {
            const response = await fetch(`${this.apiBaseUrl}/vendor/leads/${leadId}`);
            if (response.ok) {
                const lead = await response.json();
                const infoMessage = `📋 Lead Details - ID: ${leadId}

👤 Name: ${lead.name}
🏥 Hospital: ${lead.hospital}
📧 Email: ${lead.email}
📱 Phone: ${lead.phone}
🏠 Service: ${lead.serviceType}
📅 Preferred Date: ${lead.preferredDate}
💰 Budget: £${lead.budget}
📍 Location: ${lead.location}
📝 Notes: ${lead.notes || 'No additional notes'}
⭐ Lead Score: ${lead.score}/100

📱 Reply "ACCEPT ${leadId}" to claim this lead`;

                return this.sendMessage(vendorPhone, infoMessage);
            } else {
                return this.sendMessage(vendorPhone, 'Lead not found or no longer available.');
            }
        } catch (error) {
            console.error('Error fetching lead info:', error);
            return this.sendMessage(vendorPhone, 'Error retrieving lead information. Please try again later.');
        }
    }

    async handleStatusCheck(phone, message) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/status/phone/${phone.replace(/\D/g, '')}`);
            if (response.ok) {
                const status = await response.json();
                let statusMessage = '📊 Your Status Update:\n\n';

                if (status.activeBookings?.length) {
                    statusMessage += `🔄 Active Bookings: ${status.activeBookings.length}\n`;
                    status.activeBookings.forEach(booking => {
                        statusMessage += `  • ${booking.service} - ${booking.date}\n`;
                    });
                }

                if (status.pendingLeads?.length) {
                    statusMessage += `📋 Pending Leads: ${status.pendingLeads.length}\n`;
                }

                if (status.completedJobs?.length) {
                    statusMessage += `✅ Completed This Month: ${status.completedJobs.length}\n`;
                }

                if (status.earnings) {
                    statusMessage += `💰 This Month's Earnings: £${status.earnings}\n`;
                }

                return this.sendMessage(phone, statusMessage);
            } else {
                return this.sendMessage(phone, 'Unable to retrieve status. Please ensure your phone number is registered.');
            }
        } catch (error) {
            console.error('Error checking status:', error);
            return this.sendMessage(phone, 'Error retrieving status. Please try again later.');
        }
    }

    async sendHelpMessage(phone) {
        const helpMessage = `🤖 NHS Service Hub - WhatsApp Commands

Available commands:
📱 ACCEPT [Lead ID] - Accept a lead
📋 INFO [Lead ID] - Get lead details
📊 STATUS - Check your status
🆘 HELP - Show this help message

For bookings and general inquiries:
🌐 Visit: nhsservicehub.com
📧 Email: support@nhsservicehub.com
📞 Call: 0800 NHS HELP

Quick actions:
• Reply to any message for support
• Forward booking confirmations
• Get real-time lead notifications

Need human assistance? Just reply with your question! 👋`;

        return this.sendMessage(phone, helpMessage);
    }

    async handleGeneralInquiry(phone, message) {
        // Forward to customer service or auto-respond
        const autoResponse = `Thank you for your message! 👋

Our team will review your inquiry and respond within 2 hours during business hours (9 AM - 6 PM).

For immediate assistance:
📱 Call: 0800 NHS HELP
🌐 Visit: nhsservicehub.com
📧 Email: support@nhsservicehub.com

Reply HELP for quick commands.

NHS Service Hub Team 🩺`;

        // Log inquiry for customer service
        await this.logCustomerInquiry(phone, message);

        return this.sendMessage(phone, autoResponse);
    }

    async logMessage(phone, message, direction) {
        try {
            await fetch(`${this.apiBaseUrl}/whatsapp/messages/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: phone.replace(/\D/g, ''),
                    message,
                    direction,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    async logCustomerInquiry(phone, inquiry) {
        try {
            await fetch(`${this.apiBaseUrl}/customer-service/inquiries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: phone.replace(/\D/g, ''),
                    inquiry,
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                })
            });
        } catch (error) {
            console.error('Error logging customer inquiry:', error);
        }
    }

    setupWebhookListener() {
        // This would typically be handled by the backend
        console.log('Webhook listener configured for WhatsApp Business API');
    }

    initializeMessageTemplates() {
        this.templates = {
            booking_confirmation: 'booking_confirmation_nhs',
            lead_notification: 'lead_notification_vendor',
            welcome: 'welcome_nhs_service_hub'
        };
    }

    // Utility method to format phone numbers
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('44')) {
            return cleaned;
        } else if (cleaned.startsWith('0')) {
            return '44' + cleaned.substring(1);
        } else {
            return '44' + cleaned;
        }
    }

    // Method to send location-based messages
    async sendLocationMessage(to, latitude, longitude, name, address) {
        const payload = {
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: 'location',
            location: {
                latitude: latitude,
                longitude: longitude,
                name: name,
                address: address
            }
        };

        try {
            const response = await fetch(`${this.businessApiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Error sending location message:', error);
            throw error;
        }
    }

    // Method to send media messages (images, documents)
    async sendMediaMessage(to, mediaType, mediaId, caption = '') {
        const payload = {
            messaging_product: 'whatsapp',
            to: to.replace(/\D/g, ''),
            type: mediaType,
            [mediaType]: {
                id: mediaId,
                caption: caption
            }
        };

        try {
            const response = await fetch(`${this.businessApiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Error sending media message:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppService;
} else {
    window.WhatsAppService = WhatsAppService;
}