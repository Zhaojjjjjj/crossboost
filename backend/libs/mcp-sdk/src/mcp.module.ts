import { Module, DynamicModule } from '@nestjs/common'
import { McpRegistryService } from './services/mcp-registry.service'
import { McpExecutorService } from './services/mcp-executor.service'

export interface McpModuleOptions {
  /**
   * Provider classes that contain MCP-decorated methods
   */
  providers?: any[]
}

@Module({})
export class McpModule {
  static forRoot(options?: McpModuleOptions): DynamicModule {
    return {
      module: McpModule,
      global: true,
      providers: [
        McpRegistryService,
        McpExecutorService,
        ...(options?.providers ?? []),
      ],
      exports: [McpRegistryService, McpExecutorService],
    }
  }

  /**
   * Use this to register MCP tool/resource/prompt providers in feature modules
   */
  static forFeature(): DynamicModule {
    return {
      module: McpModule,
      providers: [McpRegistryService],
      exports: [McpRegistryService],
    }
  }
}
