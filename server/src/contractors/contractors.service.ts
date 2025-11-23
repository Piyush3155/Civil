import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contractor.findMany({
      include: {
        contractorUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
          },
        },
        labours: true,
        projects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
                location: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.contractor.findUnique({
      where: { id },
      include: {
        contractorUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
          },
        },
        labours: {
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
        },
        projects: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  async create(data: { name: string; phone?: string; type: string }) {
    return this.prisma.contractor.create({
      data: {
        ...data,
        type: data.type as any,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; phone?: string; type?: string },
  ) {
    return this.prisma.contractor.update({
      where: { id },
      data: {
        ...data,
        type: data.type ? (data.type as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.contractor.delete({
      where: { id },
    });
  }

  async addToProject(contractorId: string, projectId: string) {
    return this.prisma.projectContractor.create({
      data: {
        contractorId,
        projectId,
      },
    });
  }

  async removeFromProject(contractorId: string, projectId: string) {
    return this.prisma.projectContractor.delete({
      where: {
        projectId_contractorId: {
          projectId,
          contractorId,
        },
      },
    });
  }
}
