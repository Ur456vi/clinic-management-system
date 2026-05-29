import fs from "fs";
import path from "path";

// Manually load .env variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join("=").trim();
        // Strip quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  }
}

async function run() {
  // Dynamically import to read process.env after loading
  const { env } = await import("../lib/env");
  const { NextRequest } = await import("next/server")
  const { POST } = await import("../app/api/auth/password-reset/request/route")

  const req = new NextRequest("http://localhost:3000/api/auth/password-reset/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "origin": "http://localhost:3000",
    },
    body: JSON.stringify({ email: "admin@vyara.local" }),
  })
  
  console.log("Calling POST route handler with env loaded...")
  try {
    const res = await POST(req)
    console.log("Response status:", res.status)
    const json = await res.json()
    console.log("Response body:", JSON.stringify(json, null, 2))
  } catch (err) {
    console.error("POST threw error:", err)
  }
}

run()
