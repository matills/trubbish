import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { AccountsController } from './accounts.controller'
import { AccountsService } from './accounts.service'

@Module({
  imports: [CatalogModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
