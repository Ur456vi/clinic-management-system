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

// Next.js 15+ / 16+ Route Handlers require context.params to be a Promise.
// But NextAuth v4 internally expects context.params to be synchronous.
// We wrap the handler to await the params promise first and pass the resolved params.
export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params
  return handler(req, { params })
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params
  return handler(req, { params })
}
