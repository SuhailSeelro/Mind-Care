// Authentication System
class AuthSystem {
    constructor() {
        this.currentForm = 'login';
        this.users = this.loadUsers();
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        this.setupFormSwitching();
        this.setupPasswordToggles();
        this.setupFormSubmissions();
        this.setupPasswordStrength();
        this.setupForgotPassword();
        this.checkExistingSession();
    }

    setupFormSwitching() {
        document.querySelectorAll('.auth-switch').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetForm = e.target.getAttribute('data-target');
                this.switchForm(targetForm);
            });
        });
    }

    switchForm(formType) {
        // Hide all forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        // Show target form
        const targetForm = document.getElementById(`${formType}Form`);
        if (targetForm) {
            targetForm.classList.add('active');
            this.currentForm = formType;

            // Add animation
            targetForm.style.animation = 'slideInRight 0.5s ease';
            setTimeout(() => {
                targetForm.style.animation = '';
            }, 500);
        }
    }

    setupPasswordToggles() {
        // Login password toggle
        const loginToggle = document.getElementById('loginPasswordToggle');
        const loginPassword = document.getElementById('loginPassword');

        loginToggle?.addEventListener('click', () => {
            this.togglePasswordVisibility(loginPassword, loginToggle);
        });

        // Signup password toggle
        const signupToggle = document.getElementById('signupPasswordToggle');
        const signupPassword = document.getElementById('signupPassword');

        signupToggle?.addEventListener('click', () => {
            this.togglePasswordVisibility(signupPassword, signupToggle);
        });

        // Confirm password toggle
        const confirmToggle = document.getElementById('confirmPasswordToggle');
        const confirmPassword = document.getElementById('confirmPassword');

        confirmToggle?.addEventListener('click', () => {
            this.togglePasswordVisibility(confirmPassword, confirmToggle);
        });
    }

    togglePasswordVisibility(passwordField, toggleButton) {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);

        const icon = toggleButton.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    setupFormSubmissions() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(loginForm);
        });

        // Signup form
        const signupForm = document.getElementById('signupFormElement');
        signupForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup(signupForm);
        });
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('signupPassword');
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');

        passwordInput?.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = this.calculatePasswordStrength(password);
            this.updatePasswordStrengthUI(strength, strengthBar, strengthText);
        });
    }

    calculatePasswordStrength(password) {
        let strength = 0;

        // Length check
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;

        // Character variety checks
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^A-Za-z0-9]/.test(password)) strength += 10;

        return Math.min(strength, 100);
    }

    updatePasswordStrengthUI(strength, bar, text) {
        // Update bar width and color
        bar.style.width = `${strength}%`;

        if (strength < 40) {
            bar.style.background = '#f44336';
            text.textContent = 'Weak password';
        } else if (strength < 70) {
            bar.style.background = '#ff9800';
            text.textContent = 'Moderate password';
        } else {
            bar.style.background = '#4CAF50';
            text.textContent = 'Strong password';
        }
    }

    setupForgotPassword() {
        const forgotLink = document.querySelector('.forgot-password');
        const modal = document.getElementById('forgotPasswordModal');
        const closeBtn = modal?.querySelector('.modal-close');
        const form = document.getElementById('forgotPasswordForm');

        // Open modal
        forgotLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal(modal);
        });

        // Close modal
        closeBtn?.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // Handle form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordReset(form, modal);
        });

        // Close modal on outside click
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    openModal(modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    handlePasswordReset(form, modal) {
        const email = form.querySelector('#resetEmail').value;

        this.showLoading(form.querySelector('button'));

        // Simulate API call
        setTimeout(() => {
            this.hideLoading(form.querySelector('button'));
            this.closeModal(modal);
            window.mindCareApp.showNotification('Password reset instructions sent to your email!', 'success');
            form.reset();
        }, 2000);
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('Please enter your password');
            return;
        }

        const loginBtn = document.getElementById('loginButton');
        this.showLoading(loginBtn);

        try {
            // Use API for login
            const result = await window.API.auth.login({
                email,
                password,
                rememberMe
            });

            if (result.success) {
                // Store user data in auth manager
                window.authManager.currentUser = result.user;
                window.authManager.updateUIForLoggedInUser();

                // Redirect to dashboard or previous page
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                this.showError(result.error || 'Login failed');
            }
        } catch (error) {
            this.showError(error.message || 'Login failed. Please try again.');
        } finally {
            this.hideLoading(loginBtn);
        }
    }

    async handleSignup(form) {
        const formData = new FormData(form);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            userType: formData.get('userType'),
            dateOfBirth: formData.get('dateOfBirth'),
            interests: formData.getAll('interests'),
            emailNotifications: document.getElementById('newsletter')?.checked || false,
            newsletter: document.getElementById('newsletter')?.checked || false
        };

        // Validate inputs
        const validation = this.validateSignup(userData);
        if (!validation.isValid) {
            this.showError(validation.message);
            return;
        }

        const signupBtn = document.getElementById('signupButton');
        this.showLoading(signupBtn);

        try {
            // Use API for registration
            const result = await window.API.auth.register(userData);

            if (result.success) {
                // Store user data in auth manager
                window.authManager.currentUser = result.user;
                window.authManager.updateUIForLoggedInUser();

                // Show success message
                this.showSuccessModal(result.user);
            } else {
                this.showError(result.error || 'Signup failed');
            }
        } catch (error) {
            this.showError(error.message || 'Signup failed. Please try again.');
        } finally {
            this.hideLoading(signupBtn);
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('Please enter your password');
            return;
        }

        const loginBtn = document.getElementById('loginButton');
        this.showLoading(loginBtn);

        try {
            // Use API for login
            const result = await window.API.auth.login({
                email,
                password,
                rememberMe
            });

            if (result.success) {
                // Store user data in auth manager
                window.authManager.currentUser = result.user;
                window.authManager.updateUIForLoggedInUser();

                // Redirect to dashboard or previous page
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                this.showError(result.error || 'Login failed');
            }
        } catch (error) {
            this.showError(error.message || 'Login failed. Please try again.');
        } finally {
            this.hideLoading(loginBtn);
        }
    }

    async handleSignup(form) {
        const formData = new FormData(form);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            userType: formData.get('userType'),
            dateOfBirth: formData.get('dateOfBirth'),
            interests: formData.getAll('interests'),
            emailNotifications: document.getElementById('newsletter')?.checked || false,
            newsletter: document.getElementById('newsletter')?.checked || false
        };

        // Validate inputs
        const validation = this.validateSignup(userData);
        if (!validation.isValid) {
            this.showError(validation.message);
            return;
        }

        const signupBtn = document.getElementById('signupButton');
        this.showLoading(signupBtn);

        try {
            // Use API for registration
            const result = await window.API.auth.register(userData);

            if (result.success) {
                // Store user data in auth manager
                window.authManager.currentUser = result.user;
                window.authManager.updateUIForLoggedInUser();

                // Show success message
                this.showSuccessModal(result.user);
            } else {
                this.showError(result.error || 'Signup failed');
            }
        } catch (error) {
            this.showError(error.message || 'Signup failed. Please try again.');
        } finally {
            this.hideLoading(signupBtn);
        }
    }

    validateSignup(userData) {
        // Check if all required fields are filled
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.password || !userData.userType) {
            return { isValid: false, message: 'Please fill in all required fields' };
        }

        // Validate email
        if (!this.validateEmail(userData.email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }

        // Check if email already exists
        if (this.users.find(user => user.email === userData.email)) {
            return { isValid: false, message: 'An account with this email already exists' };
        }

        // Validate password strength
        if (userData.password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }

        // Check password match
        if (userData.password !== userData.confirmPassword) {
            return { isValid: false, message: 'Passwords do not match' };
        }

        // Check terms agreement
        if (!userData.agreeTerms) {
            return { isValid: false, message: 'Please agree to the Terms of Service and Privacy Policy' };
        }

        return { isValid: true, message: 'Validation successful' };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    authenticateUser(email, password) {
        // In a real app, this would be an API call
        const user = this.users.find(u => u.email === email && u.password === password);
        return user;
    }

    createUser(userData) {
        const newUser = {
            id: this.generateUserId(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password, // In real app, this would be hashed
            userType: userData.userType,
            newsletter: userData.newsletter,
            createdAt: new Date().toISOString(),
            profile: {
                avatar: null,
                bio: '',
                preferences: {}
            }
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    loginUser(user, rememberMe = false) {
        this.currentUser = user;

        // Store user session
        if (rememberMe) {
            localStorage.setItem('mindcare_user', JSON.stringify(user));
            localStorage.setItem('mindcare_token', this.generateToken());
        } else {
            sessionStorage.setItem('mindcare_user', JSON.stringify(user));
            sessionStorage.setItem('mindcare_token', this.generateToken());
        }

        // Update UI to show user is logged in
        this.updateUILoginState(true);
    }

    logoutUser() {
        this.currentUser = null;
        localStorage.removeItem('mindcare_user');
        localStorage.removeItem('mindcare_token');
        sessionStorage.removeItem('mindcare_user');
        sessionStorage.removeItem('mindcare_token');

        this.updateUILoginState(false);
        window.location.href = 'pages/login.html';
    }

    generateToken() {
        return 'token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    getCurrentUser() {
        let user = sessionStorage.getItem('mindcare_user') || localStorage.getItem('mindcare_user');
        return user ? JSON.parse(user) : null;
    }

    checkExistingSession() {
        if (this.currentUser) {
            // User is already logged in, redirect to home
            window.location.href = '../index.html';
        }
    }

    updateUILoginState(isLoggedIn) {
        // This would update navigation and other UI elements
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn && isLoggedIn) {
            loginBtn.textContent = 'Dashboard';
            loginBtn.href = '../index.html'; // or dashboard page
        }
    }

    showLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (btnText && btnLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'block';
            button.disabled = true;
        }
    }

    hideLoading(button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (btnText && btnLoading) {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    }

    showError(message) {
        window.mindCareApp.showNotification(message, 'error');
    }

    loadUsers() {
        // In a real app, this would be from an API
        // For demo purposes, we'll use localStorage
        try {
            const storedUsers = localStorage.getItem('mindcare_users');
            return storedUsers ? JSON.parse(storedUsers) : [
                // Demo user
                {
                    id: 'demo_user_123',
                    firstName: 'Demo',
                    lastName: 'User',
                    email: 'demo@mindcare.com',
                    password: 'password123',
                    userType: 'member',
                    createdAt: new Date().toISOString(),
                    profile: {
                        avatar: null,
                        bio: 'Demo user account',
                        preferences: {}
                    }
                }
            ];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('mindcare_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }
}

// Social Login Handlers
class SocialAuth {
    constructor() {
        this.init();
    }

    init() {
        this.setupGoogleLogin();
        this.setupFacebookLogin();
    }

    setupGoogleLogin() {
        document.querySelectorAll('.google-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleGoogleLogin();
            });
        });
    }

    setupFacebookLogin() {
        document.querySelectorAll('.facebook-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFacebookLogin();
            });
        });
    }

    handleGoogleLogin() {
        window.mindCareApp.showNotification('Google login would be implemented here', 'info');
        // In a real app, this would integrate with Google OAuth
    }

    handleFacebookLogin() {
        window.mindCareApp.showNotification('Facebook login would be implemented here', 'info');
        // In a real app, this would integrate with Facebook OAuth
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    window.socialAuth = new SocialAuth();
});