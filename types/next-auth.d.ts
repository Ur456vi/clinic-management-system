/**
 * Module augmentation for next-auth.
 *
 * The default `Session.user` only has { name, email, image }. We add our own
 * `userId`, `role`, and `fullName` claims, and the JWT carries the same set
 * so the two sides stay in sync.
 *
 * These augmentations are picked up automatically because `types/` is in the
 * default `tsconfig.json` `include` glob ("**\/*.ts").
 */

import type { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      /** Vyara User.id (UUID). */
      userId: string
      /** Login email (lowercased, citext-unique). */
      email: string
      /** Clinic-side role from the `Role` enum. */
      role: Role
      /** Display name from Staff.fullName / Patient.fullName (email fallback). */
      fullName: string
      /** Optional profile image URL from Staff.avatarUrl. */
      avatarUrl: string | null
      /** True while a temp-password account must reset before using the portal. */
      mustResetPassword: boolean
    } & DefaultSession["user"]
  }

  /** The shape returned by the credentials provider's `authorize`. */
  interface User {
    id: string
    email: string
    role: Role
    fullName: string
    avatarUrl: string | null
    mustResetPassword: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Vyara User.id (UUID). Mirrors session.user.userId. */
    userId: string
    /** Login email. */
    email: string
    /** Clinic-side role. */
    role: Role
    /** Display name. */
    fullName: string
    /** Profile image URL (nullable). */
    avatarUrl: string | null
    /** True while a temp-password account must reset before using the portal. */
    mustResetPassword: boolean
  }
}
