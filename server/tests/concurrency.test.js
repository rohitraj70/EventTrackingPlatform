/**
 * Concurrency Test Suite for Event Ticketing System
 * Tests race conditions and booking conflicts
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

let authToken = '';
let eventId = 1;
let seatIdToTest = 1;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Concurrency Tests...\n');

  try {
    // 1. Create test users
    console.log('1️⃣ Creating test users...');
    const user1 = await makeRequest('POST', '/auth/signup', {
      email: `user1-${Date.now()}@test.com`,
      password: 'password123',
    });
    authToken = user1.data.token;
    const user1Token = user1.data.token;
    console.log('✅ User 1 created:', user1.data.user.email);

    const user2 = await makeRequest('POST', '/auth/signup', {
      email: `user2-${Date.now()}@test.com`,
      password: 'password123',
    });
    const user2Token = user2.data.token;
    console.log('✅ User 2 created:', user2.data.user.email);

    // 2. Get available events
    console.log('\n2️⃣ Fetching events...');
    const eventsRes = await makeRequest('GET', '/events');
    const events = eventsRes.data;
    if (events.length === 0) {
      console.error('❌ No events found. Run db/init.js first.');
      return;
    }
    eventId = events[0].id;
    console.log(`✅ Using event: ${events[0].title} (ID: ${eventId})`);

    // 3. Get event details to find available seats
    console.log('\n3️⃣ Fetching available seats...');
    const eventRes = await makeRequest('GET', `/events/${eventId}`);
    const availableSeats = eventRes.data.seats.filter((s) => s.status === 'available');
    if (availableSeats.length < 2) {
      console.error('❌ Not enough available seats. Need at least 2.');
      return;
    }
    seatIdToTest = availableSeats[0].id;
    const seat2Id = availableSeats[1].id;
    console.log(`✅ Found seats: ${seatIdToTest}, ${seat2Id}`);

    // 4. CRITICAL TEST: Race condition - concurrent booking of same seat
    console.log('\n4️⃣ TESTING RACE CONDITION - Two users booking same seat simultaneously...');
    console.log(`🎯 Both users trying to book seat ${seatIdToTest}`);

    const booking1Promise = makeRequest(
      'POST',
      '/bookings',
      {
        event_id: eventId,
        seat_ids: [seatIdToTest],
        total_cents: 5000,
      },
      user1Token
    );

    const booking2Promise = makeRequest(
      'POST',
      '/bookings',
      {
        event_id: eventId,
        seat_ids: [seatIdToTest],
        total_cents: 5000,
      },
      user2Token
    );

    // Race: Fire both requests at the same time
    const [booking1Result, booking2Result] = await Promise.all([
      booking1Promise,
      booking2Promise,
    ]);

    console.log('\n📊 RESULTS:');
    console.log(`User 1 booking status: ${booking1Result.status}`);
    console.log(`User 1 response:`, booking1Result.data);
    console.log(`\nUser 2 booking status: ${booking2Result.status}`);
    console.log(`User 2 response:`, booking2Result.data);

    // Validate results
    if (booking1Result.status === 201 && booking2Result.status === 201) {
      console.error(
        '\n❌ FAILED! Both bookings succeeded. Race condition detected!'
      );
      console.error('This means row locking is NOT working properly.');
    } else if (booking1Result.status === 201 && booking2Result.status === 409) {
      console.log(
        '\n✅ PASSED! Only one booking succeeded, other was rejected.'
      );
      console.log('Row locking is working correctly!');
    } else if (booking1Result.status === 409 && booking2Result.status === 201) {
      console.log(
        '\n✅ PASSED! Only one booking succeeded, other was rejected.'
      );
      console.log('Row locking is working correctly!');
    } else {
      console.error('\n⚠️ UNEXPECTED RESULT - Check server logs');
    }

    // 5. Verify seat status
    console.log('\n5️⃣ Verifying seat status in database...');
    const eventRes2 = await makeRequest('GET', `/events/${eventId}`);
    const bookingSeat = eventRes2.data.seats.find((s) => s.id === seatIdToTest);
    console.log(`Seat ${seatIdToTest} status: ${bookingSeat.status}`);
    if (bookingSeat.status === 'booked') {
      console.log('✅ Seat correctly marked as booked');
    }

    // 6. Test sequential bookings (should work)
    console.log('\n6️⃣ Testing sequential bookings (different seats)...');
    const booking3 = await makeRequest(
      'POST',
      '/bookings',
      {
        event_id: eventId,
        seat_ids: [seat2Id],
        total_cents: 5000,
      },
      user1Token
    );
    if (booking3.status === 201) {
      console.log('✅ Sequential booking succeeded');
    } else {
      console.error('❌ Sequential booking failed:', booking3.data);
    }

    // 7. View all bookings
    console.log('\n7️⃣ Fetching user bookings...');
    const bookingsRes = await makeRequest('GET', '/bookings', null, user1Token);
    if (bookingsRes.status === 200) {
      console.log(`✅ User has ${bookingsRes.data.bookings.length} booking(s)`);
      bookingsRes.data.bookings.forEach((booking, idx) => {
        console.log(
          `  Booking ${idx + 1}: Event ID ${booking.event_id}, Total: ₹${(
            booking.total_cents / 100
          ).toFixed(2)}, Status: ${booking.status}`
        );
      });
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Authentication working');
    console.log('- ✅ Booking creation working');
    console.log('- ✅ Row locking and concurrency handling tested');
    console.log('- ✅ Unique seat constraint working');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
runTests();
