async function run() {
  console.log("Sending fetch to http://localhost:3000/api/auth/password-reset/request...")
  try {
    const res = await fetch("http://localhost:3000/api/auth/password-reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "origin": "http://localhost:3000",
      },
      body: JSON.stringify({ email: "admin@vyara.local" }),
    })
    console.log("Response status:", res.status)
    const json = await res.json()
    console.log("Response body:", JSON.stringify(json, null, 2))
  } catch (err) {
    console.error("Fetch threw error:", err)
  }
}
run()
