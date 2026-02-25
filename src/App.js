const API = process.env.REACT_APP_API_URL;

const bookSlot = async () => {
  try {
    const res = await fetch(`${API}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date,
        time: selectedSlot,
        name,
        age,
        phone
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Booking failed");
      return;
    }

    alert("✅ Booking successful");
  } catch (err) {
    alert("❌ Cannot connect to server");
    console.error(err);
  }
};
