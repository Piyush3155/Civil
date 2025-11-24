import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string) {
    return this.prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        progressLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        progressLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    category?: string;
    weightage?: number;
    contractorId?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy: string;
  }) {
    return this.prisma.task.create({
      data: {
        ...data,
        status: 'PENDING',
        category: data.category as any,
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    weightage?: number;
    contractorId?: string;
    startDate?: Date;
    endDate?: Date;
    updatedBy?: string;
  }) {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle category enum casting
    if (data.category !== undefined) {
      updateData.category = data.category as any;
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async updateProgress(id: string, progress: number, updatedBy: string, notes?: string, photos?: any[]) {
    // First update the task progress log
    await this.prisma.taskProgressLog.create({
      data: {
        taskId: id,
        progress: progress,
        notes,
        photos: photos ? JSON.stringify(photos) : undefined,
        updatedBy,
      },
    });

    // Then update the task status based on progress
    let status = 'PENDING';
    if (progress > 0 && progress < 100) {
      status = 'IN_PROGRESS';
    } else if (progress === 100) {
      status = 'COMPLETED';
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: status as any,
        updatedAt: new Date(),
        updatedBy,
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        progressLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // Calculate and update project progress
    await this.updateProjectProgress(updatedTask.projectId);

    return updatedTask;
  }

  async getProjectTasks(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        progressLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get latest progress log
        },
      },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    });
  }

  async bulkCreate(tasks: Array<{
    projectId: string;
    title: string;
    description?: string;
    category?: string;
    weightage?: number;
    contractorId?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy: string;
  }>) {
    const createdTasks: any[] = [];
    for (const task of tasks) {
      const createdTask = await this.create(task);
      createdTasks.push(createdTask);
    }

    // Calculate project progress after bulk creation
    if (createdTasks.length > 0) {
      await this.updateProjectProgress(createdTasks[0].projectId);
    }

    return createdTasks;
  }

  private async updateProjectProgress(projectId: string) {
    // Get all tasks for the project with their latest progress
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        progressLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (tasks.length === 0) return;

    // Calculate weighted average progress
    let totalWeightage: number = 0;
    let weightedProgress: number = 0;

    for (const task of tasks) {
      const weightage = Number(task.weightage) || 0;
      const progress = task.progressLogs.length > 0 ? Number(task.progressLogs[0].progress) : 0;

      totalWeightage += weightage;
      weightedProgress += (progress * weightage) / 100;
    }

    const overallProgress = totalWeightage > 0 ? Math.round((weightedProgress / totalWeightage) * 100) : 0;

    // Update project progress
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        progress: overallProgress,
        progressLastUpdated: new Date(),
      },
    });
  }
}