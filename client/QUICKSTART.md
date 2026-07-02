# Quick Start Guide - Event Ticketing Platform Frontend

## Installation & Running

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Configure Environment
The `.env.local` file is already set up with:
```
VITE_API_URL=http://localhost:5000
```

Change this if your backend runs on a different port.

### Step 3: Start Development Server
```bash
npm run dev
```

The app will open at: `http://localhost:5173`

---

## Testing the Frontend

### 1. **Events Listing Page** (Home)
- Visit: `http://localhost:5173`
- Shows all available events
- Click "View Details →" on any event card

### 2. **Event Details & Booking**
- View event information
- See ticket categories and prices
- **Select seats** by clicking on available seats (white)
- **Deselect seats** by clicking again
- **Booking Summary** updates in real-time with:
  - Selected seats list
  - Price breakdown
  - Total cost

### 3. **Booking Form**
- Enter your email address
- Click "Confirm Booking"
- If successful, you'll see: `Booking successful! Confirmation ID: XXX`
- Redirects back to events list

---

## File Structure Overview

```
client/
├── src/
│   ├── components/         # Reusable components
│   │   ├── EventCard.jsx
│   │   ├── SeatMap.jsx
│   │   └── BookingForm.jsx
│   ├── pages/             # Page components
│   │   ├── Events.jsx
│   │   └── EventDetails.jsx
│   ├── services/          # API calls
│   │   └── api.js
│   ├── styles/            # Component CSS
│   │   ├── EventCard.css
│   │   ├── EventDetails.css
│   │   ├── Events.css
│   │   ├── SeatMap.css
│   │   └── BookingForm.css
│   ├── App.jsx            # Main app
│   ├── index.css          # Global styles
│   ├── App.css
│   └── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite config
├── .env.local             # Environment variables
├── .env.example           # Example env file
├── eslint.config.js       # Linting
└── FRONTEND.md            # Full documentation
```

---

## Features Implemented

✅ **Event Listing**
- Fetches events from API
- Display in card format
- Shows loading and error states

✅ **Event Details**
- Detailed event information
- Ticket categories with prices
- Back button for navigation

✅ **Interactive Seat Map**
- Visual seat grid by section
- 4 seat statuses with colors:
  - White: Available
  - Purple: Selected
  - Gray: Booked
  - Yellow: On Hold
- Seat legend for clarity

✅ **Booking Cart**
- Shows selected seats
- Real-time price calculation
- Subtotal, tax, total display

✅ **Booking Form**
- Email validation
- Submit with loading state
- Success messages

✅ **UI/UX**
- Responsive design (mobile + desktop)
- Dark mode support (auto)
- Smooth animations
- Error handling with user messages
- Loading spinners

---

## API Endpoints Used

The frontend expects these endpoints from the backend:

### GET /events
Returns list of all upcoming events
```json
[
  {
    "id": 1,
    "title": "Concert",
    "description": "...",
    "starts_at": "2024-07-15T19:00:00Z"
  }
]
```

### GET /events/:id
Returns event details with sections and seats
```json
{
  "event": { ... },
  "sections": [ ... ],
  "seats": [ ... ]
}
```

### POST /bookings
Creates a booking
```json
{
  "event_id": 1,
  "user_email": "user@example.com",
  "seat_ids": [1, 2, 3],
  "total_cents": 15000
}
```

---

## Common Issues & Solutions

### API Connection Failed
- ❌ **Problem:** Shows "Failed to load events"
- ✅ **Solution:** Make sure backend is running on port 5000
  ```bash
  cd server
  npm run dev
  ```

### CORS Errors
- ❌ **Problem:** Cross-Origin request blocked
- ✅ **Solution:** Check backend CORS configuration

### Styling Not Applied
- ❌ **Problem:** Missing colors or layout broken
- ✅ **Solution:** Restart dev server
  ```bash
  npm run dev
  ```

### Environment Variable Not Loading
- ❌ **Problem:** API_URL is undefined
- ✅ **Solution:** Check `.env.local` file exists with correct content

---

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder. Deploy this to your hosting.

---

## Next Steps

1. ✅ Frontend is complete!
2. Ensure backend is fully implemented
3. Test the full booking flow
4. Add payment integration (Phase 4)
5. Add user authentication (Phase 5)

---

## Need Help?

Check `FRONTEND.md` for detailed documentation on:
- Component APIs
- API integration
- Styling system
- Performance tips
- Troubleshooting

Happy coding! 🚀
