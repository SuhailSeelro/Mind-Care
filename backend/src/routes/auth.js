const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('userType')
    .optional()
    .isIn(['member', 'therapist']).withMessage('Invalid user type'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      return date <= new Date();
    }).withMessage('Date of birth cannot be in the future')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.post('/forgotpassword', validate(forgotPasswordValidation), authController.forgotPassword);
router.put('/resetpassword/:resettoken', validate(resetPasswordValidation), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/updatedetails', protect, authController.updateDetails);
router.put('/updatepassword', protect, validate(updatePasswordValidation), authController.updatePassword);
router.post('/resend-verification', protect, authController.resendVerification);
router.get('/logout', protect, authController.logout);

module.exports = router;