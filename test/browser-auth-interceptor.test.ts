import { describe, it, expect, vi, beforeEach } from "vitest"
import { BrowserAuthInterceptor } from "../src/auth/browser-auth-interceptor"
import { AuthResponseDetector } from "../src/auth/auth-response-detector"
import { BrowserAuthHandler } from "../src/auth/browser-auth-handler"

describe("BrowserAuthInterceptor", () => {
  let detector: AuthResponseDetector
  let handler: BrowserAuthHandler
  let openBrowserSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    detector = new AuthResponseDetector()
    handler = new BrowserAuthHandler()
    openBrowserSpy = vi.spyOn(handler, "openBrowserForAuth").mockResolvedValue(undefined)
  })

  it("when browserAuth=false, a 401 error is re-thrown unchanged to the LLM", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: false })

    const apiCall = vi.fn().mockRejectedValue(
      Object.assign(new Error("API request failed: (401: Unauthorized)"), {
        response: {
          status: 401,
          headers: {},
          data: { error: "Unauthorized" },
        },
      }),
    )

    await expect(interceptor.intercept(apiCall)).rejects.toThrow("API request failed")
    expect(openBrowserSpy).not.toHaveBeenCalled()
  })

  it("when browserAuth=true and response is 302 with Location, calls BrowserAuthHandler and returns retry message", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: true })

    const apiCall = vi.fn().mockRejectedValue(
      Object.assign(new Error("Redirect"), {
        response: {
          status: 302,
          headers: { location: "https://auth.example.com/login" },
          data: null,
        },
      }),
    )

    const result = await interceptor.intercept(apiCall)

    expect(openBrowserSpy).toHaveBeenCalledWith(
      "https://auth.example.com/login",
      expect.any(Object),
    )
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("retry") }],
    })
  })

  it("when browserAuth=true and response is 401 with auth_url, calls BrowserAuthHandler and returns retry message", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: true })

    const apiCall = vi.fn().mockRejectedValue(
      Object.assign(new Error("Unauthorized"), {
        response: {
          status: 401,
          headers: {},
          data: { auth_url: "https://auth.example.com/login" },
        },
      }),
    )

    const result = await interceptor.intercept(apiCall)

    expect(openBrowserSpy).toHaveBeenCalledWith(
      "https://auth.example.com/login",
      expect.any(Object),
    )
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("retry") }],
    })
  })

  it("after browser login completes, LLM receives message to retry the operation", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: true })

    const apiCall = vi.fn().mockRejectedValue(
      Object.assign(new Error("Unauthorized"), {
        response: {
          status: 401,
          headers: {},
          data: { auth_url: "https://auth.example.com/login" },
        },
      }),
    )

    const result = await interceptor.intercept(apiCall)

    expect(result.content[0].text).toContain("authentication")
    expect(result.content[0].text).toContain("retry")
    expect(result.isError).toBeUndefined()
  })

  it("when browserAuth=true but error is not an auth response, re-throws the error", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: true })

    const apiCall = vi.fn().mockRejectedValue(
      Object.assign(new Error("API request failed: (500: Internal Server Error)"), {
        response: {
          status: 500,
          headers: {},
          data: { error: "Server Error" },
        },
      }),
    )

    await expect(interceptor.intercept(apiCall)).rejects.toThrow("API request failed")
    expect(openBrowserSpy).not.toHaveBeenCalled()
  })

  it("when apiCall succeeds, passes through the result unchanged", async () => {
    const interceptor = new BrowserAuthInterceptor(detector, handler, { browserAuth: true })

    const successResult = { id: 1, name: "test" }
    const apiCall = vi.fn().mockResolvedValue(successResult)

    const result = await interceptor.intercept(apiCall)

    expect(result).toBe(successResult)
    expect(openBrowserSpy).not.toHaveBeenCalled()
  })
})
