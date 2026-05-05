import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { ContentModule } from '../content/content.module'
import { CreditsModule } from '../credits/credits.module'
import { NotificationModule } from '../notification/notification.module'
import { ProductModule } from '../product/product.module'
import { UserModule } from '../user/user.module'
import { InternalController } from './internal.controller'

@Module({
  imports: [UserModule, AccountModule, ProductModule, ContentModule, CreditsModule, NotificationModule],
  controllers: [InternalController],
})
export class InternalModule {}
