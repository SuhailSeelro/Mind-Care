// Main Application Controller
class MindCareApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupCrisisBanner();
        this.setupSmoothScrolling();
        this.setupAnimations();
        this.setupServiceWorker();
    }

    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    setupCrisisBanner() {
        const closeBanner = document.querySelector('.close-banner');
        const crisisBanner = document.querySelector('.crisis-banner');

        if (closeBanner && crisisBanner) {
            closeBanner.addEventListener('click', () => {
                crisisBanner.style.display = 'none';
                // Store preference for 24 hours
                localStorage.setItem('banner-closed', Date.now().toString());
            });

            // Check if banner was recently closed
            const closedTime = localStorage.getItem('banner-closed');
            if (closedTime) {
                const hoursSinceClose = (Date.now() - parseInt(closedTime)) / (1000 * 60 * 60);
                if (hoursSinceClose < 24) {
                    crisisBanner.style.display = 'none';
                }
            }
        }
    }

    setupSmoothScrolling() {
        // Add smooth scrolling to all links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupAnimations() {
        // Add intersection observer for general elements
        this.setupIntersectionObserver();
        
        // Add loading states
        this.setupLoadingStates();
        
        // Add hover effects
        this.setupHoverEffects();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupLoadingStates() {
        // Add loading states to buttons
        document.querySelectorAll('button[type="submit"], .btn-primary, .btn-secondary').forEach(button => {
            button.addEventListener('click', function() {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                this.disabled = true;

                // Reset after 2 seconds (simulate loading)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            });
        });
    }

    setupHoverEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('.btn-primary, .btn-secondary, .btn-login').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');

                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    setupServiceWorker() {
        // Register service worker for PWA capabilities
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // Utility method for making API calls
    async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Method to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-success { border-left: 4px solid #4CAF50; }
                .notification-error { border-left: 4px solid #F44336; }
                .notification-warning { border-left: 4px solid #FF9800; }
                .notification-info { border-left: 4px solid #2196F3; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                }
            `;
            document.head.appendChild(styles);
        }

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mindCareApp = new MindCareApp();
});

// Add CSS for ripple effect
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    button {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyles);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MindCareApp };
}