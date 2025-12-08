const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE, BCRYPT_SALT_ROUNDS } = require('../config/env');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  // User Type
  userType: {
    type: String,
    enum: ['member', 'therapist', 'admin'],
    default: 'member'
  },
  
  // Therapist Specific Fields
  therapistInfo: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiry: Date,
    specialization: [String],
    yearsOfExperience: Number,
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    bio: {
      type: String,
      maxlength: [2000, 'Bio cannot exceed 2000 characters']
    },
    hourlyRate: Number,
    availability: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      isAvailable: Boolean
    }],
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  location: {
    country: String,
    state: String,
    city: String,
    timezone: String
  },
  
  interests: [{
    type: String,
    enum: ['anxiety', 'depression', 'relationships', 'trauma', 'addiction', 'stress', 'parenting', 'lgbtq', 'grief', 'self_improvement']
  }],
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isOnline: {
    type: Boolean,
    default: false
  },
  
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: true
    },
    privacyLevel: {
      type: String,
      enum: ['public', 'private', 'anonymous'],
      default: 'private'
    }
  },
  
  // Security
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
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

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, userType: this.userType },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.update(updates);
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'therapistInfo.isVerified': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);