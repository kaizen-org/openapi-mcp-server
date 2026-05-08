import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { rmSync, existsSync } from "node:fs"
import { TokenStore } from "../src/auth/token-store.js"

const tmpFile = () => join(tmpdir(), `token-store-test-${Date.now()}.json`)

describe("TokenStore", () => {
  let filePath: string

  beforeEach(() => {
    filePath = tmpFile()
  })

  afterEach(() => {
    if (existsSync(filePath)) rmSync(filePath)
  })

  it("returns null when no token has been saved", () => {
    const store = new TokenStore(filePath)
    expect(store.load("https://example.com")).toBeNull()
  })

  it("saves and loads a token for an origin", () => {
    const store = new TokenStore(filePath)
    store.save("https://example.com", "tok_abc")
    expect(store.load("https://example.com")).toBe("tok_abc")
  })

  it("overwrites an existing token for the same origin", () => {
    const store = new TokenStore(filePath)
    store.save("https://example.com", "old")
    store.save("https://example.com", "new")
    expect(store.load("https://example.com")).toBe("new")
  })

  it("keeps tokens for different origins independent", () => {
    const store = new TokenStore(filePath)
    store.save("https://a.com", "token-a")
    store.save("https://b.com", "token-b")
    expect(store.load("https://a.com")).toBe("token-a")
    expect(store.load("https://b.com")).toBe("token-b")
  })

  it("deletes a token for an origin", () => {
    const store = new TokenStore(filePath)
    store.save("https://example.com", "tok")
    store.delete("https://example.com")
    expect(store.load("https://example.com")).toBeNull()
  })

  it("persists across separate instances (simulates process restart)", () => {
    const store1 = new TokenStore(filePath)
    store1.save("https://turbine.adeo.cloud", "oidc_token_xyz")

    const store2 = new TokenStore(filePath)
    expect(store2.load("https://turbine.adeo.cloud")).toBe("oidc_token_xyz")
  })

  it("returns null gracefully when the file is missing or corrupt", () => {
    const store = new TokenStore(join(tmpdir(), "does-not-exist.json"))
    expect(store.load("https://example.com")).toBeNull()
  })
})
