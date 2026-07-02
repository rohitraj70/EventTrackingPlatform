import { useState } from "react";
import "../styles/BookingForm.css";

function BookingForm({
  selectedSeats = [],
  totalPrice = 0,
  sections = [],
  onBook,
  loading = false,
  error = null,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      return;
    }

    onBook();
  };

  const getSeatDetails = () => {
    return selectedSeats.map((seat) => {
      const section = sections.find((s) => s.id === seat.section_id);
      const row = seat.row || seat.row_no || "?";
      const number = seat.number || seat.seat_no || "?";
      return {
        label: `${row}${number}`,
        price: section?.price_cents || 0,
      };
    });
  };

  return (
    <div className="booking-form-wrapper">
      <div className="booking-summary">
        <h3>Booking Summary</h3>

        {selectedSeats.length > 0 ? (
          <>
            <div className="selected-seats">
              <h4>Selected Seats:</h4>
              <div className="seats-list">
                {getSeatDetails().map((seat, idx) => (
                  <div key={idx} className="seat-item">
                    <span className="seat-label">Seat {seat.label}</span>
                    <span className="seat-amount">
                      ₹{(seat.price / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal:</span>
                <span>₹{(totalPrice / 100).toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Tax (0%):</span>
                <span>₹0.00</span>
              </div>
              <div className="price-row total">
                <span>Total:</span>
                <span>₹{(totalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="no-seats">No seats selected</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {error && <div className="form-error">{error}</div>}

        <button
          type="submit"
          className="submit-button"
          disabled={loading || selectedSeats.length === 0}
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
