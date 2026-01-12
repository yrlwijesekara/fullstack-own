const multer = require('multer');
const path = require('path');
const { uploadToB2, generateUniqueFileName } = require('../config/b2Storage');

/**
 * Multer Middleware for Movie Poster Uploads with Backblaze B2
 * Handles file validation and uploads to B2 cloud storage
 */

// Use memory storage to keep file in buffer for B2 upload
const storage = multer.memoryStorage();

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
 * Middleware to upload file to B2 after multer processes it
 * Replaces the file object with B2 URL
 */
const uploadToB2Middleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(req.file.originalname);

    // Upload to B2
    const publicUrl = await uploadToB2(
      req.file.buffer,
      uniqueFileName,
      req.file.mimetype
    );

    // Replace file object with B2 URL for controller to use
    req.file.b2Url = publicUrl;
    req.file.b2FileName = uniqueFileName;

    next();
  } catch (error) {
    console.error('B2 Upload Error:', error);
    return res.status(500).json({
      message: `Failed to upload to cloud storage: ${error.message}`,
    });
  }
};

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
 * Single file upload middleware with B2 upload
 * Use for uploading a single movie poster
 * @param {string} fieldName - The name of the form field (default: 'posterImage')
 */
const uploadSingle = (fieldName = 'posterImage') => {
  return [upload.single(fieldName), handleUploadError, uploadToB2Middleware];
};

/**
 * Multiple files upload middleware with B2 upload
 * Use for uploading multiple movie posters or images
 * @param {string} fieldName - The name of the form field (default: 'images')
 * @param {number} maxCount - Maximum number of files (default: 10)
 */
const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return [upload.array(fieldName, maxCount), handleUploadError, uploadToB2Middleware];
};

/**
 * Multiple fields upload middleware with B2 upload
 * Use for uploading different types of files in different fields
 * @param {Array} fields - Array of field configurations
 * Example: [{ name: 'poster', maxCount: 1 }, { name: 'stills', maxCount: 5 }]
 */
const uploadFields = (fields) => {
  return [upload.fields(fields), handleUploadError, uploadToB2Middleware];
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};
