import { db } from "../lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { hashPassword } from "../lib/passwords"

async function run() {
  const email = "admin@vyara.local"
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  })
  
  if (!user) {
    console.error("User not found");
    return;
  }

  // Create a pending OTP
  const otp = "123456"
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  const otpRow = await db.passwordResetOtp.create({
    data: { userId: user.id, otpHash, expiresAt },
  })
  console.log("Created OTP row:", otpRow.id)

  // Verify OTP
  // Let's do the exact verification logic:
  const row = await db.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!row) throw new Error("No otp row found")

  const match = await bcrypt.compare(otp, row.otpHash)
  if (!match) throw new Error("OTP does not match")

  // Burn OTP
  const burned = await db.passwordResetOtp.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  console.log("Burned OTP row count:", burned.count)

  const ticketSecret = process.env.RESET_TICKET_SECRET || "fallback_secret"
  const ticket = jwt.sign(
    { sub: user.id, jti: row.id, scope: "password-reset" },
    ticketSecret,
    { expiresIn: 300 },
  )
  console.log("Generated Ticket JWT:", ticket)

  // Confirm password reset
  console.log("Confirming password reset...")
  // Decode JWT
  const decoded = jwt.verify(ticket, ticketSecret) as any
  console.log("Decoded claims:", decoded)

  const verifiedOtp = await db.passwordResetOtp.findUnique({
    where: { id: decoded.jti },
    select: { id: true, userId: true, usedAt: true },
  })
  console.log("Verified OTP from DB:", verifiedOtp)

  const newPassword = "newsecurepassword123"
  const passwordHash = await hashPassword(newPassword)
  console.log("Hashed new password successfully")

  // Update DB
  console.log("Running update transaction...")
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    db.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        detail: { event: "password-reset.confirmed", otpId: verifiedOtp!.id },
      },
    }),
  ])
  console.log("Transaction completed successfully!")
}

run().catch(err => console.error("Caught error:", err)).finally(() => db.$disconnect())
