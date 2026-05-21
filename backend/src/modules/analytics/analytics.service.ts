import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Overall summary — total log details grouped by cal status
  async getSummary() {
    const details = await this.prisma.log_activities_detail.findMany({
      where: { log_act_detail_calStatus_id: 2 }, // done
      select: {
        log_act_detail_volumeAll:    true,
        log_act_detail_areawork:     true,
        resource_used_type_id:       true,
        activities_header:           { select: { land_id: true, act_header_type_id: true } },
      },
    })
    return {
      total_records:  details.length,
      total_volume:   details.reduce((s, d) => s + (d.log_act_detail_volumeAll ?? 0), 0),
      total_areawork: details.reduce((s, d) => s + (d.log_act_detail_areawork  ?? 0), 0),
    }
  }

  // Aggregate by camp (via land → land_camp)
  async getByCamp() {
    const camps = await this.prisma.lands_camps.findMany({
      include: {
        lands: {
          include: {
            activities_header: {
              include: {
                log_activities_detail: {
                  where: { log_act_detail_calStatus_id: 2 },
                  select: { log_act_detail_volumeAll: true },
                },
              },
            },
          },
        },
      },
    })

    return camps.map(camp => ({
      camp_id:   camp.land_camp_id,
      camp_name: camp.land_camp_name,
      co2e:      camp.lands.flatMap(l =>
        l.activities_header.flatMap(h =>
          h.log_activities_detail.map(d => d.log_act_detail_volumeAll ?? 0)
        )
      ).reduce((s, v) => s + v, 0),
    }))
  }

  // Aggregate by activity type
  async getByActivity() {
    const types = await this.prisma.activities_header_type.findMany({
      include: {
        activities_header: {
          include: {
            log_activities_detail: {
              where: { log_act_detail_calStatus_id: 2 },
              select: { log_act_detail_volumeAll: true },
            },
          },
        },
      },
    })

    return types.map(t => ({
      activity_type_id: t.act_header_type_id,
      activity_type:    t.act_header_type_name_th,
      co2e: t.activities_header
        .flatMap(h => h.log_activities_detail)
        .reduce((s, d) => s + (d.log_act_detail_volumeAll ?? 0), 0),
    }))
  }

  // Aggregate by individual land plot
  async getByLand(campId?: number) {
    const lands = await this.prisma.lands.findMany({
      where: campId ? { land_camp_id: campId } : undefined,
      include: {
        activities_header: {
          include: {
            log_activities_detail: {
              where: { log_act_detail_calStatus_id: 2 },
              select: { log_act_detail_volumeAll: true },
            },
          },
        },
        lands_camps: { select: { land_camp_name: true } },
      },
    })

    return lands.map(l => ({
      land_id:   l.land_id,
      land_code: l.land_code,
      land_name: l.name,
      camp_name: l.lands_camps?.land_camp_name,
      co2e: l.activities_header
        .flatMap(h => h.log_activities_detail)
        .reduce((s, d) => s + (d.log_act_detail_volumeAll ?? 0), 0),
    }))
  }

  // Multi-camp comparison — accepts comma-separated IDs
  async getMultiCampComparison(campIds: number[]) {
    if (!campIds.length) return []
    return this.prisma.lands_camps.findMany({
      where: { land_camp_id: { in: campIds } },
      include: {
        lands: {
          include: {
            activities_header: {
              include: {
                log_activities_detail: {
                  where: { log_act_detail_calStatus_id: 2 },
                  select: { log_act_detail_volumeAll: true },
                },
              },
            },
          },
        },
      },
    }).then(camps => camps.map(camp => ({
      camp_id:   camp.land_camp_id,
      camp_name: camp.land_camp_name,
      co2e: camp.lands
        .flatMap(l => l.activities_header)
        .flatMap(h => h.log_activities_detail)
        .reduce((s, d) => s + (d.log_act_detail_volumeAll ?? 0), 0),
    })))
  }
}
