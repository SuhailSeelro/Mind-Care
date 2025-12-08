const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/email');
const { ErrorResponse } = require('../middleware/error');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, userType, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      userType: userType || 'member',
      dateOfBirth: dateOfBirth || null,
      interests: req.body.interests || [],
      preferences: {
        emailNotifications: req.body.emailNotifications !== false,
        newsletter: req.body.newsletter !== false
      }
    });

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send welcome email
    if (user.preferences.emailNotifications) {
      await sendEmail({
        email: user.email,
        ...emailTemplates.welcome(user)
      });
      
      // Send verification email
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - MindCare',
        text: `Please verify your email by clicking: ${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`,
        html: `
          <h2>Verify Your Email</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return next(new ErrorResponse(
        `Account is temporarily locked. Try again in ${lockTime} minutes`,
        423
      ));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ErrorResponse('Account is deactivated', 401));
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      
      if (attemptsLeft > 0) {
        return next(new ErrorResponse(
          `Invalid credentials. ${attemptsLeft} attempts left`,
          401
        ));
      } else {
        return next(new ErrorResponse(
          'Account locked due to too many failed attempts. Try again in 2 hours',
          423
        ));
      }
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastSeen = Date.now();
    user.isOnline = true;
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Set cookie if remember me is checked
    if (rememberMe) {
      const cookieOptions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };
      
      res.cookie('token', token, cookieOptions);
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth,
      phone: req.body.phone,
      bio: req.body.bio,
      location: req.body.location,
      interests: req.body.interests,
      'preferences.emailNotifications': req.body.emailNotifications,
      'preferences.newsletter': req.body.newsletter
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);
    
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    // Send email notification
    await sendEmail({
      email: user.email,
      subject: 'Password Changed - MindCare',
      text: 'Your password has been successfully changed.',
      html: '<h2>Password Changed</h2><p>Your password has been successfully changed.</p>'
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    if (!user) {
      return next(new ErrorResponse('No user found with that email', 404));
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    // Send email
    try {
      await sendEmail({
        email: user.email,
        ...emailTemplates.resetPassword(user, resetToken)
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      console.error('Email sending error:', error);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Confirmation - MindCare',
      text: 'Your password has been successfully reset.',
      html: '<h2>Password Reset Successful</h2><p>Your password has been successfully reset.</p>'
    });

    // Generate new token and log user in
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Update user status
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: Date.now()
    });

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Private
exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return next(new ErrorResponse('Email is already verified', 400));
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Resend: Verify Your Email - MindCare',
      text: `Please verify your email by clicking: ${verificationUrl}`,
      html: `
        <h2>Verify Your Email</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    next(error);
  }
};