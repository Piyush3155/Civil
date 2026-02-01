import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    const projects = await this.prisma.project.findMany({
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

    return projects.map((p) => {
      const proj = p as any;
      return {
        ...proj,
        progress: proj.progress ? Number(proj.progress) : 0,
      };
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
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
        owners: {
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

    // Recalculate project progress based on tasks
    if (project) {
      await this.recalculateProjectProgress(id);
      // Fetch updated project with new progress
      const updatedProject = await this.prisma.project.findUnique({
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
          owners: {
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
      
      if (!updatedProject) return null;
      const up = updatedProject as any;

      return {
        ...up,
        progress: up.progress ? Number(up.progress) : 0,
      };
    }

    if (!project) return null;
    const proj = project as any;

    return {
      ...proj,
      progress: proj.progress ? Number(proj.progress) : 0,
    };
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
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            {
              members: {
                some: {
                  userId,
                },
              },
            },
            {
              owners: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
        include: {
          members: {
            include: {
              role: true,
            },
          },
          owners: true,
          contractors: {
            include: {
              contractor: true,
            },
          },
          _count: {
            select: {
              drawings: true,
              models: true,
              members: true,
              contractors: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Map progress to number for reliable client-side handling
      return projects.map(p => {
        const proj = p as any;
        return {
          ...proj,
          progress: proj.progress ? Number(proj.progress) : 0,
        };
      });
    } catch (error) {
      console.error('Error in getProjectsByUser:', error);
      throw error;
    }
  }

  async addOwner(projectId: string, userId: string) {
    return this.prisma.projectOwner.create({
      data: {
        projectId,
        userId,
      },
    });
  }

  async removeOwner(projectId: string, userId: string) {
    return this.prisma.projectOwner.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async updateProgress(
    projectId: string,
    data: { progress: number; nextMilestone?: string },
  ) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        progress: data.progress,
        nextMilestone: data.nextMilestone,
      },
    });
  }

  async recalculateProjectProgress(projectId: string) {
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

  async getOwnerDashboard(projectId: string, userId: string) {
    // Verify user is owner or admin
    const isOwner = await this.prisma.projectOwner.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    // Also check if user is admin or project manager (optional, but good for testing)
    // For now, strict owner check or if they are a member with high privileges?
    // The prompt says "Owner Dashboard (Read-Only View)".
    // Let's assume if they call this endpoint they want the owner view.

    if (!isOwner) {
       // Check if they are a member, maybe they can view it too?
       // For now, let's restrict to actual owners for this specific "Owner Dashboard" view
       // Or just return the data if they have access to the project via other means.
       // But the requirement says "Owner sees...".
       
       // Let's allow if they are owner.
       // If not owner, check if they are admin?
       // For simplicity, let's stick to the requirement: Owner Dashboard.
       // If the user is not an owner, we might throw, but let's see if they are a member.
       const isMember = await this.prisma.projectMember.findUnique({
           where: { projectId_userId: { projectId, userId } }
       });
       
       if (!isMember) {
           // Check if admin
           const user = await this.prisma.user.findUnique({ where: { id: userId } });
           if (!user?.isAdmin) {
                throw new Error('Access denied: User is not an owner or member of this project');
           }
       }
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        drawings: {
          orderBy: { createdAt: 'desc' },
        },
        materialDeliveries: {
          orderBy: { deliveryDate: 'desc' },
          take: 10,
          include: {
              material: true
          }
        },
        materialUsages: {
            orderBy: { usageDate: 'desc' },
            take: 10,
            include: {
                material: true
            }
        },
        siteDiaries: {
          orderBy: { date: 'desc' },
          take: 5,
          // where: { status: 'APPROVED' }, // Uncomment if approval workflow is strict
        },
        contractors: {
          include: {
            contractor: true,
          },
        },
      },
    });

    if (!project) return null;
    const proj = project as any;

    return {
      ...proj,
      progress: proj.progress ? Number(proj.progress) : 0,
    };
  }

  /**
   * Send notification to all contractors associated with a project
   */
  async notifyProjectContractors(
    projectId: string,
    title: string,
    message: string,
    sentById: string,
  ) {
    // Get project with contractors
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contractors: {
          include: {
            contractor: {
              include: {
                contractorUsers: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Collect all user IDs from contractors
    const contractorUserIds: string[] = [];
    for (const pc of project.contractors) {
      for (const user of pc.contractor.contractorUsers) {
        contractorUserIds.push(user.id);
      }
    }

    if (contractorUserIds.length === 0) {
      return {
        success: false,
        message: 'No contractors with user accounts found for this project',
        notifiedCount: 0,
      };
    }

    // Send notification to all contractor users
    const result = await this.notificationsService.sendNotificationToMultipleUsers(
      contractorUserIds,
      {
        title: `[${project.name}] ${title}`,
        body: message,
        data: {
          projectId: project.id,
          projectName: project.name,
          type: 'PROJECT_NOTIFICATION',
        },
      },
      sentById,
    );

    return {
      success: result.success > 0,
      message: `Notification sent to ${result.success} contractor user(s)`,
      notifiedCount: result.success,
      failedCount: result.failure,
      projectName: project.name,
    };
  }
}

