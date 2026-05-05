import { Injectable, Logger } from '@nestjs/common'
import { McpRegistryService } from './mcp-registry.service'

@Injectable()
export class McpExecutorService {
  private readonly logger = new Logger(McpExecutorService.name)

  constructor(private readonly registry: McpRegistryService) {}

  /**
   * Execute a registered MCP tool
   */
  async executeTool(name: string, input: any): Promise<any> {
    const tool = this.registry.getTool(name)
    if (!tool) {
      throw new Error(`MCP tool not found: ${name}`)
    }

    this.logger.log(`Executing MCP tool: ${name}`)
    try {
      return await tool.handler.call(tool.instance, input)
    } catch (error) {
      this.logger.error(`MCP tool execution failed: ${name}`, error)
      throw error
    }
  }

  /**
   * Read a registered MCP resource
   */
  async readResource(uri: string): Promise<any> {
    const resource = this.registry.getResource(uri)
    if (!resource) {
      throw new Error(`MCP resource not found: ${uri}`)
    }

    this.logger.log(`Reading MCP resource: ${uri}`)
    try {
      return await resource.handler.call(resource.instance, uri)
    } catch (error) {
      this.logger.error(`MCP resource read failed: ${uri}`, error)
      throw error
    }
  }

  /**
   * Execute a registered MCP prompt
   */
  async executePrompt(name: string, args: Record<string, any>): Promise<any> {
    const prompt = this.registry.getPrompt(name)
    if (!prompt) {
      throw new Error(`MCP prompt not found: ${name}`)
    }

    this.logger.log(`Executing MCP prompt: ${name}`)
    try {
      return await prompt.handler.call(prompt.instance, args)
    } catch (error) {
      this.logger.error(`MCP prompt execution failed: ${name}`, error)
      throw error
    }
  }

  /**
   * List all available tools
   */
  listTools() {
    return this.registry.getAllTools().map((t) => ({
      name: t.options.name,
      description: t.options.description,
      inputSchema: t.options.inputSchema,
    }))
  }

  /**
   * List all available resources
   */
  listResources() {
    return this.registry.getAllResources().map((r) => ({
      uri: r.options.uri,
      name: r.options.name,
      description: r.options.description,
      mimeType: r.options.mimeType,
    }))
  }

  /**
   * List all available prompts
   */
  listPrompts() {
    return this.registry.getAllPrompts().map((p) => ({
      name: p.options.name,
      description: p.options.description,
      arguments: p.options.arguments,
    }))
  }
}
