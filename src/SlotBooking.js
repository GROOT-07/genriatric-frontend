import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["9:00–10:00 AM", "10:00–11:00 AM", "11:00–12:00 PM", "12:00–1:00 PM"];

export default function SlotBooking({ bookings, onBooked }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", age: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedName, setBookedName] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);

  const takenSlots = new Set(bookings.flatMap(b => b.slots || []));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your full name.";
    const age = parseInt(form.age);
    if (!form.age || isNaN(age) || age < 1 || age > 120) e.age = "Please enter a valid age (1–120).";
    const ph = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) e.phone = "Please enter your phone number.";
    else if (ph.length < 7 || ph.length > 15) e.phone = "Phone must be 7–15 digits.";
    return e;
  };

  const goToSlots = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const toggleSlot = (key) => {
    setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), age: parseInt(form.age), phone: form.phone.trim(), slots: selectedSlots }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.conflicts) {
          setSubmitError(`These slots were just taken: ${data.conflicts.map(fmt).join(", ")}. Please re-select.`);
          setSelectedSlots(prev => prev.filter(s => !data.conflicts.includes(s)));
          setStep(2);
        } else {
          setSubmitError(data.message || "Booking failed.");
        }
        setSubmitting(false);
        return;
      }
      setBookedName(form.name);
      setBookedSlots([...selectedSlots]);
      await onBooked();
      setStep(4);
    } catch {
      setSubmitError("Cannot connect to server. Check your internet connection.");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setStep(1);
    setForm({ name: "", age: "", phone: "" });
    setSelectedSlots([]);
    setErrors({});
    setSubmitError("");
  };

  // ── Step 4: Done ─────────────────────────────────────────────────────────────
  if (step === 4) return (
    <div className="card">
      <div className="success-screen" role="status" aria-live="polite">
        <div className="checkmark">✓</div>
        <h2>Booking Confirmed!</h2>
        <p>Thank you, <strong>{bookedName}</strong>.</p>
        <p>Your {bookedSlots.length} slot(s) have been reserved:</p>
        <ul className="confirm-list" style={{ display: "inline-block", textAlign: "left", marginTop: 14 }}>
          {bookedSlots.map(s => <li key={s}>{fmt(s)}</li>)}
        </ul>
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-primary" onClick={reset}>Book Another Appointment</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="step-progress" role="status" aria-live="polite">
        Step {step} of 3 — {step === 1 ? "Your Details" : step === 2 ? "Choose Slots" : "Confirm"}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="card">
          <h2 className="card-title"><span className="step-badge">1</span> Your Details</h2>
          <div className="form-grid">
            <Field id="name" label="Full Name *" type="text" value={form.name} error={errors.name}
              placeholder="e.g. Ramesh Sharma" autoComplete="name"
              onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field id="age" label="Age *" type="number" value={form.age} error={errors.age}
              placeholder="e.g. 72"
              onChange={v => setForm(f => ({ ...f, age: v }))} />
            <Field id="phone" label="Phone Number *" type="tel" value={form.phone} error={errors.phone}
              placeholder="e.g. 9876543210" autoComplete="tel" hint="Include STD code if needed"
              onChange={v => setForm(f => ({ ...f, phone: v }))} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={goToSlots}>Next: Choose Slots →</button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="card">
          <h2 className="card-title"><span className="step-badge">2</span> Choose Your Slot(s)</h2>
          {submitError && <div className="alert alert-warn" role="alert">⚠️ {submitError}</div>}
          <p className="slot-instruction">Tap any <strong>green slot</strong> to select it. You can pick multiple.</p>

          <div className="timetable-wrap">
            <table className="timetable" role="grid" aria-label="Appointment timetable">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  {DAYS.map(d => <th key={d} scope="col">{d.slice(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map(slot => (
                  <tr key={slot}>
                    <td className="time-label">{slot}</td>
                    {DAYS.map(day => {
                      const key = `${day}|${slot}`;
                      const taken = takenSlots.has(key);
                      const selected = selectedSlots.includes(key);
                      return (
                        <td key={day} style={{ padding: "5px" }}>
                          <button
                            className={`slot-btn${selected ? " selected" : taken ? " taken" : " free"}`}
                            onClick={() => !taken && toggleSlot(key)}
                            disabled={taken}
                            aria-pressed={selected}
                            aria-label={`${day} ${slot} — ${taken ? "Fully booked" : selected ? "Selected" : "Available"}`}
                          >
                            {taken ? "Booked" : selected ? "✓ Selected" : "Free"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="legend">
            <span className="legend-item"><span className="legend-dot free-dot"></span>Available</span>
            <span className="legend-item"><span className="legend-dot selected-dot"></span>Selected</span>
            <span className="legend-item"><span className="legend-dot taken-dot"></span>Booked</span>
          </div>

          {selectedSlots.length > 0 && (
            <div className="alert alert-success" role="status" aria-live="polite">
              ✓ {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => {
              if (!selectedSlots.length) { setSubmitError("Please select at least one slot."); return; }
              setSubmitError(""); setStep(3);
            }}>Next: Confirm →</button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="card">
          <h2 className="card-title"><span className="step-badge">3</span> Confirm Booking</h2>
          {submitError && <div className="alert alert-error" role="alert">⚠️ {submitError}</div>}
          <div className="confirm-box">
            <h3>Patient Details</h3>
            <ul className="confirm-list">
              <li>Name: <strong>{form.name}</strong></li>
              <li>Age: <strong>{form.age}</strong></li>
              <li>Phone: <strong>{form.phone}</strong></li>
            </ul>
          </div>
          <div className="confirm-box">
            <h3>Selected Slots ({selectedSlots.length})</h3>
            <ul className="confirm-list">
              {selectedSlots.map(s => <li key={s}>{fmt(s)}</li>)}
            </ul>
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Edit Slots</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} aria-busy={submitting}>
              {submitting ? "Confirming..." : "✓ Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ id, label, type, value, onChange, error, placeholder, hint, autoComplete }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} />
      {error && <span id={`${id}-err`} className="field-error" role="alert">⚠ {error}</span>}
      {hint && !error && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
    </div>
  );
}

function fmt(key) {
  const [day, slot] = key.split("|");
  return `${day} · ${slot}`;
}
