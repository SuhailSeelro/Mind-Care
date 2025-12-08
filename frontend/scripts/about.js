// About Page Functionality
class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.animateNumbers();
        this.setupContactForm();
        this.setupTeamHover();
        this.setupTimelineAnimation();
    }

    animateNumbers() {
        const numberElements = document.querySelectorAll('[data-count]');
        
        numberElements.forEach(element => {
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const timer = setInterval(() => {
                            current += step;
                            if (current >= target) {
                                element.textContent = target;
                                clearInterval(timer);
                            } else {
                                element.textContent = Math.floor(current);
                            }
                        }, 16);
                        observer.unobserve(element);
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmission(contactForm);
            });
        }
    }

    handleContactSubmission(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Simulate API call
        setTimeout(() => {
            window.mindCareApp.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
            form.reset();
        }, 1000);
    }

    setupTeamHover() {
        const teamMembers = document.querySelectorAll('.team-member');
        
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                member.style.transform = 'translateY(-10px)';
            });
            
            member.addEventListener('mouseleave', () => {
                member.style.transform = 'translateY(0)';
            });
        });
    }

    setupTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        });

        timelineItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-50px)';
            item.style.transition = `all 0.6s ease ${index * 0.2}s`;
            observer.observe(item);
        });
    }
}

// Initialize about page
document.addEventListener('DOMContentLoaded', () => {
    new AboutPage();
});