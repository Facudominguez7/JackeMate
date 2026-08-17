import { useCallback, useSyncExternalStore } from "react"

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 *
 * Returns `false` during SSR and the first client render (hydration), then the
 * real value once hydrated. The `subscribe`/`getSnapshot` callbacks are
 * stabilized with `useCallback` keyed on `query`, so `useSyncExternalStore`
 * only re-subscribes when the query string actually changes.
 *
 * @param query - A CSS media query string, e.g. `"(min-width: 1024px)"`.
 * @returns `true` if the query matches, `false` otherwise (including SSR).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
