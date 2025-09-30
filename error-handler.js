/**
 * JustRelocation Global Error Handler
 * Comprehensive error handling and user feedback system
 */

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.retryAttempts = {};
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.setupGlobalHandlers();
        this.createErrorDisplay();
        this.setupNetworkMonitoring();
    }

    setupGlobalHandlers() {
        // Unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event.error, event.filename, event.lineno, event.colno);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
            event.preventDefault();
        });

        // Network errors
        window.addEventListener('offline', () => {
            this.showNetworkError('You are currently offline. Some features may not work.');
        });

        window.addEventListener('online', () => {
            this.showSuccessMessage('Connection restored. Retrying failed requests...');
            this.retryFailedRequests();
        });
    }

    createErrorDisplay() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'errorContainer';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);

        this.addErrorStyles();
    }

    setupNetworkMonitoring() {
        // Monitor network requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.apply(window, args);

                if (!response.ok) {
                    this.handleHTTPError(response, args[0]);
                }

                return response;
            } catch (error) {
                this.handleNetworkError(error, args[0]);
                throw error;
            }
        };
    }

    // Error type handlers
    handleJavaScriptError(error, filename, lineno, colno) {
        const errorData = {
            type: 'javascript',
            message: error?.message || 'Unknown JavaScript error',
            stack: error?.stack,
            filename,
            lineno,
            colno,
            timestamp: new Date().toISOString()
        };

        this.logError(errorData);
        this.showUserError('Something went wrong. Please refresh the page and try again.');
    }

    handlePromiseRejection(reason) {
        const errorData = {
            type: 'promise_rejection',
            message: reason?.message || reason || 'Unhandled promise rejection',
            stack: reason?.stack,
            timestamp: new Date().toISOString()
        };

        this.logError(errorData);
        this.showUserError('An unexpected error occurred. Please try again.');
    }

    handleHTTPError(response, url) {
        const errorData = {
            type: 'http',
            status: response.status,
            statusText: response.statusText,
            url: url,
            timestamp: new Date().toISOString()
        };

        this.logError(errorData);

        switch (response.status) {
            case 400:
                this.showValidationError('Please check your input and try again.');
                break;
            case 401:
                this.handleAuthenticationError();
                break;
            case 403:
                this.showUserError('You do not have permission to perform this action.');
                break;
            case 404:
                this.showUserError('The requested resource was not found.');
                break;
            case 429:
                this.showUserError('Too many requests. Please wait a moment and try again.');
                break;
            case 500:
                this.showServerError();
                break;
            default:
                this.showUserError(`Server error (${response.status}). Please try again later.`);
        }
    }

    handleNetworkError(error, url) {
        const errorData = {
            type: 'network',
            message: error.message,
            url: url,
            timestamp: new Date().toISOString()
        };

        this.logError(errorData);
        this.queueForRetry(url);
        this.showNetworkError('Connection problem. Request queued for retry.');
    }

    handleAuthenticationError() {
        this.showUserError('Your session has expired. Please log in again.');

        setTimeout(() => {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }, 2000);
    }

    // User feedback methods
    showUserError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    showValidationError(message, duration = 5000) {
        this.showNotification(message, 'warning', duration);
    }

    showNetworkError(message, duration = 0) {
        this.showNotification(message, 'network', duration);
    }

    showServerError() {
        const message = 'Server is temporarily unavailable. Please try again in a few moments.';
        this.showNotification(message, 'error', 8000);
    }

    showSuccessMessage(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `error-notification ${type}`;

        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${icon}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        const container = document.getElementById('errorContainer');
        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove if duration is set
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
    }

    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle',
            network: 'fas fa-wifi'
        };
        return icons[type] || icons.info;
    }

    // Retry mechanism
    queueForRetry(url) {
        if (!this.retryAttempts[url]) {
            this.retryAttempts[url] = 0;
        }

        if (this.retryAttempts[url] < this.maxRetries) {
            this.errorQueue.push({
                url,
                timestamp: Date.now(),
                attempts: this.retryAttempts[url]
            });
        }
    }

    async retryFailedRequests() {
        const now = Date.now();
        const retryQueue = [...this.errorQueue];
        this.errorQueue = [];

        for (const request of retryQueue) {
            if (now - request.timestamp > 300000) { // Skip requests older than 5 minutes
                continue;
            }

            try {
                this.retryAttempts[request.url]++;
                await fetch(request.url);
                this.showSuccessMessage('Failed request completed successfully.');
            } catch (error) {
                if (this.retryAttempts[request.url] < this.maxRetries) {
                    this.errorQueue.push(request);
                } else {
                    this.showUserError(`Failed to complete request to ${request.url} after ${this.maxRetries} attempts.`);
                }
            }
        }
    }

    // Form validation helpers
    validateForm(formElement, validationRules) {
        const errors = [];
        const formData = new FormData(formElement);

        for (const [fieldName, rules] of Object.entries(validationRules)) {
            const value = formData.get(fieldName);
            const fieldErrors = this.validateField(fieldName, value, rules);
            errors.push(...fieldErrors);
        }

        if (errors.length > 0) {
            this.showFormErrors(errors);
            return false;
        }

        this.clearFormErrors(formElement);
        return true;
    }

    validateField(fieldName, value, rules) {
        const errors = [];

        if (rules.required && (!value || value.trim() === '')) {
            errors.push({
                field: fieldName,
                message: `${fieldName} is required`
            });
        }

        if (value && rules.minLength && value.length < rules.minLength) {
            errors.push({
                field: fieldName,
                message: `${fieldName} must be at least ${rules.minLength} characters`
            });
        }

        if (value && rules.maxLength && value.length > rules.maxLength) {
            errors.push({
                field: fieldName,
                message: `${fieldName} must be no more than ${rules.maxLength} characters`
            });
        }

        if (value && rules.pattern && !rules.pattern.test(value)) {
            errors.push({
                field: fieldName,
                message: rules.patternMessage || `${fieldName} format is invalid`
            });
        }

        if (value && rules.email && !this.isValidEmail(value)) {
            errors.push({
                field: fieldName,
                message: 'Please enter a valid email address'
            });
        }

        return errors;
    }

    showFormErrors(errors) {
        errors.forEach(error => {
            const fieldElement = document.querySelector(`[name="${error.field}"]`);
            if (fieldElement) {
                this.markFieldAsError(fieldElement, error.message);
            }
        });

        const firstError = errors[0];
        this.showValidationError(`Form validation failed: ${firstError.message}`);
    }

    markFieldAsError(fieldElement, message) {
        fieldElement.classList.add('error');

        // Remove existing error message
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        fieldElement.parentNode.appendChild(errorElement);
    }

    clearFormErrors(formElement) {
        const errorFields = formElement.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));

        const errorMessages = formElement.querySelectorAll('.field-error');
        errorMessages.forEach(message => message.remove());
    }

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    logError(errorData) {
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('JustRelocation Error:', errorData);
        }

        // Send to logging service in production
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            this.sendErrorToService(errorData);
        }
    }

    async sendErrorToService(errorData) {
        try {
            await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...errorData,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    userId: this.getCurrentUserId()
                })
            });
        } catch (error) {
            // Silently fail error logging to avoid infinite loops
        }
    }

    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || 'anonymous';
        } catch (error) {
            return 'anonymous';
        }
    }

    addErrorStyles() {
        if (document.getElementById('errorHandlerStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'errorHandlerStyles';
        styles.textContent = `
            .error-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }

            .error-notification {
                background: var(--white);
                border-radius: var(--border-radius-medium);
                box-shadow: var(--shadow-elevated);
                margin-bottom: 12px;
                transform: translateX(420px);
                opacity: 0;
                transition: all 0.3s ease;
                border-left: 4px solid;
            }

            .error-notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .error-notification.hide {
                transform: translateX(420px);
                opacity: 0;
            }

            .error-notification.error {
                border-left-color: var(--action-red);
            }

            .error-notification.warning {
                border-left-color: var(--warning-yellow);
            }

            .error-notification.success {
                border-left-color: var(--success-green);
            }

            .error-notification.info {
                border-left-color: var(--primary-blue);
            }

            .error-notification.network {
                border-left-color: var(--text-tertiary);
            }

            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                gap: 12px;
            }

            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .error-notification.error .notification-icon {
                color: var(--action-red);
            }

            .error-notification.warning .notification-icon {
                color: var(--warning-yellow);
            }

            .error-notification.success .notification-icon {
                color: var(--success-green);
            }

            .error-notification.info .notification-icon {
                color: var(--primary-blue);
            }

            .error-notification.network .notification-icon {
                color: var(--text-tertiary);
            }

            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: var(--text-primary);
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .notification-close:hover {
                color: var(--text-primary);
            }

            .field-error {
                color: var(--action-red);
                font-size: 12px;
                margin-top: 4px;
                display: block;
            }

            input.error,
            select.error,
            textarea.error {
                border-color: var(--action-red) !important;
                box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.1) !important;
            }

            @media (max-width: 480px) {
                .error-container {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }

                .error-notification {
                    transform: translateY(-100px);
                }

                .error-notification.show {
                    transform: translateY(0);
                }

                .error-notification.hide {
                    transform: translateY(-100px);
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Loading state management
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.createLoadingOverlay();
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <div class="loading-message">Loading...</div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.addLoadingStyles();
    }

    show(message = 'Loading...', id = 'default') {
        this.activeLoaders.add(id);
        const overlay = document.getElementById('globalLoadingOverlay');
        const messageEl = overlay.querySelector('.loading-message');
        messageEl.textContent = message;
        overlay.style.display = 'flex';
    }

    hide(id = 'default') {
        this.activeLoaders.delete(id);
        if (this.activeLoaders.size === 0) {
            const overlay = document.getElementById('globalLoadingOverlay');
            overlay.style.display = 'none';
        }
    }

    hideAll() {
        this.activeLoaders.clear();
        const overlay = document.getElementById('globalLoadingOverlay');
        overlay.style.display = 'none';
    }

    addLoadingStyles() {
        if (document.getElementById('loadingStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'loadingStyles';
        styles.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .loading-spinner-container {
                text-align: center;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-color);
                border-top: 3px solid var(--primary-blue);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px auto;
            }

            .loading-message {
                color: var(--text-primary);
                font-size: 16px;
                font-weight: 500;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Initialize global error handling
const errorHandler = new ErrorHandler();
const loadingManager = new LoadingManager();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.LoadingManager = LoadingManager;
window.errorHandler = errorHandler;
window.loadingManager = loadingManager;

// Utility functions for easy access
window.showError = (message, duration) => errorHandler.showUserError(message, duration);
window.showSuccess = (message, duration) => errorHandler.showSuccessMessage(message, duration);
window.showWarning = (message, duration) => errorHandler.showValidationError(message, duration);
window.showLoading = (message, id) => loadingManager.show(message, id);
window.hideLoading = (id) => loadingManager.hide(id);
window.validateForm = (form, rules) => errorHandler.validateForm(form, rules);