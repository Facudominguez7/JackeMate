/**
 * Entry route for reporting as a guest. Visitors without a session are sent to `/auth`
 * first, where they choose to sign in or continue as a guest through this route.
 */

export const NEW_REPORT_PATH = "/reportes/nuevo"
export const GUEST_MODE_PARAM = "modo"
export const GUEST_MODE_VALUE = "invitado"
export const GUEST_REPORT_PATH = `${NEW_REPORT_PATH}?${GUEST_MODE_PARAM}=${GUEST_MODE_VALUE}`
