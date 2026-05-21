import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { FarmersService } from './farmers.service'

@ApiTags('Farmers')
@Controller('farmers')
export class FarmersController {
  constructor(private svc: FarmersService) {}

  @Get()
  @ApiQuery({ name: 'factory_id',      required: false, type: Number })
  @ApiQuery({ name: 'service_area_id', required: false, type: Number })
  getFarmers(
    @Query('factory_id')      fid?: string,
    @Query('service_area_id') sid?: string,
  ) {
    return this.svc.getFarmers(fid ? +fid : undefined, sid ? +sid : undefined)
  }

  @Get(':id') getFarmerById(@Param('id', ParseIntPipe) id: number) { return this.svc.getFarmerById(id) }
  @Post()     createFarmer(@Body() b: any)  { return this.svc.createFarmer(b) }
  @Put(':id') updateFarmer(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.svc.updateFarmer(id, b) }
  @Delete(':id') deleteFarmer(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteFarmer(id) }
}
