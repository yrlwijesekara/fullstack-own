// Quick test script for seat booking APIs
// Run with: node backend/tests/test-seats.js

const API_URL = 'http://localhost:5008';

// Replace these with your actual IDs
const TEST_SHOW_ID = 'YOUR_SHOW_ID_HERE';
const AUTH_COOKIE = 'YOUR_AUTH_COOKIE_HERE'; // Get from browser after login

async function testSeatAPIs() {
  console.log('🧪 Testing Seat Booking APIs...\n');

  try {
    // Test 1: Get Seat Map
    console.log('1️⃣ Testing GET seat map...');
    const mapRes = await fetch(`${API_URL}/api/seats/${TEST_SHOW_ID}`);
    const seats = await mapRes.json();
    console.log(`✅ Found ${seats.length} seats`);
    console.log('Sample seat:', seats[0]);
    console.log('');

    // Test 2: Lock a Seat
    console.log('2️⃣ Testing LOCK seat A1...');
    const lockRes = await fetch(`${API_URL}/api/seats/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        showId: TEST_SHOW_ID,
        seatLabel: 'A1'
      })
    });
    const lockData = await lockRes.json();
    console.log(lockRes.ok ? '✅' : '❌', lockData.message);
    console.log('');

    // Test 3: Verify Lock
    console.log('3️⃣ Verifying seat A1 is locked...');
    const verifyRes = await fetch(`${API_URL}/api/seats/${TEST_SHOW_ID}`);
    const updatedSeats = await verifyRes.json();
    const seatA1 = updatedSeats.find(s => s.seatLabel === 'A1');
    console.log(seatA1.status === 'LOCKED' ? '✅' : '❌', `Seat A1 status: ${seatA1.status}`);
    console.log('');

    // Test 4: Try to Lock Already Locked Seat (Should Fail)
    console.log('4️⃣ Testing lock already locked seat (should fail)...');
    const failRes = await fetch(`${API_URL}/api/seats/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        showId: TEST_SHOW_ID,
        seatLabel: 'A1'
      })
    });
    const failData = await failRes.json();
    console.log(!failRes.ok ? '✅' : '❌', 'Correctly rejected:', failData.message);
    console.log('');

    // Test 5: Confirm Booking
    console.log('5️⃣ Testing CONFIRM booking for A1...');
    const confirmRes = await fetch(`${API_URL}/api/seats/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        showId: TEST_SHOW_ID,
        seatLabel: 'A1'
      })
    });
    const confirmData = await confirmRes.json();
    console.log(confirmRes.ok ? '✅' : '❌', confirmData.message);
    console.log('');

    // Test 6: Lock Another Seat for Unlock Test
    console.log('6️⃣ Testing LOCK seat B1 (for unlock test)...');
    const lockB1Res = await fetch(`${API_URL}/api/seats/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        showId: TEST_SHOW_ID,
        seatLabel: 'B1'
      })
    });
    const lockB1Data = await lockB1Res.json();
    console.log(lockB1Res.ok ? '✅' : '❌', lockB1Data.message);
    console.log('');

    // Test 7: Unlock Seat
    console.log('7️⃣ Testing UNLOCK seat B1...');
    const unlockRes = await fetch(`${API_URL}/api/seats/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': AUTH_COOKIE
      },
      body: JSON.stringify({
        showId: TEST_SHOW_ID,
        seatLabel: 'B1'
      })
    });
    const unlockData = await unlockRes.json();
    console.log(unlockRes.ok ? '✅' : '❌', unlockData.message);
    console.log('');

    // Test 8: Clear Expired Locks
    console.log('8️⃣ Testing CLEAR expired locks...');
    const clearRes = await fetch(`${API_URL}/api/seats/clear-expired`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const clearData = await clearRes.json();
    console.log(clearRes.ok ? '✅' : '❌', clearData.message, `(${clearData.clearedSeats} seats)`);
    console.log('');

    console.log('✨ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
if (TEST_SHOW_ID === 'YOUR_SHOW_ID_HERE' || AUTH_COOKIE === 'YOUR_AUTH_COOKIE_HERE') {
  console.log('⚠️  Please update TEST_SHOW_ID and AUTH_COOKIE in the script first!');
  console.log('');
  console.log('How to get AUTH_COOKIE:');
  console.log('1. Login to your app in browser');
  console.log('2. Open DevTools (F12) → Application → Cookies');
  console.log('3. Copy the cookie value');
} else {
  testSeatAPIs();
}
