import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LaboursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.labour.findMany({
      include: {
        contractor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.labour.findUnique({
      where: { id },
      include: {
        contractor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByContractor(contractorId: string) {
    return this.prisma.labour.findMany({
      where: { contractorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async create(data: {
    contractorId: string;
    userId?: string;
    name: string;
    gender?: string;
    age?: number;
    skill: string;
    phone?: string;
    aadhaar?: string;
  }) {
    return this.prisma.labour.create({
      data: {
        ...data,
        skill: data.skill as any,
      },
      include: {
        contractor: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      gender?: string;
      age?: number;
      skill?: string;
      phone?: string;
      aadhaar?: string;
    },
  ) {
    return this.prisma.labour.update({
      where: { id },
      data: {
        ...data,
        skill: data.skill ? (data.skill as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.labour.delete({
      where: { id },
    });
  }

  async linkUser(labourId: string, userId: string) {
    return this.prisma.labour.update({
      where: { id: labourId },
      data: { userId },
    });
  }

  async unlinkUser(labourId: string) {
    return this.prisma.labour.update({
      where: { id: labourId },
      data: { userId: null },
    });
  }
}
