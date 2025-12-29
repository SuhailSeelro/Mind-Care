// Forum Page Functionality
class ForumPage {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupCommunityJoin();
        this.setupDiscussionFilters();
        this.setupGuidelinesModal();
        this.animateStats();
    }

    setupCommunityJoin() {
        document.getElementById('joinCommunity')?.addEventListener('click', () => {
            this.showJoinModal();
        });
    }

    showJoinModal() {
        const modal = document.createElement('div');
        modal.className = 'community-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Join Our Community</h3>
                <p>Create an account to participate in discussions and connect with others.</p>
                <form id="joinForm">
                    <div class="form-group">
                        <input type="text" placeholder="Username" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" id="agreeGuidelines" required>
                        <label for="agreeGuidelines">I agree to the community guidelines</label>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn-primary">Join Community</button>
                        <button type="button" class="btn-secondary" id="cancelJoin">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#joinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleJoinSubmission();
            modal.remove();
        });

        modal.querySelector('#cancelJoin').addEventListener('click', () => {
            modal.remove();
        });
    }

    handleJoinSubmission() {
        // Simulate API call
        setTimeout(() => {
            window.mindCareApp.showNotification('Welcome to the community!', 'success');
            this.updateCommunityStats();
        }, 1000);
    }

    updateCommunityStats() {
        const memberCount = document.querySelector('[data-count="12543"]');
        if (memberCount) {
            const currentCount = parseInt(memberCount.textContent);
            memberCount.textContent = (currentCount + 1).toLocaleString();
        }
    }

    animateStats() {
        const counters = document.querySelectorAll('[data-count]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }

    setupDiscussionFilters() {
        // Implementation for filtering discussions
        document.getElementById('newDiscussion')?.addEventListener('click', () => {
            this.showNewDiscussionModal();
        });
    }

    showNewDiscussionModal() {
        window.mindCareApp.showNotification('Please log in to start a new discussion', 'info');
    }

    setupGuidelinesModal() {
        document.getElementById('viewGuidelines')?.addEventListener('click', () => {
            this.showGuidelinesModal();
        });
    }

    showGuidelinesModal() {
        const modal = document.createElement('div');
        modal.className = 'guidelines-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Community Guidelines</h3>
                <div class="guidelines-content">
                    <p>To ensure a safe and supportive environment for all members, please follow these guidelines:</p>
                    <ul>
                        <li>Be respectful and compassionate towards others</li>
                        <li>Maintain confidentiality - don't share others' stories</li>
                        <li>No medical advice - share experiences, not prescriptions</li>
                        <li>Report concerning content to moderators</li>
                        <li>No spam, advertising, or self-promotion</li>
                    </ul>
                    <p>Violations may result in content removal or account suspension.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" id="closeGuidelines">I Understand</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#closeGuidelines').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize forum page
document.addEventListener('DOMContentLoaded', () => {
    new ForumPage();
});