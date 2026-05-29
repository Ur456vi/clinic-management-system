import { db } from "../lib/db"
import bcrypt from "bcryptjs"
import { sendMail } from "../lib/email"

async function run() {
  const email = "admin@vyara.local";
  console.log("Looking up user with email:", email);
  
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, isActive: true, email: true },
    })
    console.log("Found user:", user);
    if (!user) {
      console.log("No user found");
      return;
    }
    
    // Test the create operation
    const otp = "123456"
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    console.log("Creating PasswordResetOtp row...");
    const created = await db.passwordResetOtp.create({
      data: { userId: user.id, otpHash, expiresAt },
    })
    console.log("Created row successfully:", created);

    // Test sendMail
    console.log("Sending mail...");
    const mailResult = await sendMail({
      to: email,
      subject: "Your Vyara password reset code",
      text: `Your Vyara password reset code is ${otp}.`
    });
    console.log("Mail result:", mailResult);
  } catch (err) {
    console.error("Caught error in flow:", err);
  }
}

run().finally(() => db.$disconnect());
