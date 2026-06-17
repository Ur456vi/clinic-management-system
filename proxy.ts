/**
 * Vyara unified-portal proxy.
 *
 * Protects `/admin/**` (staff only) and `/patient/**` (patients only).
 *
 * - Unauthenticated request to a protected path → redirect to `/login`.
 * - Authenticated user on `/login` or other auth pages → bounce to dashboard.
 * - Authenticated but on the wrong lane → redirect to the correct lane root.
 * - `/`, `/about`, `/services/**`, `/contact`, `/blog`, `/faq`, and the legal
 *   pages are PUBLIC — no auth check at all.
 *
 * Reads the NextAuth JWT from the request cookie via `getToken` so role
 * checks happen at the edge without a server-side DB call.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

import { canAccessAdminPath, canAccessAreaList, type RbacRole } from "@/lib/rbac"

const STAFF_ROLES = new Set([
  "ADMIN",
  "DOCTOR",
  "RMO",
  "RECEPTION",
  "INFUSION_SPECIALIST",
  "REHAB_SPECIALIST",
  "AESTHETICS_SPECIALIST",
])
const PATIENT_ROLES = new Set(["PATIENT"])

// Paths that need an authenticated user (any role).
const PROTECTED = [/^\/admin(\/|$)/, /^\/patient(\/|$)/]

// Auth-related pages reachable without a session (where authenticated users
// should be bounced to their dashboard).
const PUBLIC_AUTH = [/^\/login(\/|$)/, /^\/admin\/auth(\/|$)/, /^\/auth(\/|$)/]

// Public marketing pages — no auth check, no bounce for authenticated users.
// They can visit the public site freely while logged in.
const PUBLIC_MARKETING = [
  /^\/$/,
  /^\/about(\/|$)/,
  /^\/services(\/|$)/,
  /^\/contact(\/|$)/,
  /^\/assessment(\/|$)/,
  /^\/blog(\/|$)/,
  /^\/faq(\/|$)/,
  /^\/privacy(\/|$)/,
  /^\/terms(\/|$)/,
  /^\/consumer-health-privacy(\/|$)/,
]

function isProtected(pathname: string) {
  if (isPublicAuth(pathname)) return false
  return PROTECTED.some((re) => re.test(pathname))
}

function isPublicAuth(pathname: string) {
  return PUBLIC_AUTH.some((re) => re.test(pathname))
}

function isPublicMarketing(pathname: string) {
  return PUBLIC_MARKETING.some((re) => re.test(pathname))
}

function landingForRole(role: string): string {
  if (PATIENT_ROLES.has(role)) return "/patient/dashboard"
  return "/admin/dashboard"
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets, API, and Next.js internals: not our problem.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // favicon, .png, .svg, ...
  ) {
    return NextResponse.next()
  }

  // Public marketing pages are always reachable — even by signed-in users.
  // (We want a logged-in user to be able to browse the marketing site
  // without getting bounced into their dashboard.)
  if (isPublicMarketing(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const role = typeof token?.role === "string" ? token.role : null
  const areas = Array.isArray(token?.areas) ? (token.areas as string[]) : null
  const mustReset = Boolean(token?.mustResetPassword)
  const onReset = pathname === "/reset-password"

  // 0. Forced first-login password reset. A temp-password account is pinned
  //    to /reset-password until it sets a real password (public marketing
  //    pages already returned above, so the gate only covers the portal +
  //    auth pages).
  if (!token && onReset) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", "/reset-password")
    return NextResponse.redirect(url)
  }
  if (token && mustReset && !onReset) {
    return NextResponse.redirect(new URL("/reset-password", req.url))
  }
  if (token && !mustReset && onReset) {
    return NextResponse.redirect(new URL(landingForRole(role ?? "DOCTOR"), req.url))
  }

  // 1. Authenticated user on a public auth page (login) → bounce to dashboard.
  if (token && isPublicAuth(pathname)) {
    return NextResponse.redirect(new URL(landingForRole(role ?? "DOCTOR"), req.url))
  }

  // 2. Unauthenticated user on a protected page → bounce to /login with a
  //    `next` param so we can return them after auth.
  if (!token && isProtected(pathname)) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // 3. Authenticated but in the wrong lane → bounce to the right one.
  if (token && role) {
    const onAdmin = pathname.startsWith("/admin/") && pathname !== "/admin/auth"
    const onPatient = pathname.startsWith("/patient/")
    if (onAdmin && !STAFF_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/patient/dashboard", req.url))
    }
    if (onPatient && !PATIENT_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }

    // 4. Staff in their lane but on an /admin area they may not open → send
    //    to the dashboard. Uses the per-staff area set baked into the JWT
    //    (admin-managed), falling back to role defaults for older tokens.
    //    /admin/dashboard is always allowed, so this can't loop.
    if (onAdmin && STAFF_ROLES.has(role)) {
      const allowed = areas
        ? canAccessAreaList(areas, pathname)
        : canAccessAdminPath(role as RbacRole, pathname)
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }
    }
  }

  return NextResponse.next()
}

// Match everything except static + API. Proxy itself filters further.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
