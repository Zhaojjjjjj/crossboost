import 'reflect-metadata'

export const MCP_TOOL_METADATA = 'mcp:tool'
export const MCP_RESOURCE_METADATA = 'mcp:resource'
export const MCP_PROMPT_METADATA = 'mcp:prompt'

export interface McpToolOptions {
  name: string
  description: string
  inputSchema?: Record<string, any>
}

export interface McpResourceOptions {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface McpPromptOptions {
  name: string
  description?: string
  arguments?: Array<{ name: string; description?: string; required?: boolean }>
}

/**
 * Decorator to register a method as an MCP tool
 */
export function McpTool(options: McpToolOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(MCP_TOOL_METADATA, options, target, propertyKey)
    return descriptor
  }
}

/**
 * Decorator to register a method as an MCP resource handler
 */
export function McpResource(options: McpResourceOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(MCP_RESOURCE_METADATA, options, target, propertyKey)
    return descriptor
  }
}

/**
 * Decorator to register a method as an MCP prompt handler
 */
export function McpPrompt(options: McpPromptOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(MCP_PROMPT_METADATA, options, target, propertyKey)
    return descriptor
  }
}
