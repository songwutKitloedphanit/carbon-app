import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiQuery }       from '@nestjs/swagger'
import { AnalyticsService }        from './analytics.service'

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}

  @Get('summary')      getSummary()    { return this.svc.getSummary() }
  @Get('by-camp')      getByCamp()     { return this.svc.getByCamp() }
  @Get('by-activity')  getByActivity() { return this.svc.getByActivity() }

  @Get('by-land')
  @ApiQuery({ name: 'camp_id', required: false, type: Number })
  getByLand(@Query('camp_id') cid?: string) { return this.svc.getByLand(cid ? +cid : undefined) }

  @Get('compare-camps')
  @ApiQuery({ name: 'ids', required: true, type: String, description: 'comma-separated camp IDs' })
  compareCamps(@Query('ids') ids: string) {
    const campIds = (ids ?? '').split(',').map(Number).filter(Boolean)
    return this.svc.getMultiCampComparison(campIds)
  }
}
