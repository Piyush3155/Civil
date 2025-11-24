import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectProgressService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(
    projectId: string,
    userId: string,
    data: { progress: number; milestone?: string; notes?: string },
  ) {
    // Check if user has permission to update progress
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this project');
    }

    // Allow PROJECT_MANAGER and SITE_ENGINEER to update progress
    if (!['PROJECT_MANAGER', 'SITE_ENGINEER'].includes(member.role.name)) {
      throw new ForbiddenException('Insufficient permissions to update progress');
    }

    // Validate progress (0-100)
    if (data.progress < 0 || data.progress > 100) {
      throw new ForbiddenException('Progress must be between 0 and 100');
    }

    // Get current progress for logging
    const currentProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { progress: true },
    });

    // Update project progress
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        progress: data.progress,
        nextMilestone: data.milestone,
        progressLastUpdated: new Date(),
      },
    });

    // Log the progress change
    await this.prisma.projectProgressLog.create({
      data: {
        projectId,
        progress: data.progress,
        milestone: data.milestone,
        notes: data.notes,
        loggedBy: userId,
      },
    });

    return updatedProject;
  }

  async getProgress(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        progress: true,
        nextMilestone: true,
        progressLastUpdated: true,
      },
    });
  }

  async getProgressTimeline(projectId: string) {
    return this.prisma.projectProgressLog.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        loggedAt: 'desc',
      },
    });
  }
}
