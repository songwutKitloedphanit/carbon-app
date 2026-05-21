import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface ColumnMapping { targetKey: string; sourceKey: string | null }

// DB columns of lands_weatherStationRec that accept Float values
const FLOAT_FIELDS = new Set([
  'land_weatherStationRec_airTemperature',
  'land_weatherStationRec_relativeHumidity',
  'land_weatherStationRec_barometricPressure',
  'land_weatherStationRec_windSP',
  'land_weatherStationRec_rainfall',
  'land_weatherStationRec_solarRadiation_UV',
  'land_weatherStationRec_soilMoisture_soilTemp',
  'land_weatherStationRec_dewPoint',
  'land_weatherStationRec_evapotranspiration',
])

@Injectable()
export class WeatherService {
  constructor(private prisma: PrismaService) {}

  // ── CRUD ───────────────────────────────────────────────────
  getRecords(campId?: number) {
    return this.prisma.lands_weatherStationRec.findMany({
      where: campId ? { land_camp_id: campId } : undefined,
      include: { lands_camps: { select: { land_camp_name: true } } },
      orderBy: { land_weatherStationRec_id: 'desc' },
    })
  }

  createRecord(data: Record<string, unknown>) {
    return this.prisma.lands_weatherStationRec.create({ data: data as any })
  }

  deleteRecord(id: number) {
    return this.prisma.lands_weatherStationRec.delete({ where: { land_weatherStationRec_id: id } })
  }

  // ── CSV Import Pipeline ────────────────────────────────────
  /**
   * Accepts:
   *   mappings: [{ targetKey: 'land_camp_id', sourceKey: 'Station ID' }, ...]
   *   rows:     raw CSV rows as Record<string, string>[]
   *
   * For each row:
   *   1. Apply column mappings to extract values
   *   2. Resolve land_camp_id: if value is a name string, look up the ID
   *   3. Parse float fields
   *   4. Bulk insert into lands_weatherStationRec
   */
  async importFromCsv(mappings: ColumnMapping[], rows: Record<string, string>[]) {
    if (!rows.length) throw new BadRequestException('No rows to import')

    // Build active mapping index: targetKey → sourceKey
    const mapIndex = Object.fromEntries(
      mappings.filter(m => m.sourceKey).map(m => [m.targetKey, m.sourceKey!]),
    )

    // Pre-load camps for name→id resolution
    const camps = await this.prisma.lands_camps.findMany({
      select: { land_camp_id: true, land_camp_name: true, land_camp_idCode: true },
    })
    const campByName = Object.fromEntries(
      camps.flatMap(c => [
        [c.land_camp_name?.toLowerCase() ?? '', c.land_camp_id],
        [c.land_camp_idCode?.toLowerCase() ?? '', c.land_camp_id],
      ]),
    )

    const records: Record<string, unknown>[] = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const record: Record<string, unknown> = {}

      for (const [targetKey, sourceKey] of Object.entries(mapIndex)) {
        let raw = row[sourceKey]?.trim() ?? ''
        if (!raw) continue

        if (targetKey === 'land_camp_id') {
          // Resolve: numeric ID or name string
          const numeric = parseInt(raw, 10)
          if (!isNaN(numeric)) {
            record.land_camp_id = numeric
          } else {
            const resolved = campByName[raw.toLowerCase()]
            if (resolved) {
              record.land_camp_id = resolved
            } else {
              errors.push(`Row ${i + 2}: แคมป์ "${raw}" ไม่พบในระบบ`)
              continue
            }
          }
        } else if (FLOAT_FIELDS.has(targetKey)) {
          const val = parseFloat(raw)
          if (!isNaN(val)) record[targetKey] = val
        } else {
          record[targetKey] = raw
        }
      }

      if (record.land_camp_id) {
        records.push(record)
      } else {
        errors.push(`Row ${i + 2}: ไม่พบ land_camp_id — ข้ามแถวนี้`)
      }
    }

    if (!records.length) {
      throw new BadRequestException({ message: 'ไม่มีแถวที่ valid', errors })
    }

    // Bulk insert
    const result = await this.prisma.lands_weatherStationRec.createMany({
      data: records as any[],
      skipDuplicates: false,
    })

    return { inserted: result.count, skipped: rows.length - result.count, errors }
  }
}
