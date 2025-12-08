const rateLimit = require('express-rate-limit');
const { RateLimiterMongo } = require('rate-limiter-flexible');
const mongoose = require('mongoose');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/env');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// MongoDB-based rate limiter for specific routes
const createMongoRateLimiter = (points, duration) => {
  return new RateLimiterMongo({
    storeClient: mongoose.connection,
    points, // Number of points
    duration, // Per second(s)
    blockDuration: 60 * 15, // Block for 15 minutes if exceeded
    keyPrefix: 'rl_' // Key prefix for Redis
  });
};

// Apply rate limiting to a specific route
const applyRateLimit = (rateLimiter) => {
  return (req, res, next) => {
    rateLimiter.consume(req.ip)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later.'
        });
      });
  };
};

module.exports = {
  apiLimiter,
  authLimiter,
  createMongoRateLimiter,
  applyRateLimit
};