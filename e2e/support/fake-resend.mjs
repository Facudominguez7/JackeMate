// Stand-in for the Resend API during E2E runs: the app points RESEND_BASE_URL here, so its emails
// are stored in memory instead of being sent. Tests read them back with GET /emails.
import { randomUUID } from "node:crypto"
import { createServer } from "node:http"

const port = Number(process.env.PORT ?? 3199)
let emails = []

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ""
    request.on("data", (chunk) => (body += chunk))
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
  })
}

function send(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(payload))
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`)

  if (request.method === "GET" && url.pathname === "/health") return send(response, 200, { ok: true })

  // What the Resend SDK calls for `resend.emails.send(...)`.
  if (request.method === "POST" && url.pathname === "/emails") {
    const email = { id: randomUUID(), ...(await readJson(request)), receivedAt: new Date().toISOString() }
    emails.push(email)
    return send(response, 200, { id: email.id })
  }

  if (request.method === "GET" && url.pathname === "/emails") {
    const to = url.searchParams.get("to")
    const matching = to ? emails.filter((email) => [email.to].flat().includes(to)) : emails
    return send(response, 200, matching)
  }

  if (request.method === "DELETE" && url.pathname === "/emails") {
    emails = []
    return send(response, 200, { ok: true })
  }

  send(response, 404, { message: "Not found" })
}).listen(port, "127.0.0.1", () => console.log(`Fake Resend listening on http://127.0.0.1:${port}`))
