/**
 * Barrel for the lab partner integration. Route handlers and the consultation
 * sign hook import from here.
 */

export { isLabEnabled, getLabConfig, type LabConfig } from "./config"
export { labFetch, clearTokenCache } from "./client"
export { syncProducts, syncCenters, type SyncResult } from "./sync"
export { resolveItems, type ResolvedItem } from "./mapping"
export { getAvailableSlots, type SlotQuery, type AvailabilityResult } from "./availability"
export {
  enqueueLabOrderForConsultation,
  bookOrder,
  cancelOrder,
  rescheduleOrder,
  type BookInput,
  type SlotSelection,
  type AddressInput,
} from "./orders"
export {
  processReportStatus,
  processOrderStatus,
  processCenterStatus,
} from "./webhooks"
export { verifyWebhookSecret } from "./webhook-auth"
export {
  serializeOrder,
  listOrdersForPatient,
  listOrdersForStaff,
  assertOrderOwnedByPatient,
  type SerializedLabOrder,
} from "./queries"
