import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { AccountService } from '../account/account.service'
import { ContentService } from '../content/content.service'
import { ProductService } from '../product/product.service'

@ApiTags('MCP')
@Controller('mcp')
export class McpController {
  constructor(
    private readonly accountService: AccountService,
    private readonly contentService: ContentService,
    private readonly productService: ProductService,
  ) {}

  @ApiDoc({
    summary: 'MCP health check',
    description: 'Check MCP protocol availability',
  })
  @Get('/health')
  async health() {
    return {
      status: 'ok',
      name: 'crossboost-server',
      version: '1.0.0',
      capabilities: ['products', 'content', 'accounts', 'publishing', 'analytics'],
    }
  }

  @ApiDoc({
    summary: 'MCP tools list',
    description: 'List available MCP tools for Claude/Cursor integration',
  })
  @Get('/tools')
  async listTools() {
    return {
      tools: [
        {
          name: 'list_products',
          description: 'List products with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number', description: 'Page number' },
              pageSize: { type: 'number', description: 'Items per page' },
              status: { type: 'string', enum: ['draft', 'active', 'archived'] },
              search: { type: 'string', description: 'Search term' },
            },
          },
        },
        {
          name: 'get_product',
          description: 'Get a product by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Product ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_product',
          description: 'Create a new product',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              sku: { type: 'string' },
              price: { type: 'number' },
              currency: { type: 'string' },
              category: { type: 'string' },
            },
            required: ['name', 'sku', 'price'],
          },
        },
        {
          name: 'list_content',
          description: 'List content items',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              pageSize: { type: 'number' },
              type: { type: 'string', enum: ['post', 'video', 'image', 'story', 'reel'] },
              status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'archived'] },
            },
          },
        },
        {
          name: 'list_accounts',
          description: 'List connected platform accounts',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_analytics',
          description: 'Get aggregated analytics data',
          inputSchema: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['tiktok_shop', 'instagram', 'pinterest', 'youtube'] },
            },
          },
        },
      ],
    }
  }

  @ApiDoc({
    summary: 'MCP tool execution',
    description: 'Execute an MCP tool',
  })
  @Post('/tools/call')
  async callTool(@Body() body: { name: string; arguments?: Record<string, unknown> }) {
    const userId = 'current-user-id'
    const args = body.arguments ?? {}

    switch (body.name) {
      case 'list_products':
        return this.productService.list(userId, args as any)
      case 'get_product':
        return this.productService.getById(args.id as string, userId)
      case 'create_product':
        return this.productService.create(userId, args as any)
      case 'list_content':
        return this.contentService.list(userId, args as any)
      case 'list_accounts':
        return this.accountService.listByUserId(userId)
      default:
        return { error: `Unknown tool: ${body.name}` }
    }
  }
}
