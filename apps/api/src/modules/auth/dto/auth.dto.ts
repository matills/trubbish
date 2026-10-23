import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, Matches, MaxLength } from 'class-validator'

const toEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)

export class RequestCodeDto {
  @ApiProperty({ example: 'yo@ejemplo.com' })
  @Transform(toEmail)
  @IsEmail({}, { message: 'Ingresá un correo válido' })
  @MaxLength(254)
  email: string
}

export class VerifyCodeDto extends RequestCodeDto {
  @ApiProperty({ example: '483920' })
  @Matches(/^\d{6}$/, { message: 'El código tiene 6 dígitos' })
  code: string
}
