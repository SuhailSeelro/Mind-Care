// Resources Page Functionality
class ResourcesPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupToolInteractions();
        this.setupGuideReadMore();
        this.setupArticleFilters();
    }

    setupToolInteractions() {
        // Meditation Tool
        document.getElementById('startMeditation')?.addEventListener('click', () => {
            this.showToolModal('Meditation Guide', 'Starting a 5-minute guided meditation...');
        });

        // Journal Tool
        document.getElementById('openJournal')?.addEventListener('click', () => {
            this.showToolModal('Thought Journal', 'Opening your digital journal...');
        });

        // Breathing Tool
        document.getElementById('startBreathing')?.addEventListener('click', () => {
            this.startBreathingExercise();
        });
    }

    showToolModal(title, message) {
        const modal = document.createElement('div');
        modal.className = 'tool-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn-primary" id="continueTool">Continue</button>
                    <button class="btn-secondary" id="cancelTool">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add styles
        if (!document.querySelector('#modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.textContent = `
                .tool-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 15px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                }
                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                    justify-content: center;
                }
            `;
            document.head.appendChild(styles);
        }

        // Event listeners for modal buttons
        modal.querySelector('#continueTool').addEventListener('click', () => {
            modal.remove();
            // In a real app, this would open the actual tool
            window.mindCareApp.showNotification('Tool opened successfully!', 'success');
        });

        modal.querySelector('#cancelTool').addEventListener('click', () => {
            modal.remove();
        });
    }

    startBreathingExercise() {
        const exercise = document.createElement('div');
        exercise.className = 'breathing-exercise';
        exercise.innerHTML = `
            <div class="exercise-content">
                <h3>Breathing Exercise</h3>
                <div class="breathing-circle">
                    <div class="circle"></div>
                </div>
                <p class="breathing-instruction">Breathe in...</p>
                <button class="btn-secondary" id="stopBreathing">Stop Exercise</button>
            </div>
        `;

        document.body.appendChild(exercise);

        // Add breathing animation styles
        if (!document.querySelector('#breathing-styles')) {
            const styles = document.createElement('style');
            styles.id = 'breathing-styles';
            styles.textContent = `
                .breathing-exercise {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    color: white;
                }
                .exercise-content {
                    text-align: center;
                }
                .breathing-circle {
                    width: 200px;
                    height: 200px;
                    margin: 2rem auto;
                }
                .circle {
                    width: 100%;
                    height: 100%;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    animation: breathe 4s ease-in-out infinite;
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                .breathing-instruction {
                    font-size: 1.2rem;
                    margin: 1rem 0;
                    animation: pulse 2s infinite;
                }
            `;
            document.head.appendChild(styles);
        }

        let breathing = true;
        const instructions = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];
        let instructionIndex = 0;
        const instructionElement = exercise.querySelector('.breathing-instruction');

        const cycleInstructions = () => {
            if (breathing) {
                instructionElement.textContent = instructions[instructionIndex];
                instructionIndex = (instructionIndex + 1) % instructions.length;
                setTimeout(cycleInstructions, 4000);
            }
        };

        cycleInstructions();

        exercise.querySelector('#stopBreathing').addEventListener('click', () => {
            breathing = false;
            exercise.remove();
        });
    }

    setupGuideReadMore() {
        document.querySelectorAll('.guide-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const guideTitle = e.target.closest('.guide-card').querySelector('h3').textContent;
                window.mindCareApp.showNotification(`Opening guide: ${guideTitle}`, 'info');
                // In a real app, this would navigate to the full guide
            });
        });
    }

    setupArticleFilters() {
        // This would handle filtering articles by category
        // Implementation depends on your specific needs
    }
}

// Initialize resources page
document.addEventListener('DOMContentLoaded', () => {
    new ResourcesPage();
});