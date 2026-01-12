# Quick Reference Guide

## Valid Movie Genres
```javascript
[
  'Action',
  'Adventure', 
  'Animation',
  'Comedy',
  'Crime',         // ✅ NEWLY ADDED
  'Documentary',
  'Drama',
  'Fantasy',       // ✅ NEWLY ADDED
  'Horror',
  'Mystery',       // ✅ NEWLY ADDED
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Western'        // ✅ NEWLY ADDED
]
```

## Valid Movie Status Values
```javascript
'upcoming'      // ✅ CHANGED FROM 'Coming Soon'
'now_showing'   // ✅ CHANGED FROM 'Now Showing'
'archived'      // ✅ CHANGED FROM 'Archived'
```

## Frontend Status Mapping
```javascript
// Frontend dropdown values → Backend database values
'Coming Soon'  → 'upcoming'
'Now Showing'  → 'now_showing'
'Archived'     → 'archived'
```

## Backblaze B2 Configuration
```env
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_KEY_ID=00520ddc46fffb50000000001
B2_APPLICATION_KEY=K0053rDlrg2oo6/c2HIBh0+EgqkqFwk
B2_BUCKET_NAME=enimate-movies
B2_BUCKET_ID=3280ed3d6c34a6cf9fbf0b15
```

## Image URL Format
```
https://enimate-movies.s3.us-east-005.backblazeb2.com/movies/[timestamp]-[filename].[ext]
```

Example:
```
https://enimate-movies.s3.us-east-005.backblazeb2.com/movies/1736632800000-avatar-poster.jpg
```

## File Upload Flow
```
1. User uploads image via form
   ↓
2. Multer receives file in memory
   ↓
3. B2 middleware uploads to Backblaze
   ↓
4. B2 returns public URL
   ↓
5. Controller saves URL to MongoDB
   ↓
6. Frontend displays image from B2
```

## Quick Test Commands

### Create Movie with New Features
```bash
curl -X POST http://localhost:5009/api/movies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Crime Mystery Movie" \
  -F "description=A thrilling crime mystery that will keep you on the edge of your seat for the entire duration" \
  -F "duration=135" \
  -F "genre=Crime,Mystery,Thriller" \
  -F "language=English" \
  -F "status=upcoming" \
  -F "posterImage=@/path/to/poster.jpg"
```

### Update Movie Status
```bash
curl -X PUT http://localhost:5009/api/movies/:id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "now_showing"}'
```

### Get Movies by Status
```bash
# Get upcoming movies (Coming Soon)
curl http://localhost:5009/api/movies?status=upcoming

# Get now showing movies
curl http://localhost:5009/api/movies?status=now_showing

# Get archived movies
curl http://localhost:5009/api/movies?status=archived
```

### Get Movies by Genre
```bash
# Get Crime movies
curl http://localhost:5009/api/movies?genre=Crime

# Get Mystery movies
curl http://localhost:5009/api/movies?genre=Mystery
```

## Files Modified

### Backend:
- ✅ `models/Movie.js` - Updated genres and status enums
- ✅ `controllers/movieController.js` - B2 integration
- ✅ `middleware/upload.js` - B2 upload middleware
- ✅ `config/b2Storage.js` - NEW: B2 service
- ✅ `.env` - Added B2 credentials

### Frontend:
- ✅ `pages/Home.jsx` - Updated status to `now_showing`
- ✅ `pages/Movies.jsx` - Updated status values

### Documentation:
- ✅ `BACKBLAZE_B2_INTEGRATION.md` - Complete B2 guide
- ✅ `IMPLEMENTATION_SUMMARY.md` - All changes overview
- ✅ `POST_IMPLEMENTATION_CHECKLIST.md` - Testing checklist
- ✅ `QUICK_REFERENCE.md` - This file

## Common Validation Errors Fixed

### Before:
```javascript
// ❌ Would fail
{ genre: ['Crime'] }           // Not in enum
{ genre: ['Mystery'] }         // Not in enum
{ status: 'Coming Soon' }      // Not in enum
{ status: 'Now Showing' }      // Not in enum
```

### After:
```javascript
// ✅ Now works
{ genre: ['Crime'] }           // Valid
{ genre: ['Mystery'] }         // Valid
{ status: 'upcoming' }         // Valid
{ status: 'now_showing' }      // Valid
```

## B2 Storage Benefits

### Before (Local Storage):
- ❌ Limited by disk space
- ❌ Difficult to scale
- ❌ Doesn't work in containers
- ❌ No redundancy
- ❌ Manual backups needed

### After (B2 Cloud Storage):
- ✅ Unlimited storage
- ✅ Automatically scales
- ✅ Works in any environment
- ✅ Built-in redundancy
- ✅ Automatic backups
- ✅ Cost-effective (~$0.005/GB/month)

## Troubleshooting Quick Fixes

### Genre validation error?
→ Check genre is in the list of 14 valid genres

### Status validation error?
→ Use `upcoming`, `now_showing`, or `archived` (lowercase, underscore)

### Image won't upload?
→ Check B2 credentials in `.env`

### Image won't display?
→ Set B2 bucket to "Public"

### Old images not deleting?
→ Verify B2 key has delete permissions

## Need More Help?

See detailed documentation:
- [BACKBLAZE_B2_INTEGRATION.md](backend/BACKBLAZE_B2_INTEGRATION.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- [POST_IMPLEMENTATION_CHECKLIST.md](POST_IMPLEMENTATION_CHECKLIST.md)
