# Backblaze B2 Cloud Storage Integration

This document describes the Backblaze B2 cloud storage integration for movie poster uploads.

## Overview

The application now uses Backblaze B2 cloud storage instead of local file storage for movie poster images. This provides:

- **Scalability**: No need to manage local storage
- **Reliability**: Cloud-based backup and redundancy
- **Performance**: CDN-like delivery of images
- **Cost-effective**: Backblaze B2 offers affordable cloud storage

## Configuration

### Environment Variables

The following environment variables must be set in your `.env` file:

```env
# Backblaze B2 Cloud Storage Configuration
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_KEY_ID=00520ddc46fffb50000000001
B2_APPLICATION_KEY=K0053rDlrg2oo6/c2HIBh0+EgqkqFwk
B2_BUCKET_NAME=enimate-movies
B2_BUCKET_ID=3280ed3d6c34a6cf9fbf0b15
```

### Bucket Configuration

**Bucket Name**: enimate-movies
**Bucket ID**: 3280ed3d6c34a6cf9fbf0b15
**Endpoint**: s3.us-east-005.backblazeb2.com
**Region**: us-east-005

**Important**: Make sure your B2 bucket is configured with:
- **Public access** enabled (Files in Bucket are: "Public")
- **CORS rules** configured if accessing from browsers

### CORS Configuration (if needed)

If you need to access images directly from the browser, add the following CORS rules to your B2 bucket:

```json
[
  {
    "corsRuleName": "downloadFromAnyOrigin",
    "allowedOrigins": ["*"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["s3_get"],
    "maxAgeSeconds": 3600
  }
]
```

## Implementation Details

### Files Modified/Created

1. **`config/b2Storage.js`** (NEW)
   - Handles B2 client initialization
   - Provides upload and delete functions
   - Generates unique filenames

2. **`middleware/upload.js`** (MODIFIED)
   - Changed from disk storage to memory storage
   - Added B2 upload middleware
   - Files are uploaded to B2 after multer processes them

3. **`controllers/movieController.js`** (MODIFIED)
   - Updated to use B2 URLs instead of local paths
   - Deletes old images from B2 when updating/deleting movies

4. **`models/Movie.js`** (MODIFIED)
   - Updated genre enum to include: Crime, Mystery, Western, Fantasy
   - Updated status enum to use: `upcoming`, `now_showing`, `archived`

### How It Works

1. **File Upload Flow**:
   ```
   Client → Multer (memory storage) → B2 Upload Middleware → Controller
   ```

2. **Multer** receives the file and stores it in memory as a buffer
3. **B2 Middleware** uploads the buffer to Backblaze B2
4. **Controller** receives the B2 URL and saves it to the database

### Image URLs

Images are stored with the following URL pattern:
```
https://enimate-movies.s3.us-east-005.backblazeb2.com/movies/[timestamp]-[filename]
```

Example:
```
https://enimate-movies.s3.us-east-005.backblazeb2.com/movies/1736632800000-avatar-poster.jpg
```

## API Usage

### Create Movie with Poster

```javascript
POST /api/movies
Content-Type: multipart/form-data

{
  title: "Movie Title",
  description: "Movie description...",
  duration: 120,
  genre: ["Action", "Sci-Fi"],
  language: "English",
  posterImage: [FILE],
  status: "upcoming"
}
```

### Update Movie Poster

```javascript
PUT /api/movies/:id
Content-Type: multipart/form-data

{
  posterImage: [FILE]
}
```

The old poster will be automatically deleted from B2.

### Delete Movie

```javascript
DELETE /api/movies/:id
```

The poster image will be automatically deleted from B2.

## Movie Genres & Status

### Valid Genres
- Action
- Adventure
- Animation
- Comedy
- Crime
- Documentary
- Drama
- Fantasy
- Horror
- Mystery
- Romance
- Sci-Fi
- Thriller
- Western

### Valid Status Values
- `upcoming` - Coming Soon movies
- `now_showing` - Currently playing movies
- `archived` - Past movies

## Testing

### Test File Upload

```bash
curl -X POST http://localhost:5009/api/movies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Test Movie" \
  -F "description=This is a test movie with a minimum of fifty characters in the description" \
  -F "duration=120" \
  -F "genre=Action,Sci-Fi" \
  -F "language=English" \
  -F "status=upcoming" \
  -F "posterImage=@/path/to/image.jpg"
```

### Verify Upload

Check that:
1. The movie is created in MongoDB
2. The `posterImage` field contains a B2 URL
3. The image is accessible via the B2 URL
4. The image appears in the B2 bucket under the `movies/` folder

## Troubleshooting

### Common Issues

1. **"Failed to upload to cloud storage"**
   - Check your B2 credentials in `.env`
   - Verify the bucket name is correct
   - Ensure the bucket has public access enabled

2. **"Access Denied"**
   - Verify your application key has read/write permissions
   - Check that the bucket allows public file access

3. **CORS Errors**
   - Add CORS rules to your B2 bucket
   - Make sure `allowedOrigins` includes your frontend domain

4. **Images not loading**
   - Check if the bucket is set to "Public"
   - Verify the URL format is correct
   - Test the URL directly in a browser

### Debug Mode

Enable detailed logging by checking the console output:
```javascript
console.error('B2 Upload Error:', error);
console.log('Deleted old poster from B2');
```

## Migration from Local Storage

If you have existing movies with local file paths:

1. **Old format**: `/uploads/movies/12345-poster.jpg`
2. **New format**: `https://enimate-movies.s3.us-east-005.backblazeb2.com/movies/12345-poster.jpg`

To migrate existing images:
1. Upload all local images to B2 manually
2. Update the database with new B2 URLs
3. Delete local files

## Security Notes

- ⚠️ **Never commit** `.env` file to version control
- Store B2 credentials securely
- Use environment variables for all sensitive data
- Consider rotating application keys periodically
- Monitor B2 usage and costs in the Backblaze dashboard

## Cost Considerations

Backblaze B2 Pricing (as of 2026):
- Storage: ~$0.005/GB/month
- Downloads: ~$0.01/GB
- Free tier: 10GB storage, 1GB daily download

For a typical movie poster (~500KB):
- Storage cost: ~$0.0000025/month per poster
- Very cost-effective for most applications

## Support

For Backblaze B2 support:
- Documentation: https://www.backblaze.com/b2/docs/
- Support: https://www.backblaze.com/help.html

For application issues:
- Check the backend logs
- Verify environment variables
- Test B2 credentials using Backblaze CLI
