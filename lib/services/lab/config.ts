/**
 * Lab partner integration — resolved config + enablement gate.
 *
 * The whole feature is a no-op unless `LAB_INTEGRATION_ENABLED=true` AND the
 * base URL + OAuth credentials are present. Callers check `isLabEnabled()`
 * before doing any network work; the outbound notify hook records the order
 * locally regardless so nothing is lost when the flag is off.
 */

import { env } from "@/lib/env"

export type LabConfig = {
  baseUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  paths: {
    slots: string
    bookHome: string
    bookCenter: string
    cancelHome: string
    rescheduleHome: string
    cancelCenter: string
    rescheduleCenter: string
  }
}

/** True only when the feature is switched on and fully configured. */
export function isLabEnabled(): boolean {
  return (
    env.LAB_INTEGRATION_ENABLED &&
    !!env.LAB_BASE_URL &&
    !!env.LAB_OAUTH_TOKEN_URL &&
    !!env.LAB_CLIENT_ID &&
    !!env.LAB_CLIENT_SECRET
  )
}

/**
 * Resolve the config or throw. Only call after `isLabEnabled()` returns true
 * (network code paths). The throw is a guard against misconfiguration, not an
 * expected control-flow branch.
 */
export function getLabConfig(): LabConfig {
  if (!isLabEnabled()) {
    throw new Error(
      "Lab integration is disabled or misconfigured (check LAB_INTEGRATION_ENABLED + LAB_BASE_URL + LAB_OAUTH_* env).",
    )
  }
  return {
    baseUrl: env.LAB_BASE_URL!.replace(/\/+$/, ""),
    tokenUrl: env.LAB_OAUTH_TOKEN_URL!,
    clientId: env.LAB_CLIENT_ID!,
    clientSecret: env.LAB_CLIENT_SECRET!,
    paths: {
      slots: env.LAB_SLOTS_PATH,
      bookHome: env.LAB_BOOK_HOME_PATH,
      bookCenter: env.LAB_BOOK_CENTER_PATH,
      cancelHome: env.LAB_CANCEL_HOME_PATH,
      rescheduleHome: env.LAB_RESCHEDULE_HOME_PATH,
      cancelCenter: env.LAB_CANCEL_CENTER_PATH,
      rescheduleCenter: env.LAB_RESCHEDULE_CENTER_PATH,
    },
  }
}
