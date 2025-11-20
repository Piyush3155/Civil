import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: { name: string; username: string; email: string; password: string; phone?: string }) {
    return this.prisma.user.create({
      data,
    });
  }
}

