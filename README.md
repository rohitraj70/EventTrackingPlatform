# Event Ticketing Platform

A full-stack final-year project demonstrating real backend engineering concepts through building a complete event ticketing system.

**🎯 Core Learning Objectives:**
- REST API design and database transactions
- Authentication with JWT and password hashing
- Race condition prevention with row locking
- Payment processing with Stripe
- Responsive React frontend
- Docker deployment

**📹 Video Demo:** Coming soon

---

## 🚀 Quick Start

### Option 1: Docker (Recommended - Easiest)

```bash
# Clone the repository
git clone <repo-url>
cd EventTicketingPlatform

# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# Database: localhost:5432 (PostgreSQL)
# Cache: localhost:6379 (Redis)
```

### Option 2: Local Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for caching)

#### Backend Setup
```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Initialize database
npm run init

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

#### Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 📂 Project Structure

```
EventTicketingPlatform/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── styles/            # Component CSS
│   │   ├── context/           # Auth context
│   │   └── App.jsx            # Main app
│   ├── Dockerfile
│   └── package.json
│
├── server/                    # Node.js + Express backend
│   ├── db/
│   │   ├── connection.js      # PostgreSQL pool
│   │   └── init.js            # Database initialization
│   ├── tests/
│   │   └── concurrency-test.js # Race condition testing
│   ├── index.js               # Main server file
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Multi-container orchestration
└── README.md                  # This file
```

---

## 🔑 Key Features

### Phase 1: Browse Events ✅
- [x] Event listing page
- [x] Event details with seat map
- [x] Interactive seat selection
- [x] Responsive design

### Phase 2: Authentication ✅
- [x] User signup with email
- [x] Login with password hashing (bcryptjs)
- [x] JWT token management
- [x] Protected routes

### Phase 3: Booking (with Race Condition Safety) ✅
- [x] Seat selection and booking
- [x] Database transactions (SERIALIZABLE isolation)
- [x] Row locking with SELECT...FOR UPDATE
- [x] Prevents double-booking
- [x] Concurrency test suite

### Phase 4: Stripe Payments 🔄
- [ ] Create payment intent
- [ ] Payment processing
- [ ] Webhook handling (TODO)
- [ ] Order status tracking

### Phase 5+: Advanced Features (Stretch Goals)
- [ ] Caching with Redis
- [ ] Email notifications via job queue
- [ ] WebSocket real-time updates
- [ ] Admin dashboard
- [ ] Load testing

---

## 🧪 Testing

### Run Concurrency Test
```bash
cd server
node tests/concurrency-test.js
```

This tests that two users cannot book the same seat simultaneously. The test verifies:
- ✅ Database row locking works
- ✅ SERIALIZABLE isolation level prevents anomalies
- ✅ Only one user gets each seat

---

## 🔐 Security Features

- **Password Hashing:** bcryptjs with salt rounds 10
- **JWT Authentication:** Stateless, expiring tokens
- **Database Transactions:** SERIALIZABLE isolation + row locking
- **CORS:** Configured for frontend origin
- **SQL Injection Protection:** Parameterized queries

---

## 📊 Database Schema

```sql
-- Venues
venues (id, name, address, created_at)

-- Events
events (id, venue_id, title, description, starts_at, status, created_at)

-- Ticket Categories
sections (id, venue_id, name, price_cents, created_at)

-- Individual Seats
seats (id, section_id, row, number, status, created_at)
  └─ status: 'available' | 'held' | 'booked'

-- Users
users (id, email, password_hash, created_at)

-- Bookings
bookings (id, user_id, event_id, status, total_cents, created_at)
  └─ status: 'pending' | 'confirmed' | 'paid' | 'cancelled'

-- Booking-Seat Relationship
booking_seats (id, booking_id, seat_id, created_at)
```

---

## 🛠️ API Endpoints

### Authentication
```bash
POST   /auth/signup              # Register user
POST   /auth/login               # Login user
GET    /auth/me                  # Get current user (requires auth)
```

### Events
```bash
GET    /events                   # List all events
GET    /events/:id               # Get event details with seats
```

### Bookings
```bash
POST   /bookings                 # Create booking (requires auth)
GET    /bookings                 # Get user's bookings (requires auth)
```

### Payments (Stripe)
```bash
POST   /payments/intent          # Create payment intent
POST   /payments/confirm         # Confirm payment and create booking
```

---

## 🚢 Deployment

### Deploy to Render

1. **Backend:**
   - Connect GitHub repo
   - Set environment variables (DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY)
   - Deploy

2. **Frontend:**
   - Connect GitHub repo
   - Set VITE_API_URL to backend URL
   - Deploy

### Deploy to Railway

Similar process - set environment variables in the Railway dashboard.

### Manual VPS Deployment

```bash
# On VPS
git clone <repo>
cd EventTicketingPlatform

docker-compose up -d

# Nginx reverse proxy configuration included in deployment guide
```

---

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host/dbname
JWT_SECRET=your-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (.env.local)
```
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432

Solution:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL is correct
3. Verify credentials in connection.js
```

### Token Invalid
```
Error: Invalid token

Solution:
1. Check JWT_SECRET is consistent
2. Ensure token hasn't expired (7 days)
3. Verify Authorization header format: "Bearer <token>"
```

### Race Condition Test Fails
```
Both users got the same seat!

Solution:
1. Check SERIALIZABLE isolation level is set
2. Verify SELECT...FOR UPDATE is in booking query
3. Check database isn't in autocommit mode
```

---

## 📚 Learning Resources

- [Node.js & Express](https://expressjs.com/)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [JWT Authentication](https://jwt.io/)
- [React Context](https://react.dev/reference/react/useContext)
- [Stripe Documentation](https://stripe.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🎓 Interview Talking Points

1. **Race Conditions:** Explain how SELECT...FOR UPDATE prevents double-booking
2. **Transactions:** Discuss SERIALIZABLE isolation level and ACID properties
3. **Authentication:** JWT vs Sessions tradeoffs
4. **API Design:** RESTful endpoints and status codes
5. **Database:** Foreign keys, indexes, and query optimization
6. **Deployment:** Docker, environment variables, CI/CD

---

## 📄 License

MIT - See LICENSE file

---

## 👤 Author

**Your Name**
- Final Year Project
- [GitHub](https://github.com)
- [LinkedIn](https://linkedin.com)

---

## 🙏 Acknowledgments

- **Project Template:** Event Ticketing Platform - Final Year Project Plan
- **Technologies:** Node.js, React, PostgreSQL, Stripe
- **Community:** Open-source contributors

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API documentation
3. Open an issue on GitHub
4. Check server logs: `docker logs ticketing-backend`

---

**Made with ❤️ for learning backend engineering concepts**
