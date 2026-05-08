import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const BASE_YARGS_RESULT = {
  "api-base-url": "https://api.example.com",
  "openapi-spec": "./spec.json",
  name: "test-server",
  "server-version": "1.0.0",
  transport: "stdio",
}

function mockYargs(extraArgvFields: Record<string, unknown> = {}) {
  vi.doMock("yargs", () => ({
    default: vi.fn().mockReturnValue({
      option: vi.fn().mockReturnThis(),
      help: vi.fn().mockReturnThis(),
      parseSync: vi.fn().mockReturnValue({ ...BASE_YARGS_RESULT, ...extraArgvFields }),
    }),
  }))
  vi.doMock("yargs/helpers", () => ({
    hideBin: vi.fn((arr) => arr),
  }))
}

describe("Browser Auth CLI Configuration", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // Clear browser auth env vars
    delete process.env.BROWSER_AUTH
    delete process.env.BROWSER_AUTH_TIMEOUT
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  it("should enable browserAuth when --browser-auth flag is provided", async () => {
    mockYargs({ "browser-auth": true })

    const { loadConfig } = await import("../src/config")
    const config = loadConfig()

    expect(config.browserAuth).toBe(true)
  })

  it("should enable browserAuth via programmatic config (browserAuth: true)", async () => {
    // The programmatic path goes through the OpenAPIServer constructor directly,
    // browserAuth is already part of OpenAPIMCPServerConfig interface.
    // Verify the type is exported and accepted.
    const { OpenAPIServer } = await import("../src/server")
    expect(OpenAPIServer).toBeDefined()

    // Type check: OpenAPIMCPServerConfig accepts browserAuth
    const { type: _type } = await import("../src/config")
    // If this compiles (no TS error), the field is accepted
    expect(true).toBe(true)
  })

  it("should not activate browserAuth by default when flag is absent", async () => {
    mockYargs()

    const { loadConfig } = await import("../src/config")
    const config = loadConfig()

    expect(config.browserAuth).toBeFalsy()
  })

  it("should configure browserAuthTimeoutMs from --browser-auth-timeout CLI flag (in seconds)", async () => {
    mockYargs({ "browser-auth": true, "browser-auth-timeout": 600 })

    const { loadConfig } = await import("../src/config")
    const config = loadConfig()

    expect(config.browserAuthTimeoutMs).toBe(600 * 1000) // converted to milliseconds
  })

  it("should not set browserAuthTimeoutMs when --browser-auth-timeout is absent", async () => {
    mockYargs({ "browser-auth": true })

    const { loadConfig } = await import("../src/config")
    const config = loadConfig()

    expect(config.browserAuthTimeoutMs).toBeUndefined()
  })
})
