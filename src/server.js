const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// ── Firebase Admin Init ───────────────────────────────────────────────────────
// We read the service account JSON from an environment variable (set in Render)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const bookingsCol = db.collection("bookings");

// ── Express Setup ─────────────────────────────────────────────────────────────
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,   // your Vercel URL — set in Render env vars
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Geriatric Daycare Backend Running" });
});

// ── GET /bookings — fetch all bookings from Firestore ─────────────────────────
app.get("/bookings", async (req, res) => {
  try {
    const snapshot = await bookingsCol.orderBy("bookedAt", "desc").get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (err) {
    console.error("GET /bookings error:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ── POST /book — create a new booking ────────────────────────────────────────
// Body: { name, age, phone, slots: ["Monday|9:00–10:00 AM", ...] }
app.post("/book", async (req, res) => {
  const { name, age, phone, slots } = req.body;

  // ── Validation ──
  if (!name || !age || !phone || !slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ message: "Missing required fields: name, age, phone, slots[]" });
  }
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    return res.status(400).json({ message: "Age must be between 1 and 120" });
  }
  const phoneClean = String(phone).replace(/\D/g, "");
  if (phoneClean.length < 7 || phoneClean.length > 15) {
    return res.status(400).json({ message: "Invalid phone number" });
  }

  try {
    // ── Check for duplicate slots ──
    const snapshot = await bookingsCol.get();
    const allTakenSlots = snapshot.docs.flatMap(doc => doc.data().slots || []);
    const conflicts = slots.filter(s => allTakenSlots.includes(s));

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: "Some slots are already booked",
        conflicts,
      });
    }

    // ── Save to Firestore ──
    const booking = {
      name: name.trim(),
      age: ageNum,
      phone: phone.trim(),
      slots,
      bookedAt: new Date().toISOString(),
    };

    const docRef = await bookingsCol.add(booking);
    console.log(`New booking saved: ${docRef.id} — ${name}`);
    res.status(201).json({ message: "Booked successfully", booking: { id: docRef.id, ...booking } });

  } catch (err) {
    console.error("POST /book error:", err);
    res.status(500).json({ message: "Failed to save booking" });
  }
});

// ── DELETE /bookings/:id — cancel a booking ───────────────────────────────────
app.delete("/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await bookingsCol.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Booking not found" });
    }
    await bookingsCol.doc(id).delete();
    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("DELETE /bookings error:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ── GET /export — download all bookings as CSV ────────────────────────────────
app.get("/export", async (req, res) => {
  try {
    const snapshot = await bookingsCol.orderBy("bookedAt", "desc").get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const rows = [["ID", "Name", "Age", "Phone", "Day", "Time Slot", "Booked At"]];

    bookings.forEach(b => {
      (b.slots || []).forEach(s => {
        const [day, slot] = s.split("|");
        rows.push([
          b.id, b.name, b.age, b.phone, day, slot,
          new Date(b.bookedAt).toLocaleString("en-IN"),
        ]);
      });
    });

    const csv = rows.map(r => r.map(escape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);

  } catch (err) {
    console.error("GET /export error:", err);
    res.status(500).json({ message: "Failed to export" });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
