import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { CatalogEntry } from '@trubbish/shared'
import { CatalogService } from './catalog.service'
import { CatalogQueryDto } from './dto/catalog-query.dto'

/** Dato de referencia público: no expone nada del usuario. */
@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: CatalogQueryDto): Promise<CatalogEntry[]> {
    return this.catalog.list(query.q, query.category)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CatalogEntry> {
    return this.catalog.findById(id)
  }
}
