import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { InfraService } from './infra.service'

@ApiTags('Infrastructure')
@Controller('infra')
export class InfraController {
  constructor(private infra: InfraService) {}

  // factories
  @Get('factories')    getFactories() { return this.infra.getFactories() }
  @Post('factories')   createFactory(@Body() b: any)  { return this.infra.createFactory(b) }
  @Put('factories/:id')  updateFactory(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.infra.updateFactory(id, b) }
  @Delete('factories/:id') deleteFactory(@Param('id', ParseIntPipe) id: number) { return this.infra.deleteFactory(id) }

  // service areas
  @Get('service-areas')
  @ApiQuery({ name: 'factory_id', required: false, type: Number })
  getServiceAreas(@Query('factory_id') fid?: string) { return this.infra.getServiceAreas(fid ? +fid : undefined) }
  @Post('service-areas')   createServiceArea(@Body() b: any)  { return this.infra.createServiceArea(b) }
  @Put('service-areas/:id')  updateServiceArea(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.infra.updateServiceArea(id, b) }
  @Delete('service-areas/:id') deleteServiceArea(@Param('id', ParseIntPipe) id: number) { return this.infra.deleteServiceArea(id) }

  // departments
  @Get('departments')    getDepartments() { return this.infra.getDepartments() }
  @Post('departments')   createDepartment(@Body() b: any) { return this.infra.createDepartment(b) }
  @Put('departments/:id')  updateDepartment(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.infra.updateDepartment(id, b) }
  @Delete('departments/:id') deleteDepartment(@Param('id', ParseIntPipe) id: number) { return this.infra.deleteDepartment(id) }
}
