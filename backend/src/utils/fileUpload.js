const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MAX_FILE_SIZE, UPLOAD_PATH } = require('../config/env');
const { ErrorResponse } = require('../middleware/error');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../', UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt'
  };

  // Check file type
  const isValid = allowedTypes[file.mimetype];
  
  if (isValid) {
    cb(null, true);
  } else {
    cb(new ErrorResponse(
      `Invalid file type. Allowed types: ${Object.keys(allowedTypes).join(', ')}`,
      400
    ), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Handle single file upload
const singleUpload = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ErrorResponse(
            `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            400
          ));
        }
        return next(new ErrorResponse(err.message, 400));
      } else if (err) {
        return next(err);
      }
      
      // Add file info to request
      if (req.file) {
        req.file.url = `/uploads/${req.file.filename}`;
      }
      
      next();
    });
  };
};

// Handle multiple file upload
const multipleUpload = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMultiple = upload.array(fieldName, maxCount);
    
    uploadMultiple(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ErrorResponse(
            `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            400
          ));
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ErrorResponse(
            `Too many files. Maximum ${maxCount} files allowed`,
            400
          ));
        }
        return next(new ErrorResponse(err.message, 400));
      } else if (err) {
        return next(err);
      }
      
      // Add file info to request
      if (req.files && req.files.length > 0) {
        req.files = req.files.map(file => ({
          ...file,
          url: `/uploads/${file.filename}`
        }));
      }
      
      next();
    });
  };
};

// Delete file utility
const deleteFile = (filename) => {
  const filePath = path.join(uploadDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filename}:`, err);
      }
    });
  }
};

// Cleanup old files (run periodically)
const cleanupOldFiles = (daysOld = 30) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading upload directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for ${file}:`, err);
          return;
        }
        
        if (stats.mtime < cutoffDate) {
          deleteFile(file);
          console.log(`Deleted old file: ${file}`);
        }
      });
    });
  });
};

module.exports = {
  singleUpload,
  multipleUpload,
  deleteFile,
  cleanupOldFiles
};