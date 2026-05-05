import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { ContentModule } from '../content/content.module'
import { ProductModule } from '../product/product.module'
import { McpController } from './mcp.controller'

@Module({
  imports: [AccountModule, ContentModule, ProductModule],
  controllers: [McpController],
})
export class McpModule {}
