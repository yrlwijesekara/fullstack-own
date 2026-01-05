const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Multer Middleware for Movie Poster Uploads
 * Handles file validation, storage configuration, and error handling
 */

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/movies');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter - accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB in bytes
  },
});

/**
 * Error handling middleware for multer
 * Handles file upload errors and provides appropriate responses
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File size exceeded. Maximum file size is 50MB.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Unexpected field name. Please check your form data.' 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    // Handle custom errors (e.g., from fileFilter)
    return res.status(400).json({ 
      message: err.message 
    });
  }
  next();
};

/**
 * Single file upload middleware
 * Use for uploading a single movie poster
 * @param {string} fieldName - The name of the form field (default: 'posterImage')
 */
const uploadSingle = (fieldName = 'posterImage') => {
  return [upload.single(fieldName), handleUploadError];
};

/**
 * Multiple files upload middleware
 * Use for uploading multiple movie posters or images
 * @param {string} fieldName - The name of the form field (default: 'images')
 * @param {number} maxCount - Maximum number of files (default: 10)
 */
const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return [upload.array(fieldName, maxCount), handleUploadError];
};

/**
 * Multiple fields upload middleware
 * Use for uploading different types of files in different fields
 * @param {Array} fields - Array of field configurations
 * Example: [{ name: 'poster', maxCount: 1 }, { name: 'stills', maxCount: 5 }]
 */
const uploadFields = (fields) => {
  return [upload.fields(fields), handleUploadError];
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};
