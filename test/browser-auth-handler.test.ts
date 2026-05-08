import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { Browser, BrowserContext, Page } from "playwright-core"

// Mock playwright-core before importing BrowserAuthHandler
vi.mock("playwright-core", () => ({
  chromium: {
    launch: vi.fn(),
  },
}))

import { chromium } from "playwright-core"
import { BrowserAuthHandler } from "../src/auth/browser-auth-handler"

describe("BrowserAuthHandler", () => {
  let handler: BrowserAuthHandler
  let mockPage: Partial<Page>
  let mockContext: Partial<BrowserContext>
  let mockBrowser: Partial<Browser>

  beforeEach(() => {
    handler = new BrowserAuthHandler()

    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForEvent: vi.fn().mockResolvedValue(undefined),
      isClosed: vi.fn().mockReturnValue(false),
    }

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    }

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
    }

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as Browser)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should launch Chromium browser with the given auth URL", async () => {
    await handler.openBrowserForAuth("https://auth.example.com/login")

    expect(chromium.launch).toHaveBeenCalledWith({ headless: false })
    expect(mockContext.newPage).toHaveBeenCalled()
    expect(mockPage.goto).toHaveBeenCalledWith("https://auth.example.com/login")
  })

  it("should log to stderr that browser has been opened", async () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await handler.openBrowserForAuth("https://auth.example.com/login")

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://auth.example.com/login"),
    )
    stderrSpy.mockRestore()
  })

  it("should wait for the browser page to close", async () => {
    await handler.openBrowserForAuth("https://auth.example.com/login")

    expect(mockPage.waitForEvent).toHaveBeenCalledWith("close", expect.any(Object))
  })

  it("should throw a descriptive error if Playwright cannot launch the browser", async () => {
    vi.mocked(chromium.launch).mockRejectedValue(new Error("Browser binary not found"))

    await expect(handler.openBrowserForAuth("https://auth.example.com/login")).rejects.toThrow(
      /Playwright.*browser/i,
    )
  })

  it("should close the browser after the page closes", async () => {
    await handler.openBrowserForAuth("https://auth.example.com/login")

    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it("should respect a configurable timeout", async () => {
    await handler.openBrowserForAuth("https://auth.example.com/login", { timeoutMs: 100 })

    expect(mockPage.waitForEvent).toHaveBeenCalledWith(
      "close",
      expect.objectContaining({ timeout: 100 }),
    )
  })

  it("should use default timeout of 5 minutes when not specified", async () => {
    await handler.openBrowserForAuth("https://auth.example.com/login")

    expect(mockPage.waitForEvent).toHaveBeenCalledWith(
      "close",
      expect.objectContaining({ timeout: 5 * 60 * 1000 }),
    )
  })
})

describe("BrowserAuthHandler.openBrowserAndExtractToken", () => {
  let handler: BrowserAuthHandler
  let mockPage: Partial<Page>
  let mockContext: Partial<BrowserContext>
  let mockBrowser: Partial<Browser>

  beforeEach(() => {
    handler = new BrowserAuthHandler()

    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(null), // no localStorage token by default
    }

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
      cookies: vi.fn().mockResolvedValue([]), // no cookies by default
    }

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
    }

    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as Browser)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("opens browser at loginUrl", async () => {
    // Immediately return a localStorage token so the poll exits fast
    vi.mocked(mockPage.evaluate!).mockResolvedValue("eyJtoken123")

    await handler.openBrowserAndExtractToken("https://app.example.com")

    expect(chromium.launch).toHaveBeenCalledWith({ headless: false })
    expect(mockPage.goto).toHaveBeenCalledWith("https://app.example.com")
  })

  it("returns token found in localStorage", async () => {
    vi.mocked(mockPage.evaluate!).mockResolvedValue("eyJlocalStorageToken")

    const result = await handler.openBrowserAndExtractToken("https://app.example.com")

    expect(result).toBe("eyJlocalStorageToken")
  })

  it("returns token found in HTTP-only cookie (jwt-token)", async () => {
    vi.mocked(mockPage.evaluate!).mockResolvedValue(null) // nothing in localStorage
    vi.mocked(mockContext.cookies!).mockResolvedValue([
      { name: "jwt-token", value: "eyJcookieToken1234567890abc", domain: "app.example.com" } as any,
    ])

    const result = await handler.openBrowserAndExtractToken("https://app.example.com", {
      timeoutMs: 2000,
    })

    expect(result).toBe("eyJcookieToken1234567890abc")
  })

  it("prefers localStorage over cookie when both are present", async () => {
    vi.mocked(mockPage.evaluate!).mockResolvedValue("eyJlocalFirst")
    vi.mocked(mockContext.cookies!).mockResolvedValue([
      { name: "jwt-token", value: "eyJcookieSecond123456", domain: "app.example.com" } as any,
    ])

    const result = await handler.openBrowserAndExtractToken("https://app.example.com", {
      timeoutMs: 2000,
    })

    expect(result).toBe("eyJlocalFirst")
  })

  it("returns null when timeout is reached with no token found", async () => {
    // Both localStorage and cookies return nothing; very short timeout
    vi.mocked(mockPage.evaluate!).mockResolvedValue(null)
    vi.mocked(mockContext.cookies!).mockResolvedValue([])

    const result = await handler.openBrowserAndExtractToken("https://app.example.com", {
      timeoutMs: 50,
    })

    expect(result).toBeNull()
  })

  it("closes browser after successful token extraction", async () => {
    vi.mocked(mockPage.evaluate!).mockResolvedValue("eyJtoken123")

    await handler.openBrowserAndExtractToken("https://app.example.com")

    expect(mockBrowser.close).toHaveBeenCalled()
  })

  it("closes browser even when no token is found (timeout)", async () => {
    vi.mocked(mockPage.evaluate!).mockResolvedValue(null)
    vi.mocked(mockContext.cookies!).mockResolvedValue([])

    await handler.openBrowserAndExtractToken("https://app.example.com", { timeoutMs: 50 })

    expect(mockBrowser.close).toHaveBeenCalled()
  })
})
