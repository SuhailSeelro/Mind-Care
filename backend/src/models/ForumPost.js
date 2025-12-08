const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [20, 'Content must be at least 20 characters'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'anxiety',
      'depression',
      'stress',
      'relationships',
      'trauma',
      'addiction',
      'lgbtq',
      'family',
      'work',
      'general',
      'success_stories',
      'seeking_advice',
      'resources'
    ],
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  allowComments: {
    type: Boolean,
    default: true
  },
  
  isPinned: {
    type: Boolean,
    default: false
  },
  
  isLocked: {
    type: Boolean,
    default: false
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Content moderation
  isApproved: {
    type: Boolean,
    default: false
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: [
        'harassment',
        'hate_speech',
        'self_harm',
        'spam',
        'misinformation',
        'inappropriate',
        'other'
      ]
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Emergency flagging
  requiresCrisisResponse: {
    type: Boolean,
    default: false
  },
  
  crisisResponseSent: {
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
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
forumPostSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for comment count
forumPostSchema.virtual('commentCount', {
  ref: 'ForumComment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// Indexes
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ isApproved: 1, createdAt: -1 });
forumPostSchema.index({ user: 1, createdAt: -1 });
forumPostSchema.index({ requiresCrisisResponse: 1 });

// Middleware to update lastActivityAt
forumPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastActivityAt = Date.now();
  next();
});

// Static method to get trending posts
forumPostSchema.statics.getTrendingPosts = async function(limit = 10) {
  return this.aggregate([
    {
      $match: {
        isApproved: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $size: '$upvotes' }, 2] },
            { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 1] },
            { $divide: ['$viewCount', 10] }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              avatar: 1,
              userType: 1
            }
          }
        ]
      }
    },
    {
      $unwind: '$user'
    }
  ]);
};

module.exports = mongoose.model('ForumPost', forumPostSchema);