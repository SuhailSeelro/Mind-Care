const { validationResult } = require('express-validator');

// Validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors
    });
  };
};

// Sanitize input data
exports.sanitize = () => {
  return (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
          
          // Remove potentially dangerous characters
          req.body[key] = req.body[key].replace(/[<>]/g, '');
        }
      });
    }
    
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].trim();
          req.query[key] = req.query[key].replace(/[<>]/g, '');
        }
      });
    }
    
    next();
  };
};