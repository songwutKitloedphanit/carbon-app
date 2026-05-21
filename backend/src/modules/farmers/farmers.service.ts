import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FarmersService {
  constructor(private prisma: PrismaService) {}

  getFarmers(factoryId?: number, serviceAreaId?: number) {
    return this.prisma.farmers.findMany({
      where: {
        ...(factoryId     ? { factory_id:      factoryId }     : {}),
        ...(serviceAreaId ? { service_area_id: serviceAreaId } : {}),
      },
      include: {
        factories:     { select: { name: true } },
        service_areas: { select: { name: true } },
      },
      orderBy: { farmer_id: 'asc' },
    })
  }

  getFarmerById(id: number) {
    return this.prisma.farmers.findUnique({
      where: { farmer_id: id },
      include: { lands: true },
    })
  }

  createFarmer(data: {
    first_name: string; last_name: string
    thai_national_id?: string; thai_farmer_id?: string
    phone?: string; factory_id?: number; service_area_id?: number
    updated_uid?: number
  }) {
    return this.prisma.farmers.create({ data: { ...data, update_at: new Date() } })
  }

  updateFarmer(id: number, data: Partial<{
    first_name: string; last_name: string; phone: string
    thai_national_id: string; thai_farmer_id: string
    factory_id: number; service_area_id: number
  }>) {
    return this.prisma.farmers.update({
      where: { farmer_id: id },
      data: { ...data, update_at: new Date() },
    })
  }

  deleteFarmer(id: number) {
    return this.prisma.farmers.delete({ where: { farmer_id: id } })
  }
}
