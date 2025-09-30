/**
 * JustRelocation Authentication System
 * Handles user login, registration, and session management
 */

class AuthenticationManager {
    constructor() {
        this.apiBase = 'http://localhost:8001';
        this.token = localStorage.getItem('jwt_token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.createAuthModal();
        this.bindEvents();
        this.updateUIBasedOnAuth();
    }

    createAuthModal() {
        const modalHTML = `
        <div id="authModal" class="auth-modal" style="display: none;">
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2 id="authModalTitle">Sign In</h2>
                    <button class="auth-modal-close">&times;</button>
                </div>

                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Sign In</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>

                <div id="loginForm" class="auth-form active">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button class="auth-btn primary" id="loginBtn">Sign In</button>
                    <div class="auth-divider">or</div>
                    <button class="auth-btn secondary" id="demoLogin">Demo Login (Healthcare Worker)</button>
                </div>

                <div id="registerForm" class="auth-form">
                    <div class="user-type-selector">
                        <label class="radio-option">
                            <input type="radio" name="userType" value="healthcare_worker" checked>
                            <span>Healthcare Worker</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="userType" value="provider">
                            <span>Service Provider</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="registerFullName" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="registerPassword" required>
                    </div>
                    <div class="form-group">
                        <label>Phone (Optional)</label>
                        <input type="tel" id="registerPhone">
                    </div>

                    <div id="healthcareWorkerFields" class="conditional-fields">
                        <div class="form-group">
                            <label>NHS Trust</label>
                            <select id="nhsTrust">
                                <option value="">Select NHS Trust</option>
                                <option value="barts">Barts Health NHS Trust</option>
                                <option value="guys">Guy's and St Thomas'</option>
                                <option value="manchester">Manchester University NHS</option>
                                <option value="leeds">Leeds Teaching Hospitals</option>
                                <option value="birmingham">University Hospitals Birmingham</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Profession</label>
                            <select id="profession">
                                <option value="">Select Profession</option>
                                <option value="nurse">Nurse</option>
                                <option value="doctor">Doctor</option>
                                <option value="paramedic">Paramedic</option>
                                <option value="admin">Administrative</option>
                                <option value="allied">Allied Health Professional</option>
                            </select>
                        </div>
                    </div>

                    <div id="providerFields" class="conditional-fields" style="display: none;">
                        <div class="form-group">
                            <label>Business Name</label>
                            <input type="text" id="businessName">
                        </div>
                        <div class="form-group">
                            <label>Business Address</label>
                            <textarea id="businessAddress" rows="3"></textarea>
                        </div>
                    </div>

                    <button class="auth-btn primary" id="registerBtn">Create Account</button>
                </div>

                <div id="authStatus" class="auth-status"></div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add CSS
        const authCSS = `
        <style>
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .auth-modal-content {
            background: white;
            border-radius: 12px;
            padding: 0;
            width: 90%;
            max-width: 440px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .auth-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 16px;
            border-bottom: 1px solid #eee;
        }

        .auth-modal-header h2 {
            margin: 0;
            color: #003580;
            font-size: 24px;
        }

        .auth-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 4px;
        }

        .auth-tabs {
            display: flex;
            border-bottom: 1px solid #eee;
        }

        .auth-tab {
            flex: 1;
            padding: 16px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            border-bottom: 2px solid transparent;
        }

        .auth-tab.active {
            color: #003580;
            border-bottom-color: #003580;
        }

        .auth-form {
            display: none;
            padding: 24px;
        }

        .auth-form.active {
            display: block;
        }

        .user-type-selector {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
        }

        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 6px;
            flex: 1;
            text-align: center;
            justify-content: center;
        }

        .radio-option input[type="radio"] {
            margin: 0;
        }

        .radio-option:has(input:checked) {
            border-color: #003580;
            background: #f0f7ff;
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

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #003580;
            box-shadow: 0 0 0 2px rgba(0, 53, 128, 0.1);
        }

        .auth-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .auth-btn.primary {
            background: #003580;
            color: white;
        }

        .auth-btn.primary:hover {
            background: #002d5c;
        }

        .auth-btn.secondary {
            background: #f8f9fa;
            color: #003580;
            border: 1px solid #003580;
            margin-top: 8px;
        }

        .auth-btn.secondary:hover {
            background: #e3f2fd;
        }

        .auth-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .auth-divider {
            text-align: center;
            margin: 16px 0;
            color: #666;
            position: relative;
        }

        .auth-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #eee;
        }

        .auth-divider {
            background: white;
            padding: 0 16px;
            display: inline-block;
            width: auto;
        }

        .conditional-fields {
            margin-top: 16px;
        }

        .auth-status {
            padding: 16px 24px;
            text-align: center;
            font-size: 14px;
        }

        .auth-status.success {
            background: #e8f5e8;
            color: #2e7d2e;
        }

        .auth-status.error {
            background: #fee;
            color: #d32f2f;
        }

        .auth-status.loading {
            background: #f0f7ff;
            color: #003580;
        }

        .user-profile-dropdown {
            position: relative;
            display: inline-block;
        }

        .profile-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #eee;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            min-width: 200px;
            z-index: 1000;
            display: none;
        }

        .profile-menu.show {
            display: block;
        }

        .profile-menu-item {
            display: block;
            width: 100%;
            padding: 12px 16px;
            text-align: left;
            border: none;
            background: none;
            cursor: pointer;
            color: #333;
            text-decoration: none;
        }

        .profile-menu-item:hover {
            background: #f5f5f5;
        }

        .profile-menu-divider {
            height: 1px;
            background: #eee;
            margin: 4px 0;
        }

        @media (max-width: 480px) {
            .auth-modal-content {
                margin: 20px;
                width: calc(100% - 40px);
            }

            .user-type-selector {
                flex-direction: column;
            }
        }
        </style>`;

        document.head.insertAdjacentHTML('beforeend', authCSS);
    }

    bindEvents() {
        // Modal controls
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.closeModal();
            }
        });

        document.querySelector('.auth-modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // User type switching
        document.querySelectorAll('input[name="userType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleUserTypeFields(e.target.value);
            });
        });

        // Form submissions
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        document.getElementById('demoLogin').addEventListener('click', () => this.handleDemoLogin());

        // Profile dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-profile-dropdown')) {
                this.hideProfileMenu();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.hideProfileMenu();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(tabName + 'Form').classList.add('active');

        // Update title
        const title = tabName === 'login' ? 'Sign In' : 'Register';
        document.getElementById('authModalTitle').textContent = title;

        // Clear status
        this.showStatus('', '');
    }

    toggleUserTypeFields(userType) {
        const healthcareFields = document.getElementById('healthcareWorkerFields');
        const providerFields = document.getElementById('providerFields');

        if (userType === 'healthcare_worker') {
            healthcareFields.style.display = 'block';
            providerFields.style.display = 'none';
        } else {
            healthcareFields.style.display = 'none';
            providerFields.style.display = 'block';
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        this.showStatus('Signing in...', 'loading');

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.access_token, data.user);
                this.showStatus('Login successful!', 'success');
                setTimeout(() => {
                    this.closeModal();
                    this.updateUIBasedOnAuth();
                }, 1000);
            } else {
                this.showStatus(data.detail || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showStatus('Network error. Please try again.', 'error');
        }
    }

    async handleRegister() {
        const formData = {
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            user_type: document.querySelector('input[name="userType"]:checked').value,
            full_name: document.getElementById('registerFullName').value,
            phone: document.getElementById('registerPhone').value,
        };

        // Add conditional fields
        if (formData.user_type === 'healthcare_worker') {
            formData.nhs_trust = document.getElementById('nhsTrust').value;
            formData.profession = document.getElementById('profession').value;
        } else {
            formData.business_name = document.getElementById('businessName').value;
            formData.business_address = document.getElementById('businessAddress').value;
        }

        // Validation
        if (!formData.email || !formData.password || !formData.full_name) {
            this.showStatus('Please fill in all required fields', 'error');
            return;
        }

        this.showStatus('Creating account...', 'loading');

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showStatus('Account created! Welcome email sent. Please sign in.', 'success');
                setTimeout(() => {
                    this.switchTab('login');
                }, 2000);
            } else {
                this.showStatus(data.detail || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showStatus('Network error. Please try again.', 'error');
        }
    }

    handleDemoLogin() {
        // Auto-fill demo credentials
        document.getElementById('loginEmail').value = 'demo@nhs.uk';
        document.getElementById('loginPassword').value = 'demo123';
        this.handleLogin();
    }

    showModal() {
        document.getElementById('authModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('authModal').style.display = 'none';
        document.body.style.overflow = '';
        this.clearForms();
        this.showStatus('', '');
    }

    clearForms() {
        document.querySelectorAll('#authModal input, #authModal select, #authModal textarea').forEach(field => {
            field.value = '';
        });
        document.querySelector('input[name="userType"][value="healthcare_worker"]').checked = true;
        this.toggleUserTypeFields('healthcare_worker');
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('authStatus');
        statusEl.textContent = message;
        statusEl.className = `auth-status ${type}`;
        statusEl.style.display = message ? 'block' : 'none';
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        this.updateUIBasedOnAuth();
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    updateUIBasedOnAuth() {
        const authButton = document.querySelector('.account-menu');

        if (this.isAuthenticated() && authButton) {
            // Update to show user profile
            authButton.innerHTML = `
                <div class="user-profile-dropdown">
                    <div class="account-avatar" onclick="window.authManager.toggleProfileMenu()">
                        ${this.user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="profile-menu">
                        <div class="profile-menu-item">
                            <strong>${this.user.full_name}</strong><br>
                            <small>${this.user.email}</small>
                        </div>
                        <div class="profile-menu-divider"></div>
                        <button class="profile-menu-item" onclick="window.authManager.viewProfile()">
                            My Profile
                        </button>
                        <button class="profile-menu-item" onclick="window.authManager.viewBookings()">
                            My Bookings
                        </button>
                        <div class="profile-menu-divider"></div>
                        <button class="profile-menu-item" onclick="window.authManager.logout()">
                            Sign Out
                        </button>
                    </div>
                </div>`;
        }
    }

    toggleProfileMenu() {
        const menu = document.querySelector('.profile-menu');
        menu.classList.toggle('show');
    }

    hideProfileMenu() {
        const menu = document.querySelector('.profile-menu');
        if (menu) menu.classList.remove('show');
    }

    viewProfile() {
        this.hideProfileMenu();
        console.log('Navigate to profile page');
    }

    viewBookings() {
        this.hideProfileMenu();
        console.log('Navigate to bookings page');
    }
}

// Initialize authentication manager
window.authManager = new AuthenticationManager();

// Global functions
window.showAuthModal = () => window.authManager.showModal();