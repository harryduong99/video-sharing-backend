import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export const hashingRounds = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      hashingRounds,
    );

    createUserDto.password = hashedPassword;
    return this.prisma.user.create({ data: createUserDto });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
