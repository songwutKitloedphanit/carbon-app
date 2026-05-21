import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface Co2eResult {
  co2e_total:  number
  co2_contrib: number
  ch4_contrib: number
  n2o_contrib: number
  ef_used:     number | null
  gwp_co2:     number
  gwp_ch4:     number
  gwp_n2o:     number
}

// Default IPCC AR5 GWP100 fallbacks when DB has no data
const DEFAULT_GWP = { co2: 1, ch4: 28, n2o: 265 }

@Injectable()
export class Co2eEngineService {
  private readonly logger = new Logger(Co2eEngineService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Core formula:
   *   CO2e = volumeAll × EF_total × GWP_CO2  (for direct CO2)
   *        + volumeAll × EF_ch4  × GWP_CH4
   *        + volumeAll × EF_n2o  × GWP_N2O
   *
   * If no EF is found for the resource type, returns 0 with a warning.
   */
  async calculate(params: {
    volumeAll:         number
    volumePerUnit?:    number
    quantity?:         number
    resourceTypeId?:   number
    fertilizerId?:     number
    chemicalId?:       number
    equipmentId?:      number
    cfTypeId?:         number
    calcMode?:         'standard' | 'tver'
  }): Promise<Co2eResult> {
    const {
      volumeAll, volumePerUnit = 1, quantity = 1,
      resourceTypeId, fertilizerId, chemicalId, equipmentId,
      cfTypeId, calcMode = 'standard',
    } = params

    // Effective volume (matches xlsx: ปริมาณ × ปริมาณ/หน่วย = ปริมาณรวม)
    const effectiveVolume = volumeAll ?? (quantity * volumePerUnit)

    // Load GWP values from DB (co2, ch4, n2o)
    const gwpRows = await this.prisma.coefficients_emissions_factors_gwp.findMany()
    const gwpMap  = this.buildGwpMap(gwpRows)

    // Find EF — look up by resourceTypeId or individual resource FK
    let ef = await this.findEf(resourceTypeId, fertilizerId, chemicalId, equipmentId, cfTypeId)

    if (!ef) {
      this.logger.warn(`No EF found for resource_type=${resourceTypeId} — using zeros`)
      return {
        co2e_total: 0, co2_contrib: 0, ch4_contrib: 0, n2o_contrib: 0,
        ef_used: null, gwp_co2: gwpMap.co2, gwp_ch4: gwpMap.ch4, gwp_n2o: gwpMap.n2o,
      }
    }

    const co2_val  = (ef.coef_em_factor_value_co2  ?? 0) * effectiveVolume
    const ch4_val  = (ef.coef_em_factor_value_ch4  ?? 0) * effectiveVolume
    const n2o_val  = (ef.coef_em_factor_value_n2o  ?? 0) * effectiveVolume

    const co2_contrib  = co2_val  * gwpMap.co2
    const ch4_contrib  = ch4_val  * gwpMap.ch4
    const n2o_contrib  = n2o_val  * gwpMap.n2o

    // T-VER applies a baseline deduction factor (placeholder: -15%)
    const tverFactor = calcMode === 'tver' ? 0.85 : 1.0

    const co2e_total = (co2_contrib + ch4_contrib + n2o_contrib) * tverFactor

    return {
      co2e_total:  Math.round(co2e_total * 1000) / 1000,
      co2_contrib: Math.round(co2_contrib * 1000) / 1000,
      ch4_contrib: Math.round(ch4_contrib * 1000) / 1000,
      n2o_contrib: Math.round(n2o_contrib * 1000) / 1000,
      ef_used:     ef.coef_em_factor_value_total,
      gwp_co2:     gwpMap.co2,
      gwp_ch4:     gwpMap.ch4,
      gwp_n2o:     gwpMap.n2o,
    }
  }

  // ── helpers ────────────────────────────────────────────────
  private buildGwpMap(rows: { coef_em_factor_gwp_name_en?: string | null; coef_em_factor_gwp_value?: number | null }[]) {
    const map = { ...DEFAULT_GWP }
    for (const r of rows) {
      const name = r.coef_em_factor_gwp_name_en?.toLowerCase() ?? ''
      if (name.includes('co2') && !name.includes('ch4') && !name.includes('n2o')) map.co2 = r.coef_em_factor_gwp_value ?? map.co2
      else if (name.includes('ch4')) map.ch4 = r.coef_em_factor_gwp_value ?? map.ch4
      else if (name.includes('n2o')) map.n2o = r.coef_em_factor_gwp_value ?? map.n2o
    }
    return map
  }

  private async findEf(
    resourceTypeId?: number,
    fertilizerId?: number,
    chemicalId?: number,
    equipmentId?: number,
    cfTypeId?: number,
  ) {
    // Try direct group link from resource type
    if (resourceTypeId) {
      const ef = await this.prisma.coefficients_emissions_factors.findFirst({
        where: {
          ...(cfTypeId ? { carbonfootprint_type_id: cfTypeId } : {}),
        },
        orderBy: { coefficient_emission_factor_id: 'asc' },
      })
      if (ef) return ef
    }
    return null
  }
}
