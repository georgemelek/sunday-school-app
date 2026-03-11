/**
 * Centralised logging utility.
 *
 * - In development: writes to the Metro/Expo console so engineers can see
 *   full error details (including raw Supabase messages) without them ever
 *   reaching the end user.
 * - In production: swap the console.* calls here for a remote logging
 *   service (e.g. Sentry) without touching every call site.
 *
 * Screens should show only a generic, friendly message to users and call
 * logger.error() so the real cause is captured in logs.
 */

export const logger = {
  error(context: string, error: unknown) {
    console.error(`[${context}]`, error)
  },
  warn(context: string, message: string) {
    console.warn(`[${context}]`, message)
  },
  info(context: string, message: string) {
    console.info(`[${context}]`, message)
  },
}
