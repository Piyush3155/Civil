import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NCRStatus } from '@prisma/client';

@Injectable()
export class QualityControlService {
  constructor(private prisma: PrismaService) {}

  // Valid status transitions
  private readonly statusTransitions: Record<NCRStatus, NCRStatus[]> = {
    OPEN: ['ASSIGNED', 'REJECTED'],
    ASSIGNED: ['IN_PROGRESS', 'OPEN', 'REJECTED'],
    IN_PROGRESS: ['FIXED', 'ASSIGNED', 'REJECTED'],
    FIXED: ['VERIFIED', 'IN_PROGRESS', 'REJECTED'],
    VERIFIED: ['CLOSED', 'IN_PROGRESS'],
    CLOSED: [],
    REJECTED: ['OPEN'],
  };

  private validateStatusTransition(currentStatus: NCRStatus, newStatus: NCRStatus): boolean {
    return this.statusTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  async findAll(projectId?: string, filters?: {
    type?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
  }) {
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    return this.prisma.qCIssue.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updates: {
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
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const qcIssue = await this.prisma.qCIssue.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updates: {
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

    if (!qcIssue) {
      throw new NotFoundException(`QC Issue with ID ${id} not found`);
    }

    return qcIssue;
  }

  async create(data: {
    projectId: string;
    taskId?: string;
    type: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    photos?: string[];
    location?: string;
    costImpact?: number;
    createdBy: string;
  }) {
    // Create the QC issue
    const qcIssue = await this.prisma.qCIssue.create({
      data: {
        projectId: data.projectId,
        taskId: data.taskId,
        type: data.type as any,
        title: data.title,
        description: data.description,
        priority: (data.priority as any) || 'MEDIUM',
        dueDate: data.dueDate,
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
        location: data.location,
        costImpact: data.costImpact,
        createdBy: data.createdBy,
        status: 'OPEN',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
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

    // Create initial update log
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: qcIssue.id,
        updatedBy: data.createdBy,
        status: 'OPEN',
        notes: 'NCR created',
      },
    });

    return qcIssue;
  }

  async update(id: string, data: {
    taskId?: string;
    type?: string;
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: Date;
    photos?: string[];
    location?: string;
    costImpact?: number;
    notes?: string;
  }, updatedBy: string) {
    const existing = await this.findOne(id);

    // Validate status transition if status is being changed
    if (data.status && data.status !== existing.status) {
      if (!this.validateStatusTransition(existing.status, data.status as NCRStatus)) {
        throw new BadRequestException(
          `Invalid status transition from ${existing.status} to ${data.status}`
        );
      }
    }

    const updateData: any = {};

    if (data.taskId !== undefined) updateData.taskId = data.taskId;
    if (data.type) updateData.type = data.type as any;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority as any;
    if (data.status) updateData.status = data.status as any;
    if (data.dueDate) updateData.dueDate = data.dueDate;
    if (data.photos) updateData.photos = JSON.stringify(data.photos);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.costImpact !== undefined) updateData.costImpact = data.costImpact;

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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

    // Log the update
    if (data.status || data.notes) {
      await this.prisma.qCUpdate.create({
        data: {
          qcIssueId: id,
          updatedBy,
          status: updated.status,
          notes: data.notes,
          photos: data.photos ? JSON.stringify(data.photos) : undefined,
        },
      });
    }

    return updated;
  }

  async assignContractor(id: string, data: {
    contractorId: string;
    dueDate?: Date;
    notes?: string;
  }, assignedBy: string) {
    const existing = await this.findOne(id);

    if (existing.status !== 'OPEN' && existing.status !== 'REJECTED') {
      throw new BadRequestException(
        `Cannot assign contractor when status is ${existing.status}. Status must be OPEN or REJECTED.`
      );
    }

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: {
        assignedTo: data.contractorId,
        status: 'ASSIGNED',
        dueDate: data.dueDate,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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

    // Log the assignment
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: id,
        updatedBy: assignedBy,
        status: 'ASSIGNED',
        notes: data.notes || `Assigned to contractor: ${updated.contractor?.name}`,
      },
    });

    return updated;
  }

  async contractorUpdate(id: string, data: {
    status: 'IN_PROGRESS' | 'FIXED';
    notes?: string;
    photos?: string[];
  }, updatedBy: string) {
    const existing = await this.findOne(id);

    const allowedStatuses: NCRStatus[] = ['ASSIGNED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(existing.status)) {
      throw new BadRequestException(
        `Contractor can only update when status is ASSIGNED or IN_PROGRESS. Current status: ${existing.status}`
      );
    }

    if (!this.validateStatusTransition(existing.status, data.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existing.status} to ${data.status}`
      );
    }

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log the update with photos
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: id,
        updatedBy,
        status: data.status,
        notes: data.notes,
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
      },
    });

    return updated;
  }

  async verify(id: string, data: {
    approved: boolean;
    notes?: string;
    photos?: string[];
  }, verifiedBy: string) {
    const existing = await this.findOne(id);

    if (existing.status !== 'FIXED') {
      throw new BadRequestException(
        `Can only verify when status is FIXED. Current status: ${existing.status}`
      );
    }

    const newStatus: NCRStatus = data.approved ? 'VERIFIED' : 'IN_PROGRESS';

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedBy: data.approved ? verifiedBy : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the verification
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: id,
        updatedBy: verifiedBy,
        status: newStatus,
        notes: data.notes || (data.approved ? 'Fix verified by engineer' : 'Fix rejected - needs rework'),
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
      },
    });

    return updated;
  }

  async close(id: string, data: {
    approved: boolean;
    notes?: string;
  }, closedBy: string) {
    const existing = await this.findOne(id);

    if (existing.status !== 'VERIFIED') {
      throw new BadRequestException(
        `Can only close when status is VERIFIED. Current status: ${existing.status}`
      );
    }

    const newStatus: NCRStatus = data.approved ? 'CLOSED' : 'IN_PROGRESS';

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: {
        status: newStatus,
        closedBy: data.approved ? closedBy : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the closure
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: id,
        updatedBy: closedBy,
        status: newStatus,
        notes: data.notes || (data.approved ? 'NCR closed by PM' : 'NCR rejected - returned for rework'),
      },
    });

    return updated;
  }

  async reject(id: string, data: {
    notes: string;
  }, rejectedBy: string) {
    const existing = await this.findOne(id);

    if (existing.status === 'CLOSED') {
      throw new BadRequestException('Cannot reject a closed NCR');
    }

    const updated = await this.prisma.qCIssue.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log the rejection
    await this.prisma.qCUpdate.create({
      data: {
        qcIssueId: id,
        updatedBy: rejectedBy,
        status: 'REJECTED',
        notes: data.notes,
      },
    });

    return updated;
  }

  async delete(id: string) {
    await this.findOne(id); // Verify it exists
    return this.prisma.qCIssue.delete({
      where: { id },
    });
  }

  async getStats(projectId: string) {
    const [byStatus, byType, byPriority] = await Promise.all([
      this.prisma.qCIssue.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true },
      }),
      this.prisma.qCIssue.groupBy({
        by: ['type'],
        where: { projectId },
        _count: { id: true },
      }),
      this.prisma.qCIssue.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { id: true },
      }),
    ]);

    const openIssues = await this.prisma.qCIssue.count({
      where: {
        projectId,
        status: { notIn: ['CLOSED', 'REJECTED'] },
      },
    });

    const overdueIssues = await this.prisma.qCIssue.count({
      where: {
        projectId,
        status: { notIn: ['CLOSED', 'REJECTED'] },
        dueDate: { lt: new Date() },
      },
    });

    return {
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byType: byType.map(t => ({ type: t.type, count: t._count.id })),
      byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count.id })),
      openIssues,
      overdueIssues,
    };
  }
}
