import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrawingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string) {
    return this.prisma.drawing.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessControls: {
          include: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.drawing.findUnique({
      where: { id },
      include: {
        project: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessControls: {
          include: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.drawing.findMany({
      where: { projectId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: string;
  }) {
    return this.prisma.drawing.create({
      data: {
        ...data,
        fileType: data.fileType as any,
      },
      include: {
        project: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      fileUrl?: string;
      version?: number;
    },
  ) {
    return this.prisma.drawing.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.drawing.delete({
      where: { id },
    });
  }

  async grantAccess(
    drawingId: string,
    roleId?: string,
    userId?: string,
    canView: boolean = true,
  ) {
    return this.prisma.drawingAccess.create({
      data: {
        drawingId,
        roleId,
        userId,
        canView,
      },
    });
  }

  async revokeAccess(accessId: string) {
    return this.prisma.drawingAccess.delete({
      where: { id: accessId },
    });
  }

  async checkAccess(drawingId: string, userId: string, userRoles: string[]) {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id: drawingId },
      include: {
        accessControls: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!drawing) {
      return false;
    }

    // If no access controls defined, allow all authenticated users
    if (drawing.accessControls.length === 0) {
      return true;
    }

    // Check user-specific access
    const userAccess = drawing.accessControls.find(
      (ac) => ac.userId === userId && ac.canView,
    );
    if (userAccess) {
      return true;
    }

    // Check role-based access
    const roleAccess = drawing.accessControls.find(
      (ac) => ac.role && userRoles.includes(ac.role.name) && ac.canView,
    );
    if (roleAccess) {
      return true;
    }

    return false;
  }

  async getUserAccessibleDrawings(
    userId: string,
    userRoles: string[],
    projectId?: string,
  ) {
    const allDrawings = await this.prisma.drawing.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessControls: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter drawings based on access
    return allDrawings.filter((drawing) => {
      // No access controls = public to all authenticated users
      if (drawing.accessControls.length === 0) {
        return true;
      }

      // Check user-specific access
      const hasUserAccess = drawing.accessControls.some(
        (ac) => ac.userId === userId && ac.canView,
      );
      if (hasUserAccess) {
        return true;
      }

      // Check role-based access
      const hasRoleAccess = drawing.accessControls.some(
        (ac) => ac.role && userRoles.includes(ac.role.name) && ac.canView,
      );
      return hasRoleAccess;
    });
  }
}
