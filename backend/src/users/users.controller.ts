import {
  Controller,
  Patch,
  Param,
  Body,
  Get,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.usersService.changeRole(id, role);
  }

  // 👇 เพิ่มตรงนี้
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
