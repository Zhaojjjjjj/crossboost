import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CreditTransaction, User } from '@crossboost/database'
import { CreditsService } from './credits.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction, User])],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
