import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Co2eEngineService } from './co2e-engine.service'

export interface ColumnMapping { targetKey: string; sourceKey: string | null }

const CAL_STATUS_PENDING  = 1
const CAL_STATUS_DONE     = 2
const CAL_STATUS_ERROR    = 3

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name)

  constructor(
    private prisma:  PrismaService,
    private engine:  Co2eEngineService,
  ) {}

  // ── Headers ────────────────────────────────────────────────
  getHeaders(landId?: number, farmerId?: number) {
    return this.prisma.activities_header.findMany({
      where: {
        ...(landId   ? { land_id:   landId }   : {}),
        ...(farmerId ? { farmer_id: farmerId }  : {}),
      },
      include: {
        lands:                  { select: { land_code: true, name: true } },
        activities_header_type: { select: { act_header_type_name_th: true } },
      },
      orderBy: { activities_header_id: 'desc' },
    })
  }

  async createHeader(data: {
    land_id?: number; farmer_id?: number
    act_header_type_id?: number; act_header_typeLand_id?: number
    act_header_typeSugarCane_id?: number
    activities_header_startDate?: Date
    activities_header_idCode?: string; activities_header_update_uid?: number
  }) {
    const code = data.activities_header_idCode ?? `ACT-${Date.now()}`
    return this.prisma.activities_header.create({
      data: { ...data, activities_header_idCode: code, activities_header_create_at: new Date() },
    })
  }

  updateHeader(id: number, data: any) {
    return this.prisma.activities_header.update({ where: { activities_header_id: id }, data })
  }

  deleteHeader(id: number) {
    return this.prisma.activities_header.delete({ where: { activities_header_id: id } })
  }

  // ── Details ────────────────────────────────────────────────
  getDetails(headerId?: number) {
    return this.prisma.log_activities_detail.findMany({
      where: headerId ? { activities_header_id: headerId } : undefined,
      include: {
        activities_fertilizers: { select: { act_fertilizer_name: true } },
        activities_equipments:  { select: { act_equipment_name: true } },
        activities_chemiscals:  { select: { act_chemiscal_name: true } },
        resource_used_type:     { select: { resc_used_type_name: true } },
      },
      orderBy: { log_act_detail_id: 'desc' },
    })
  }

  async createDetail(data: {
    activities_header_id: number
    act_header_type_id?: number; act_header_detail_type_id?: number
    act_fertilizer_id?: number; act_equipment_id?: number; act_chemiscal_id?: number
    resource_used_type_id?: number; unit_id?: number; unit_prefix_id?: number
    log_act_detail_quatity?: number; log_act_detail_volumePerUnit?: number
    log_act_detail_volumeAll: number; log_act_detail_areawork?: number
    calcMode?: 'standard' | 'tver'
  }) {
    // Auto-calculate CO2e
    const { calcMode, ...rest } = data
    let calStatusId = CAL_STATUS_PENDING

    const detail = await this.prisma.log_activities_detail.create({
      data: { ...rest, log_act_detail_create_at: new Date(), log_act_detail_calStatus_id: calStatusId },
    })

    // Async CO2e computation
    this.triggerCalc(detail.log_act_detail_id, data.resource_used_type_id, data.log_act_detail_volumeAll, data.log_act_detail_volumePerUnit, data.log_act_detail_quatity, calcMode)
      .catch(e => this.logger.error('CO2e calc failed', e))

    return detail
  }

  private async triggerCalc(
    detailId: number, resourceTypeId?: number,
    volumeAll?: number, volumePerUnit?: number, quantity?: number,
    calcMode: 'standard' | 'tver' = 'standard',
  ) {
    try {
      const result = await this.engine.calculate({
        volumeAll: volumeAll ?? 0,
        volumePerUnit,
        quantity,
        resourceTypeId,
        calcMode,
      })
      await this.prisma.log_activities_detail.update({
        where: { log_act_detail_id: detailId },
        data:  { log_act_detail_calStatus_id: CAL_STATUS_DONE },
      })
      this.logger.log(`Detail #${detailId} CO2e=${result.co2e_total} kgCO2e`)
    } catch {
      await this.prisma.log_activities_detail.update({
        where: { log_act_detail_id: detailId },
        data:  { log_act_detail_calStatus_id: CAL_STATUS_ERROR },
      })
    }
  }

  // ── Reference lists ────────────────────────────────────────
  getHeaderTypes() { return this.prisma.activities_header_type.findMany({ orderBy: { act_header_type_id: 'asc' } }) }
  getDetailTypes(headerTypeId?: number) {
    return this.prisma.activities_header_detail_type.findMany({
      where: headerTypeId ? { act_header_type_id: headerTypeId } : undefined,
    })
  }
  getResourceTypes() { return this.prisma.resource_used_type.findMany({ orderBy: { resource_used_type_id: 'asc' } }) }
  getFertilizers()   { return this.prisma.activities_fertilizers.findMany({ orderBy: { act_fertilizer_id: 'asc' } }) }
  getEquipments()    { return this.prisma.activities_equipments.findMany({ orderBy: { act_equipment_id: 'asc' } }) }
  getChemicals()     { return this.prisma.activities_chemiscals.findMany({ orderBy: { act_chemiscal_id: 'asc' } }) }
  getSugarCaneTypes(){ return this.prisma.activities_header_typeSugarCane.findMany() }
  getLandTypes()     { return this.prisma.activities_header_typeLand.findMany() }
  getCalStatuses()   { return this.prisma.log_act_detail_calStatus.findMany() }

  // ── CSV Import ─────────────────────────────────────────────
  /**
   * Columns from actual xlsx file:
   *   กิจกรรม | ไร่(camp) | แปลง | รายการปัจจัยการผลิต | ปริมาณ | math
   *   ปริมาณใช้ | ไร่(area) | รวมเป็นเงิน | ประเภทปัจจัย | หน่วยนับ Farmpro | ประเภทใหม่
   */
  async importFromCsv(
    mappings: ColumnMapping[],
    rows: Record<string, string>[],
    calcMode: 'standard' | 'tver' = 'standard',
  ) {
    if (!rows.length) throw new BadRequestException('No rows')

    const mapIdx = Object.fromEntries(mappings.filter(m => m.sourceKey).map(m => [m.targetKey, m.sourceKey!]))

    // Pre-load lookup tables
    const [camps, lands, resourceTypes, fertilizers, equipments, chemicals, headerTypes, units] = await Promise.all([
      this.prisma.lands_camps.findMany({ select: { land_camp_id: true, land_camp_name: true } }),
      this.prisma.lands.findMany({ select: { land_id: true, land_code: true, name: true, land_camp_id: true } }),
      this.prisma.resource_used_type.findMany({ select: { resource_used_type_id: true, resc_used_type_name: true } }),
      this.prisma.activities_fertilizers.findMany({ select: { act_fertilizer_id: true, act_fertilizer_name: true } }),
      this.prisma.activities_equipments.findMany({ select: { act_equipment_id: true, act_equipment_name: true } }),
      this.prisma.activities_chemiscals.findMany({ select: { act_chemiscal_id: true, act_chemiscal_name: true } }),
      this.prisma.activities_header_type.findMany({ select: { act_header_type_id: true, act_header_type_name_th: true } }),
      this.prisma.units.findMany({ select: { unit_id: true, unit_name: true, unit_initial: true } }),
    ])

    const byName = {
      camp:         Object.fromEntries(camps.map(c => [c.land_camp_name?.toLowerCase() ?? '', c.land_camp_id])),
      land:         Object.fromEntries(lands.map(l => [l.land_code?.toLowerCase() ?? '', l.land_id])),
      resType:      Object.fromEntries(resourceTypes.map(r => [r.resc_used_type_name?.toLowerCase() ?? '', r.resource_used_type_id])),
      fertilizer:   Object.fromEntries(fertilizers.map(f => [f.act_fertilizer_name?.toLowerCase() ?? '', f.act_fertilizer_id])),
      equipment:    Object.fromEntries(equipments.map(e => [e.act_equipment_name?.toLowerCase() ?? '', e.act_equipment_id])),
      chemical:     Object.fromEntries(chemicals.map(c => [c.act_chemiscal_name?.toLowerCase() ?? '', c.act_chemiscal_id])),
      headerType:   Object.fromEntries(headerTypes.map(t => [t.act_header_type_name_th?.toLowerCase() ?? '', t.act_header_type_id])),
      unit:         Object.fromEntries(units.map(u => [u.unit_name?.toLowerCase() ?? '', u.unit_id])),
    }

    const results = { inserted: 0, skipped: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const get = (key: string) => (mapIdx[key] ? row[mapIdx[key]]?.trim() ?? '' : '')

      try {
        // Resolve land_id (required)
        let landId: number | undefined
        const campName = get('land_camp_name')
        const landCode = get('land_code')

        if (landCode) {
          landId = byName.land[landCode.toLowerCase()]
            ?? lands.find(l => l.land_camp_id === byName.camp[campName.toLowerCase()] && l.land_code?.toLowerCase() === landCode.toLowerCase())?.land_id
        }

        if (!landId) { results.errors.push(`Row ${i + 2}: ไม่พบแปลง "${landCode}"`); results.skipped++; continue }

        // Resolve activity header type
        const actTypeName    = get('act_header_type')
        const actTypeId      = byName.headerType[actTypeName.toLowerCase()]

        // Create header per row (or find existing for same land + date — simplified: 1 row = 1 header)
        const header = await this.prisma.activities_header.create({
          data: {
            land_id:                     landId,
            act_header_type_id:          actTypeId,
            activities_header_idCode:    `IMP-${Date.now()}-${i}`,
            activities_header_startDate: new Date(),
            activities_header_create_at: new Date(),
          },
        })

        // Resolve resource
        const resTypeName   = get('resource_used_type')
        const resTypeId     = byName.resType[resTypeName.toLowerCase()]
        const resourceName  = get('resource_item_name').toLowerCase()
        const fertilizerId = byName.fertilizer[resourceName]
        const equipmentId  = byName.equipment[resourceName]
        const chemicalId   = byName.chemical[resourceName]
        const unitName     = get('unit_name')
        const unitId       = byName.unit[unitName.toLowerCase()]

        const volumeAll      = parseFloat(get('log_act_detail_volumeAll'))  || 0
        const volumePerUnit  = parseFloat(get('log_act_detail_volumePerUnit')) || 1
        const quantity       = parseInt(get('log_act_detail_quatity'), 10)  || 1
        const areawork       = parseFloat(get('log_act_detail_areawork'))   || undefined

        await this.createDetail({
          activities_header_id:      header.activities_header_id,
          resource_used_type_id:     resTypeId,
          act_fertilizer_id:         fertilizerId,
          act_equipment_id:          equipmentId,
          act_chemiscal_id:          chemicalId,
          unit_id:                   unitId,
          log_act_detail_quatity:    quantity,
          log_act_detail_volumePerUnit: volumePerUnit,
          log_act_detail_volumeAll:  volumeAll,
          log_act_detail_areawork:   areawork,
          calcMode,
        })

        results.inserted++
      } catch (e: any) {
        results.errors.push(`Row ${i + 2}: ${e.message}`)
        results.skipped++
      }
    }

    return results
  }
}
