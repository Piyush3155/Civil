import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            role: true,
          },
        },
        contractors: {
          include: {
            contractor: true,
          },
        },
        _count: {
          select: {
            drawings: true,
            models: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                phone: true,
              },
            },
            role: true,
          },
        },
        contractors: {
          include: {
            contractor: {
              include: {
                labours: true,
              },
            },
          },
        },
        drawings: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        models: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    code: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.project.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      location?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...data,
        status: data.status ? (data.status as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async addMember(projectId: string, userId: string, roleId: string) {
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        roleId,
      },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async getProjectsByUser(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            drawings: true,
            models: true,
            members: true,
          },
        },
      },
    });
  }
}
