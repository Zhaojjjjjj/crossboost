import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@crossboost/common'
import { ConnectAccountDto, ConnectAccountDtoSchema } from './account.dto'
import { AccountService } from './account.service'

@ApiTags('Account')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @ApiDoc({
    summary: 'List connected accounts',
    description: 'Get all platform accounts connected by the current user',
  })
  @Get('/')
  async listAccounts() {
    const userId = 'current-user-id'
    return this.accountService.listByUserId(userId)
  }

  @ApiDoc({
    summary: 'Connect a platform account',
    description: 'Initiate OAuth flow and connect a new platform account',
    body: ConnectAccountDtoSchema,
  })
  @Post('/connect')
  async connectAccount(@Body() body: ConnectAccountDto) {
    const userId = 'current-user-id'
    return this.accountService.connect(userId, body.platform, {
      platformAccountId: body.platformAccountId,
      accountName: body.accountName,
      avatar: body.avatar,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      tokenExpiresAt: body.tokenExpiresAt,
      metadata: body.metadata,
    })
  }

  @ApiDoc({
    summary: 'Disconnect a platform account',
    description: 'Remove connection to a platform account',
  })
  @Delete('/:id')
  async disconnectAccount(@Param('id') id: string) {
    const userId = 'current-user-id'
    await this.accountService.disconnect(id, userId)
  }
}
