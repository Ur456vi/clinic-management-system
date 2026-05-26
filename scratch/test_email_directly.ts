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
  console.log("BREVO_API_KEY present in process.env:", !!process.env.BREVO_API_KEY);
  
  // Dynamically import so env.ts reads the populated process.env
  const { sendMail } = await import("../lib/email");

  try {
    const result = await sendMail({
      to: "sharmaurvi48@gmail.com",
      subject: "Test Diagnostic Email",
      text: "This is a diagnostic email from the test script."
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("sendMail threw error:", err);
  }
}

run();
