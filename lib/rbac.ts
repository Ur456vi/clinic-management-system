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
// Admin areas (page + nav layer, with per-staff overrides)
// ---------------------------------------------------------------------------
//
// One entry per admin nav area. `roles` is the DEFAULT access for a role,
// used when a staff member has no custom per-staff set. `alwaysOn` areas
// (dashboard, profile) can never be switched off. Access is enforced in
// `proxy.ts` (route) + the sidebar (nav); API action gates above remain the
// real data enforcement. Admin overrides access per staff via Staff → Access;
// edit a `roles` line here to change a role's defaults for everyone.

export type AdminArea = {
  key: string
  path: string
  label: string
  roles: readonly RbacRole[]
  alwaysOn?: boolean
}

export const ADMIN_AREAS: readonly AdminArea[] = [
  { key: "dashboard", path: "/admin/dashboard", label: "Dashboard", roles: ALL_STAFF, alwaysOn: true },
  { key: "patients", path: "/admin/patients", label: "Patients", roles: PERMISSIONS["patient:view"] },
  { key: "appointments", path: "/admin/appointments", label: "Appointments", roles: PERMISSIONS["appointment:view"] },
  { key: "assessments", path: "/admin/assessments", label: "Assessments", roles: PERMISSIONS["assessment:view"] },
  { key: "invoices", path: "/admin/invoices", label: "Invoices", roles: PERMISSIONS["invoice:view"] },
  { key: "refills", path: "/admin/refills", label: "Refills", roles: PERMISSIONS["refill:read"] },
  { key: "reports", path: "/admin/reports", label: "Reports", roles: ["ADMIN", "DOCTOR"] },
  { key: "staff", path: "/admin/staff", label: "Staff", roles: ADMIN_ONLY },
  { key: "departments", path: "/admin/departments", label: "Departments", roles: ADMIN_ONLY },
  { key: "yuvraaj", path: "/admin/yuvraaj-appointments", label: "Dr Yuvraaj Appointment", roles: ADMIN_ONLY },
  { key: "settings", path: "/admin/settings", label: "Settings", roles: ADMIN_ONLY },
  { key: "profile", path: "/admin/profile", label: "Profile", roles: ALL_STAFF, alwaysOn: true },
]

/** Areas an admin can toggle per staff (everything except the always-on ones). */
export const ASSIGNABLE_AREAS: readonly AdminArea[] = ADMIN_AREAS.filter((a) => !a.alwaysOn)
const ASSIGNABLE_AREA_KEYS: readonly string[] = ASSIGNABLE_AREAS.map((a) => a.key)
const ALL_AREA_KEYS: readonly string[] = ADMIN_AREAS.map((a) => a.key)
const ALWAYS_ON_KEYS: readonly string[] = ADMIN_AREAS.filter((a) => a.alwaysOn).map((a) => a.key)

/** Keep only valid, assignable, de-duped area keys (drops unknown/always-on). */
export function sanitizeAreaKeys(keys: readonly string[] | null | undefined): string[] {
  return Array.from(new Set((keys ?? []).filter((k) => ASSIGNABLE_AREA_KEYS.includes(k))))
}

/** The admin area key owning a pathname (longest path-prefix match), or null. */
export function areaForPath(pathname: string): string | null {
  let key: string | null = null
  let len = -1
  for (const a of ADMIN_AREAS) {
    if ((pathname === a.path || pathname.startsWith(a.path + "/")) && a.path.length > len) {
      key = a.key
      len = a.path.length
    }
  }
  return key
}

/** Area keys a role can access by default (its role template). */
export function roleDefaultAreas(role: RbacRole): string[] {
  return ADMIN_AREAS.filter((a) => a.roles.includes(role)).map((a) => a.key)
}

/**
 * The effective area set for a staff member, baked into the JWT at login:
 *   - ADMIN → everything; PATIENT → nothing (patient lane).
 *   - custom (non-empty) `allowedAreas` → that set (always-on forced in).
 *   - otherwise → the role's defaults.
 */
export function effectiveAreasFor(
  role: RbacRole,
  allowedAreas?: readonly string[] | null,
): string[] {
  if (role === "ADMIN") return [...ALL_AREA_KEYS]
  if (role === "PATIENT") return []
  const custom = (allowedAreas ?? []).filter((k) => ALL_AREA_KEYS.includes(k))
  if (custom.length === 0) return roleDefaultAreas(role)
  return Array.from(new Set([...ALWAYS_ON_KEYS, ...custom]))
}

/** Can someone with this explicit area set open the given admin pathname? */
export function canAccessAreaList(
  areas: readonly string[] | null | undefined,
  pathname: string,
): boolean {
  const key = areaForPath(pathname)
  if (!key) return true // unmapped /admin path → allowed
  if (ALWAYS_ON_KEYS.includes(key)) return true
  return (areas ?? []).includes(key)
}

/**
 * Role-only fallback when no per-staff set is available (e.g. an older JWT):
 * can this role open the pathname per its role defaults? PATIENT never on /admin.
 */
export function canAccessAdminPath(
  role: RbacRole | null | undefined,
  pathname: string,
): boolean {
  if (!role || role === "PATIENT") return false
  if (role === "ADMIN") return true
  return canAccessAreaList(roleDefaultAreas(role), pathname)
}
