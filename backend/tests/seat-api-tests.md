# Seat Booking API Testing Guide

## Prerequisites
1. Start your backend server: `npm start` or `node server.js`
2. Have at least one Hall created
3. Have at least one Show/Showtime created
4. Login to get authentication cookie/token

---

## Test Sequence

### 1. Initialize Seats for a Show (Admin)
**POST** `http://localhost:5008/api/seats/initialize`

**Headers:**
```
Content-Type: application/json
Cookie: [your auth cookie]
```

**Body:**
```json
{
  "showId": "YOUR_SHOW_ID_HERE"
}
```

**Expected Response:**
```json
{
  "message": "Seats initialized",
  "totalSeats": 50
}
```

---

### 2. Get Seat Map (Public)
**GET** `http://localhost:5008/api/seats/YOUR_SHOW_ID_HERE`

**Expected Response:**
```json
[
  {
    "seatLabel": "A1",
    "status": "AVAILABLE",
    "userId": null,
    "lockedAt": null
  },
  {
    "seatLabel": "A2",
    "status": "AVAILABLE",
    "userId": null,
    "lockedAt": null
  }
  // ... more seats
]
```

---

### 3. Lock a Seat (User)
**POST** `http://localhost:5008/api/seats/lock`

**Headers:**
```
Content-Type: application/json
Cookie: [your auth cookie]
```

**Body:**
```json
{
  "showId": "YOUR_SHOW_ID_HERE",
  "seatLabel": "A1"
}
```

**Expected Response:**
```json
{
  "message": "Seat locked"
}
```

**Verify:** Call GET seat map again - A1 should show `"status": "LOCKED"`

---

### 4. Try to Lock Same Seat (Another User) - Should Fail
**POST** `http://localhost:5008/api/seats/lock`

**Body:**
```json
{
  "showId": "YOUR_SHOW_ID_HERE",
  "seatLabel": "A1"
}
```

**Expected Response (409):**
```json
{
  "message": "Seat not available"
}
```

---

### 5. Confirm Booking (Original User)
**POST** `http://localhost:5008/api/seats/confirm`

**Headers:**
```
Content-Type: application/json
Cookie: [your auth cookie]
```

**Body:**
```json
{
  "showId": "YOUR_SHOW_ID_HERE",
  "seatLabel": "A1"
}
```

**Expected Response:**
```json
{
  "message": "Seat booked"
}
```

**Verify:** A1 should now show `"status": "BOOKED"`

---

### 6. Unlock a Seat (User Cancels)
**POST** `http://localhost:5008/api/seats/unlock`

**Headers:**
```
Content-Type: application/json
Cookie: [your auth cookie]
```

**Body:**
```json
{
  "showId": "YOUR_SHOW_ID_HERE",
  "seatLabel": "B1"
}
```

**Expected Response:**
```json
{
  "message": "Seat unlocked"
}
```

---

### 7. Clear Expired Locks (System/Cron)
**POST** `http://localhost:5008/api/seats/clear-expired`

**Expected Response:**
```json
{
  "message": "Expired locks cleared",
  "clearedSeats": 0
}
```

**To Test Timeout:**
1. Lock a seat
2. Manually change `lockedAt` in database to 15 minutes ago
3. Call clear-expired
4. Check if seat is now AVAILABLE

---

## Testing WebSocket Real-Time Updates

### Setup:
1. Open two browser tabs/windows
2. Open browser console in both (F12)
3. Connect to WebSocket in both:

```javascript
const socket = io('http://localhost:5008');
socket.emit('joinShow', 'YOUR_SHOW_ID_HERE');

socket.on('seatUpdate', (data) => {
  console.log('Seat updated:', data);
});
```

### Test:
- In Tab 1: Lock a seat via API
- In Tab 2: Console should show: `Seat updated: {seatLabel: 'A1', status: 'LOCKED'}`

---

## Quick MongoDB Verification

```javascript
// Check Show document in MongoDB
db.shows.findOne({ _id: ObjectId("YOUR_SHOW_ID") })

// Should see:
{
  _id: ...,
  hallId: ...,
  showTime: ...,
  seats: [
    { seatLabel: "A1", status: "LOCKED", userId: ..., lockedAt: ... },
    { seatLabel: "A2", status: "AVAILABLE", userId: null, lockedAt: null }
  ]
}
```

---

## Common Issues

❌ **"Show not found"** → Initialize seats first
❌ **"Unauthorized"** → Make sure you're logged in and sending auth cookie
❌ **"Seat not available"** → Seat is already locked/booked
❌ **No WebSocket updates** → Check if Socket.io is properly configured in server.js
