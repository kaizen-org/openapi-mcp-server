import { describe, it, expect } from "vitest"
import { AuthResponseDetector } from "../src/auth/auth-response-detector"

describe("AuthResponseDetector", () => {
  const detector = new AuthResponseDetector()

  describe("isAuthResponse", () => {
    it("should detect 302 redirect with Location header as auth response", () => {
      const response = {
        status: 302,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 301 redirect with Location header as auth response", () => {
      const response = {
        status: 301,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 303 redirect with Location header as auth response", () => {
      const response = {
        status: 303,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 307 redirect with Location header as auth response", () => {
      const response = {
        status: 307,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 308 redirect with Location header as auth response", () => {
      const response = {
        status: 308,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 401 with WWW-Authenticate header containing URL as auth response", () => {
      const response = {
        status: 401,
        headers: { "www-authenticate": 'Bearer realm="https://auth.example.com/login"' },
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 401 with JSON body containing auth_url as auth response", () => {
      const response = {
        status: 401,
        headers: {},
        data: { auth_url: "https://auth.example.com/login" },
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 401 with JSON body containing login_url as auth response", () => {
      const response = {
        status: 401,
        headers: {},
        data: { login_url: "https://auth.example.com/login" },
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should detect 401 with JSON body containing authorization_url as auth response", () => {
      const response = {
        status: 401,
        headers: {},
        data: { authorization_url: "https://auth.example.com/login" },
      }
      expect(detector.isAuthResponse(response)).toBe(true)
    })

    it("should NOT detect 200 as auth response", () => {
      const response = {
        status: 200,
        headers: {},
        data: { result: "ok" },
      }
      expect(detector.isAuthResponse(response)).toBe(false)
    })

    it("should NOT detect 404 as auth response", () => {
      const response = {
        status: 404,
        headers: {},
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(false)
    })

    it("should NOT detect 500 as auth response", () => {
      const response = {
        status: 500,
        headers: {},
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(false)
    })

    it("should NOT detect 401 without URL indicators as auth response", () => {
      const response = {
        status: 401,
        headers: { "www-authenticate": "Basic realm=restricted" },
        data: { error: "Unauthorized" },
      }
      expect(detector.isAuthResponse(response)).toBe(false)
    })

    it("should NOT detect 3xx without Location header as auth response", () => {
      const response = {
        status: 302,
        headers: {},
        data: null,
      }
      expect(detector.isAuthResponse(response)).toBe(false)
    })
  })

  describe("extractAuthUrl", () => {
    it("should extract URL from Location header (highest priority)", () => {
      const response = {
        status: 302,
        headers: { location: "https://auth.example.com/login" },
        data: null,
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/login")
    })

    it("should extract URL from WWW-Authenticate header when no Location header", () => {
      const response = {
        status: 401,
        headers: { "www-authenticate": 'Bearer realm="https://auth.example.com/login"' },
        data: null,
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/login")
    })

    it("should extract URL from JSON body auth_url when no other headers", () => {
      const response = {
        status: 401,
        headers: {},
        data: { auth_url: "https://auth.example.com/login" },
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/login")
    })

    it("should extract URL from JSON body login_url", () => {
      const response = {
        status: 401,
        headers: {},
        data: { login_url: "https://auth.example.com/login" },
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/login")
    })

    it("should extract URL from JSON body authorization_url", () => {
      const response = {
        status: 401,
        headers: {},
        data: { authorization_url: "https://auth.example.com/login" },
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/login")
    })

    it("should prioritize Location over WWW-Authenticate", () => {
      const response = {
        status: 302,
        headers: {
          location: "https://auth.example.com/location",
          "www-authenticate": 'Bearer realm="https://auth.example.com/www-auth"',
        },
        data: null,
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/location")
    })

    it("should prioritize WWW-Authenticate over JSON body", () => {
      const response = {
        status: 401,
        headers: { "www-authenticate": 'Bearer realm="https://auth.example.com/www-auth"' },
        data: { auth_url: "https://auth.example.com/body" },
      }
      expect(detector.extractAuthUrl(response)).toBe("https://auth.example.com/www-auth")
    })

    it("should return null when no auth URL can be extracted", () => {
      const response = {
        status: 401,
        headers: { "www-authenticate": "Basic realm=restricted" },
        data: { error: "Unauthorized" },
      }
      expect(detector.extractAuthUrl(response)).toBeNull()
    })

    it("should return null for 200 response", () => {
      const response = {
        status: 200,
        headers: {},
        data: { result: "ok" },
      }
      expect(detector.extractAuthUrl(response)).toBeNull()
    })
  })
})
