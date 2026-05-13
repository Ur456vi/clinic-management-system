/**
 * Consultation domain types & guards (BE-13).
 *
 * The `Consultation` model is polymorphic: a single table with a `type`
 * discriminator (`RMO` | `MAIN`) and a `sections` JSONB blob whose keys
 * differ per type. We expose lightweight TypeScript shapes here so callers
 * can narrow the JSON without round-tripping through Prisma's generic
 * `Prisma.JsonValue`.
 *
 * Field-level validation (Zod schemas, allowed enum values, required vs.
 * optional, etc.) lands in BE-14 alongside the service/CRUD layer. For now
 * each section is just an open record so the schema and the form can evolve
 * in lockstep without breaking the type-check.
 */

/** A single sub-section of a consultation — open shape until BE-14. */
export type ConsultationSection = Partial<Record<string, unknown>>;

/**
 * RMO consultation payload. Maps 1:1 to the six tabs on the
 * `/admin/patients/add` RMO panel.
 */
export type RmoSections = {
  informant?: ConsultationSection;
  demographics?: ConsultationSection;
  medicalHistory?: ConsultationSection;
  socialHistory?: ConsultationSection;
  personalHistory?: ConsultationSection;
  examinationSummary?: ConsultationSection;
};

/**
 * Main (senior doctor) consultation payload. Sections are a standard
 * SOAP-style breakdown — actual fields will be locked down in BE-14.
 */
export type MainSections = {
  chiefComplaint?: ConsultationSection;
  hpi?: ConsultationSection;
  assessment?: ConsultationSection;
  diagnosis?: ConsultationSection;
  plan?: ConsultationSection;
};

/** Type guard — RMO consultation. */
export function isRmo(c: { type: string }): boolean {
  return c.type === "RMO";
}

/** Type guard — Main consultation. */
export function isMain(c: { type: string }): boolean {
  return c.type === "MAIN";
}
