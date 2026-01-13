const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

/**
 * Backblaze B2 Cloud Storage Configuration
 * Uses AWS S3 SDK for compatibility with B2's S3-compatible API
 */

// Initialize S3 Client for Backblaze B2
const b2Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: process.env.B2_REGION || 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

/**
 * Upload a file to Backblaze B2
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name for the file in B2
 * @param {string} mimeType - The MIME type of the file
 * @param {string} folder - The folder to store the file in (default: 'movies')
 * @returns {Promise<string>} The public URL of the uploaded file
 */
const uploadToB2 = async (fileBuffer, fileName, mimeType, folder = 'movies') => {
  try {
    const params = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: `${folder}/${fileName}`, // Store files in specified folder
      Body: fileBuffer,
      ContentType: mimeType,
      // Make the file publicly accessible
      ACL: 'public-read',
    };

    const command = new PutObjectCommand(params);
    await b2Client.send(command);

    // Construct the public URL
    const publicUrl = `https://${process.env.B2_BUCKET_NAME}.${process.env.B2_ENDPOINT}/${folder}/${fileName}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to B2:', error);
    throw new Error(`Failed to upload file to B2: ${error.message}`);
  }
};

/**
 * Delete a file from Backblaze B2
 * @param {string} fileUrl - The full URL or file key to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteFromB2 = async (fileUrl) => {
  try {
    // Extract the file key from the URL
    let fileKey;
    if (fileUrl.includes('/')) {
      // Extract everything after the bucket name
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes(process.env.B2_BUCKET_NAME));
      if (bucketIndex !== -1) {
        fileKey = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback: assume it's just the path after the domain
        const domainPattern = new RegExp(`https://${process.env.B2_BUCKET_NAME}\.${process.env.B2_ENDPOINT}/`);
        fileKey = fileUrl.replace(domainPattern, '');
      }
    } else {
      // If it's just a filename, assume it's in the movies folder
      fileKey = `movies/${fileUrl}`;
    }

    // Remove query parameters if any
    if (fileKey.includes('?')) {
      fileKey = fileKey.split('?')[0];
    }

    const params = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(params);
    await b2Client.send(command);

    return true;
  } catch (error) {
    console.error('Error deleting from B2:', error);
    // Don't throw error, just log it - file might not exist
    return false;
  }
};

/**
 * Generate a unique filename for uploads
 * @param {string} originalName - The original filename
 * @returns {string} A unique filename with timestamp
 */
const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '-');
  return `${timestamp}-${nameWithoutExt}${ext}`;
};

module.exports = {
  b2Client,
  uploadToB2,
  deleteFromB2,
  generateUniqueFileName,
};
