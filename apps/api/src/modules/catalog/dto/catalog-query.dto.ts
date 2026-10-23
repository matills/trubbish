import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { Category } from '@borrar/shared'

export class CatalogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string

  @ApiPropertyOptional({ enum: Object.values(Category) })
  @IsOptional()
  @IsIn(Object.values(Category))
  category?: Category
}
