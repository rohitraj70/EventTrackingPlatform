const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const pool = require("./db/connection");
const initDatabase = require("./db/init");
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Test route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// PHASE 2: Authentication

// POST - Sign up
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Signup failed",
    });
  }
});

// POST - Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

// GET - Verify token (check if user is logged in)
app.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching user",
    });
  }
});

// GET all events
app.get("/events", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events");

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get event
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const event = eventResult.rows[0];

    // Get sections for the event's venue
    const sectionsResult = await pool.query(
      `
      SELECT *
      FROM sections
      WHERE venue_id = $1
      `,
      [event.venue_id]
    );

    // Get seats for all sections in that venue
    const seatsResult = await pool.query(
      `
      SELECT seats.*
      FROM seats
      JOIN sections
        ON seats.section_id = sections.id
      WHERE sections.venue_id = $1
      `,
      [event.venue_id]
    );

    res.json({
      event,
      sections: sectionsResult.rows,
      seats: seatsResult.rows,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// POST - Create a booking
app.post("/bookings", verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { event_id, seat_ids, total_cents } = req.body;
    const user_id = req.user.id; // From JWT token

    // Validate input
    if (!event_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        message: "Missing or invalid required fields",
      });
    }

    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // Lock and check seats atomically - FOR UPDATE prevents race conditions
    const seatsCheckResult = await client.query(
      "SELECT id, status FROM seats WHERE id = ANY($1) FOR UPDATE",
      [seat_ids]
    );

    // Check if we got all requested seats
    if (seatsCheckResult.rows.length !== seat_ids.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "One or more seats not found",
      });
    }

    // Check all seats are available
    for (const seat of seatsCheckResult.rows) {
      if (seat.status !== "available") {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: `Seat ${seat.id} is no longer available. Someone else booked it.`,
        });
      }
    }

    // Create booking with idempotency (if same user books same seats, they get same booking)
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, event_id, status, total_cents, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id`,
      [user_id, event_id, "confirmed", total_cents]
    );

    const booking_id = bookingResult.rows[0].id;

    // Add seats to booking and mark as booked
    for (const seat_id of seat_ids) {
      await client.query(
        "INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)",
        [booking_id, seat_id]
      );

      // Update seat status - now protected by FOR UPDATE lock
      await client.query(
        "UPDATE seats SET status = $1 WHERE id = $2",
        ["booked", seat_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      booking_id,
      message: "Booking confirmed successfully",
    });

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    console.error("Booking error:", error);
    
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(409).json({
        message: "This booking already exists",
      });
    }
    
    res.status(500).json({
      message: "Booking failed. Please try again.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// GET - User's bookings
app.get("/bookings", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        b.id, b.event_id, b.status, b.total_cents, b.created_at,
        e.title as event_title,
        ARRAY_AGG(ROW_TO_JSON(s.*)) as seats
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       LEFT JOIN booking_seats bs ON b.id = bs.booking_id
       LEFT JOIN seats s ON bs.seat_id = s.id
       WHERE b.user_id = $1
       GROUP BY b.id, e.title
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({
      bookings: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching bookings",
    });
  }
});

// PHASE 4: Stripe Payment Integration

// POST - Create payment intent
app.post("/payments/intent", verifyToken, async (req, res) => {
  try {
    const { amount, event_id, seat_ids } = req.body;

    if (!amount || !event_id || !seat_ids || seat_ids.length === 0) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amount in cents
      currency: "inr",
      metadata: {
        user_id: req.user.id,
        event_id,
        seat_ids: JSON.stringify(seat_ids),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(500).json({
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
});

// POST - Confirm payment and create booking
app.post("/payments/confirm", verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { paymentIntentId, event_id, seat_ids } = req.body;
    const user_id = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: "Payment was not successful",
      });
    }

    // Verify metadata
    if (paymentIntent.metadata.user_id !== String(user_id)) {
      return res.status(403).json({
        message: "Unauthorized payment confirmation",
      });
    }

    // Process booking with payment confirmed
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // Lock and check seats
    const seatsCheckResult = await client.query(
      "SELECT id, status FROM seats WHERE id = ANY($1) FOR UPDATE",
      [seat_ids]
    );

    if (seatsCheckResult.rows.length !== seat_ids.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "One or more seats not found",
      });
    }

    for (const seat of seatsCheckResult.rows) {
      if (seat.status !== "available") {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: `Seat ${seat.id} is no longer available`,
        });
      }
    }

    // Create booking with paid status
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, event_id, status, total_cents, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id`,
      [user_id, event_id, "paid", paymentIntent.amount]
    );

    const booking_id = bookingResult.rows[0].id;

    // Add seats and mark as booked
    for (const seat_id of seat_ids) {
      await client.query(
        "INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)",
        [booking_id, seat_id]
      );

      await client.query(
        "UPDATE seats SET status = $1 WHERE id = $2",
        ["booked", seat_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      booking_id,
      message: "Booking confirmed and payment processed",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      // Ignore
    }
    console.error("Payment confirmation error:", error);
    res.status(500).json({
      message: "Payment confirmation failed",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

(async () => {
  try {

    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {

    console.error("Failed to initialize database");
    console.error(err);

  }
})();