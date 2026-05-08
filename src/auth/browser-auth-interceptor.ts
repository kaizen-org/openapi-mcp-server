import { AuthResponseDetector, ApiResponse } from "./auth-response-detector.js"
import { BrowserAuthHandler, BrowserAuthOptions } from "./browser-auth-handler.js"

export interface BrowserAuthInterceptorOptions extends BrowserAuthOptions {
  /** When true, browser-based auth interception is active. Default: false. */
  browserAuth?: boolean
  /**
   * Fallback login URL to open when a 401 response contains no auth redirect URL.
   * Intended for SPA apps where the OAuth flow is fully client-side.
   * Typically the origin of the API base URL (e.g. "https://app.example.com").
   */
  fallbackLoginUrl?: string
  /**
   * Callback invoked with the extracted Bearer token after a successful SPA fallback login.
   * Use this to update the API client's auth headers before the retry.
   */
  onTokenExtracted?: (token: string) => void
}

export interface ToolCallResult {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

/**
 * Intercepts API call errors to detect browser-based auth challenges.
 *
 * Priority:
 * 1. If the response contains an auth URL (Location header, WWW-Authenticate, JSON body):
 *    → opens that URL in a browser, waits for the user to close the page, returns a retry message.
 * 2. (Fallback) If the response is a 401 with no auth URL and `fallbackLoginUrl` is set:
 *    → opens the fallback URL, waits for an OIDC token to appear in localStorage,
 *      calls `onTokenExtracted`, retries the API call, and returns the actual result.
 */
export class BrowserAuthInterceptor {
  constructor(
    private detector: AuthResponseDetector,
    private handler: BrowserAuthHandler,
    private options: BrowserAuthInterceptorOptions = {},
  ) {}

  async intercept<T>(apiCall: () => Promise<T>): Promise<T | ToolCallResult> {
    try {
      return await apiCall()
    } catch (error) {
      if (!this.options.browserAuth) {
        throw error
      }

      const httpResponse = this.extractHttpResponse(error)
      if (!httpResponse) {
        throw error
      }

      // ── Path 1: explicit auth URL in the response ──────────────────────────
      const authUrl = this.detector.extractAuthUrl(httpResponse)
      if (authUrl) {
        await this.handler.openBrowserForAuth(authUrl, {
          timeoutMs: this.options.timeoutMs,
        })
        return {
          content: [
            {
              type: "text",
              text:
                `Browser-based authentication completed successfully. ` +
                `Please retry the operation — the API should now accept your request.`,
            },
          ],
        } as ToolCallResult
      }

      // ── Path 2: SPA fallback — 401 with no auth URL ────────────────────────
      if (httpResponse.status === 401 && this.options.fallbackLoginUrl) {
        const token = await this.handler.openBrowserAndExtractToken(this.options.fallbackLoginUrl, {
          timeoutMs: this.options.timeoutMs,
        })
        if (!token) {
          throw error
        }
        this.options.onTokenExtracted?.(token)
        return await apiCall()
      }

      throw error
    }
  }

  private extractHttpResponse(error: unknown): ApiResponse | null {
    if (
      error !== null &&
      typeof error === "object" &&
      "response" in error &&
      error.response !== null &&
      typeof error.response === "object"
    ) {
      const response = error.response as Record<string, unknown>
      if (typeof response.status === "number") {
        return {
          status: response.status,
          headers: (response.headers as Record<string, string>) ?? {},
          data: response.data ?? null,
        }
      }
    }
    return null
  }
}
