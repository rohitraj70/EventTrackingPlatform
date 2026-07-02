import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SeatMap from "../components/SeatMap";
import BookingForm from "../components/BookingForm";
import "../styles/EventDetails.css";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/events/${id}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load event details. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSeatSelect = (seat) => {
    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((sum, seat) => {
      const section = data.sections.find((s) => s.id === seat.section_id);
      return sum + (section ? section.price_cents : 0);
    }, 0);
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setBookingError("Please select at least one seat");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const response = await api.post("/bookings", {
        event_id: parseInt(id),
        seat_ids: selectedSeats.map((s) => s.id),
        total_cents: getTotalPrice(),
      });

      if (response.status === 201) {
        alert(`Booking successful! Confirmation ID: ${response.data.booking_id}`);
        setSelectedSeats([]);
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setBookingError(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details-container">
        <div className="loading-spinner">
          <h2>Loading event details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-details-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")}>Back to Events</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="event-details-container">
        <div className="error-message">
          <h2>Event not found</h2>
          <button onClick={() => navigate("/")}>Back to Events</button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      <button className="back-button" onClick={() => navigate("/")}>
        ← Back to Events
      </button>

      <div className="event-details-content">
        <div className="event-info">
          <h1>{data.event.title}</h1>
          <p className="description">{data.event.description}</p>

          <div className="event-meta">
            <p>
              <strong>Starts At:</strong>{" "}
              {new Date(data.event.starts_at).toLocaleString()}
            </p>
            <p>
              <strong>Booking as:</strong> {user?.email}
            </p>
          </div>

          <div className="sections-info">
            <h3>Ticket Categories</h3>
            <ul className="sections-list">
              {data.sections.map((section) => (
                <li key={section.id}>
                  <span className="section-name">{section.name}</span>
                  <span className="section-price">
                    ₹{(section.price_cents / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="booking-section">
          <div className="seat-map-container">
            <h2>Select Your Seats</h2>
            <SeatMap
              sections={data.sections}
              seats={data.seats}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
            />
          </div>

          <div className="booking-form-container">
            <BookingForm
              selectedSeats={selectedSeats}
              totalPrice={getTotalPrice()}
              sections={data.sections}
              onBook={handleBooking}
              loading={bookingLoading}
              error={bookingError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;