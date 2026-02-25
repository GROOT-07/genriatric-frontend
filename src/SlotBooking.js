import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL;
console.log("API BASE URL:", API);

function SlotBooking() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [message, setMessage] = useState("");

  const timeSlots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 01:00",
    "01:00 - 02:00",
    "02:00 - 03:00",
    "03:00 - 04:00"
  ];

  // Fetch bookings on load
  useEffect(() => {
    fetch(`${API}/bookings`)
      .then(res => res.json())
      .then(data => setBookedSlots(data))
      .catch(() => setBookedSlots([]));
  }, []);

  const isSlotBooked = (d, t) => {
    return bookedSlots.some(b => b.date === d && b.time === t);
  };

  const handleSubmit = async () => {
    setMessage("");

    const res = await fetch(`${API}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time, name, age, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Booking failed");
      return;
    }

    setMessage("✅ Slot booked successfully!");

    // Refresh bookings
    const updated = await fetch(`${API}/bookings`);
    setBookedSlots(await updated.json());

    // Reset form
    setDate("");
    setTime("");
    setName("");
    setAge("");
    setPhone("");
  };

  return (
    <div style={{ padding: 30, maxWidth: 600, margin: "auto" }}>
      <h2>Geriatric Daycare Slot Booking</h2>

      <label>Day</label>
      <select value={date} onChange={e => setDate(e.target.value)}>
        <option value="">Select Day</option>
        <option>Mon</option>
        <option>Tue</option>
        <option>Wed</option>
        <option>Thu</option>
        <option>Fri</option>
        <option>Sat</option>
      </select>

      <br /><br />

      <label>Time Slot</label>
      <select value={time} onChange={e => setTime(e.target.value)}>
        <option value="">Select Time</option>
        {timeSlots.map(slot => (
          <option
            key={slot}
            value={slot}
            disabled={isSlotBooked(date, slot)}
          >
            {slot} {isSlotBooked(date, slot) ? "(Booked)" : ""}
          </option>
        ))}
      </select>

      <br /><br />

      <label>Name</label>
      <input value={name} onChange={e => setName(e.target.value)} />

      <br /><br />

      <label>Age</label>
      <input type="number" value={age} onChange={e => setAge(e.target.value)} />

      <br /><br />

      <label>Phone</label>
      <input value={phone} onChange={e => setPhone(e.target.value)} />

      <br /><br />

      <button onClick={handleSubmit}>Book Slot</button>

      <p style={{ marginTop: 20, fontWeight: "bold" }}>{message}</p>
    </div>
  );
}

export default SlotBooking;