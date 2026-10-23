import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'

export const SESSION_COOKIE = 'bmvd_session'

export interface SessionUser {
  id: number
  email: string
}

interface SessionPayload {
  sub: number
  email: string
}

type AuthedRequest = Request & { user?: SessionUser }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>()
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE]
    if (!token) throw new UnauthorizedException('Sesión requerida')
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token)
      req.user = { id: payload.sub, email: payload.email }
      return true
    } catch {
      throw new UnauthorizedException('Sesión vencida')
    }
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user
  if (!user) throw new UnauthorizedException()
  return user
})
