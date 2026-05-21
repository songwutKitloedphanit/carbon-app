import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { WeatherService } from './weather.service'

@ApiTags('Weather')
@Controller('lands/weather')
export class WeatherController {
  constructor(private svc: WeatherService) {}

  @Get()
  @ApiQuery({ name: 'camp_id', required: false, type: Number })
  getRecords(@Query('camp_id') cid?: string) {
    return this.svc.getRecords(cid ? +cid : undefined)
  }

  @Post()
  createRecord(@Body() b: Record<string, unknown>) {
    return this.svc.createRecord(b)
  }

  @Delete(':id')
  deleteRecord(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteRecord(id)
  }

  /**
   * POST /api/lands/weather/import
   * Body: { mappings: ColumnMapping[], rows: Record<string,string>[] }
   */
  @Post('import')
  importCsv(@Body() body: { mappings: { targetKey: string; sourceKey: string | null }[]; rows: Record<string, string>[] }) {
    return this.svc.importFromCsv(body.mappings, body.rows)
  }
}
