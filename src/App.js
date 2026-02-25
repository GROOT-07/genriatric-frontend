import React, { useState, useEffect, useCallback } from "react";
import SlotBooking from "./SlotBooking";
import AdminView from "./AdminView";
import "./styles.css";

const API = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [tab, setTab] = useState("book"); // "book" | "admin"
  const [bookings, setBookings] = useState([]);
  const [loadError, setLoadError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/bookings`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setBookings(data);
      setLoadError("");
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setLoadError("Cannot connect to server. Please try again later.");
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <div>
          <h1>🏥 Senior Health Centre</h1>
          <p>Consultation Slot Booking — Mon to Sat</p>
        </div>
        <div className="helpline">Helpline: <strong>1800-XXX-XXXX</strong></div>
      </header>

      {/* Navigation */}
      <div className="main-container">
        <nav className="nav-tabs" role="tablist" aria-label="Main navigation">
          <button
            role="tab"
            aria-selected={tab === "book"}
            className={`nav-tab${tab === "book" ? " active" : ""}`}
            onClick={() => setTab("book")}
          >
            📅 Book Appointment
          </button>
          <button
            role="tab"
            aria-selected={tab === "admin"}
            className={`nav-tab${tab === "admin" ? " active" : ""}`}
            onClick={() => setTab("admin")}
          >
            🔒 Admin View
          </button>
        </nav>

        {loadError && (
          <div className="alert alert-error" role="alert">
            ⚠️ {loadError}
          </div>
        )}

        {tab === "book" ? (
          <SlotBooking
            bookings={bookings}
            onBooked={fetchBookings}
          />
        ) : (
          <AdminView
            bookings={bookings}
            onDelete={fetchBookings}
          />
        )}
      </div>
    </div>
  );
}

export default App;
