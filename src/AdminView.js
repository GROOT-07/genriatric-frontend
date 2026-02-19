import React, { useEffect, useState } from "react";

function AdminView() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/bookings")
      .then(res => res.json())
      .then(data => setBookings(data));
  }, []);

  const exportCSV = () => {
    window.location.href = "http://localhost:5000/export";
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ fontSize: "28px" }}>Admin – Slot Bookings</h2>

      <button
        onClick={exportCSV}
        style={{
          padding: "10px 16px",
          fontSize: "18px",
          marginBottom: "20px"
        }}
      >
        Export CSV
      </button>

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", fontSize: "16px" }}
      >
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Name</th>
            <th>Age</th>
            <th>Phone</th>
          </tr>
        </thead>

        <tbody>
          {bookings.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No bookings yet
              </td>
            </tr>
          )}

          {bookings.map((b, index) => (
            <tr key={index}>
              <td>{b.day}</td>
              <td>{b.time}</td>
              <td>{b.name}</td>
              <td>{b.age}</td>
              <td>{b.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminView;
