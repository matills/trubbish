import { Controller, Delete, Get, HttpCode, Inject, NotFoundException, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { eq } from 'drizzle-orm'
import type { Response } from 'express'
import type { Me } from '@trubbish/shared'
import { CurrentUser, JwtAuthGuard, SESSION_COOKIE, type SessionUser } from '../../common/auth'
import { DRIZZLE, type Database } from '../../database/database.module'
import { users } from '../../database/schema'

@ApiTags('me')
@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly secure: boolean

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    config: ConfigService,
  ) {
    this.secure = config.get('NODE_ENV') === 'production'
  }

  @Get()
  async me(@CurrentUser() user: SessionUser): Promise<Me> {
    const [row] = await this.db
      .select({ id: users.id, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, user.id))
    if (!row) throw new NotFoundException('Usuario inexistente')
    return { ...row, createdAt: row.createdAt.toISOString() }
  }

  /** Borrado total: cuentas, escaneos y pedidos caen por cascada. */
  @Delete()
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: SessionUser, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.db.delete(users).where(eq(users.id, user.id))
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: this.secure, path: '/' })
  }
}
