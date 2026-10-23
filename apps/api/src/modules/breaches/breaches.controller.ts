import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { BreachScan } from '@trubbish/shared'
import { CurrentUser, JwtAuthGuard, type SessionUser } from '../../common/auth'
import { BreachesService } from './breaches.service'

/** Siempre sobre el correo de la sesión: nunca se acepta un correo por parámetro. */
@ApiTags('breaches')
@Controller('breaches')
@UseGuards(JwtAuthGuard)
export class BreachesController {
  constructor(private readonly breaches: BreachesService) {}

  @Get('latest')
  latest(@CurrentUser() user: SessionUser): Promise<BreachScan | null> {
    return this.breaches.latest(user.id)
  }

  @Post('scans')
  @HttpCode(202)
  scan(@CurrentUser() user: SessionUser): Promise<BreachScan> {
    return this.breaches.startScan(user.id)
  }
}
