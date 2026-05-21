import { Module }               from '@nestjs/common'
import { ActivitiesController } from './activities.controller'
import { ActivitiesService }    from './activities.service'
import { Co2eEngineService }    from './co2e-engine.service'

@Module({ controllers: [ActivitiesController], providers: [ActivitiesService, Co2eEngineService] })
export class ActivitiesModule {}
