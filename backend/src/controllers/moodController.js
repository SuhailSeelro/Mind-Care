const MoodEntry = require('../models/MoodEntry');
const { ErrorResponse } = require('../middleware/error');

// @desc    Create mood entry
// @route   POST /api/v1/mood
// @access  Private
exports.createMoodEntry = async (req, res, next) => {
  try {
    const { mood, notes, tags, activities, sleepHours, sleepQuality, exerciseMinutes, weather, location } = req.body;

    // Check if entry already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await MoodEntry.findOne({
      user: req.user.id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingEntry) {
      return next(new ErrorResponse('Mood entry already exists for today', 400));
    }

    // Create mood entry
    const moodEntry = await MoodEntry.create({
      user: req.user.id,
      mood,
      notes,
      tags,
      activities,
      sleepHours,
      sleepQuality,
      exerciseMinutes,
      weather,
      location,
      isPrivate: req.body.isPrivate || false
    });

    res.status(201).json({
      success: true,
      data: moodEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all mood entries for user
// @route   GET /api/v1/mood
// @access  Private
exports.getMoodEntries = async (req, res, next) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Build query
    const query = {
      user: req.user.id,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Add mood filter if provided
    if (req.query.mood) {
      query.mood = parseInt(req.query.mood, 10);
    }

    // Add tag filter if provided
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Execute query
    const [entries, total] = await Promise.all([
      MoodEntry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MoodEntry.countDocuments(query)
    ]);

    // Calculate statistics
    const stats = await MoodEntry.getMoodStats(req.user.id, startDate, endDate);

    // Get mood trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTrends = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          averageMood: { $avg: "$mood" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: entries,
      stats,
      trends: weeklyTrends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mood entry
// @route   GET /api/v1/mood/:id
// @access  Private
exports.getMoodEntry = async (req, res, next) => {
  try {
    const moodEntry = await MoodEntry.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!moodEntry) {
      return next(new ErrorResponse('Mood entry not found', 404));
    }

    res.status(200).json({
      success: true,
      data: moodEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mood entry
// @route   PUT /api/v1/mood/:id
// @access  Private
exports.updateMoodEntry = async (req, res, next) => {
  try {
    let moodEntry = await MoodEntry.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!moodEntry) {
      return next(new ErrorResponse('Mood entry not found', 404));
    }

    // Check if trying to update old entry (beyond 24 hours)
    const entryDate = new Date(moodEntry.createdAt);
    const now = new Date();
    const hoursDiff = (now - entryDate) / (1000 * 60 * 60);

    if (hoursDiff > 24 && req.user.userType !== 'admin') {
      return next(new ErrorResponse('Cannot update entries older than 24 hours', 400));
    }

    // Update fields
    moodEntry = await MoodEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: moodEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete mood entry
// @route   DELETE /api/v1/mood/:id
// @access  Private
exports.deleteMoodEntry = async (req, res, next) => {
  try {
    const moodEntry = await MoodEntry.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!moodEntry) {
      return next(new ErrorResponse('Mood entry not found', 404));
    }

    await moodEntry.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mood statistics
// @route   GET /api/v1/mood/stats
// @access  Private
exports.getMoodStatistics = async (req, res, next) => {
  try {
    // Parse date range
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get overall statistics
    const overallStats = await MoodEntry.getMoodStats(req.user.id, startDate, endDate);

    // Get mood distribution by day of week
    const byDayOfWeek = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          averageMood: { $avg: "$mood" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get mood distribution by hour
    const byHour = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          averageMood: { $avg: "$mood" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get correlation with sleep
    const sleepCorrelation = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          sleepHours: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          correlation: {
            $avg: {
              $multiply: [
                { $subtract: ["$sleepHours", { $avg: "$sleepHours" }] },
                { $subtract: ["$mood", { $avg: "$mood" }] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top tags
    const topTags = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          tags: { $exists: true, $ne: [] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          averageMood: { $avg: "$mood" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get top activities
    const topActivities = await MoodEntry.aggregate([
      {
        $match: {
          user: req.user._id,
          activities: { $exists: true, $ne: [] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$activities" },
      {
        $group: {
          _id: "$activities",
          averageMood: { $avg: "$mood" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats,
        byDayOfWeek,
        byHour,
        sleepCorrelation: sleepCorrelation[0] || { correlation: 0, count: 0 },
        topTags,
        topActivities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export mood data
// @route   GET /api/v1/mood/export
// @access  Private
exports.exportMoodData = async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const query = {
      user: req.user.id
    };

    if (startDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const entries = await MoodEntry.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    // Convert to CSV format
    const csvData = [
      ['Date', 'Time', 'Mood', 'Mood Text', 'Notes', 'Tags', 'Activities', 'Sleep Hours', 'Sleep Quality', 'Exercise Minutes', 'Weather', 'Location'],
      ...entries.map(entry => [
        entry.createdAt.toISOString().split('T')[0],
        entry.createdAt.toISOString().split('T')[1].split('.')[0],
        entry.mood,
        entry.moodText,
        entry.notes || '',
        entry.tags.join(', '),
        entry.activities.join(', '),
        entry.sleepHours || '',
        entry.sleepQuality || '',
        entry.exerciseMinutes || '',
        entry.weather || '',
        entry.location || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=mood-data-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};