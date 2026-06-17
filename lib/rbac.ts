/**
 * Central RBAC permission matrix — the single source of truth for who can
 * do what. Two layers:
 *
 *   1. PERMISSIONS — action → allowed roles. Reproduces (exactly) the role
 *      gates that previously lived as ad-hoc `WRITE_ROLES`/`VIEW_ROLES`/…
 *      arrays scattered across the service + route files. Services now do
 *      `const WRITE_ROLES = rolesFor("invoice:write")` instead of inlining a
 *      list, so the policy is defined once and enforced everywhere.
 *
 *   2. ADMIN_AREA_ACCESS — admin nav area → allowed roles. Drives BOTH the
 *      `proxy.ts` route guard (server-side redirect away from areas a role
 *      can't use) and the sidebar (hide what you can't open). API gates in
 *      (1) remain the real enforcement; this is the page/nav layer on top.
 *
 * IMPORTANT: this module is imported by `proxy.ts` (Next.js edge middleware),
 * so it must stay dependency-free — in particular it must NOT import
 * `@prisma/client` (the Prisma client is not edge-safe). Roles are therefore
 * a string union whose members are identical to the Prisma `Role` enum
 * values, so `Role` and `RbacRole` are interchangeable at call sites.
 */

export type RbacRole =
  | "ADMIN"
  | "DOCTOR"
  | "RMO"
  | "RECEPTION"
  | "INFUSION_SPECIALIST"
  | "REHAB_SPECIALIST"
  | "AESTHETICS_SPECIALIST"
  | "PATIENT"

// Common groupings. ALL_STAFF = every non-patient role (read-heavy gates use
// this so any clinic member can view across disciplines).
const ALL_STAFF: readonly RbacRole[] = [
  "ADMIN",
  "DOCTOR",
  "RMO",
  "RECEPTION",
  "INFUSION_SPECIALIST",
  "REHAB_SPECIALIST",
  "AESTHETICS_SPECIALIST",
]
const CLINICAL_DESK: readonly RbacRole[] = ["ADMIN", "DOCTOR", "RMO", "RECEPTION"]
const ADMIN_ONLY: readonly RbacRole[] = ["ADMIN"]

/**
 * Action → roles. Keys are `"<resource>:<action>"`. Each entry mirrors the
 * exact role list that previously lived in the named service/route constant
 * (noted in the trailing comment) so behavior is unchanged.
 */
export const PERMISSIONS = {
  // Appointment (lib/services/appointment.ts)
  "appointment:write": CLINICAL_DESK, // WRITE_ROLES
  "appointment:view": ALL_STAFF, // VIEW_ROLES
  "appointment:fullBook": ["ADMIN", "RECEPTION"], // FULL_BOOK_ROLES
  "appointment:delete": ADMIN_ONLY, // inline ADMIN

  // Consultation (lib/services/consultation.ts)
  "consultation:createRmo": ["ADMIN", "RMO", "DOCTOR"], // RMO_AUTHOR_ROLES
  "consultation:createMain": ["ADMIN", "DOCTOR"], // MAIN_AUTHOR_ROLES
  "consultation:view": ALL_STAFF, // VIEW_ROLES

  // LabResult (lib/services/lab-result.ts)
  "labResult:write": ["ADMIN", "DOCTOR", "RMO"], // WRITE_ROLES
  "labResult:attach": CLINICAL_DESK, // ATTACH_ROLES (reception uploads reports)
  "labResult:read": ALL_STAFF, // READ_ROLES

  // Invoice + Payment (lib/services/invoice.ts)
  "invoice:write": ["ADMIN", "DOCTOR", "RECEPTION"], // WRITE_ROLES
  "invoice:view": CLINICAL_DESK, // VIEW_ROLES
  "invoice:delete": ADMIN_ONLY, // inline ADMIN

  // TreatmentPlan (lib/services/treatment-plan.ts)
  "treatmentPlan:write": ["ADMIN", "DOCTOR"], // WRITE_ROLES
  "treatmentPlan:view": CLINICAL_DESK, // VIEW_ROLES

  // InfusionLog (lib/services/infusion-log.ts)
  "infusion:write": ["ADMIN", "DOCTOR", "RMO", "INFUSION_SPECIALIST"], // WRITE_ROLES
  "infusion:read": ALL_STAFF, // READ_ROLES
  "infusion:delete": ADMIN_ONLY, // DELETE_ROLES

  // RefillRequest (lib/services/refill-request.ts)
  "refill:write": CLINICAL_DESK, // WRITE_ROLES
  "refill:read": ALL_STAFF, // READ_ROLES

  // Patient (app/api/patients/**)
  "patient:create": CLINICAL_DESK, // PATIENT_WRITE
  "patient:view": ALL_STAFF, // STAFF_VIEW
  "patient:update": CLINICAL_DESK, // PATIENT_WRITE
  "patient:delete": ADMIN_ONLY, // inline ADMIN

  // Vitals (app/api/patients/[id]/vitals)
  "vitals:write": ALL_STAFF, // STAFF_ROLES

  // Files (app/api/files/**)
  "file:upload": ALL_STAFF,
  "file:download": ALL_STAFF,

  // Assessment submissions (app/api/admin/assessment-submissions/**)
  "assessment:view": CLINICAL_DESK, // requireRole(ADMIN, DOCTOR, RMO, RECEPTION)

  // Staff + Department management
  "staff:view": ALL_STAFF, // GET list = requireSession (any staff)
  "staff:manage": ADMIN_ONLY, // create/update = ADMIN
  "department:view": ALL_STAFF, // GET list = requireSession
  "department:manage": ADMIN_ONLY, // create/update = ADMIN

  // Settings
  "settings:manage": ADMIN_ONLY, // email settings = ADMIN
} as const satisfies Record<string, readonly RbacRole[]>

export type Permission = keyof typeof PERMISSIONS

/** The role list allowed for an action (use where an array is expected). */
export function rolesFor(action: Permission): readonly RbacRole[] {
  return PERMISSIONS[action]
}

/** True when `role` is allowed to perform `action`. */
export function can(role: RbacRole | null | undefined, action: Permission): boolean {
  return role != null && rolesFor(action).includes(role)
}

// ---------------------------------------------------------------------------
// Admin area / route access (page + nav layer)
// ---------------------------------------------------------------------------
//
// Maps each admin nav area (by href prefix) to the roles allowed to OPEN it.
// Clinical/front-desk areas mirror their resource's view gate; management and
// configuration areas are ADMIN-only. Edit a single line here to widen/narrow
// who can reach a page — both the route guard and the sidebar read from it.

export const ADMIN_AREA_ACCESS = {
  "/admin/dashboard": ALL_STAFF,
  "/admin/patients": PERMISSIONS["patient:view"],
  "/admin/appointments": PERMISSIONS["appointment:view"],
  "/admin/assessments": PERMISSIONS["assessment:view"],
  "/admin/invoices": PERMISSIONS["invoice:view"],
  "/admin/refills": PERMISSIONS["refill:read"],
  "/admin/staff": ADMIN_ONLY,
  "/admin/departments": ADMIN_ONLY,
  "/admin/reports": ["ADMIN", "DOCTOR"],
  "/admin/settings": PERMISSIONS["settings:manage"],
  "/admin/yuvraaj-appointments": ADMIN_ONLY,
  "/admin/profile": ALL_STAFF,
} as const satisfies Record<string, readonly RbacRole[]>

/**
 * Can `role` open the given admin pathname?
 *
 * Matches the longest configured area prefix. Unmapped `/admin/*` paths
 * (e.g. /admin/help) default to ALL_STAFF — we only ever ADD restrictions
 * explicitly, never lock out a page by omission. PATIENT is never allowed on
 * /admin (the proxy lane guard handles that separately too).
 */
export function canAccessAdminPath(
  role: RbacRole | null | undefined,
  pathname: string,
): boolean {
  if (!role) return false
  if (role === "PATIENT") return false

  let matched: readonly RbacRole[] | null = null
  let matchedLen = -1
  for (const [prefix, roles] of Object.entries(ADMIN_AREA_ACCESS)) {
    if ((pathname === prefix || pathname.startsWith(prefix + "/")) && prefix.length > matchedLen) {
      matched = roles
      matchedLen = prefix.length
    }
  }
  if (!matched) return true // unmapped admin path → any staff
  return matched.includes(role)
}
