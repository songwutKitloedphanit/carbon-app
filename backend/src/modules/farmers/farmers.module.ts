import { Module }              from '@nestjs/common'
import { FarmersController }   from './farmers.controller'
import { FarmersService }      from './farmers.service'

@Module({ controllers: [FarmersController], providers: [FarmersService] })
export class FarmersModule {}
