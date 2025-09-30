/**
 * JustRelocation Payment System
 * Handles Stripe integration and booking payments
 */

class PaymentManager {
    constructor() {
        this.apiBase = 'http://localhost:8001';
        this.stripe = null; // Will be initialized when needed
        this.init();
    }

    init() {
        this.loadStripe();
        this.createPaymentModal();
    }

    async loadStripe() {
        // Load Stripe.js
        if (!document.getElementById('stripe-js')) {
            const script = document.createElement('script');
            script.id = 'stripe-js';
            script.src = 'https://js.stripe.com/v3/';
            document.head.appendChild(script);

            script.onload = () => {
                // Initialize with test key (replace with your publishable key)
                this.stripe = Stripe('pk_test_your_stripe_publishable_key');
            };
        }
    }

    createPaymentModal() {
        const modalHTML = `
        <div id="paymentModal" class="payment-modal" style="display: none;">
            <div class="payment-modal-content">
                <div class="payment-modal-header">
                    <h2>Complete Your Booking</h2>
                    <button class="payment-modal-close">&times;</button>
                </div>

                <div class="payment-steps">
                    <div class="step active" data-step="1">
                        <span class="step-number">1</span>
                        <span>Service Details</span>
                    </div>
                    <div class="step" data-step="2">
                        <span class="step-number">2</span>
                        <span>Payment</span>
                    </div>
                    <div class="step" data-step="3">
                        <span class="step-number">3</span>
                        <span>Confirmation</span>
                    </div>
                </div>

                <div id="step1" class="payment-step active">
                    <div class="service-summary">
                        <div class="service-image">
                            <img id="serviceImage" src="" alt="Service">
                        </div>
                        <div class="service-details">
                            <h3 id="serviceName">Service Name</h3>
                            <p id="serviceDescription">Service description</p>
                            <div class="service-provider">
                                <strong>Provider:</strong> <span id="serviceProvider">Provider Name</span>
                            </div>
                            <div class="service-location">
                                <strong>Location:</strong> <span id="serviceLocation">Location</span>
                            </div>
                            <div class="service-price">
                                <span class="price-amount" id="servicePrice">£0.00</span>
                                <span class="price-period">per booking</span>
                            </div>
                        </div>
                    </div>

                    <div class="booking-details">
                        <h4>Booking Details</h4>
                        <div class="form-group">
                            <label>Preferred Date</label>
                            <input type="date" id="bookingDate" required>
                        </div>
                        <div class="form-group">
                            <label>Preferred Time</label>
                            <select id="bookingTime" required>
                                <option value="">Select time</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Additional Notes (Optional)</label>
                            <textarea id="bookingNotes" rows="3" placeholder="Any special requirements or notes"></textarea>
                        </div>
                    </div>

                    <button class="payment-btn primary" id="proceedToPayment">Proceed to Payment</button>
                </div>

                <div id="step2" class="payment-step">
                    <div class="payment-summary">
                        <div class="summary-row">
                            <span>Service</span>
                            <span id="summaryService">Service Name</span>
                        </div>
                        <div class="summary-row">
                            <span>Date & Time</span>
                            <span id="summaryDateTime">Date & Time</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total</span>
                            <span id="summaryTotal">£0.00</span>
                        </div>
                    </div>

                    <div class="payment-methods">
                        <h4>Payment Method</h4>
                        <div class="payment-method-tabs">
                            <button class="payment-method-tab active" data-method="card">
                                Credit/Debit Card
                            </button>
                            <button class="payment-method-tab" data-method="bank">
                                Bank Transfer
                            </button>
                        </div>

                        <div id="cardPayment" class="payment-method-content active">
                            <div id="stripe-card-element" class="stripe-element">
                                <!-- Stripe card element will be mounted here -->
                            </div>
                            <div id="card-errors" class="payment-error"></div>
                        </div>

                        <div id="bankPayment" class="payment-method-content">
                            <div class="bank-details">
                                <p><strong>Bank Transfer Details:</strong></p>
                                <p>Sort Code: 12-34-56<br>
                                Account Number: 12345678<br>
                                Reference: <span id="paymentReference">REF123456</span></p>
                                <p><small>Please use the reference number when making your transfer</small></p>
                            </div>
                        </div>
                    </div>

                    <div class="payment-actions">
                        <button class="payment-btn secondary" id="backToDetails">Back</button>
                        <button class="payment-btn primary" id="processPayment">
                            <span class="payment-amount">Pay £0.00</span>
                        </button>
                    </div>
                </div>

                <div id="step3" class="payment-step">
                    <div class="confirmation-content">
                        <div class="confirmation-icon">✓</div>
                        <h3>Booking Confirmed!</h3>
                        <p>Your booking has been successfully confirmed and payment processed.</p>

                        <div class="confirmation-details">
                            <div class="detail-row">
                                <span>Booking ID:</span>
                                <span id="confirmationBookingId">BK123456</span>
                            </div>
                            <div class="detail-row">
                                <span>Service:</span>
                                <span id="confirmationService">Service Name</span>
                            </div>
                            <div class="detail-row">
                                <span>Date & Time:</span>
                                <span id="confirmationDateTime">Date & Time</span>
                            </div>
                            <div class="detail-row">
                                <span>Amount Paid:</span>
                                <span id="confirmationAmount">£0.00</span>
                            </div>
                        </div>

                        <div class="confirmation-actions">
                            <button class="payment-btn secondary" id="downloadReceipt">Download Receipt</button>
                            <button class="payment-btn primary" id="viewBookings">View My Bookings</button>
                        </div>

                        <p class="email-notice">
                            📧 Confirmation email sent to your registered email address
                        </p>
                    </div>
                </div>

                <div id="paymentStatus" class="payment-status"></div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add payment CSS
        const paymentCSS = `
        <style>
        .payment-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
        }

        .payment-modal-content {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            margin: 20px 0;
        }

        .payment-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 16px;
            border-bottom: 1px solid #eee;
        }

        .payment-modal-header h2 {
            margin: 0;
            color: #003580;
            font-size: 24px;
        }

        .payment-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 4px;
        }

        .payment-steps {
            display: flex;
            justify-content: space-between;
            padding: 20px 24px;
            border-bottom: 1px solid #eee;
        }

        .step {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #999;
            font-size: 14px;
        }

        .step.active {
            color: #003580;
        }

        .step-number {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ddd;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }

        .step.active .step-number {
            background: #003580;
        }

        .payment-step {
            display: none;
            padding: 24px;
        }

        .payment-step.active {
            display: block;
        }

        .service-summary {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            padding: 16px;
            border: 1px solid #eee;
            border-radius: 8px;
        }

        .service-image img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 6px;
        }

        .service-details {
            flex: 1;
        }

        .service-details h3 {
            margin: 0 0 8px 0;
            color: #333;
        }

        .service-details p {
            margin: 0 0 12px 0;
            color: #666;
            font-size: 14px;
        }

        .service-provider,
        .service-location {
            font-size: 14px;
            margin-bottom: 8px;
        }

        .service-price {
            margin-top: 12px;
        }

        .price-amount {
            font-size: 20px;
            font-weight: bold;
            color: #003580;
        }

        .price-period {
            color: #666;
            font-size: 14px;
            margin-left: 4px;
        }

        .booking-details h4 {
            margin-bottom: 16px;
            color: #333;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            color: #333;
            font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
        }

        .payment-summary {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .summary-row.total {
            border-top: 1px solid #ddd;
            padding-top: 8px;
            margin-top: 8px;
            font-weight: bold;
            font-size: 16px;
        }

        .payment-methods h4 {
            margin-bottom: 16px;
        }

        .payment-method-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }

        .payment-method-tab {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
        }

        .payment-method-tab.active {
            background: #003580;
            color: white;
            border-color: #003580;
        }

        .payment-method-content {
            display: none;
            padding: 16px;
            border: 1px solid #eee;
            border-radius: 6px;
            margin-bottom: 24px;
        }

        .payment-method-content.active {
            display: block;
        }

        .stripe-element {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: white;
        }

        .payment-error {
            color: #d32f2f;
            font-size: 14px;
            margin-top: 8px;
        }

        .bank-details {
            background: #f0f7ff;
            padding: 16px;
            border-radius: 6px;
        }

        .payment-actions {
            display: flex;
            gap: 12px;
        }

        .payment-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            flex: 1;
        }

        .payment-btn.primary {
            background: #003580;
            color: white;
        }

        .payment-btn.primary:hover {
            background: #002d5c;
        }

        .payment-btn.secondary {
            background: #f8f9fa;
            color: #003580;
            border: 1px solid #003580;
        }

        .payment-btn.secondary:hover {
            background: #e3f2fd;
        }

        .payment-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .confirmation-content {
            text-align: center;
        }

        .confirmation-icon {
            font-size: 48px;
            color: #4caf50;
            margin-bottom: 16px;
        }

        .confirmation-content h3 {
            color: #4caf50;
            margin-bottom: 16px;
        }

        .confirmation-details {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
            text-align: left;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .confirmation-actions {
            display: flex;
            gap: 12px;
            margin: 24px 0;
        }

        .email-notice {
            background: #e8f5e8;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            color: #2e7d2e;
        }

        .payment-status {
            padding: 16px 24px;
            text-align: center;
            font-size: 14px;
        }

        .payment-status.success {
            background: #e8f5e8;
            color: #2e7d2e;
        }

        .payment-status.error {
            background: #fee;
            color: #d32f2f;
        }

        .payment-status.loading {
            background: #f0f7ff;
            color: #003580;
        }

        @media (max-width: 768px) {
            .payment-modal {
                padding: 10px;
            }

            .service-summary {
                flex-direction: column;
            }

            .payment-actions {
                flex-direction: column;
            }

            .confirmation-actions {
                flex-direction: column;
            }

            .payment-steps {
                flex-direction: column;
                gap: 8px;
            }
        }
        </style>`;

        document.head.insertAdjacentHTML('beforeend', paymentCSS);

        this.bindPaymentEvents();
    }

    bindPaymentEvents() {
        // Modal controls
        document.getElementById('paymentModal').addEventListener('click', (e) => {
            if (e.target.id === 'paymentModal') {
                this.closePaymentModal();
            }
        });

        document.querySelector('.payment-modal-close').addEventListener('click', () => {
            this.closePaymentModal();
        });

        // Step navigation
        document.getElementById('proceedToPayment').addEventListener('click', () => {
            this.proceedToPayment();
        });

        document.getElementById('backToDetails').addEventListener('click', () => {
            this.showStep(1);
        });

        document.getElementById('processPayment').addEventListener('click', () => {
            this.processPayment();
        });

        // Payment method tabs
        document.querySelectorAll('.payment-method-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPaymentMethod(e.target.dataset.method);
            });
        });

        // Confirmation actions
        document.getElementById('viewBookings').addEventListener('click', () => {
            this.closePaymentModal();
            console.log('Navigate to bookings page');
        });

        document.getElementById('downloadReceipt').addEventListener('click', () => {
            this.downloadReceipt();
        });
    }

    async showPaymentModal(serviceData) {
        this.currentService = serviceData;

        // Populate service details
        document.getElementById('serviceImage').src = serviceData.images?.[0] || 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop';
        document.getElementById('serviceName').textContent = serviceData.title;
        document.getElementById('serviceDescription').textContent = serviceData.description;
        document.getElementById('serviceProvider').textContent = serviceData.provider;
        document.getElementById('serviceLocation').textContent = serviceData.location;
        document.getElementById('servicePrice').textContent = `£${serviceData.price.toFixed(2)}`;

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDate').min = today;

        // Show modal
        document.getElementById('paymentModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Initialize Stripe card element
        if (this.stripe && !this.cardElement) {
            const elements = this.stripe.elements();
            this.cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                },
            });
            this.cardElement.mount('#stripe-card-element');

            this.cardElement.on('change', (event) => {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        }

        this.showStep(1);
    }

    closePaymentModal() {
        document.getElementById('paymentModal').style.display = 'none';
        document.body.style.overflow = '';
        this.showPaymentStatus('', '');
    }

    showStep(stepNumber) {
        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

        // Update step content
        document.querySelectorAll('.payment-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }

    proceedToPayment() {
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const notes = document.getElementById('bookingNotes').value;

        if (!date || !time) {
            this.showPaymentStatus('Please select both date and time', 'error');
            return;
        }

        // Update summary
        document.getElementById('summaryService').textContent = this.currentService.title;
        document.getElementById('summaryDateTime').textContent = `${date} at ${time}`;
        document.getElementById('summaryTotal').textContent = `£${this.currentService.price.toFixed(2)}`;
        document.querySelector('.payment-amount').textContent = `Pay £${this.currentService.price.toFixed(2)}`;

        this.bookingDetails = { date, time, notes };
        this.showStep(2);
    }

    switchPaymentMethod(method) {
        // Update tabs
        document.querySelectorAll('.payment-method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.payment-method-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${method}Payment`).classList.add('active');

        this.selectedPaymentMethod = method;
    }

    async processPayment() {
        if (!window.authManager.isAuthenticated()) {
            this.showPaymentStatus('Please sign in to complete your booking', 'error');
            return;
        }

        this.showPaymentStatus('Processing payment...', 'loading');

        try {
            if (this.selectedPaymentMethod === 'card') {
                await this.processCardPayment();
            } else {
                await this.processBankTransfer();
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showPaymentStatus('Payment failed. Please try again.', 'error');
        }
    }

    async processCardPayment() {
        // Create payment intent
        const response = await window.authManager.makeAuthenticatedRequest(`${this.apiBase}/payments/create-intent`, {
            method: 'POST',
            body: JSON.stringify({
                amount: Math.round(this.currentService.price * 100), // Convert to pence
                service_id: this.currentService.id,
                description: `Booking: ${this.currentService.title}`
            })
        });

        const { client_secret, intent_id } = await response.json();

        // Confirm payment with Stripe
        const { error } = await this.stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: this.cardElement,
            }
        });

        if (error) {
            this.showPaymentStatus(error.message, 'error');
        } else {
            // Confirm payment on backend
            await this.confirmPayment(intent_id);
        }
    }

    async processBankTransfer() {
        // For bank transfer, we just create the booking and mark payment as pending
        const bookingId = await this.createBooking('pending_payment');

        document.getElementById('paymentReference').textContent = `JR${bookingId.slice(-6)}`;

        this.showPaymentStatus('Bank transfer details provided. Payment pending.', 'success');
        setTimeout(() => {
            this.showConfirmation(bookingId, 'pending');
        }, 2000);
    }

    async confirmPayment(intentId) {
        const response = await window.authManager.makeAuthenticatedRequest(`${this.apiBase}/payments/confirm/${intentId}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            // Create booking
            const bookingId = await this.createBooking('confirmed');
            this.showConfirmation(bookingId, 'paid');
        } else {
            this.showPaymentStatus('Payment confirmation failed', 'error');
        }
    }

    async createBooking(status = 'confirmed') {
        const bookingDate = new Date(`${this.bookingDetails.date}T${this.bookingDetails.time}:00`);

        const response = await window.authManager.makeAuthenticatedRequest(`${this.apiBase}/bookings/create`, {
            method: 'POST',
            body: JSON.stringify({
                service_id: this.currentService.id,
                user_id: window.authManager.user.id,
                booking_date: bookingDate.toISOString(),
                notes: this.bookingDetails.notes
            })
        });

        const result = await response.json();
        return result.booking_id;
    }

    showConfirmation(bookingId, paymentStatus) {
        // Update confirmation details
        document.getElementById('confirmationBookingId').textContent = bookingId;
        document.getElementById('confirmationService').textContent = this.currentService.title;
        document.getElementById('confirmationDateTime').textContent = `${this.bookingDetails.date} at ${this.bookingDetails.time}`;
        document.getElementById('confirmationAmount').textContent = `£${this.currentService.price.toFixed(2)}`;

        this.showStep(3);
        this.showPaymentStatus('', '');
    }

    downloadReceipt() {
        // Generate and download receipt
        const receiptData = {
            booking_id: document.getElementById('confirmationBookingId').textContent,
            service: this.currentService.title,
            amount: this.currentService.price,
            date: this.bookingDetails.date,
            time: this.bookingDetails.time
        };

        const receipt = `
JUSTRELOCATION RECEIPT
=====================
Booking ID: ${receiptData.booking_id}
Service: ${receiptData.service}
Date: ${receiptData.date} at ${receiptData.time}
Amount: £${receiptData.amount.toFixed(2)}
Status: Confirmed

Thank you for your booking!
        `;

        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JustRelocation-Receipt-${receiptData.booking_id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showPaymentStatus(message, type) {
        const statusEl = document.getElementById('paymentStatus');
        statusEl.textContent = message;
        statusEl.className = `payment-status ${type}`;
        statusEl.style.display = message ? 'block' : 'none';
    }
}

// Initialize payment manager
window.paymentManager = new PaymentManager();

// Global function to trigger payment flow
window.bookService = (serviceData) => {
    if (!window.authManager.isAuthenticated()) {
        window.authManager.showModal();
        return;
    }
    window.paymentManager.showPaymentModal(serviceData);
};