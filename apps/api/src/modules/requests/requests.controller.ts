import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'
import type { DeletionRequest } from '@trubbish/shared'
import { CurrentUser, JwtAuthGuard, type SessionUser } from '../../common/auth'
import { CreateRequestDto, UpdateRequestDto } from './dto/requests.dto'
import { RequestsService } from './requests.service'

class RequestsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId?: number
}

@ApiTags('requests')
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser, @Query() query: RequestsQueryDto): Promise<DeletionRequest[]> {
    return this.requests.list(user.id, query.accountId)
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateRequestDto): Promise<DeletionRequest> {
    return this.requests.create(user, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequestDto,
  ): Promise<DeletionRequest> {
    return this.requests.updateStatus(user.id, id, dto.status)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: SessionUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.requests.remove(user.id, id)
  }
}
