import { Injectable, Logger } from '@nestjs/common'
import { MCP_TOOL_METADATA, MCP_RESOURCE_METADATA, MCP_PROMPT_METADATA } from '../decorators/mcp-tool.decorator'
import type { McpToolOptions, McpResourceOptions, McpPromptOptions } from '../decorators/mcp-tool.decorator'

export interface RegisteredTool {
  options: McpToolOptions
  handler: Function
  instance: any
}

export interface RegisteredResource {
  options: McpResourceOptions
  handler: Function
  instance: any
}

export interface RegisteredPrompt {
  options: McpPromptOptions
  handler: Function
  instance: any
}

@Injectable()
export class McpRegistryService {
  private readonly logger = new Logger(McpRegistryService.name)
  private readonly tools = new Map<string, RegisteredTool>()
  private readonly resources = new Map<string, RegisteredResource>()
  private readonly prompts = new Map<string, RegisteredPrompt>()

  /**
   * Scan an instance for MCP-decorated methods and register them
   */
  scanInstance(instance: any): void {
    const prototype = Object.getPrototypeOf(instance)
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function',
    )

    for (const methodName of methodNames) {
      const toolMeta: McpToolOptions | undefined = Reflect.getMetadata(MCP_TOOL_METADATA, prototype, methodName)
      if (toolMeta) {
        this.tools.set(toolMeta.name, {
          options: toolMeta,
          handler: prototype[methodName],
          instance,
        })
        this.logger.log(`Registered MCP tool: ${toolMeta.name}`)
      }

      const resourceMeta: McpResourceOptions | undefined = Reflect.getMetadata(MCP_RESOURCE_METADATA, prototype, methodName)
      if (resourceMeta) {
        this.resources.set(resourceMeta.uri, {
          options: resourceMeta,
          handler: prototype[methodName],
          instance,
        })
        this.logger.log(`Registered MCP resource: ${resourceMeta.uri}`)
      }

      const promptMeta: McpPromptOptions | undefined = Reflect.getMetadata(MCP_PROMPT_METADATA, prototype, methodName)
      if (promptMeta) {
        this.prompts.set(promptMeta.name, {
          options: promptMeta,
          handler: prototype[methodName],
          instance,
        })
        this.logger.log(`Registered MCP prompt: ${promptMeta.name}`)
      }
    }
  }

  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name)
  }

  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values())
  }

  getResource(uri: string): RegisteredResource | undefined {
    return this.resources.get(uri)
  }

  getAllResources(): RegisteredResource[] {
    return Array.from(this.resources.values())
  }

  getPrompt(name: string): RegisteredPrompt | undefined {
    return this.prompts.get(name)
  }

  getAllPrompts(): RegisteredPrompt[] {
    return Array.from(this.prompts.values())
  }
}
