async function run() {
  const payload = {
    patient: {
      name: "John Doe Test",
      email: "johndoe_test_" + Math.random().toString(36).substring(7) + "@example.com",
      phone: "+91 9999999999",
      sex: "male"
    },
    slot: {
      date: "2026-06-01",
      time: "10:00",
      notes: "Testing email delivery."
    },
    assessment: {
      totalScore: 45,
      scoreOutOf: 100,
      band: "mild",
      topRisks: [
        { key: "energy", label: "Fatigue", severity: "High" }
      ],
      suggestedFocus: [
        { key: "lifestyle", label: "Exercise plan" }
      ],
      byCategory: { energy: 3, metabolic: 2 },
      answers: { q1: "Constant exhaustion" }
    }
  };

  console.log("Submitting booking to port 3000 for email:", payload.patient.email);

  try {
    const res = await fetch("http://localhost:3000/api/assessment-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000",
        "Referer": "http://localhost:3000/assessment/book"
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const text = await res.text();
    console.log(`Response Status: ${status}`);
    console.log(`Response Body: ${text}`);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
