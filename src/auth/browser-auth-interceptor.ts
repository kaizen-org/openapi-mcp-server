import { AuthResponseDetector, ApiResponse } from "./auth-response-detector.js"
import { BrowserAuthHandler, BrowserAuthOptions } from "./browser-auth-handler.js"

export interface BrowserAuthInterceptorOptions extends BrowserAuthOptions {
  /** When true, browser-based auth interception is active. Default: false. */
  browserAuth?: boolean
}

export interface ToolCallResult {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

/**
 * Intercepts API call errors to detect browser-based auth challenges.
 * When enabled, opens a Playwright browser for the user to complete the OAuth flow
 * instead of returning the raw 401/3xx response to the LLM.
 *
 * Extension point: wraps any async API call function in the tool handler.
 */
export class BrowserAuthInterceptor {
  constructor(
    private detector: AuthResponseDetector,
    private handler: BrowserAuthHandler,
    private options: BrowserAuthInterceptorOptions = {},
  ) {}

  /**
   * Wraps an async API call. If browser auth is enabled and the call fails with an
   * auth-requiring response, opens the browser and returns a retry message to the LLM.
   * Otherwise, passes the result or error through unchanged.
   *
   * @param apiCall - A function that executes the API call and returns a promise.
   * @returns The API call result, or a ToolCallResult with a retry message if auth was required.
   */
  async intercept<T>(apiCall: () => Promise<T>): Promise<T | ToolCallResult> {
    try {
      return await apiCall()
    } catch (error) {
      // Only intercept if browser auth is enabled
      if (!this.options.browserAuth) {
        throw error
      }

      // Check if the error carries an HTTP response we can inspect
      const httpResponse = this.extractHttpResponse(error)
      if (!httpResponse) {
        throw error
      }

      // Detect if this is an auth challenge
      if (!this.detector.isAuthResponse(httpResponse)) {
        throw error
      }

      // Extract the auth URL
      const authUrl = this.detector.extractAuthUrl(httpResponse)
      if (!authUrl) {
        throw error
      }

      // Open browser and wait for the user to complete auth
      await this.handler.openBrowserForAuth(authUrl, {
        timeoutMs: this.options.timeoutMs,
      })

      // Return a retry message to the LLM
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
  }

  /**
   * Extracts an ApiResponse-compatible object from an error, if present.
   */
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
