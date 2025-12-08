class MoodTracker {
    constructor() {
        this.moodData = this.loadMoodData();
        this.currentDate = new Date().toDateString();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderMoodHistory();
        this.checkTodaysEntry();
    }

    setupEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMood(e.currentTarget);
            });
        });

        // Crisis buttons
        document.querySelector('.btn-call')?.addEventListener('click', () => {
            window.open('tel:988');
        });

        document.querySelector('.btn-text')?.addEventListener('click', () => {
            window.open('sms:741741&body=HOME');
        });

        document.querySelector('.btn-emergency')?.addEventListener('click', () => {
            window.open('tel:911');
        });
    }

    selectMood(option) {
        // Remove active class from all options
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('active');
        });

        // Add active class to selected option
        option.classList.add('active');

        // Get mood value
        const moodValue = parseInt(option.dataset.mood);
        const moodText = option.querySelector('span').textContent;
        const moodIcon = option.querySelector('i').className;

        // Save mood entry
        this.saveMoodEntry(moodValue, moodText, moodIcon);

        // Show confirmation
        this.showConfirmation(moodText);
    }

    async saveMoodEntry(moodValue, moodText, moodIcon) {
        try {
            // Use API to save mood entry
            const result = await window.API.mood.createMoodEntry({
                mood: moodValue,
                notes: '', // Add optional notes field
                tags: [], // Add tags if needed
                activities: [] // Add activities if needed
            });

            if (result.success) {
                // Update local storage for offline fallback
                const entry = {
                    id: result.data._id,
                    date: new Date().toISOString(),
                    mood: moodValue,
                    text: moodText,
                    icon: moodIcon,
                    timestamp: new Date().toISOString(),
                    synced: true
                };

                // Save to local storage for offline access
                const localData = this.loadMoodData();
                localData.push(entry);
                this.saveMoodData(localData);

                // Update UI
                this.showConfirmation(moodText);
                this.renderMoodHistory();
            } else {
                // Fallback to local storage if API fails
                this.saveMoodEntryLocally(moodValue, moodText, moodIcon);
            }
        } catch (error) {
            console.error('Failed to save mood entry:', error);
            // Fallback to local storage
            this.saveMoodEntryLocally(moodValue, moodText, moodIcon);
        }
    }

    // Load mood data from API
    async loadMoodData() {
        try {
            const result = await window.API.mood.getMoodEntries({
                limit: 30 // Get last 30 days
            });

            if (result.success) {
                return result.data.map(entry => ({
                    id: entry._id,
                    date: new Date(entry.createdAt).toDateString(),
                    mood: entry.mood,
                    text: entry.moodText,
                    icon: this.getMoodIcon(entry.mood),
                    timestamp: entry.createdAt,
                    synced: true
                }));
            }
        } catch (error) {
            console.error('Failed to load mood data:', error);
        }

        // Fallback to local storage
        try {
            const saved = localStorage.getItem('mindcare-mood-data');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading mood data:', error);
            return [];
        }
    }

    showConfirmation(moodText) {
        // Create or update confirmation message
        let confirmation = document.querySelector('.mood-confirmation');
        if (!confirmation) {
            confirmation = document.createElement('div');
            confirmation.className = 'mood-confirmation';
            document.querySelector('.mood-options').after(confirmation);
        }

        confirmation.innerHTML = `
            <div class="confirmation-content">
                <i class="fas fa-check-circle"></i>
                <span>Mood recorded: ${moodText}</span>
            </div>
        `;

        confirmation.classList.add('show');

        // Remove after 3 seconds
        setTimeout(() => {
            confirmation.classList.remove('show');
        }, 3000);
    }

    renderMoodHistory() {
        const historyChart = document.querySelector('.history-chart');
        if (!historyChart) return;

        // Get last 7 days of data
        const last7Days = this.getLast7Days();
        const chartData = last7Days.map(day => {
            const entry = this.moodData.find(d => d.date === day.date);
            return entry ? entry.mood : null;
        });

        historyChart.innerHTML = `
            <div class="chart-bars">
                ${last7Days.map((day, index) => {
            const mood = chartData[index];
            const height = mood ? (mood / 5 * 100) : 10;
            const color = this.getMoodColor(mood);

            return `
                        <div class="chart-bar" data-day="${day.short}">
                            <div class="bar-fill" style="height: ${height}%; background: ${color}; opacity: ${mood ? 1 : 0.3}"></div>
                            <span class="bar-label">${day.short}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toDateString(),
                short: date.toLocaleDateString('en', { weekday: 'short' })
            });
        }
        return days;
    }

    getMoodColor(mood) {
        const colors = {
            1: '#F44336', // Terrible
            2: '#FF9800', // Poor
            3: '#FFC107', // Okay
            4: '#8BC34A', // Good
            5: '#4CAF50'  // Excellent
        };
        return colors[mood] || '#E0E0E0';
    }

    checkTodaysEntry() {
        const todayEntry = this.moodData.find(entry => entry.date === this.currentDate);
        if (todayEntry) {
            // Highlight today's selected mood
            const moodOption = document.querySelector(`[data-mood="${todayEntry.mood}"]`);
            if (moodOption) {
                moodOption.classList.add('active');
            }
        }
    }

    loadMoodData() {
        try {
            const saved = localStorage.getItem('mindcare-mood-data');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading mood data:', error);
            return [];
        }
    }

    saveMoodData() {
        try {
            localStorage.setItem('mindcare-mood-data', JSON.stringify(this.moodData));
        } catch (error) {
            console.error('Error saving mood data:', error);
        }
    }

    // Export mood data (for future features)
    exportData() {
        const dataStr = JSON.stringify(this.moodData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `mindcare-mood-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Clear all data (for privacy)
    clearData() {
        if (confirm('Are you sure you want to clear all your mood data? This cannot be undone.')) {
            this.moodData = [];
            this.saveMoodData();
            this.renderMoodHistory();

            // Remove active classes
            document.querySelectorAll('.mood-option').forEach(opt => {
                opt.classList.remove('active');
            });
        }
    }
}

// Initialize Mood Tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoodTracker();
});