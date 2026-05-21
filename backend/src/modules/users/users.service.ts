import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getUsers() {
    return this.prisma.users.findMany({
      select: {
        user_id: true, username: true, first_name: true, last_name: true,
        email: true, role_id: true, department_id: true, updated_at: true,
      },
      orderBy: { user_id: 'asc' },
    })
  }

  getRoles() { return this.prisma.role.findMany({ orderBy: { role_id: 'asc' } }) }

  createUser(data: {
    username: string; first_name: string; last_name: string
    email?: string; role_id?: number; department_id?: number
  }) {
    return this.prisma.users.create({
      data: { ...data, updated_at: new Date() },
      select: { user_id: true, username: true, first_name: true, last_name: true, email: true },
    })
  }

  updateUser(id: number, data: Partial<{
    username: string; first_name: string; last_name: string
    email: string; role_id: number; department_id: number
  }>) {
    return this.prisma.users.update({
      where: { user_id: id },
      data: { ...data, updated_at: new Date() },
      select: { user_id: true, username: true, first_name: true, last_name: true },
    })
  }

  deleteUser(id: number) {
    return this.prisma.users.delete({ where: { user_id: id } })
  }

  createRole(data: { role_name: string; role_name_eng?: string }) {
    return this.prisma.role.create({ data })
  }

  updateRole(id: number, data: Partial<{ role_name: string; role_name_eng: string }>) {
    return this.prisma.role.update({ where: { role_id: id }, data })
  }
}
