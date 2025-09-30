class WhatsAppConfig {
    constructor() {
        this.config = {
            // WhatsApp Business API Configuration
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '1234567890',
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'your_access_token_here',
            webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN || 'nhs_service_hub_webhook_token_2024',
            apiVersion: 'v18.0',

            // Business Profile Configuration
            businessProfile: {
                name: 'NHS Service Hub',
                description: 'Professional services for NHS healthcare workers',
                website: 'https://nhsservicehub.com',
                email: 'support@nhsservicehub.com',
                phone: '+44 800 NHS HELP',
                address: 'NHS Service Hub, Healthcare Quarter, London, UK',
                category: 'Healthcare Services'
            },

            // Message Templates (these need to be approved by Meta)
            messageTemplates: {
                bookingConfirmation: {
                    name: 'booking_confirmation_nhs',
                    language: 'en',
                    category: 'TRANSACTIONAL',
                    components: [
                        {
                            type: 'BODY',
                            text: 'Hi {{1}}! Your NHS Service Hub booking is confirmed.\n\nService: {{2}}\nProvider: {{3}}\nDate: {{4}}\nTime: {{5}}\nLocation: {{6}}\nPrice: £{{7}}\n\nBooking Reference: {{8}}\n\nYour provider will contact you shortly!'
                        }
                    ]
                },

                vendorLeadAlert: {
                    name: 'vendor_lead_alert_nhs',
                    language: 'en',
                    category: 'MARKETING',
                    components: [
                        {
                            type: 'HEADER',
                            format: 'TEXT',
                            text: '🚨 New Lead Alert'
                        },
                        {
                            type: 'BODY',
                            text: 'You have a new lead from NHS Service Hub!\n\nHealthcare Worker: {{1}}\nHospital: {{2}}\nService: {{3}}\nLead Score: {{4}}/100\nBudget: £{{5}}\n\nReply ACCEPT to claim this lead!'
                        },
                        {
                            type: 'FOOTER',
                            text: 'NHS Service Hub - Lead Notification'
                        }
                    ]
                },

                welcomeMessage: {
                    name: 'welcome_nhs_service_hub',
                    language: 'en',
                    category: 'MARKETING',
                    components: [
                        {
                            type: 'HEADER',
                            format: 'TEXT',
                            text: 'Welcome to NHS Service Hub! 👋'
                        },
                        {
                            type: 'BODY',
                            text: 'Thank you for joining NHS Service Hub, {{1}}!\n\nWe\'re here to connect you with trusted service providers.\n\nQuick Commands:\n📋 Reply STATUS for updates\n🆘 Reply HELP for assistance\n📱 Forward this to colleagues\n\nLet\'s get started!'
                        },
                        {
                            type: 'FOOTER',
                            text: 'Your trusted healthcare services platform'
                        }
                    ]
                },

                appointmentReminder: {
                    name: 'appointment_reminder_nhs',
                    language: 'en',
                    category: 'TRANSACTIONAL',
                    components: [
                        {
                            type: 'HEADER',
                            format: 'TEXT',
                            text: '⏰ Appointment Reminder'
                        },
                        {
                            type: 'BODY',
                            text: 'Hi {{1}}! This is a reminder about your upcoming appointment:\n\nService: {{2}}\nProvider: {{3}}\nDate: {{4}}\nTime: {{5}}\nLocation: {{6}}\n\nPlease arrive 10 minutes early. Contact your provider if you need to reschedule.'
                        },
                        {
                            type: 'FOOTER',
                            text: 'NHS Service Hub Reminder'
                        }
                    ]
                }
            },

            // Quick Reply Buttons Configuration
            quickReplies: {
                leadResponse: ['Accept Lead', 'Get More Info', 'Decline'],
                bookingActions: ['Confirm', 'Reschedule', 'Cancel'],
                generalSupport: ['Speak to Agent', 'FAQ', 'Check Status'],
                serviceInquiry: ['Get Quote', 'Book Now', 'More Details']
            },

            // Auto-response Configuration
            autoResponses: {
                officeHours: {
                    start: 9, // 9 AM
                    end: 18,  // 6 PM
                    timezone: 'Europe/London',
                    days: [1, 2, 3, 4, 5] // Monday to Friday
                },

                outOfOfficeMessage: `Thank you for contacting NHS Service Hub! 🏥\n\nWe're currently outside office hours (9 AM - 6 PM, Monday-Friday).\n\nFor urgent matters:\n📞 Emergency: 999\n📞 NHS 111: 111\n\nWe'll respond during business hours.\n\nNHS Service Hub Team`,

                defaultResponse: `Thanks for your message! 👋\n\nOur team will respond within 2 hours during business hours.\n\nQuick help:\n📱 Reply HELP for commands\n📊 Reply STATUS for updates\n🌐 Visit: nhsservicehub.com\n\nNHS Service Hub Team`,

                errorResponse: `We're experiencing technical difficulties. Please try again later or contact:\n\n📧 support@nhsservicehub.com\n📞 0800 NHS HELP\n\nSorry for the inconvenience!`
            },

            // Message Categories and Keywords
            messageCategories: {
                leadAcceptance: ['accept', 'yes', 'claim', 'take'],
                infoRequest: ['info', 'details', 'more', 'explain'],
                statusCheck: ['status', 'update', 'progress', 'current'],
                helpRequest: ['help', 'support', 'assist', 'guide'],
                booking: ['book', 'appointment', 'schedule', 'reserve'],
                cancel: ['cancel', 'decline', 'no', 'reject'],
                emergency: ['urgent', 'emergency', 'immediate', 'asap']
            },

            // Integration Settings
            integration: {
                webhookUrl: 'https://your-domain.com/webhook/whatsapp',
                retryAttempts: 3,
                messageTimeout: 30000, // 30 seconds
                batchSize: 50, // Maximum messages per batch
                rateLimiting: {
                    maxMessagesPerSecond: 10,
                    maxMessagesPerMinute: 100,
                    maxMessagesPerHour: 1000
                }
            },

            // Notification Settings
            notifications: {
                newLead: {
                    enabled: true,
                    template: 'vendorLeadAlert',
                    priority: 'high'
                },
                bookingConfirmation: {
                    enabled: true,
                    template: 'bookingConfirmation',
                    priority: 'normal'
                },
                appointmentReminder: {
                    enabled: true,
                    template: 'appointmentReminder',
                    priority: 'normal',
                    timing: {
                        hours: [24, 2], // 24 hours and 2 hours before
                        enabled: true
                    }
                },
                paymentReminder: {
                    enabled: true,
                    priority: 'normal',
                    timing: {
                        days: [7, 3, 1], // 7, 3, and 1 days before due
                        enabled: true
                    }
                }
            }
        };
    }

    getConfig() {
        return this.config;
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    getTemplate(templateName) {
        return this.config.messageTemplates[templateName];
    }

    getQuickReplies(category) {
        return this.config.quickReplies[category] || [];
    }

    getAutoResponse(type) {
        return this.config.autoResponses[type];
    }

    isOfficeHours() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();

        const { start, end, days } = this.config.autoResponses.officeHours;

        return days.includes(currentDay) && currentHour >= start && currentHour < end;
    }

    categorizeMessage(message) {
        const lowerMessage = message.toLowerCase();

        for (const [category, keywords] of Object.entries(this.config.messageCategories)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return category;
            }
        }

        return 'general';
    }

    validatePhoneNumber(phone) {
        // UK phone number validation
        const ukPhoneRegex = /^(?:\+44|0044|44)?(?:\d{10}|\d{11})$/;
        const cleaned = phone.replace(/\D/g, '');
        return ukPhoneRegex.test(cleaned);
    }

    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');

        // Add UK country code if missing
        if (cleaned.startsWith('0')) {
            cleaned = '44' + cleaned.substring(1);
        } else if (!cleaned.startsWith('44')) {
            cleaned = '44' + cleaned;
        }

        return cleaned;
    }

    // Method to create message templates programmatically
    createTemplate(name, category, components) {
        return {
            name,
            language: 'en',
            category,
            components
        };
    }

    // Method to validate template structure
    validateTemplate(template) {
        const requiredFields = ['name', 'language', 'category', 'components'];
        return requiredFields.every(field => template.hasOwnProperty(field));
    }

    // Method to get rate limiting settings
    getRateLimits() {
        return this.config.integration.rateLimiting;
    }

    // Method to check if feature is enabled
    isFeatureEnabled(feature) {
        return this.config.notifications[feature]?.enabled || false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppConfig;
} else {
    window.WhatsAppConfig = WhatsAppConfig;
}