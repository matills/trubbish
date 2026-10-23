import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { AccountStats, BulkImportResult, TrackedAccount } from '@borrar/shared'
import { CurrentUser, JwtAuthGuard, type SessionUser } from '../../common/auth'
import { AccountsService } from './accounts.service'
import { AccountsQueryDto, BulkImportDto, CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto'

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser, @Query() query: AccountsQueryDto): Promise<TrackedAccount[]> {
    return this.accounts.list(user.id, query.status)
  }

  @Get('stats')
  stats(@CurrentUser() user: SessionUser): Promise<AccountStats> {
    return this.accounts.stats(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: SessionUser, @Param('id', ParseIntPipe) id: number): Promise<TrackedAccount> {
    return this.accounts.findOne(user.id, id)
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateAccountDto): Promise<TrackedAccount> {
    return this.accounts.create(user.id, dto)
  }

  @Post('bulk')
  bulk(@CurrentUser() user: SessionUser, @Body() dto: BulkImportDto): Promise<BulkImportResult> {
    return this.accounts.bulkImport(user.id, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ): Promise<TrackedAccount> {
    return this.accounts.update(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: SessionUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.accounts.remove(user.id, id)
  }
}
