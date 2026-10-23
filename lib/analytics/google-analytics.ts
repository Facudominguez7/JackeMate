const GA_ID_PATTERN = /^G-[A-Z0-9]+$/

/**
 * Reads the GA4 measurement ID from the environment. Anything that is not a measurement ID
 * (missing, empty, a "GTM-" container ID, a typo) loads nothing, so dev and previews stay untracked.
 */
export function gaIdFromEnv(value: string | undefined): string | null {
  const id = value?.trim()
  return id && GA_ID_PATTERN.test(id) ? id : null
}
