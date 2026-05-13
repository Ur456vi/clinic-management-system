/**
 * Module augmentation for next-auth.
 *
 * The default `Session.user` only has { name, email, image }. We add our own
 * `userId` and `role` claims, and the JWT carries the same triple so the two
 * sides stay in sync.
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
    } & DefaultSession["user"]
  }

  /** The shape returned by the credentials provider's `authorize`. */
  interface User {
    id: string
    email: string
    role: Role
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
  }
}
