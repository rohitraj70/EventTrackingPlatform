const pool = require("./connection");

async function initDatabase() {
  try {
    console.log("Initializing database...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        starts_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price_cents INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        row VARCHAR(10) NOT NULL,
        number INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        held_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section_id, row, number)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'confirmed',
        total_cents INTEGER,
        idempotency_key VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_seats (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_id, seat_id)
      );
    `);

    console.log("Tables created.");

    const venues = await pool.query("SELECT COUNT(*) FROM venues");

    if (parseInt(venues.rows[0].count) === 0) {

      console.log("Inserting sample data...");

      const venue = await pool.query(
        `INSERT INTO venues(name,address)
        VALUES($1,$2)
        RETURNING id`,
        ["Grand Theater", "123 Main Street"]
      );

      const venueId = venue.rows[0].id;

      const event = await pool.query(
        `INSERT INTO events
        (venue_id,title,description,starts_at)
        VALUES($1,$2,$3,$4)
        RETURNING id`,
        [
          venueId,
          "Live Concert",
          "Amazing Live Concert",
          new Date()
        ]
      );

      const floor = await pool.query(
        `INSERT INTO sections
        (venue_id,name,price_cents)
        VALUES($1,$2,$3)
        RETURNING id`,
        [venueId, "Floor", 5000]
      );

      const balcony = await pool.query(
        `INSERT INTO sections
        (venue_id,name,price_cents)
        VALUES($1,$2,$3)
        RETURNING id`,
        [venueId, "Balcony", 3000]
      );

      const floorId = floor.rows[0].id;
      const balconyId = balcony.rows[0].id;

      for (let r = 0; r < 3; r++) {

        const row = String.fromCharCode(65 + r);

        for (let i = 1; i <= 10; i++) {

          await pool.query(
            `INSERT INTO seats(section_id,row,number,status)
             VALUES($1,$2,$3,'available')`,
            [floorId, row, i]
          );

        }

      }

      for (let r = 0; r < 2; r++) {

        const row = String.fromCharCode(65 + r);

        for (let i = 1; i <= 8; i++) {

          await pool.query(
            `INSERT INTO seats(section_id,row,number,status)
             VALUES($1,$2,$3,'available')`,
            [balconyId, row, i]
          );

        }

      }

      console.log("Sample data inserted.");
    }

    console.log("Database ready.");

  } catch (err) {

    console.error(err);
    throw err;

  }
}

module.exports = initDatabase;