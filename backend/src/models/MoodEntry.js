const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },
  
  moodText: {
    type: String,
    enum: ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent']
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
  },
  
  tags: [{
    type: String,
    enum: [
      'anxiety', 'stress', 'happy', 'sad', 'angry', 
      'tired', 'energetic', 'productive', 'social', 
      'lonely', 'hopeful', 'hopeless', 'grateful'
    ]
  }],
  
  activities: [{
    type: String,
    enum: [
      'work', 'exercise', 'meditation', 'socializing',
      'reading', 'tv', 'gaming', 'cooking', 'cleaning',
      'shopping', 'resting', 'therapy', 'medication'
    ]
  }],
  
  sleepHours: {
    type: Number,
    min: 0,
    max: 24
  },
  
  sleepQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  
  exerciseMinutes: {
    type: Number,
    min: 0
  },
  
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy']
  },
  
  location: {
    type: String,
    enum: ['home', 'work', 'outdoors', 'travel', 'other']
  },
  
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for user and date queries
moodEntrySchema.index({ user: 1, createdAt: -1 });
moodEntrySchema.index({ user: 1, mood: 1 });
moodEntrySchema.index({ user: 1, tags: 1 });

// Virtual for date (without time)
moodEntrySchema.virtual('date').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

// Pre-save middleware to set moodText based on mood value
moodEntrySchema.pre('save', function(next) {
  const moodTexts = {
    1: 'Terrible',
    2: 'Poor',
    3: 'Okay',
    4: 'Good',
    5: 'Excellent'
  };
  
  this.moodText = moodTexts[this.mood];
  this.updatedAt = Date.now();
  next();
});

// Static method to get mood statistics for a user
moodEntrySchema.statics.getMoodStats = async function(userId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        averageMood: { $avg: '$mood' },
        totalEntries: { $sum: 1 },
        moodDistribution: {
          $push: '$mood'
        },
        bestDay: { $max: '$mood' },
        worstDay: { $min: '$mood' }
      }
    },
    {
      $project: {
        _id: 0,
        averageMood: { $round: ['$averageMood', 2] },
        totalEntries: 1,
        bestDay: 1,
        worstDay: 1
      }
    }
  ]);
  
  return stats[0] || {
    averageMood: 0,
    totalEntries: 0,
    bestDay: 0,
    worstDay: 0
  };
};

module.exports = mongoose.model('MoodEntry', moodEntrySchema);