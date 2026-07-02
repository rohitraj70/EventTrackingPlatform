import "../styles/SeatMap.css";

function SeatMap({ sections, seats, selectedSeats = [], onSeatSelect }) {
  const isSelected = (seatId) =>
    selectedSeats.some((seat) => seat.id === seatId);

  const getSeatStatus = (seat) => {
    if (isSelected(seat.id)) return "selected";
    if (seat.status === "booked") return "booked";
    if (seat.status === "held") return "held";
    return "available";
  };

  const handleSeatClick = (seat) => {
    if (seat.status === "available" && onSeatSelect) {
      onSeatSelect(seat);
    }
  };

  return (
    <div className="seat-map">
      {sections.map((section) => (
        <div key={section.id} className="section-block">
          <div className="section-header">
            <h3>
              {section.name}
              <span className="section-price">₹{(section.price_cents / 100).toFixed(2)}</span>
            </h3>
          </div>

          <div className="seat-grid">
            {seats
              .filter((seat) => seat.section_id === section.id)
              .sort((a, b) => {
                const rowA = a.row || a.row_no || "";
                const rowB = b.row || b.row_no || "";
                const numA = a.number || a.seat_no || 0;
                const numB = b.number || b.seat_no || 0;
                if (rowA !== rowB) return rowA.localeCompare(rowB);
                return numA - numB;
              })
              .map((seat) => {
                const status = getSeatStatus(seat);
                const row = seat.row || seat.row_no || "?";
                const number = seat.number || seat.seat_no || "?";
                return (
                  <button
                    key={seat.id}
                    className={`seat seat-${status}`}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status !== "available"}
                    title={`Seat ${row}${number} - ${status}`}
                  >
                    <span className="seat-label">
                      {row}
                      {number}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-seat seat-available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat seat-selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat seat-booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat seat-held"></div>
          <span>On Hold</span>
        </div>
      </div>
    </div>
  );
}

export default SeatMap;