import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { AccountSource, AccountStatus } from '@trubbish/shared'

export class CreateAccountDto {
  @ApiPropertyOptional({ description: 'Servicio del catálogo. Si falta, se usa `domain`.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  serviceId?: number

  @ApiPropertyOptional({ example: 'letterboxd.com' })
  @ValidateIf((o: CreateAccountDto) => o.serviceId === undefined)
  @IsString({ message: 'Indicá un servicio o un dominio' })
  @MaxLength(253)
  domain?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @ApiProperty({ enum: Object.values(AccountSource) })
  @IsIn(Object.values(AccountSource))
  source: AccountSource

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string
}

export class BulkItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2048)
  domain: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string
}

/**
 * Import en lote desde el CSV del navegador o las apps conectadas.
 * Solo dominios: el cliente descarta usuarios y contraseñas antes de enviar.
 */
export class BulkImportDto {
  @ApiProperty({ enum: [AccountSource.BROWSER, AccountSource.CONNECTED_APPS, AccountSource.BREACH, AccountSource.GUIDED] })
  @IsIn([AccountSource.BROWSER, AccountSource.CONNECTED_APPS, AccountSource.BREACH, AccountSource.GUIDED])
  source: AccountSource

  @ApiProperty({ type: [BulkItemDto] })
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => BulkItemDto)
  items: BulkItemDto[]
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ enum: Object.values(AccountStatus) })
  @IsOptional()
  @IsIn(Object.values(AccountStatus))
  status?: AccountStatus

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null

  @ApiPropertyOptional({ description: 'Obligatorio para marcar como borrada una cuenta de categoría sensible.' })
  @IsOptional()
  @IsBoolean()
  confirmSensitive?: boolean
}

export class AccountsQueryDto {
  @ApiPropertyOptional({ enum: Object.values(AccountStatus) })
  @IsOptional()
  @IsIn(Object.values(AccountStatus))
  status?: AccountStatus
}
