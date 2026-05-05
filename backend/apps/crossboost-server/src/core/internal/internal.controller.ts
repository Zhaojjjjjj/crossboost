import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { AccountService } from '../account/account.service'
import { ContentService } from '../content/content.service'
import { CreditsService } from '../credits/credits.service'
import { NotificationService } from '../notification/notification.service'
import { ProductService } from '../product/product.service'
import { UserService } from '../user/user.service'

@ApiTags('Internal')
@Controller('internal')
export class InternalController {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly productService: ProductService,
    private readonly contentService: ContentService,
    private readonly creditsService: CreditsService,
    private readonly notificationService: NotificationService,
  ) {}

  @ApiDoc({
    summary: 'Get user info (internal)',
    description: 'Internal endpoint for crossboost-ai to get user info',
  })
  @Get('/users/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getProfile(id)
  }

  @ApiDoc({
    summary: 'Get user accounts (internal)',
    description: 'Internal endpoint for crossboost-ai to get user accounts',
  })
  @Get('/users/:id/accounts')
  async getUserAccounts(@Param('id') id: string) {
    return this.accountService.listByUserId(id)
  }

  @ApiDoc({
    summary: 'Get user products (internal)',
    description: 'Internal endpoint for crossboost-ai to get user products',
  })
  @Get('/users/:id/products')
  async getUserProducts(@Param('id') id: string) {
    return this.productService.list(id, {})
  }

  @ApiDoc({
    summary: 'Get credit balance (internal)',
    description: 'Internal endpoint for crossboost-ai to check credit balance',
  })
  @Get('/users/:id/credits')
  async getCreditBalance(@Param('id') id: string) {
    return this.creditsService.getBalance(id)
  }

  @ApiDoc({
    summary: 'Deduct credits (internal)',
    description: 'Internal endpoint for crossboost-ai to deduct credits for AI usage',
  })
  @Post('/users/:id/credits/deduct')
  async deductCredits(
    @Param('id') id: string,
    @Body() body: { amount: number; description: string; referenceId?: string },
  ) {
    return this.creditsService.deductCredits(id, body.amount, body.description, body.referenceId)
  }

  @ApiDoc({
    summary: 'Create notification (internal)',
    description: 'Internal endpoint for crossboost-ai to send notifications',
  })
  @Post('/notifications')
  async createNotification(
    @Body() body: { userId: string; type: string; title: string; message: string; data?: Record<string, unknown> },
  ) {
    return this.notificationService.create(body as any)
  }

  @ApiDoc({
    summary: 'Create content (internal)',
    description: 'Internal endpoint for crossboost-ai to create AI-generated content',
  })
  @Post('/users/:id/content')
  async createContent(
    @Param('id') id: string,
    @Body() body: { type: string; title: string; body: string; platform: string; tags?: string[] },
  ) {
    return this.contentService.create(id, body as any)
  }
}
