import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator'
import { Law, RequestStatus } from '@trubbish/shared'

export class CreateRequestDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  accountId: number

  @ApiProperty({ enum: Object.values(Law) })
  @IsIn(Object.values(Law))
  law: Law

  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @MinLength(3, { message: 'Indicá tu nombre completo' })
  @MaxLength(120)
  fullName: string

  @ApiPropertyOptional({ example: '30111222' })
  @IsOptional()
  @Matches(/^[0-9.]{6,12}$/, { message: 'El DNI tiene solo números' })
  documentId?: string

  @ApiPropertyOptional({ example: 'privacy@servicio.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El destinatario no es un correo válido' })
  recipient?: string
}

export class UpdateRequestDto {
  @ApiProperty({ enum: Object.values(RequestStatus) })
  @IsIn(Object.values(RequestStatus))
  status: RequestStatus
}
