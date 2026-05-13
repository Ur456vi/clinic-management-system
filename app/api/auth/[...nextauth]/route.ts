/**
 * NextAuth.js route handler (Next.js 15+ App Router).
 *
 * Exposes the canonical NextAuth endpoints under `/api/auth/*`:
 *   POST /api/auth/callback/credentials  — sign in
 *   POST /api/auth/signout               — sign out
 *   GET  /api/auth/session               — current session as JSON
 *   GET  /api/auth/csrf                  — CSRF token
 *   GET  /api/auth/providers             — configured providers
 *
 * Both GET and POST are exported because NextAuth services both verbs from
 * the same handler.
 */

import NextAuth from "next-auth"

import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
