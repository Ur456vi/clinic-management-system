/**
 * Small symmetric encryption helper for secrets stored in the DB (e.g. the
 * SMTP password in the `settings` table). AES-256-GCM with a random IV.
 *
 * Key material comes from `DATA_ENCRYPTION_KEY` (preferred) or falls back to
 * `NEXTAUTH_SECRET` so encryption works out of the box in environments that
 * already have an auth secret. The 32-byte key is derived with scrypt.
 *
 * Encrypted payload format (base64 of `iv(12) | tag(16) | ciphertext`),
 * prefixed with "enc:v1:" so we can detect/skip already-encrypted or
 * plaintext values during reads.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

import { env } from "@/lib/env"

const PREFIX = "enc:v1:"

function key(): Buffer {
  const secret = env.DATA_ENCRYPTION_KEY || env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      "No encryption key available (set DATA_ENCRYPTION_KEY or NEXTAUTH_SECRET).",
    )
  }
  // Static salt is acceptable here: the secret is high-entropy and the salt's
  // job (defeating rainbow tables on low-entropy passwords) doesn't apply.
  return scryptSync(secret, "vyara.settings.v1", 32)
}

export function encryptSecret(plain: string): string {
  if (plain === "") return ""
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64")
}

export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return ""
  if (!stored.startsWith(PREFIX)) return stored // tolerate legacy plaintext
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64")
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const ct = raw.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8")
}

export function isEncrypted(stored: string | null | undefined): boolean {
  return Boolean(stored && stored.startsWith(PREFIX))
}
