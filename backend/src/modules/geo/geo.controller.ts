import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { GeoService } from './geo.service'

@ApiTags('Geo')
@Controller('geo')
export class GeoController {
  constructor(private geo: GeoService) {}

  @Get('geographies')
  getGeographies() { return this.geo.getGeographies() }

  @Get('provinces')
  @ApiQuery({ name: 'geography_id', required: false, type: Number })
  getProvinces(@Query('geography_id') gid?: string) {
    return this.geo.getProvinces(gid ? +gid : undefined)
  }

  @Get('districts')
  @ApiQuery({ name: 'province_id', required: false, type: Number })
  getDistricts(@Query('province_id') pid?: string) {
    return this.geo.getDistricts(pid ? +pid : undefined)
  }

  @Get('subdistricts')
  @ApiQuery({ name: 'district_id', required: false, type: Number })
  getSubdistricts(@Query('district_id') did?: string) {
    return this.geo.getSubdistricts(did ? +did : undefined)
  }

  @Post('provinces')
  createProvince(@Body() body: { name_th: string; name_en?: string; name_th_short?: string; geography_id?: number }) {
    return this.geo.createProvince(body)
  }

  @Put('provinces/:id')
  updateProvince(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.geo.updateProvince(id, body)
  }

  @Delete('provinces/:id')
  deleteProvince(@Param('id', ParseIntPipe) id: number) {
    return this.geo.deleteProvince(id)
  }

  @Post('districts')
  createDistrict(@Body() body: { name_th: string; name_en?: string; province_code?: number }) {
    return this.geo.createDistrict(body)
  }

  @Put('districts/:id')
  updateDistrict(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.geo.updateDistrict(id, body)
  }

  @Post('subdistricts')
  createSubdistrict(@Body() body: any) { return this.geo.createSubdistrict(body) }

  @Put('subdistricts/:id')
  updateSubdistrict(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.geo.updateSubdistrict(id, body)
  }
}
