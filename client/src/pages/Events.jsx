import { useEffect, useState } from "react";
import api from "../services/api";
import EventCard from "../components/EventCard";
import "../styles/Events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/events")
      .then((res) => {
        setEvents(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load events. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="events-container">
        <div className="loading-spinner">
          <h2>Loading events...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="events-container">
        <div className="no-events">
          <h2>No events available</h2>
          <p>Check back later for upcoming events!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-container">
      <div className="events-header">
        <h1>Upcoming Events</h1>
        <p>Choose an event to book your tickets</p>
      </div>
      <div className="events-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default Events;