// Concurrency Test Script for Booking Endpoint
// Run this after starting the server to test race conditions
// Usage: node tests/concurrency-test.js

const axios = require("axios");

const API_URL = "http://localhost:5000";

// Test credentials
const testUser1 = { email: "user1@test.com", password: "password123" };
const testUser2 = { email: "user2@test.com", password: "password123" };

let token1, token2;

async function signup(user) {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, user);
    return response.data.token;
  } catch (error) {
    if (error.response?.status === 409) {
      // User exists, login instead
      const loginResponse = await axios.post(`${API_URL}/auth/login`, user);
      return loginResponse.data.token;
    }
    throw error;
  }
}

async function getEvents() {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
}

async function getEventDetails(eventId) {
  const response = await axios.get(`${API_URL}/events/${eventId}`);
  return response.data;
}

async function bookSeats(token, eventId, seatIds, totalCents) {
  const response = await axios.post(
    `${API_URL}/bookings`,
    {
      event_id: eventId,
      seat_ids: seatIds,
      total_cents: totalCents,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

async function runConcurrencyTest() {
  console.log("🧪 Starting Concurrency Test for Booking System\n");

  try {
    // Step 1: Sign up two users
    console.log("📝 Step 1: Creating test users...");
    token1 = await signup(testUser1);
    token2 = await signup(testUser2);
    console.log("✅ Users created/authenticated\n");

    // Step 2: Get events
    console.log("📋 Step 2: Fetching events...");
    const events = await getEvents();
    if (events.length === 0) {
      console.error("❌ No events available for testing");
      return;
    }
    const eventId = events[0].id;
    console.log(`✅ Using event ID: ${eventId}\n`);

    // Step 3: Get event details to find available seats
    console.log("🪑 Step 3: Fetching available seats...");
    const eventDetails = await getEventDetails(eventId);
    const availableSeats = eventDetails.seats.filter(
      (seat) => seat.status === "available"
    );

    if (availableSeats.length < 2) {
      console.error(
        "❌ Not enough available seats for concurrent test (need at least 2)"
      );
      return;
    }

    const targetSeat1 = availableSeats[0];
    const targetSeat2 = availableSeats[1];
    const targetSection = eventDetails.sections.find(
      (s) => s.id === targetSeat1.section_id
    );

    console.log(`✅ Found seats: ${targetSeat1.row}${targetSeat1.number} and ${targetSeat2.row}${targetSeat2.number}\n`);

    // Step 4: RACE CONDITION TEST - Both users try to book the SAME seat
    console.log("⚔️  Step 4: RACE CONDITION TEST - Attempting concurrent booking of same seat...\n");

    const seatId = targetSeat1.id;
    const totalCents = targetSection.price_cents;

    const bookingPromises = [
      bookSeats(token1, eventId, [seatId], totalCents).then((result) => ({
        user: "User 1",
        ...result,
      })),
      bookSeats(token2, eventId, [seatId], totalCents).then((result) => ({
        user: "User 2",
        ...result,
      })),
    ];

    const results = await Promise.allSettled(bookingPromises);

    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(
          `✅ ${result.value.user}: Booking succeeded! ID: ${result.value.booking_id}`
        );
        successCount++;
      } else {
        console.log(
          `❌ ${index === 0 ? "User 1" : "User 2"}: Booking failed (expected for race condition test)`
        );
        console.log(`   Error: ${result.reason.response?.data?.message || result.reason.message}`);
      }
    });

    console.log("\n📊 RACE CONDITION TEST RESULTS:");
    if (successCount === 1) {
      console.log("✅ PASSED: Only one user got the seat (no double-booking!)");
      console.log("   The database row locking and SERIALIZABLE isolation prevented race condition.");
    } else if (successCount === 0) {
      console.log("⚠️  Both bookings failed - check server logs");
    } else {
      console.log(
        "❌ FAILED: Both users got the same seat! Race condition detected."
      );
      console.log("   The row locking is not working properly.");
    }

    // Step 5: Verify seat status
    console.log("\n🔍 Step 5: Verifying seat status...");
    const updatedDetails = await getEventDetails(eventId);
    const updatedSeat = updatedDetails.seats.find((s) => s.id === seatId);
    console.log(`Seat ${updatedSeat.row}${updatedSeat.number} status: ${updatedSeat.status}`);

    if (updatedSeat.status === "booked") {
      console.log("✅ Seat correctly marked as booked");
    } else {
      console.log("❌ Seat status is incorrect");
    }

    console.log("\n✅ Concurrency test completed!\n");
  } catch (error) {
    console.error("❌ Test error:", error.message);
    if (error.response?.data) {
      console.error("Response:", error.response.data);
    }
  }
}

// Run the test
runConcurrencyTest();
