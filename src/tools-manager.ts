import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { OpenAPISpecLoader, ExtendedTool } from "./openapi-loader"
import { OpenAPIMCPServerConfig, SpecEntry } from "./config"
import { OpenAPIV3 } from "openapi-types"
import { parseToolId as parseToolIdUtil } from "./utils/tool-id.js"
import { Logger } from "./utils/logger"

/**
 * Manages the tools available in the MCP server
 */
export class ToolsManager {
  private tools: Map<string, Tool> = new Map()
  private specLoader: OpenAPISpecLoader
  private loadedSpec?: OpenAPIV3.Document
  private logger: Logger

  constructor(private config: OpenAPIMCPServerConfig) {
    // Ensure toolsMode has a default value of 'all'
    this.config.toolsMode = this.config.toolsMode || "all"
    this.specLoader = new OpenAPISpecLoader({
      disableAbbreviation: this.config.disableAbbreviation,
      verbose: this.config.verbose,
    })
    this.logger = new Logger(this.config.verbose)
  }

  /**
   * Get the OpenAPI spec loader instance
   */
  getSpecLoader(): OpenAPISpecLoader {
    return this.specLoader
  }

  /**
   * Get the loaded OpenAPI specification
   */
  getOpenApiSpec(): OpenAPIV3.Document | undefined {
    return this.loadedSpec
  }

  /**
   * Create dynamic discovery meta-tools
   */
  private createDynamicTools(): Map<string, Tool> {
    const dynamicTools = new Map<string, Tool>()

    // LIST-API-ENDPOINTS
    dynamicTools.set("LIST-API-ENDPOINTS", {
      name: "list-api-endpoints",
      description: "List all available API endpoints",
      inputSchema: { type: "object", properties: {} },
    })

    // GET-API-ENDPOINT-SCHEMA
    dynamicTools.set("GET-API-ENDPOINT-SCHEMA", {
      name: "get-api-endpoint-schema",
      description: "Get the JSON schema for a specified API endpoint",
      inputSchema: {
        type: "object",
        properties: {
          endpoint: { type: "string", description: "Endpoint path (e.g. /users/{id})" },
        },
        required: ["endpoint"],
      },
    })

    // INVOKE-API-ENDPOINT
    dynamicTools.set("INVOKE-API-ENDPOINT", {
      name: "invoke-api-endpoint",
      description: "Invoke an API endpoint with provided parameters",
      inputSchema: {
        type: "object",
        properties: {
          endpoint: { type: "string", description: "Endpoint path to invoke (e.g. /users/{id})" },
          method: {
            type: "string",
            description: "HTTP method to use (optional, e.g. GET, POST, PUT, DELETE)",
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
          },
          params: {
            type: "object",
            description: "Parameters for the API call",
            properties: {},
          },
        },
        required: ["endpoint"],
      },
    })

    return dynamicTools
  }

  /**
   * Load tools from multiple OpenAPI specs, appending a suffix to each tool name and ID.
   * The suffixed tool ID is used as the map key; originalToolId is stored in tool metadata
   * so that ApiClient can reconstruct the correct HTTP method+path for routing.
   */
  private async initializeMultiSpec(specs: SpecEntry[]): Promise<void> {
    const combined = new Map<string, Tool>()

    for (const entry of specs) {
      const spec = await this.specLoader.loadOpenAPISpec(
        entry.path,
        entry.specInputMethod,
        entry.inlineSpecContent,
      )

      // Store the first spec as the canonical loaded spec (used by ApiClient for content-type etc.)
      if (!this.loadedSpec) {
        this.loadedSpec = spec
      }

      if (this.config.toolsMode === "dynamic") {
        // Dynamic tools don't benefit from multi-spec suffixes; just create them once
        this.tools = this.createDynamicTools()
        return
      }

      const rawTools = this.specLoader.parseOpenAPISpec(spec)

      for (const [originalToolId, tool] of rawTools.entries()) {
        const extTool = tool as ExtendedTool

        // Apply the same filters as single-spec mode
        if (!this.passesFilters(originalToolId, extTool)) {
          continue
        }

        // Build the suffixed map key and tool name
        const suffixedToolId = `${entry.suffix}::${originalToolId}`
        const suffixedName = `${tool.name}_${entry.suffix}`

        const suffixedTool: ExtendedTool = {
          ...extTool,
          name: suffixedName,
          originalToolId,
        }

        combined.set(suffixedToolId, suffixedTool)
        this.logger.error(`Registered tool: ${suffixedToolId} (${suffixedName})`)
      }
    }

    this.tools = combined
  }

  /**
   * Check whether a tool passes the configured include filters.
   */
  private passesFilters(toolId: string, tool: ExtendedTool): boolean {
    const includeToolsLower = this.config.includeTools?.map((t) => t.toLowerCase()) ?? []
    const includeOperationsLower =
      this.config.includeOperations?.map((op) => op.toLowerCase()) ?? []
    const includeResourcesLower =
      this.config.includeResources?.map((res) => res.toLowerCase()) ?? []
    const includeTagsLower = this.config.includeTags?.map((tag) => tag.toLowerCase()) ?? []

    if (includeToolsLower.length > 0) {
      const toolIdLower = toolId.toLowerCase()
      const toolNameLower = tool.name.toLowerCase()
      return includeToolsLower.includes(toolIdLower) || includeToolsLower.includes(toolNameLower)
    }

    if (
      includeOperationsLower.length > 0 &&
      (!tool.httpMethod || !includeOperationsLower.includes(tool.httpMethod.toLowerCase()))
    ) {
      return false
    }

    if (
      includeResourcesLower.length > 0 &&
      (!tool.resourceName || !includeResourcesLower.includes(tool.resourceName.toLowerCase()))
    ) {
      return false
    }

    if (includeTagsLower.length > 0) {
      const toolTags = Array.isArray(tool.tags) ? tool.tags : []
      if (
        !toolTags.some(
          (tag) => typeof tag === "string" && includeTagsLower.includes(tag.toLowerCase()),
        )
      ) {
        return false
      }
    }

    return true
  }

  /**
   * Initialize tools from the OpenAPI specification
   */
  async initialize(): Promise<void> {
    // Multi-spec mode: load each spec and namespace tools by suffix
    if (this.config.openApiSpecs && this.config.openApiSpecs.length > 0) {
      await this.initializeMultiSpec(this.config.openApiSpecs)
      return
    }

    const spec = await this.specLoader.loadOpenAPISpec(
      this.config.openApiSpec,
      this.config.specInputMethod,
      this.config.inlineSpecContent,
    )
    this.loadedSpec = spec // Store the loaded spec

    // Determine tools loading mode
    if (this.config.toolsMode === "dynamic") {
      // Use dynamic discovery meta-tools
      this.tools = this.createDynamicTools()
      return
    }

    if (this.config.toolsMode === "explicit") {
      // Only load tools explicitly listed in includeTools
      const rawTools = this.specLoader.parseOpenAPISpec(spec)
      const filtered = new Map<string, Tool>()

      if (this.config.includeTools && this.config.includeTools.length > 0) {
        const includeToolsLower = this.config.includeTools.map((t) => t.toLowerCase())

        for (const [toolId, tool] of rawTools.entries()) {
          const toolIdLower = toolId.toLowerCase()
          const toolNameLower = tool.name.toLowerCase()

          // Include tool if it matches by ID or name
          if (
            includeToolsLower.includes(toolIdLower) ||
            includeToolsLower.includes(toolNameLower)
          ) {
            filtered.set(toolId, tool)
          }
        }
      }
      // If includeTools is empty or undefined, no tools are loaded in explicit mode

      this.tools = filtered

      // Log the registered tools
      for (const [toolId, tool] of this.tools.entries()) {
        this.logger.error(`Registered tool: ${toolId} (${tool.name})`)
      }
      return
    }

    // Load and filter standard tools (for "all" mode)
    const rawTools = this.specLoader.parseOpenAPISpec(spec)
    const filtered = new Map<string, Tool>()

    // Precompute lowercase filter arrays for better performance
    const includeToolsLower = this.config.includeTools?.map((t) => t.toLowerCase()) || []
    const includeOperationsLower =
      this.config.includeOperations?.map((op) => op.toLowerCase()) || []
    const includeResourcesLower =
      this.config.includeResources?.map((res) => res.toLowerCase()) || []
    const includeTagsLower = this.config.includeTags?.map((tag) => tag.toLowerCase()) || []

    for (const [toolId, tool] of rawTools.entries()) {
      const extendedTool = tool as ExtendedTool

      // includeTools filter - takes highest priority
      if (includeToolsLower.length > 0) {
        const toolIdLower = toolId.toLowerCase()
        const toolNameLower = tool.name.toLowerCase()
        if (
          !includeToolsLower.includes(toolIdLower) &&
          !includeToolsLower.includes(toolNameLower)
        ) {
          continue
        }
        // If tool is explicitly included, skip other filters and add it
        filtered.set(toolId, tool)
        continue
      }

      // includeOperations filter
      if (includeOperationsLower.length > 0) {
        const httpMethod =
          typeof extendedTool.httpMethod === "string"
            ? extendedTool.httpMethod.toLowerCase()
            : undefined
        if (!httpMethod || !includeOperationsLower.includes(httpMethod)) {
          continue
        }
      }

      // includeResources filter
      if (includeResourcesLower.length > 0) {
        const resourceName =
          typeof extendedTool.resourceName === "string"
            ? extendedTool.resourceName.toLowerCase()
            : undefined
        if (!resourceName || !includeResourcesLower.includes(resourceName)) {
          continue
        }
      }

      // includeTags filter
      if (includeTagsLower.length > 0) {
        const toolTags = Array.isArray(extendedTool.tags) ? extendedTool.tags : []
        const hasMatchingTag = toolTags.some(
          (tag) => typeof tag === "string" && includeTagsLower.includes(tag.toLowerCase()),
        )
        if (!hasMatchingTag) {
          continue
        }
      }

      filtered.set(toolId, tool)
    }
    this.tools = filtered

    // Log the registered tools
    for (const [toolId, tool] of this.tools.entries()) {
      this.logger.error(`Registered tool: ${toolId} (${tool.name})`)
    }
  }

  /**
   * Get all available tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get all available tools with their IDs
   * Returns array of [toolId, tool] pairs
   */
  getToolsWithIds(): [string, Tool][] {
    return Array.from(this.tools.entries())
  }

  /**
   * Find a tool by ID or name
   */
  findTool(idOrName: string): { toolId: string; tool: Tool } | undefined {
    const lowerIdOrName = idOrName.toLowerCase()

    // Try to find by ID first (case-insensitive)
    for (const [toolId, tool] of this.tools.entries()) {
      if (toolId.toLowerCase() === lowerIdOrName) {
        return { toolId, tool }
      }
    }

    // Then try to find by name (case-insensitive)
    for (const [toolId, tool] of this.tools.entries()) {
      if (tool.name.toLowerCase() === lowerIdOrName) {
        return { toolId, tool }
      }
    }

    return undefined
  }

  /**
   * Get the path and method from a tool ID
   *
   * Note: This converts hyphens back to slashes to reconstruct the original API path.
   * This is consistent with ApiClient.parseToolId() which needs the actual path for HTTP requests.
   */
  parseToolId(toolId: string): { method: string; path: string } {
    return parseToolIdUtil(toolId)
  }
}
