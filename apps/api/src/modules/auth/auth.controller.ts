import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { CookieOptions, Response } from 'express'
import type { RequestCodeResponse } from '@borrar/shared'
import { SESSION_COOKIE } from '../../common/auth'
import { AuthService } from './auth.service'
import { RequestCodeDto, VerifyCodeDto } from './dto/auth.dto'

const SESSION_DAYS = 7

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookie: CookieOptions

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.cookie = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV') === 'production',
      path: '/',
    }
  }

  @Post('code')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestCode(@Body() dto: RequestCodeDto): Promise<RequestCodeResponse> {
    return this.auth.requestCode(dto.email)
  }

  @Post('verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verify(@Body() dto: VerifyCodeDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.verifyCode(dto.email, dto.code)
    res.cookie(SESSION_COOKIE, token, { ...this.cookie, maxAge: SESSION_DAYS * 86_400_000 })
    return user
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookie)
  }
}
