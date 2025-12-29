// Therapists Page Functionality
class TherapistsPage {
    constructor() {
        this.filters = {};
        this.init();
    }

    init() {
        this.setupFilters();
        this.setupTherapistActions();
        this.setupSearch();
    }

    setupFilters() {
        const filterElements = {
            specialty: document.getElementById('specialtyFilter'),
            sessionType: document.getElementById('sessionTypeFilter'),
            insurance: document.getElementById('insuranceFilter'),
            price: document.getElementById('priceFilter')
        };

        // Apply filters
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.filters = {};
            
            for (const [key, element] of Object.entries(filterElements)) {
                if (element && element.value) {
                    this.filters[key] = element.value;
                }
            }
            
            this.filterTherapists();
            this.updateResultsCount();
        });

        // Reset filters
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            for (const element of Object.values(filterElements)) {
                if (element) element.value = '';
            }
            this.filters = {};
            this.filterTherapists();
            this.updateResultsCount();
        });
    }

    filterTherapists() {
        const therapistCards = document.querySelectorAll('.therapist-card');
        let visibleCount = 0;

        therapistCards.forEach(card => {
            let shouldShow = true;

            // Check each filter
            for (const [filterKey, filterValue] of Object.entries(this.filters)) {
                const cardValue = card.getAttribute(`data-${filterKey}`);
                
                if (filterValue && cardValue) {
                    if (filterKey === 'specialty') {
                        // For specialties, check if the card contains the filter value
                        if (!cardValue.includes(filterValue)) {
                            shouldShow = false;
                            break;
                        }
                    } else if (filterKey === 'price') {
                        // Handle price ranges
                        if (!this.matchesPriceRange(cardValue, filterValue)) {
                            shouldShow = false;
                            break;
                        }
                    } else if (cardValue !== filterValue) {
                        shouldShow = false;
                        break;
                    }
                }
            }

            if (shouldShow) {
                card.style.display = 'block';
                visibleCount++;
                // Add animation
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                card.style.display = 'none';
            }
        });

        return visibleCount;
    }

    matchesPriceRange(cardPrice, filterRange) {
        // Simple price range matching
        if (filterRange === 'sliding') {
            return cardPrice === 'sliding';
        }
        
        const [min, max] = filterRange.split('-').map(val => 
            val === '+' ? Infinity : parseInt(val)
        );
        
        const cardPriceNum = parseInt(cardPrice.split('-')[0]);
        return cardPriceNum >= min && cardPriceNum <= max;
    }

    updateResultsCount() {
        const visibleCount = this.filterTherapists();
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = visibleCount;
        }
    }

    setupTherapistActions() {
        // View profile buttons
        document.querySelectorAll('.view-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const therapistName = e.target.closest('.therapist-card').querySelector('h3').textContent;
                this.showTherapistProfile(therapistName);
            });
        });

        // Book session buttons
        document.querySelectorAll('.book-session').forEach(button => {
            button.addEventListener('click', (e) => {
                const therapistName = e.target.closest('.therapist-card').querySelector('h3').textContent;
                this.showBookingModal(therapistName);
            });
        });
    }

    showTherapistProfile(therapistName) {
        window.mindCareApp.showNotification(`Opening profile: ${therapistName}`, 'info');
        // In a real app, this would navigate to the therapist's full profile page
    }

    showBookingModal(therapistName) {
        const modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Book Session with ${therapistName}</h3>
                <p>Select your preferred session type and time:</p>
                
                <form id="bookingForm">
                    <div class="form-group">
                        <label>Session Type</label>
                        <select>
                            <option>Virtual Session (50 min)</option>
                            <option>In-Person Session (50 min)</option>
                            <option>Initial Consultation (75 min)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Date</label>
                        <input type="date" min="${this.getTomorrowDate()}">
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Time</label>
                        <select>
                            <option>Morning (9 AM - 12 PM)</option>
                            <option>Afternoon (12 PM - 5 PM)</option>
                            <option>Evening (5 PM - 8 PM)</option>
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Request Booking</button>
                        <button type="button" class="btn-secondary" id="cancelBooking">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookingSubmission(therapistName);
            modal.remove();
        });

        modal.querySelector('#cancelBooking').addEventListener('click', () => {
            modal.remove();
        });
    }

    getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    handleBookingSubmission(therapistName) {
        // Simulate API call
        setTimeout(() => {
            window.mindCareApp.showNotification(
                `Booking request sent to ${therapistName}. You'll hear back within 24 hours.`,
                'success'
            );
        }, 1000);
    }

    setupSearch() {
        const searchInput = document.getElementById('therapistSearch');
        const searchButton = document.querySelector('.search-bar button');

        searchButton?.addEventListener('click', () => {
            this.performSearch(searchInput?.value);
        });

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });
    }

    performSearch(query) {
        if (!query.trim()) return;

        const therapistCards = document.querySelectorAll('.therapist-card');
        let foundAny = false;

        therapistCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                card.style.display = 'block';
                foundAny = true;
                // Highlight matching text
                this.highlightText(card, query);
            } else {
                card.style.display = 'none';
            }
        });

        if (!foundAny) {
            window.mindCareApp.showNotification('No therapists found matching your search', 'info');
        }

        this.updateResultsCount();
    }

    highlightText(element, query) {
        // Simple text highlighting implementation
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(query.toLowerCase())) {
                nodes.push(node);
            }
        }

        nodes.forEach(node => {
            const span = document.createElement('span');
            span.className = 'search-highlight';
            span.textContent = node.textContent;
            node.parentNode.replaceChild(span, node);
        });
    }
}

// Initialize therapists page
document.addEventListener('DOMContentLoaded', () => {
    new TherapistsPage();
});