export interface ApiResponse {
  status: number
  headers: Record<string, string>
  data: unknown
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308]
const AUTH_BODY_KEYS = ["auth_url", "login_url", "authorization_url"]
const URL_REGEX = /https?:\/\/[^\s"'>]+/

/**
 * Detects whether an API response requires interactive browser-based authentication.
 * Extracts the authentication URL from the response using a priority-based strategy.
 */
export class AuthResponseDetector {
  /**
   * Returns true if the response indicates the user must complete an interactive auth flow.
   */
  isAuthResponse(response: ApiResponse): boolean {
    return this.extractAuthUrl(response) !== null
  }

  /**
   * Extracts the authentication URL from the response.
   * Priority: Location header > WWW-Authenticate header > JSON body fields.
   * Returns null if no URL can be extracted.
   */
  extractAuthUrl(response: ApiResponse): string | null {
    // 1. Location header (3xx redirects)
    if (REDIRECT_STATUSES.includes(response.status)) {
      const location = response.headers["location"] || response.headers["Location"]
      if (location) return location
    }

    // 2. WWW-Authenticate header (401)
    if (response.status === 401) {
      const wwwAuth = response.headers["www-authenticate"] || response.headers["WWW-Authenticate"]
      if (wwwAuth) {
        const match = URL_REGEX.exec(wwwAuth)
        if (match) return match[0]
      }

      // 3. JSON body fields
      const data = response.data
      if (data && typeof data === "object") {
        const body = data as Record<string, unknown>
        for (const key of AUTH_BODY_KEYS) {
          if (typeof body[key] === "string" && body[key]) {
            return body[key] as string
          }
        }
      }
    }

    return null
  }
}
