import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EmissionFactorsService {
  constructor(private prisma: PrismaService) {}

  // EF coefficients
  getCoefficients(groupId?: number, cfTypeId?: number) {
    return this.prisma.coefficients_emissions_factors.findMany({
      where: {
        ...(groupId  ? { group_emission_factor_id: groupId }  : {}),
        ...(cfTypeId ? { carbonfootprint_type_id:  cfTypeId } : {}),
      },
      orderBy: { coefficient_emission_factor_id: 'asc' },
    })
  }

  createCoefficient(data: Record<string, unknown>) {
    return this.prisma.coefficients_emissions_factors.create({ data: { ...data, create_at: new Date(), update_at: new Date() } as any })
  }

  updateCoefficient(id: number, data: Record<string, unknown>) {
    return this.prisma.coefficients_emissions_factors.update({
      where: { coefficient_emission_factor_id: id },
      data: { ...data, update_at: new Date() } as any,
    })
  }

  deleteCoefficient(id: number) {
    return this.prisma.coefficients_emissions_factors.delete({ where: { coefficient_emission_factor_id: id } })
  }

  // GWP
  getGwp() { return this.prisma.coefficients_emissions_factors_gwp.findMany({ orderBy: { coefficients_emissions_factors_gwp_id: 'asc' } }) }
  createGwp(data: Record<string, unknown>) { return this.prisma.coefficients_emissions_factors_gwp.create({ data: { ...data, coef_em_factor_gwp_create_at: new Date() } as any }) }
  updateGwp(id: number, data: Record<string, unknown>) {
    return this.prisma.coefficients_emissions_factors_gwp.update({
      where: { coefficients_emissions_factors_gwp_id: id },
      data: { ...data, coef_em_factor_gwp_update_at: new Date() } as any,
    })
  }

  // CF Types
  getCfTypes()                  { return this.prisma.carbonfootprints_types.findMany({ orderBy: { carbonfootprint_type_id: 'asc' } }) }
  createCfType(data: any)       { return this.prisma.carbonfootprints_types.create({ data: { ...data, cf_type_create_at: new Date(), cf_type_update_at: new Date() } }) }
  updateCfType(id: number, d: any) { return this.prisma.carbonfootprints_types.update({ where: { carbonfootprint_type_id: id }, data: { ...d, cf_type_update_at: new Date() } }) }

  // Groups
  getGroups(cfTypeId?: number) {
    return this.prisma.groups_emissions_factors.findMany({
      where: cfTypeId ? { carbonfootprint_type_id: cfTypeId } : undefined,
      orderBy: { group_emission_factor_id: 'asc' },
    })
  }
  createGroup(data: any) { return this.prisma.groups_emissions_factors.create({ data }) }
  updateGroup(id: number, data: any) { return this.prisma.groups_emissions_factors.update({ where: { group_emission_factor_id: id }, data }) }

  // Units
  getUnits()        { return this.prisma.units.findMany({ orderBy: { unit_id: 'asc' } }) }
  createUnit(d: any){ return this.prisma.units.create({ data: { ...d, unit_updated_at: new Date() } }) }
  updateUnit(id: number, d: any) { return this.prisma.units.update({ where: { unit_id: id }, data: { ...d, unit_updated_at: new Date() } }) }

  // Unit prefixes
  getUnitPrefixs()         { return this.prisma.units_prefixs.findMany({ orderBy: { unit_prefix_id: 'asc' } }) }
  createUnitPrefix(d: any) { return this.prisma.units_prefixs.create({ data: { ...d, unit_prefix_updated_at: new Date() } }) }
  updateUnitPrefix(id: number, d: any) { return this.prisma.units_prefixs.update({ where: { unit_prefix_id: id }, data: { ...d, unit_prefix_updated_at: new Date() } }) }
}
