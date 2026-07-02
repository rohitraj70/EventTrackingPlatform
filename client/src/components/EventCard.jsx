import { Link } from "react-router-dom";
import "../styles/EventCard.css";

function EventCard({ event }) {
  return (
    <div className="event-card">
      <div className="event-card-content">
        <h2 className="event-title">{event.title}</h2>
        <p className="event-description">{event.description}</p>
        <p className="event-date">
          <strong>Starts:</strong>{" "}
          {new Date(event.starts_at).toLocaleString()}
        </p>
      </div>
      <Link to={`/events/${event.id}`} className="event-card-button">
        View Details →
      </Link>
    </div>
  );
}

export default EventCard;