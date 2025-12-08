const { NODE_ENV } = require('../config/env');

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate field value: ${field}. Please use another value.`;
  return new ErrorResponse(message, 400);
};

// Handle MongoDB validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ErrorResponse(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new ErrorResponse('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new ErrorResponse('Your token has expired. Please log in again.', 401);

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    console.error('Error 💥:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    });

    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production mode
    let error = { ...err };
    error.message = err.message;

    // Handle specific MongoDB errors
    if (err.name === 'CastError') {
      error = new ErrorResponse(`Invalid ${err.path}: ${err.value}`, 400);
    }

    if (err.code === 11000) {
      error = handleDuplicateKeyError(err);
    }

    if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    }

    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    // Send response
    res.status(error.statusCode || 500).json({
      success: false,
      status: error.status || 'error',
      message: error.message || 'Something went wrong',
      ...(error.isOperational && { error: error.message })
    });
  }
};

module.exports = {
  ErrorResponse,
  errorHandler
};