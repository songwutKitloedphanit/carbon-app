import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()        getUsers()  { return this.svc.getUsers() }
  @Get('roles') getRoles()  { return this.svc.getRoles() }

  @Post()    createUser(@Body() b: any) { return this.svc.createUser(b) }
  @Put(':id') updateUser(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.svc.updateUser(id, b) }
  @Delete(':id') deleteUser(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteUser(id) }

  @Post('roles')    createRole(@Body() b: any)  { return this.svc.createRole(b) }
  @Put('roles/:id') updateRole(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.svc.updateRole(id, b) }
}
