const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mindcare',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mindcare_test',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,
  
  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@mindcare.com',
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',
  
  // External APIs
  CRISIS_TEXT_API_KEY: process.env.CRISIS_TEXT_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};