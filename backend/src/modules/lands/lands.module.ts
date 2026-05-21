import { Module }           from '@nestjs/common'
import { LandsController }  from './lands.controller'
import { LandsService }     from './lands.service'

@Module({ controllers: [LandsController], providers: [LandsService] })
export class LandsModule {}
