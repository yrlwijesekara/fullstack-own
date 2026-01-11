# 🧪 Postman Testing Guide

## Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `Seat-Booking-API.postman_collection.json`
4. Collection "Seat Booking API Tests" will appear in sidebar

## Step 2: Setup Variables

1. Click on the collection name
2. Go to **Variables** tab
3. Update these values:

| Variable | Current Value | Your Value |
|----------|---------------|------------|
| `BASE_URL` | `http://localhost:5008` | (Keep if running locally) |
| `SHOW_ID` | `REPLACE_WITH_YOUR_SHOW_ID` | Get from your database or admin panel |

### How to Get SHOW_ID:

**Option A - From MongoDB:**
```javascript
db.shows.findOne()
// Copy the _id value
```

**Option B - From API:**
```
GET http://localhost:5008/api/showtimes
// Find a show and copy its _id
```

**Option C - Create new showtime:**
- Go to admin dashboard
- Create a new showtime
- Copy the ID from the response

## Step 3: Login First

Before testing, you need to authenticate:

1. **Login via your app** (or use Postman):
   ```
   POST http://localhost:5008/api/auth/login
   Body: {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```

2. Postman will **automatically save cookies** from login
3. All subsequent requests will use those cookies for auth

## Step 4: Run Tests in Order

Execute requests **in sequence**:

### ✅ Request 1: Initialize Seats
- Click **"1. Initialize Seats (Admin)"**
- Click **Send**
- Expected: `{ "message": "Seats initialized", "totalSeats": 50 }`

### ✅ Request 2: Get Seat Map
- Click **"2. Get Seat Map (Public)"**
- Click **Send**
- Expected: Array of seats `[{ seatLabel: "A1", status: "AVAILABLE", ... }]`

### ✅ Request 3: Lock Seat A1
- Click **"3. Lock Seat A1 (User)"**
- Click **Send**
- Expected: `{ "message": "Seat locked" }`

### ✅ Request 4: Verify Lock
- Run **Request 2** again
- Check seat A1 has `"status": "LOCKED"`

### ✅ Request 5: Try Lock A1 Again (Should Fail)
- Expected: `409 Error` - "Seat not available"

### ✅ Request 6: Confirm Booking
- Click **"6. Confirm Booking A1"**
- Expected: `{ "message": "Seat booked" }`
- Verify: A1 now shows `"status": "BOOKED"`

### ✅ Request 7: Test Unlock
- First run **"4. Lock Seat A2"**
- Then run **"7. Unlock Seat A2"**
- Expected: A2 returns to `"AVAILABLE"`

### ✅ Request 8: Clear Expired Locks
- Click **"8. Clear Expired Locks"**
- Expected: `{ "message": "Expired locks cleared", "clearedSeats": 0 }`

## Expected Test Flow:

```
1. Initialize → Creates all seats as AVAILABLE
2. Get Map → Shows all AVAILABLE seats
3. Lock A1 → A1 becomes LOCKED
4. Lock A2 → A2 becomes LOCKED
5. Try Lock A1 → ❌ FAILS (already locked)
6. Confirm A1 → A1 becomes BOOKED
7. Unlock A2 → A2 becomes AVAILABLE
8. Clear Expired → Releases any locks > 10 min old
```

## Troubleshooting:

❌ **401 Unauthorized** 
- Login first to get authentication cookie

❌ **404 Show not found**
- Update `SHOW_ID` variable with valid ID

❌ **"Seats already initialized"**
- This is OK, seats are already created

❌ **409 Seat not available**
- Someone already locked that seat
- Try a different seat label (A2, B1, etc.)

❌ **403 Unauthorized (unlock/confirm)**
- Only the user who locked the seat can unlock/confirm it
- Use same auth session for lock and confirm

## Testing WebSocket Real-Time Updates:

1. Open two browser tabs
2. In console of both tabs:
```javascript
const socket = io('http://localhost:5008');
socket.emit('joinShow', 'YOUR_SHOW_ID');
socket.on('seatUpdate', data => console.log('🔥 Real-time:', data));
```
3. Lock a seat in Postman
4. Both browser tabs should log: `🔥 Real-time: {seatLabel: 'A1', status: 'LOCKED'}`

## Quick Commands:

### Reset all seats to AVAILABLE (MongoDB):
```javascript
db.shows.updateOne(
  { _id: ObjectId("YOUR_SHOW_ID") },
  { $set: { "seats.$[].status": "AVAILABLE", "seats.$[].userId": null } }
)
```

### Check current seat status:
```javascript
db.shows.findOne(
  { _id: ObjectId("YOUR_SHOW_ID") },
  { seats: 1 }
)
```

---

**Ready to test! Start with Request 1 and work your way down. Good luck! 🚀**
