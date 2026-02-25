import React, { useState, useEffect, useCallback } from "react";
import SlotBooking from "./SlotBooking";
import AdminView from "./AdminView";

const API = process.env.REACT_APP_BACKEND_URL;

export default function App() {
  const [tab, setTab] = useState("book");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/bookings`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setBookings(data);
      setLoadError("");
    } catch (err) {
      console.error(err);
      setLoadError("Cannot reach server. Please refresh or try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div>
      <header className="app-header">
        <div>
          <h1>🏥 Senior Health Centre</h1>
          <p>Consultation Slot Booking — Mon to Sat</p>
        </div>
        <div className="helpline">Helpline: <strong>1800-XXX-XXXX</strong></div>
      </header>

      <main className="main-container">
        <nav className="nav-tabs" role="tablist">
          <button
            role="tab" aria-selected={tab === "book"}
            className={`nav-tab${tab === "book" ? " active" : ""}`}
            onClick={() => setTab("book")}
          >📅 Book Appointment</button>
          <button
            role="tab" aria-selected={tab === "admin"}
            className={`nav-tab${tab === "admin" ? " active" : ""}`}
            onClick={() => setTab("admin")}
          >🔒 Admin View</button>
        </nav>

        {loadError && <div className="alert alert-error" role="alert">⚠️ {loadError}</div>}

        {loading ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
        ) : tab === "book" ? (
          <SlotBooking bookings={bookings} onBooked={fetchBookings} />
        ) : (
          <AdminView bookings={bookings} onDelete={fetchBookings} />
        )}
      </main>
    </div>
  );
}
