import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class InfraService {
  constructor(private prisma: PrismaService) {}

  // ── Factories ──────────────────────────────────────────────
  getFactories() {
    return this.prisma.factories.findMany({ orderBy: { factory_id: 'asc' } })
  }
  createFactory(data: { name: string; initial?: string; note?: string; updated_uid?: number }) {
    return this.prisma.factories.create({ data: { ...data, update_at: new Date() } })
  }
  updateFactory(id: number, data: Partial<{ name: string; initial: string; note: string }>) {
    return this.prisma.factories.update({ where: { factory_id: id }, data: { ...data, update_at: new Date() } })
  }
  deleteFactory(id: number) {
    return this.prisma.factories.delete({ where: { factory_id: id } })
  }

  // ── Service Areas ──────────────────────────────────────────
  getServiceAreas(factoryId?: number) {
    return this.prisma.service_areas.findMany({
      where: factoryId ? { factory_id: factoryId } : undefined,
      include: { factories: { select: { name: true } } },
      orderBy: { service_area_id: 'asc' },
    })
  }
  createServiceArea(data: { name: string; code?: string; factory_id?: number; note?: string }) {
    return this.prisma.service_areas.create({ data: { ...data, update_at: new Date() } })
  }
  updateServiceArea(id: number, data: Partial<{ name: string; code: string; factory_id: number; note: string }>) {
    return this.prisma.service_areas.update({ where: { service_area_id: id }, data: { ...data, update_at: new Date() } })
  }
  deleteServiceArea(id: number) {
    return this.prisma.service_areas.delete({ where: { service_area_id: id } })
  }

  // ── Departments ────────────────────────────────────────────
  getDepartments() {
    return this.prisma.departments.findMany({ orderBy: { departments_id: 'asc' } })
  }
  createDepartment(data: { name: string }) {
    return this.prisma.departments.create({ data: { ...data, created_at: new Date(), updated_at: new Date() } })
  }
  updateDepartment(id: number, data: Partial<{ name: string }>) {
    return this.prisma.departments.update({ where: { departments_id: id }, data: { ...data, updated_at: new Date() } })
  }
  deleteDepartment(id: number) {
    return this.prisma.departments.delete({ where: { departments_id: id } })
  }
}
