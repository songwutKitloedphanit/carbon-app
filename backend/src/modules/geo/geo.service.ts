import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  getGeographies() {
    return this.prisma.geographies.findMany({ orderBy: { geographies_id: 'asc' } })
  }

  getProvinces(geographyId?: number) {
    return this.prisma.provinces.findMany({
      where: geographyId ? { geography_id: geographyId } : undefined,
      orderBy: { name_th: 'asc' },
    })
  }

  getDistricts(provinceId?: number) {
    return this.prisma.districts.findMany({
      where: provinceId ? { province_code: provinceId } : undefined,
      orderBy: { name_th: 'asc' },
    })
  }

  getSubdistricts(districtId?: number) {
    return this.prisma.subdistricts.findMany({
      where: districtId ? { district_code: districtId } : undefined,
      orderBy: { name_th: 'asc' },
    })
  }

  createProvince(data: { name_th: string; name_en?: string; name_th_short?: string; geography_id?: number }) {
    return this.prisma.provinces.create({ data: data as Prisma.provincesUncheckedCreateInput })
  }

  updateProvince(id: number, data: Partial<{ name_th: string; name_en: string; name_th_short: string; geography_id: number }>) {
    return this.prisma.provinces.update({ where: { provinces_id: id }, data })
  }

  deleteProvince(id: number) {
    return this.prisma.provinces.delete({ where: { provinces_id: id } })
  }

  createDistrict(data: { name_th: string; name_en?: string; province_code?: number }) {
    return this.prisma.districts.create({ data: data as Prisma.districtsUncheckedCreateInput })
  }

  updateDistrict(id: number, data: Partial<{ name_th: string; name_en: string; province_code: number }>) {
    return this.prisma.districts.update({ where: { districts_id: id }, data })
  }

  createSubdistrict(data: { name_th: string; name_en?: string; zip_code?: string; district_code?: number; latitude?: number; longitude?: number }) {
    return this.prisma.subdistricts.create({ data: data as Prisma.subdistrictsUncheckedCreateInput })
  }

  updateSubdistrict(id: number, data: Partial<{ name_th: string; name_en: string; zip_code: string; district_code: number }>) {
    return this.prisma.subdistricts.update({ where: { subdistricts_id: id }, data })
  }
}
