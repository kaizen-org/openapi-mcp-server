import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"

export interface StoredToken {
  token: string
  savedAt: string
}

type TokenMap = Record<string, StoredToken>

const DEFAULT_PATH = join(homedir(), ".config", "mcp-openapi-server", "tokens.json")

/**
 * Persists auth tokens to disk, keyed by origin (e.g. "https://turbine.adeo.cloud").
 * Survives MCP server process restarts so the user doesn't have to log in again.
 */
export class TokenStore {
  private readonly filePath: string

  constructor(filePath: string = DEFAULT_PATH) {
    this.filePath = filePath
  }

  /** Save a token for the given origin. */
  save(origin: string, token: string): void {
    const map = this.readMap()
    map[origin] = { token, savedAt: new Date().toISOString() }
    this.writeMap(map)
  }

  /** Load the token for the given origin, or null if not found. */
  load(origin: string): string | null {
    const map = this.readMap()
    return map[origin]?.token ?? null
  }

  /** Remove the token for the given origin. */
  delete(origin: string): void {
    const map = this.readMap()
    delete map[origin]
    this.writeMap(map)
  }

  private readMap(): TokenMap {
    try {
      const raw = readFileSync(this.filePath, "utf-8")
      return JSON.parse(raw) as TokenMap
    } catch {
      return {}
    }
  }

  private writeMap(map: TokenMap): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(map, null, 2), "utf-8")
    } catch {
      // Best-effort — don't crash the server if we can't write
    }
  }
}
