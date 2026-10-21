import { describe, expect, it } from "vitest"

import {
  EXCLUDED_TABLES,
  dockerHelp,
  envFileContent,
  isConnectionString,
  parseArgs,
  parseStatusEnv,
  readProjectId,
  restoreObjectsSql,
  storagePath,
} from "./lib.mjs"

describe("parseArgs", () => {
  it("asks for the data source when run without options", () => {
    expect(parseArgs([])).toEqual({ source: "ask", schema: false, help: false })
  })

  it.each([
    ["--production", "production"],
    ["--saved", "saved"],
    ["--empty", "empty"],
  ])("%s skips the question", (flag, source) => {
    expect(parseArgs([flag])).toMatchObject({ source })
  })

  it("supports the schema and help modes", () => {
    expect(parseArgs(["--schema"])).toMatchObject({ schema: true })
    expect(parseArgs(["-h"])).toMatchObject({ help: true })
  })

  it("rejects unknown options and conflicting sources", () => {
    expect(() => parseArgs(["--prod"])).toThrow("Unknown option: --prod")
    expect(() => parseArgs(["--saved", "--empty"])).toThrow("Choose only one of --production, --saved or --empty.")
  })
})

describe("isConnectionString", () => {
  it("accepts the Supabase session pooler string with a password", () => {
    expect(isConnectionString("postgresql://postgres.ref:p%40ss&w0rd@aws-0-us-east-2.pooler.supabase.com:5432/postgres")).toBe(true)
    expect(isConnectionString("postgres://postgres:secret@db.ref.supabase.co:5432/postgres")).toBe(true)
  })

  it.each([
    ["the placeholder", "postgresql://postgres.ref:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"],
    ["no password", "postgresql://postgres.ref@aws-0-us-east-2.pooler.supabase.com:5432/postgres"],
    ["an API URL", "https://ref.supabase.co"],
    ["an empty answer", "  "],
  ])("rejects %s", (_case, value) => {
    expect(isConnectionString(value)).toBe(false)
  })
})

describe("parseStatusEnv", () => {
  it("reads the KEY=\"value\" lines of `supabase status -o env` without evaluating them", () => {
    const output = 'API_URL="http://127.0.0.1:54321"\nANON_KEY="eyJ.a.b"\nWARN: something\nSERVICE_ROLE_KEY="eyJ.c.d"\n'

    expect(parseStatusEnv(output)).toEqual({
      API_URL: "http://127.0.0.1:54321",
      ANON_KEY: "eyJ.a.b",
      SERVICE_ROLE_KEY: "eyJ.c.d",
    })
  })
})

describe("readProjectId", () => {
  it("reads project_id from config.toml", () => {
    expect(readProjectId('# comment\nproject_id = "JackeMate"\n\n[api]\n')).toBe("JackeMate")
  })

  it("fails when it is missing", () => {
    expect(() => readProjectId("[api]\n")).toThrow("project_id not found in supabase/config.toml")
  })
})

describe("envFileContent", () => {
  const status = { API_URL: "http://127.0.0.1:54321", ANON_KEY: "anon", SERVICE_ROLE_KEY: "service" }

  it("points the app at the local stack and turns off production-only services", () => {
    const content = envFileContent(status)

    expect(content).toContain("NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\n")
    expect(content).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY=anon\n")
    expect(content).toContain("SUPABASE_SERVICE_ROLE_KEY=service\n")
    expect(content).toContain("NEXT_PUBLIC_APP_URL=http://localhost:3000\n")
    expect(content).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY=\n")
    expect(content).toContain("RESEND_API_KEY=\n")
  })

  it("refuses to write a file without the local keys", () => {
    expect(() => envFileContent({ ...status, ANON_KEY: "" })).toThrow("ANON_KEY missing from supabase status")
  })
})

describe("storagePath", () => {
  it("encodes each segment and keeps the slashes", () => {
    expect(storagePath("67/thumbnails/foto con espacio#1.webp")).toBe("67/thumbnails/foto%20con%20espacio%231.webp")
  })
})

describe("restoreObjectsSql", () => {
  it("restores owners and timestamps from a dollar-quoted JSON list", () => {
    const sql = restoreObjectsSql("reportes", [
      { name: "a$json$b.webp", owner: null, owner_id: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
    ])

    expect(sql).toContain("json_to_recordset(")
    expect(sql).toContain("where o.bucket_id = 'reportes' and o.name = r.name")
    // The quote tag never appears inside the data, so a name cannot close the literal.
    const tag = sql.match(/(\$\w*\$)\[/)?.[1]
    expect(tag).toBeDefined()
    expect(sql.split(tag!).length).toBe(3)
  })
})

describe("dockerHelp", () => {
  it.each([
    ["win32", "Docker Desktop"],
    ["darwin", "Docker Desktop"],
    ["linux", "Docker Engine"],
  ])("explains how to get Docker on %s", (platform, product) => {
    expect(dockerHelp(platform as NodeJS.Platform)).toContain(product)
  })
})

describe("EXCLUDED_TABLES", () => {
  it("keeps live Auth credentials out of the production copy", () => {
    expect(EXCLUDED_TABLES).toEqual(expect.arrayContaining(["auth.sessions", "auth.refresh_tokens", "auth.one_time_tokens"]))
    expect(EXCLUDED_TABLES).not.toContain("auth.users")
  })
})
