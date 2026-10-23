import { expect } from "@playwright/test"

/** Inbox of the local Supabase stack, which catches every auth email instead of sending it. */
function mailpitUrl() {
  const url = process.env.E2E_MAILPIT_URL
  if (!url) throw new Error("Run the E2E suite with `npx playwright test`, which sets the local Mailpit URL.")
  return url
}

type MailpitMessage = { ID: string; Subject: string; HTML: string }

function searchQuery(to: string) {
  return new URLSearchParams({ query: `to:"${to}"` })
}

/** Waits for the newest email sent to `to` with this subject and returns it. */
export async function waitForAuthEmail(to: string, subject: string): Promise<MailpitMessage> {
  let id: string | undefined

  await expect
    .poll(
      async () => {
        const response = await fetch(`${mailpitUrl()}/api/v1/search?${searchQuery(to)}`)
        const { messages } = (await response.json()) as { messages: { ID: string; Subject: string }[] }
        id = messages.find((message) => message.Subject === subject)?.ID
        return id
      },
      { message: `email "${subject}" to ${to}`, timeout: 15_000 },
    )
    .toBeTruthy()

  const response = await fetch(`${mailpitUrl()}/api/v1/message/${id}`)
  return (await response.json()) as MailpitMessage
}

/**
 * The path of the email's `/auth/confirm` link. Emails point to the Site URL of the local stack
 * (port 3000), so tests open the same path on the app under test.
 */
export function confirmLinkPath(message: MailpitMessage) {
  const href = message.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1]
  if (!href) throw new Error(`No /auth/confirm link in "${message.Subject}"`)
  const url = new URL(href.replaceAll("&amp;", "&"))
  return `${url.pathname}${url.search}`
}

export async function deleteAuthEmailsTo(to: string) {
  const response = await fetch(`${mailpitUrl()}/api/v1/search?${searchQuery(to)}`, { method: "DELETE" })
  if (!response.ok) throw new Error(`Could not delete the emails to ${to}: HTTP ${response.status}`)
}
