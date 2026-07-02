# Event Ticketing Platform - Frontend

A modern React-based frontend for browsing events and booking tickets with interactive seat selection.

## Features

✨ **Core Functionality:**
- Browse upcoming events
- View detailed event information
- Interactive seat map with real-time selection
- Shopping cart with price calculation
- Email-based booking system
- Responsive design for mobile and desktop

🎨 **User Experience:**
- Clean, modern UI with smooth animations
- Real-time seat status feedback (available, selected, booked, on hold)
- Form validation with helpful error messages
- Loading states for better feedback
- Sticky booking form for easy checkout

## Technology Stack

- **Framework:** React 19 with Vite
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Styling:** CSS3 with CSS Variables
- **Package Manager:** npm

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── EventCard.jsx    # Event listing card
│   ├── SeatMap.jsx      # Interactive seat selection
│   └── BookingForm.jsx  # Checkout form
├── pages/               # Page components
│   ├── Events.jsx       # Events listing page
│   └── EventDetails.jsx # Event details & booking page
├── services/            # API integration
│   └── api.js          # Axios instance
├── styles/              # Component stylesheets
│   ├── EventCard.css
│   ├── EventDetails.css
│   ├── Events.css
│   ├── SeatMap.css
│   └── BookingForm.css
├── App.jsx              # Main app component
├── App.css              # Global styles
├── index.css            # CSS variables & base styles
└── main.jsx             # React entry point
```

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.example` to `.env.local` (already done, but verify):
```bash
VITE_API_URL=http://localhost:5000
```

3. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## Component Documentation

### EventCard (`components/EventCard.jsx`)
Displays a single event in card format with:
- Event title, description, and start time
- Link to event details page
- Hover effects and animations

### SeatMap (`components/SeatMap.jsx`)
Interactive seat selection component featuring:
- Organized display of seats by section
- Four seat statuses: available, selected, booked, on hold
- Click to select/deselect available seats
- Visual legend showing seat statuses
- Responsive grid layout

**Props:**
- `sections`: Array of ticket sections
- `seats`: Array of seats with status information
- `selectedSeats`: Currently selected seats (optional)
- `onSeatSelect`: Callback when seat is clicked (optional)

### BookingForm (`components/BookingForm.jsx`)
Checkout form with:
- Email input with validation
- Selected seats summary
- Price breakdown (subtotal, tax, total)
- Submit button with loading state
- Error message display

**Props:**
- `selectedSeats`: Array of selected seat objects
- `totalPrice`: Total price in cents
- `sections`: Array of sections for pricing
- `onBook`: Callback function for booking submission
- `loading`: Loading state boolean
- `error`: Error message string

## API Integration

The frontend communicates with the backend via the API service in `src/services/api.js`.

### Expected API Endpoints

**GET /events**
Returns list of all events
```json
[
  {
    "id": 1,
    "title": "Concert",
    "description": "Amazing concert",
    "starts_at": "2024-07-15T19:00:00Z"
  }
]
```

**GET /events/:id**
Returns event details with sections and seats
```json
{
  "event": {
    "id": 1,
    "title": "Concert",
    "description": "Amazing concert",
    "starts_at": "2024-07-15T19:00:00Z"
  },
  "sections": [
    {
      "id": 1,
      "name": "Floor",
      "price_cents": 5000
    }
  ],
  "seats": [
    {
      "id": 1,
      "section_id": 1,
      "row": "A",
      "number": 1,
      "status": "available"
    }
  ]
}
```

**POST /bookings**
Creates a new booking
```json
{
  "event_id": 1,
  "user_email": "user@example.com",
  "seat_ids": [1, 2, 3],
  "total_cents": 15000
}
```

## Styling System

The app uses CSS variables for consistent theming. Key variables in `src/index.css`:

```css
--text: Main text color
--text-h: Heading text color
--bg: Background color
--border: Border color
--code-bg: Code/secondary background
--accent: Primary action color (purple)
--accent-bg: Accent background (light)
--accent-border: Accent border
--shadow: Box shadow
```

Colors automatically adapt to dark/light mode preferences.

## Error Handling

The frontend includes comprehensive error handling:
- Network error messages with retry options
- Form validation with inline error messages
- API error responses with user-friendly messages
- Loading states to prevent duplicate submissions

## Performance Optimizations

- React Router for efficient client-side routing
- Conditional rendering to avoid unnecessary DOM updates
- CSS Grid for efficient layout rendering
- Sticky positioning for booking form (desktop)
- Responsive images and optimized assets

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Debugging
- Use React DevTools browser extension for component inspection
- Check browser console for API errors
- Network tab shows all API requests

### Hot Module Replacement (HMR)
Changes to components and styles are reflected instantly during development without full page reload.

### Environment Variables
Create a `.env.local` file to override the default API URL:
```
VITE_API_URL=http://your-api-server.com
```

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure the backend has proper CORS headers configured:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### API Connection Issues
1. Check that the backend is running on port 5000
2. Verify the `VITE_API_URL` environment variable is correct
3. Check browser console for detailed error messages

### Styling Issues
Clear browser cache and restart dev server if CSS changes don't appear.

## Future Enhancements

- User authentication and profile management
- Payment integration (Stripe)
- Booking history and ticket management
- Admin dashboard
- Real-time seat availability updates (WebSockets)
- Email confirmation with QR codes
- Mobile app version

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details
