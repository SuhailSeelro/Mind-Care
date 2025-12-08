// Scroll Animation Implementation
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('[data-aos]');
        this.threshold = 0.1;
        this.init();
    }

    init() {
        if (this.elements.length === 0) return;

        // Create Intersection Observer
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateIn(entry.target);
                    }
                });
            },
            {
                threshold: this.threshold,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        // Observe all elements
        this.elements.forEach(element => {
            this.observer.observe(element);
        });
    }

    animateIn(element) {
        element.classList.add('aos-animate');
        
        // Remove observer after animation
        this.observer.unobserve(element);
    }
}

// Floating Animation Manager
class FloatingAnimations {
    constructor() {
        this.floatingElements = document.querySelectorAll('.floating-card');
        this.init();
    }

    init() {
        this.floatingElements.forEach((element, index) => {
            // Add staggered delay
            element.style.animationDelay = `${index * 0.5}s`;
        });
    }
}

// Typing Effect
class TypeWriter {
    constructor(element, texts, speed = 100) {
        this.element = element;
        this.texts = texts;
        this.speed = speed;
        this.textIndex = 0;
        this.charIndex = 0;
        this.currentText = '';
        this.isDeleting = false;
        this.init();
    }

    init() {
        this.type();
    }

    type() {
        const current = this.textIndex % this.texts.length;
        const fullText = this.texts[current];

        if (this.isDeleting) {
            this.currentText = fullText.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.currentText = fullText.substring(0, this.charIndex + 1);
            this.charIndex++;
        }

        this.element.innerHTML = this.currentText + '<span class="cursor">|</span>';

        let typeSpeed = this.speed;

        if (this.isDeleting) {
            typeSpeed /= 2;
        }

        if (!this.isDeleting && this.charIndex === fullText.length) {
            typeSpeed = 2000; // Pause at end
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.textIndex++;
            typeSpeed = 500; // Pause before start
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

// Particle Background
class ParticleBackground {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 30;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
        this.container.appendChild(this.canvas);
    }

    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.speedY *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Smooth Scroll
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Add smooth scroll to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    new ScrollAnimations();
    
    // Initialize floating animations
    new FloatingAnimations();
    
    // Initialize smooth scroll
    new SmoothScroll();
    
    // Add particle background to hero section if desired
    const hero = document.querySelector('.hero');
    if (hero) {
        // new ParticleBackground(hero); // Uncomment if you want particle background
    }

    // Add typing effect to hero title if desired
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // new TypeWriter(heroTitle, ['You Are Not Alone', 'Professional Support', 'Community Care'], 100);
    }

    // Add hover effects to cards
    document.querySelectorAll('.feature-card, .resource-card').forEach(card => {
        card.classList.add('hover-lift');
    });

    // Loading animation for buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('btn-primary') || 
                this.classList.contains('btn-secondary')) {
                
                const originalText = this.innerHTML;
                this.innerHTML = '<div class="loading-spinner"></div>';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            }
        });
    });
});

// Parallax Scrolling Effect
class ParallaxScroll {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax');
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
}

// Staggered List Animation
class StaggeredList {
    constructor(container) {
        this.container = container;
        this.items = container.querySelectorAll('.stagger-item');
        this.init();
    }

    init() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateItems();
                        this.observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        this.observer.observe(this.container);
    }

    animateItems() {
        this.items.forEach((item, index) => {
            setTimeout(() => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.classList.add('stagger-item');
            }, index * 100);
        });
    }
}