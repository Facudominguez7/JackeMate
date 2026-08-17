import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * Returns `false` during SSR and the first client render (hydration),
 * then `true` once hydrated. Use to gate client-only rendering without
 * triggering `react-hooks/set-state-in-effect` warnings.
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
