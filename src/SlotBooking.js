import React, { useEffect, useState } from "react";

function SlotBooking() {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState("");
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
    fetch("http://localhost:5000/bookings")
      .then(res => res.json())
      .then(data => setBookedSlots(data));
  }, []);

  const isSlotBooked = (d, t) => {
    return bookedSlots.some(b => b.day === d && b.time === t);
  };

  const handleSubmit = async () => {
    setMessage("");

    const res = await fetch("http://localhost:5000/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, time, name, age, phone })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message);
      return;
    }

    setMessage("✅ Slot booked successfully!");

    // Refresh bookings
    const updated = await fetch("http://localhost:5000/bookings");
    setBookedSlots(await updated.json());

    // Reset form
    setDay("");
    setTime("");
    setName("");
    setAge("");
    setPhone("");
  };

  return (
    <div style={{ padding: 30, maxWidth: 600, margin: "auto" }}>
      <h2>Geriatric Daycare Slot Booking</h2>

      <label>Day</label>
      <select value={day} onChange={e => setDay(e.target.value)}>
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
            disabled={isSlotBooked(day, slot)}
          >
            {slot} {isSlotBooked(day, slot) ? "(Booked)" : ""}
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
