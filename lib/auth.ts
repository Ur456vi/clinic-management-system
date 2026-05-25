/**
 * NextAuth.js configuration and server-side helpers.
 *
 * Strategy: JWT sessions (stateless, no DB lookup per request). We still
 * declare the Session / VerificationToken Prisma models so we can flip to
 * the database strategy later without a schema migration.
 *
 * Custom claims (`userId`, `role`, `email`) are baked into the JWT in the
 * `jwt` callback and projected back onto `session.user` in the `session`
 * callback. The shapes are augmented in `types/next-auth.d.ts`.
 *
 * Usage in a server component / route handler:
 *   import { requireUser } from "@/lib/auth"
 *   const user = await requireUser()  // throws UnauthorizedError if no session
 *
 * Or for optional auth:
 *   import { getSession } from "@/lib/auth"
 *   const session = await getSession()
 *   if (session) { ... }
 */

import type { NextAuthOptions, Session } from "next-auth"
import { getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { verifyPassword } from "@/lib/passwords"
import { UnauthorizedError } from "@/lib/errors"

/** Shape of the user object returned from `authorize`. */
export type AuthorizedUser = {
  id: string
  email: string
  role: Role
  fullName: string
  avatarUrl: string | null
}

/** Shape of `session.user` after our session callback runs. */
export type SessionUser = {
  userId: string
  email: string
  role: Role
  fullName: string
  avatarUrl: string | null
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // 12 hours — clinic staff sign in at the start of a shift.
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthorizedUser | null> {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password

        if (!email || !password) return null

        // NOTE: `patient.avatarUrl` is queried via a permissive cast below
        // rather than included in this select. The column was added to the
        // schema in migration 20260525000000_patient_avatar_url but if the
        // generated Prisma client hasn't been regenerated locally yet
        // (or the migration hasn't been applied) the include would throw
        // "Unknown field avatarUrl" and break sign-in for everyone. Run
        // `npm run prisma:generate && npm run prisma:migrate` to pick up
        // the new field; until then we read it defensively further down.
        const user = await db.user.findUnique({
          where: { email },
          include: {
            staff: { select: { fullName: true, avatarUrl: true } },
            patient: { select: { fullName: true } },
          },
        })
        if (!user || !user.isActive) return null

        const ok = await verifyPassword(password, user.passwordHash)
        if (!ok) return null

        // Best-effort: record the login and bump lastLoginAt. We never fail
        // the sign-in just because audit logging hits the DB; wrap in try/catch.
        try {
          await db.$transaction([
            db.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            }),
            db.auditLog.create({
              data: {
                actorUserId: user.id,
                action: "LOGIN",
                entityType: "User",
                entityId: user.id,
                detail: { provider: "credentials" },
              },
            }),
          ])
        } catch (err) {
          console.error("[auth] failed to record login audit", err)
        }

        const fullName =
          user.staff?.fullName ??
          user.patient?.fullName ??
          user.email

        // Permissive read of patient.avatarUrl — see the NOTE above the
        // findUnique call. Falls back to null on older clients/DBs that
        // don't have the column yet.
        const patientAvatarUrl =
          (user.patient as { avatarUrl?: string | null } | null)?.avatarUrl ?? null
        const avatarUrl = user.staff?.avatarUrl ?? patientAvatarUrl ?? null

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName,
          avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only defined on the initial sign-in. Subsequent calls only
      // receive the existing token — leave it untouched.
      if (user) {
        const u = user as AuthorizedUser
        token.userId = u.id
        token.email = u.email
        token.role = u.role
        token.fullName = u.fullName
        token.avatarUrl = u.avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      // Project our custom claims onto session.user. The types are augmented
      // in types/next-auth.d.ts so callers get full IntelliSense.
      if (token && session.user) {
        session.user.userId = token.userId as string
        session.user.email = token.email as string
        session.user.role = token.role as Role
        session.user.fullName = (token.fullName as string) ?? token.email
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null
      }
      return session
    },
  },
}

/**
 * Server-side helper. Returns the current session, or `null` when the caller
 * is not signed in. Use this when auth is optional.
 */
export function getSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

/**
 * Server-side helper. Returns the current session user, or throws
 * `UnauthorizedError` when the caller is not signed in.
 *
 * Route handlers should let the error bubble — the top-level error handler
 * maps `UnauthorizedError` to a 401 response.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession()
  const u = session?.user
  if (!u || !u.userId) {
    throw new UnauthorizedError("Authentication required")
  }
  return {
    userId: u.userId,
    email: u.email,
    role: u.role,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
  }
}
