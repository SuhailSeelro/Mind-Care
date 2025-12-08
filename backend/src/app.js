const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { CLIENT_URL, NODE_ENV } = require('./config/env');
const { errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.mindcare.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Apply rate limiting to all API routes
app.use('/api/v1', apiLimiter);

// API routes
app.use('/api/v1', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;