import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountModule } from './core/account/account.module'
import { ChannelModule } from './core/channel/channel.module'
import { ContentModule } from './core/content/content.module'
import { CreditsModule } from './core/credits/credits.module'
import { InternalModule } from './core/internal/internal.module'
import { McpModule } from './core/mcp/mcp.module'
import { NotificationModule } from './core/notification/notification.module'
import { ProductModule } from './core/product/product.module'
import { UserModule } from './core/user/user.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    UserModule,
    AccountModule,
    ProductModule,
    ChannelModule,
    ContentModule,
    CreditsModule,
    NotificationModule,
    McpModule,
    InternalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
