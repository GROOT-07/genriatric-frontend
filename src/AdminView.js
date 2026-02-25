import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL;
const ADMIN_PIN = "1234"; // Change this to your preferred PIN

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["9:00–10:00 AM", "10:00–11:00 AM", "11:00–12:00 PM", "12:00–1:00 PM"];

function AdminView({ bookings, onDelete }) {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // booking id pending delete
  const [deleteError, setDeleteError] = useState("");

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (pinInput === ADMIN_PIN) {
      setAuthed(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
  };

  // ── Export CSV via backend ──────────────────────────────────────────────────
  const exportCSV = () => {
    window.location.href = `${API}/export`;
  };

  // ── Delete booking ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleteError("");
    try {
      const res = await fetch(`${API}/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await onDelete(); // refresh parent
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError("Failed to cancel booking. Please try again.");
      console.error(err);
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalSlots = bookings.reduce((a, b) => a + (b.slots?.length || 0), 0);
  const uniquePatients = new Set(bookings.map(b => b.phone)).size;
  const openSlots = DAYS.length * SLOTS.length - totalSlots;

  // ── Group bookings by day|slot ──────────────────────────────────────────────
  const bySlot = {};
  DAYS.forEach(d => SLOTS.forEach(s => { bySlot[`${d}|${s}`] = []; }));
  bookings.forEach(b => {
    (b.slots || []).forEach(key => {
      if (bySlot[key]) bySlot[key].push(b);
    });
  });

  const visibleDays = filter === "all" ? DAYS : [filter];

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-login">
        <div className="card">
          <h2 className="card-title">🔒 Admin Login</h2>
          <p className="login-hint">Enter your 4-digit PIN to access the admin panel.</p>

          <div className="field">
            <label htmlFor="pin">Admin PIN</label>
            <input
              id="pin"
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="● ● ● ●"
              maxLength={4}
              inputMode="numeric"
              autoComplete="current-password"
              aria-invalid={!!pinError}
              aria-describedby={pinError ? "pin-err" : undefined}
            />
            {pinError && (
              <span id="pin-err" className="field-error" role="alert">⚠ {pinError}</span>
            )}
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={handleLogin}>Login</button>
          </div>
          <p className="demo-note">Demo PIN: 1234</p>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Header row */}
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard</h2>
        <div className="admin-actions">
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            ⬇ Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setAuthed(false)}>
            🔒 Logout
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="alert alert-error" role="alert">⚠️ {deleteError}</div>
      )}

      {/* Summary stats */}
      <div className="summary-bar" role="region" aria-label="Booking summary">
        <div className="summary-stat">
          <div className="stat-num">{bookings.length}</div>
          <div className="stat-lbl">Bookings</div>
        </div>
        <div className="summary-stat">
          <div className="stat-num">{totalSlots}</div>
          <div className="stat-lbl">Total Slots</div>
        </div>
        <div className="summary-stat">
          <div className="stat-num">{uniquePatients}</div>
          <div className="stat-lbl">Patients</div>
        </div>
        <div className="summary-stat">
          <div className="stat-num">{openSlots}</div>
          <div className="stat-lbl">Open Slots</div>
        </div>
      </div>

      {/* Day filter */}
      <div className="day-filter">
        <button
          className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setFilter("all")}
        >
          All Days
        </button>
        {DAYS.map(d => (
          <button
            key={d}
            className={`btn btn-sm ${filter === d ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No bookings yet. They will appear here once patients book slots.</p>
        </div>
      )}

      {/* Slot cards */}
      {visibleDays.map(day => (
        <div key={day}>
          <h3 className="day-heading">{day}</h3>
          {SLOTS.map(slot => {
            const key = `${day}|${slot}`;
            const slotBookings = bySlot[key];
            return (
              <div className="slot-card" key={key}>
                <div className="slot-card-header">
                  <span className="slot-card-title">{slot}</span>
                  <span className="slot-card-count">
                    {slotBookings.length} booking{slotBookings.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {slotBookings.length === 0 ? (
                  <div className="no-bookings">No bookings for this slot.</div>
                ) : (
                  <table className="bookings-table" aria-label={`Bookings for ${day} ${slot}`}>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Age</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Booked At</th>
                        <th scope="col"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotBookings.map(b => (
                        <tr key={b.id}>
                          <td><strong>{b.name}</strong></td>
                          <td>{b.age} yrs</td>
                          <td>{b.phone}</td>
                          <td className="booked-at">
                            {new Date(b.bookedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </td>
                          <td>
                            {deleteConfirm === b.id ? (
                              <span className="delete-confirm-row">
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(b.id)}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                className="btn btn-sm cancel-btn"
                                onClick={() => setDeleteConfirm(b.id)}
                                aria-label={`Cancel booking for ${b.name}`}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

export default AdminView;
