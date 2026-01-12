# Backward Compatibility Update

## Overview
Updated frontend to fetch movies with both old and new status values for backward compatibility with existing database records.

## Changes Made

### [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
**Before**: Only fetched `now_showing` status
**After**: Fetches both `now_showing` and `Now Showing` statuses

- Fetches movies with both status values in parallel
- Combines results and removes duplicates by movie ID
- Maintains limit of 5 featured movies and 8 now showing movies

### [frontend/src/pages/Movies.jsx](frontend/src/pages/Movies.jsx)
**Before**: Only fetched new status values
**After**: Fetches both old and new status values

Status mapping:
- **Now Showing tab**: Fetches `now_showing` + `Now Showing`
- **Coming Soon tab**: Fetches `upcoming` + `Coming Soon`

## How It Works

### Parallel Fetching
```javascript
const [dataNew, dataOld] = await Promise.all([
  fetchMovies({ status: 'now_showing', limit: 100 }),
  fetchMovies({ status: 'Now Showing', limit: 100 })
]);
```

### Deduplication
```javascript
const uniqueMovies = allMovies.filter((movie, index, self) => 
  index === self.findIndex((m) => m._id === movie._id)
);
```

## Benefits

✅ **Backward Compatible**: Works with existing movies that have old status values
✅ **No Data Loss**: All movies are displayed regardless of status format
✅ **Seamless Migration**: No need to update existing database records immediately
✅ **Performance**: Uses Promise.all for parallel requests
✅ **Duplicate Prevention**: Automatically removes duplicate movies

## Migration Path

### Immediate (Now):
- Frontend works with both old and new status values
- No database changes required
- Existing movies remain accessible

### Optional Future Steps:
1. Run a database migration to update all old status values to new format:
   ```javascript
   // Example migration script
   db.movies.updateMany(
     { status: 'Now Showing' },
     { $set: { status: 'now_showing' } }
   );
   db.movies.updateMany(
     { status: 'Coming Soon' },
     { $set: { status: 'upcoming' } }
   );
   db.movies.updateMany(
     { status: 'Archived' },
     { $set: { status: 'archived' } }
   );
   ```

2. After all records are updated, remove the backward compatibility code

## Testing

### Test Cases:
1. ✅ Movies with `now_showing` status display in Now Showing tab
2. ✅ Movies with `Now Showing` status display in Now Showing tab
3. ✅ Movies with `upcoming` status display in Coming Soon tab
4. ✅ Movies with `Coming Soon` status display in Coming Soon tab
5. ✅ No duplicate movies appear
6. ✅ Featured movies carousel works with both status formats

### Verify:
```bash
# Test that both status values work
curl "http://localhost:5009/api/movies?status=now_showing"
curl "http://localhost:5009/api/movies?status=Now%20Showing"
curl "http://localhost:5009/api/movies?status=upcoming"
curl "http://localhost:5009/api/movies?status=Coming%20Soon"
```

## Performance Impact

- **Minimal**: Uses Promise.all for parallel requests
- **Network**: 2 requests instead of 1 per page load
- **Processing**: Simple array deduplication is very fast
- **Overall**: Negligible impact on user experience

## When to Remove Backward Compatibility

Remove this code when:
1. All existing movies have been updated to new status values
2. Confirmed no movies use old format in production database
3. Database migration completed and verified

To remove, revert to single status query:
```javascript
// Simple version (after migration)
const data = await fetchMovies({ status: 'now_showing', limit: 8 });
```

## Status Values Reference

### Old Format (Still Supported):
- `'Now Showing'`
- `'Coming Soon'`
- `'Archived'`

### New Format (Preferred):
- `'now_showing'`
- `'upcoming'`
- `'archived'`

Both formats work in the frontend and backend! 🎉
