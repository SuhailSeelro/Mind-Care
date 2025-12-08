const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const moodController = require('../controllers/moodController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Validation rules
const moodEntryValidation = [
  body('mood')
    .notEmpty().withMessage('Mood rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString().withMessage('Each tag must be a string')
    .isLength({ max: 20 }).withMessage('Tag cannot exceed 20 characters'),
  
  body('activities')
    .optional()
    .isArray().withMessage('Activities must be an array'),
  
  body('activities.*')
    .optional()
    .isString().withMessage('Each activity must be a string'),
  
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage('Sleep hours must be between 0 and 24'),
  
  body('sleepQuality')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Sleep quality must be between 1 and 5'),
  
  body('exerciseMinutes')
    .optional()
    .isInt({ min: 0 }).withMessage('Exercise minutes cannot be negative'),
  
  body('weather')
    .optional()
    .isIn(['sunny', 'cloudy', 'rainy', 'snowy', 'windy']).withMessage('Invalid weather value'),
  
  body('location')
    .optional()
    .isIn(['home', 'work', 'outdoors', 'travel', 'other']).withMessage('Invalid location value')
];

// All routes require authentication
router.use(protect);

// Mood entries
router.route('/')
  .post(validate(moodEntryValidation), moodController.createMoodEntry)
  .get(moodController.getMoodEntries);

router.route('/:id')
  .get(moodController.getMoodEntry)
  .put(validate(moodEntryValidation), moodController.updateMoodEntry)
  .delete(moodController.deleteMoodEntry);

// Statistics and exports
router.get('/stats', moodController.getMoodStatistics);
router.get('/export', moodController.exportMoodData);

module.exports = router;