import * as esbuild from "esbuild"

console.log("Building OpenAPI MCP Server...")

const sharedExternal = [
  "@modelcontextprotocol/sdk",
  "@modelcontextprotocol/sdk/server/index.js",
  "@modelcontextprotocol/sdk/server/stdio.js",
  "@modelcontextprotocol/sdk/server/transport.js",
  "@modelcontextprotocol/sdk/types.js",
  "@modelcontextprotocol/sdk/shared/transport.js",
  "playwright-core",
  "chromium-bidi",
]

// Build the main library bundle (for importing)
await esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "./dist/bundle.js",
  target: "node18",
  external: sharedExternal,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
})

// Build the CLI entry point
await esbuild.build({
  entryPoints: ["./src/cli.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "./dist/cli.js",
  target: "node18",
  external: sharedExternal,
  banner: {
    js: `#!/usr/bin/env node\nimport { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
})

console.log("✅ Build complete!")
