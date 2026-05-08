export interface BrowserAuthOptions {
  /** Timeout in milliseconds to wait for the user to complete auth. Default: 5 minutes. */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

/**
 * localStorage keys checked in priority order for OIDC/OAuth tokens.
 * Covers angular-oauth2-oidc, oidc-client, auth0-spa-js, and custom patterns.
 */
const TOKEN_STORAGE_KEYS = ["access_token", "id_token", "token", "auth_token"]

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

  /**
   * Launches a Chromium browser, navigates to the given login URL, and waits for an
   * OIDC/OAuth access token to appear in the page's localStorage. Returns the token
   * string, or null if the timeout is reached before a token is found.
   *
   * This is the fallback path for apps where the auth flow is fully client-side
   * (SPA + OIDC) and the API does not provide a redirect URL in the 401 response.
   *
   * @param loginUrl - The URL to open (typically the app's root or /login route).
   * @param options - Optional configuration including timeout.
   * @returns The extracted token string, or null on timeout.
   */
  async openBrowserAndExtractToken(
    loginUrl: string,
    options: BrowserAuthOptions = {},
  ): Promise<string | null> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const playwright = await import("playwright-core")
    const browser = await playwright.chromium.launch({ headless: false })

    process.stderr.write(
      `[MCP Browser Auth] Opening browser for login (token extraction): ${loginUrl}\n` +
        `[MCP Browser Auth] Please complete the login. The tool call will resume automatically.\n`,
    )

    try {
      const context = await browser.newContext()
      const page = await context.newPage()
      await page.goto(loginUrl)

      try {
        const handle = await page.waitForFunction(
          (keys: string[]) => {
            for (const key of keys) {
              const val = localStorage.getItem(key)
              if (val && val.length > 20) return val
            }
            return undefined
          },
          TOKEN_STORAGE_KEYS,
          { timeout: timeoutMs },
        )
        return (await handle.jsonValue()) as string
      } catch {
        // Timeout or other error — return null so caller can degrade gracefully
        return null
      }
    } finally {
      await browser.close()
    }
  }
}
