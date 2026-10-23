const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

/**
 * Reads the Tag Manager container ID from the environment. Anything that is not a container ID
 * (missing, empty, a GA4 "G-" ID, a typo) loads nothing, so dev and previews stay untracked.
 */
export function gtmIdFromEnv(value: string | undefined): string | null {
  const id = value?.trim()
  return id && GTM_ID_PATTERN.test(id) ? id : null
}
