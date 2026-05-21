import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LandsService {
  constructor(private prisma: PrismaService) {}

  // ── Lands ──────────────────────────────────────────────────
  getLands(campId?: number, farmerId?: number) {
    return this.prisma.lands.findMany({
      where: {
        ...(campId   ? { land_camp_id: campId }   : {}),
        ...(farmerId ? { farmer_id:    farmerId }  : {}),
      },
      include: {
        farmers:     { select: { first_name: true, last_name: true } },
        lands_camps: { select: { land_camp_name: true } },
      },
      orderBy: { land_id: 'asc' },
    })
  }

  getLandById(id: number) {
    return this.prisma.lands.findUnique({
      where: { land_id: id },
      include: {
        lands_camps:  true,
        farmers:      { select: { first_name: true, last_name: true, phone: true } },
        subdistricts: { select: { name_th: true, zip_code: true } },
      },
    })
  }

  createLand(data: {
    land_code?: string; name?: string; farmer_id?: number; land_camp_id?: number
    area_size?: number; land_size?: number; village?: string; zip_code?: string
    latitude?: number; longitude?: number; subdistrict_code?: number; updated_uid?: number
  }) {
    return this.prisma.lands.create({ data: { ...data, update_at: new Date() } })
  }

  updateLand(id: number, data: Partial<{
    land_code: string; name: string; area_size: number; land_size: number
    village: string; zip_code: string; land_camp_id: number; farmer_id: number
  }>) {
    return this.prisma.lands.update({ where: { land_id: id }, data: { ...data, update_at: new Date() } })
  }

  deleteLand(id: number) {
    return this.prisma.lands.delete({ where: { land_id: id } })
  }

  // ── Camps ──────────────────────────────────────────────────
  getCamps() {
    return this.prisma.lands_camps.findMany({
      orderBy: { land_camp_id: 'asc' },
    })
  }

  createCamp(data: {
    land_camp_name?: string; land_camp_idCode?: string
    land_camp_latitude?: number; land_camp_longitude?: number
    land_camp_info?: string; land_camp_uid?: number
  }) {
    return this.prisma.lands_camps.create({ data: { ...data, land_camp_update_at: new Date() } })
  }

  updateCamp(id: number, data: Partial<{
    land_camp_name: string; land_camp_idCode: string
    land_camp_latitude: number; land_camp_longitude: number; land_camp_info: string
  }>) {
    return this.prisma.lands_camps.update({ where: { land_camp_id: id }, data: { ...data, land_camp_update_at: new Date() } })
  }

  deleteCamp(id: number) {
    return this.prisma.lands_camps.delete({ where: { land_camp_id: id } })
  }

  // ── Landmaps ───────────────────────────────────────────────
  getLandmaps() {
    return this.prisma.landmaps.findMany({ orderBy: { landmap_id: 'asc' } })
  }

  createLandmap(data: {
    landmap_idCode?: string; landmap_area_size?: number
    landmap_latitude?: number; landmap_longitude?: number; landmap_info?: string
  }) {
    return this.prisma.landmaps.create({ data: { ...data, landmap_create_at: new Date(), landmap_update_at: new Date() } })
  }

  // ── Landmap owners ─────────────────────────────────────────
  getLandmapOwners(landmapId?: number) {
    return this.prisma.landmaps_owner.findMany({
      where: landmapId ? { landmap_id: landmapId } : undefined,
      include: {
        farmers:  { select: { first_name: true, last_name: true } },
        landmaps: { select: { landmap_idCode: true } },
      },
    })
  }

  createLandmapOwner(data: { landmap_id?: number; landmap_owner_fid?: number; landmap_owner_uid?: number; landmap_owner_info?: string }) {
    return this.prisma.landmaps_owner.create({ data: { ...data, landmap_owner_create_at: new Date(), landmap_owner_update_at: new Date() } })
  }

  // ── Mapping (land ↔ landmap) ───────────────────────────────
  getMappings(landId?: number, landmapId?: number) {
    return this.prisma.lands_landmaps_mapping.findMany({
      where: {
        ...(landId    ? { land_id:    landId }    : {}),
        ...(landmapId ? { landmap_id: landmapId } : {}),
      },
      include: {
        lands:    { select: { land_code: true, name: true } },
        landmaps: { select: { landmap_idCode: true } },
      },
    })
  }
}
