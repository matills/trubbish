import { Module } from '@nestjs/common'
import { AccountsModule } from '../accounts/accounts.module'
import { RequestsController } from './requests.controller'
import { RequestsService } from './requests.service'

@Module({
  imports: [AccountsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
