const app = require('./src/app');
const connectDB = require('./src/config/database');
const { PORT, NODE_ENV } = require('./src/config/env');

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to Unhandled Promise Rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});