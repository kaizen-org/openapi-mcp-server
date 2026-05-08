export interface BrowserAuthOptions {
  /** Timeout in milliseconds to wait for the user to complete auth. Default: 5 minutes. */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Opens a Chromium browser window for the user to complete an interactive OAuth/auth flow.
 * Suspends the calling code until the browser page is closed or the timeout is reached.
 */
export class BrowserAuthHandler {
  /**
   * Launches a Chromium browser, navigates to the given auth URL, and waits for the user
   * to complete the flow (page close) before returning.
   *
   * @param authUrl - The URL to open in the browser for authentication.
   * @param options - Optional configuration including timeout.
   * @throws If Playwright cannot launch the browser, a descriptive error is thrown.
   */
  async openBrowserForAuth(authUrl: string, options: BrowserAuthOptions = {}): Promise<void> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    let chromium: typeof import("playwright-core").chromium
    try {
      const playwright = await import("playwright-core")
      chromium = playwright.chromium
    } catch (err) {
      throw new Error(
        `Playwright browser automation is not available. ` +
          `Ensure playwright-core is installed and a Chromium browser is available. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    process.stderr.write(
      `[MCP Browser Auth] Opening browser for authentication: ${authUrl}\n` +
        `[MCP Browser Auth] Please complete the login in the browser window. ` +
        `This tool call will resume once you close the browser.\n`,
    )

    let browser
    try {
      browser = await chromium.launch({ headless: false })
    } catch (err) {
      throw new Error(
        `Playwright failed to launch the browser. ` +
          `Ensure a Chromium browser is available in your environment. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    try {
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(authUrl)
      await page.waitForEvent("close", { timeout: timeoutMs })
    } finally {
      await browser.close()
    }
  }
}
