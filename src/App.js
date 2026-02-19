import React, { useEffect, useState } from "react";

const times = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00"
];

const MAX_CAPACITY = 5;

function App() {
  const [view, setView] = useState("user");
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: ""
  });

  const today = new Date().toISOString().split("T")[0];

  // Load bookings
  const loadBookings = () => {
    fetch("http://localhost:5000/bookings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      })
      .catch(() => setBookings([]));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Count bookings for a slot
  const slotCount = (date, time) => {
    return bookings.filter(
      b => b.date === date && b.time === time
    ).length;
  };

  // Book slot
  const bookSlot = async () => {
    if (!selectedDate || !selectedTime || !form.name || !form.age || !form.phone) {
      alert("Please fill all fields");
      return;
    }

    const response = await fetch("http://localhost:5000/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        time: selectedTime,
        name: form.name,
        age: form.age,
        phone: form.phone
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Booking failed");
      return;
    }

    alert("✅ Booking confirmed");
    setSelectedTime("");
    setForm({ name: "", age: "", phone: "" });
    loadBookings();
  };

  // Delete booking (admin)
  const deleteBooking = async id => {
    await fetch(`http://localhost:5000/booking/${id}`, {
      method: "DELETE"
    });
    loadBookings();
  };

  return (
    <div className="container">
      <h1>Geriatric Daycare Slot Booking</h1>

      {/* View Toggle */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="primary-btn"
          onClick={() => setView("user")}
        >
          User View
        </button>
        <button
          className="primary-btn"
          onClick={() => setView("admin")}
        >
          Admin View
        </button>
      </div>

      {/* USER VIEW */}
      {view === "user" && (
        <>
          <h3>Select Date</h3>
          <input
            type="date"
            min={today}
            className="date-picker"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              setSelectedTime("");
            }}
          />

          {selectedDate && (
            <>
              <h3>Select Time Slot</h3>

              <table className="slot-table">
                <tbody>
                  <tr>
                    {times.map(time => {
                      const count = slotCount(selectedDate, time);
                      const isFull = count >= MAX_CAPACITY;

                      let className = "slot-available";
                      if (isFull) className = "slot-full";
                      if (selectedTime === time) className = "slot-selected";

                      return (
                        <td
                          key={time}
                          className={className}
                          onClick={() => {
                            if (!isFull) {
                              setSelectedTime(time);
                            }
                          }}
                        >
                          {time}
                          <br />
                          {count}/{MAX_CAPACITY}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>

              <h3>Patient Details</h3>

              <input
                placeholder="Full Name"
                value={form.name}
                onChange={e =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <input
                placeholder="Age"
                type="number"
                value={form.age}
                onChange={e =>
                  setForm({ ...form, age: e.target.value })
                }
              />

              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={e =>
                  setForm({ ...form, phone: e.target.value })
                }
              />

              <button
                className="primary-btn"
                onClick={bookSlot}
              >
                Confirm Booking
              </button>
            </>
          )}
        </>
      )}

      {/* ADMIN VIEW */}
      {view === "admin" && (
        <>
          <h2>Admin Panel</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>Age</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No bookings yet
                  </td>
                </tr>
              )}

              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>{b.name}</td>
                  <td>{b.age}</td>
                  <td>{b.phone}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteBooking(b.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <a href="http://localhost:5000/export">
            <button className="primary-btn">
              Export CSV
            </button>
          </a>
        </>
      )}
    </div>
  );
}

export default App;
