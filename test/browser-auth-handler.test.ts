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
    // With very short timeout, if page doesn't close fast enough, it should still complete
    // We mock waitForEvent to resolve immediately, so timeout doesn't fire
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
