const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    required: true,
    enum: ['initial', 'followup', 'emergency', 'group'],
    default: 'followup'
  },
  
  mode: {
    type: String,
    required: true,
    enum: ['in_person', 'video', 'phone'],
    default: 'video'
  },
  
  status: {
    type: String,
    required: true,
    enum: [
      'pending',    // Waiting for therapist confirmation
      'confirmed',  // Both parties confirmed
      'cancelled',  // Cancelled by either party
      'rescheduled', // Appointment was rescheduled
      'completed',  // Appointment happened
      'no_show',    // Client didn't show up
      'rejected'    // Therapist rejected the request
    ],
    default: 'pending',
    index: true
  },
  
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  duration: {
    type: Number, // in minutes
    required: true,
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [180, 'Maximum appointment duration is 180 minutes'],
    default: 50
  },
  
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  
  // Location for in-person appointments
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    room: String
  },
  
  // Video/Phone meeting details
  meetingLink: String,
  meetingId: String,
  meetingPassword: String,
  
  // Notes
  clientNotes: {
    type: String,
    maxlength: [1000, 'Client notes cannot exceed 1000 characters']
  },
  
  therapistNotes: {
    type: String,
    maxlength: [1000, 'Therapist notes cannot exceed 1000 characters']
  },
  
  privateNotes: {
    type: String,
    maxlength: [1000, 'Private notes cannot exceed 1000 characters']
  },
  
  // Payment information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  paymentId: String,
  receiptUrl: String,
  
  // Insurance information
  insuranceProvider: String,
  insuranceClaimId: String,
  coPay: Number,
  
  // Cancellation information
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  cancellationReason: String,
  cancellationNotes: String,
  
  // Reminders sent
  remindersSent: {
    '24_hours': { type: Boolean, default: false },
    '1_hour': { type: Boolean, default: false },
    '15_minutes': { type: Boolean, default: false }
  },
  
  // Rating and feedback
  clientRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  clientFeedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  
  therapistRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  therapistFeedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  
  // Files (consent forms, documents)
  files: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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

// Virtual for end time
appointmentSchema.virtual('endTime').get(function() {
  const endTime = new Date(this.date);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  return endTime;
});

// Virtual for isPast
appointmentSchema.virtual('isPast').get(function() {
  return new Date() > this.endTime;
});

// Virtual for isUpcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.date;
});

// Virtual for isOngoing
appointmentSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return now >= this.date && now <= this.endTime;
});

// Indexes
appointmentSchema.index({ therapist: 1, date: 1 });
appointmentSchema.index({ client: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });

// Middleware to update updatedAt
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that appointment date is in the future
appointmentSchema.pre('save', function(next) {
  if (this.isNew && this.date <= new Date()) {
    next(new Error('Appointment date must be in the future'));
  }
  next();
});

// Validate that therapist is actually a therapist
appointmentSchema.pre('save', async function(next) {
  if (this.isModified('therapist')) {
    const User = mongoose.model('User');
    const therapist = await User.findById(this.therapist);
    
    if (!therapist || therapist.userType !== 'therapist') {
      next(new Error('Therapist must be a registered therapist'));
    }
    
    if (therapist.therapistInfo && !therapist.therapistInfo.isVerified) {
      next(new Error('Therapist must be verified'));
    }
  }
  next();
});

// Static method to check availability
appointmentSchema.statics.checkAvailability = async function(therapistId, date, duration) {
  const startTime = new Date(date);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const conflictingAppointments = await this.find({
    therapist: therapistId,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      {
        date: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });
  
  return conflictingAppointments.length === 0;
};

module.exports = mongoose.model('Appointment', appointmentSchema);