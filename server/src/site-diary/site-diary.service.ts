import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiaryStatus } from '@prisma/client';

@Injectable()
export class SiteDiaryService {
  constructor(private prisma: PrismaService) {}

  async createDiary(
    projectId: string,
    data: {
      date: Date;
      weather?: string;
      location?: string;
      notes?: string;
      issues?: string;
      photos?: any;
    },
    createdBy: string,
  ) {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.siteDiary.create({
      data: {
        projectId,
        ...data,
        createdBy,
      },
      include: {
        labourLogs: true,
        materialLogs: true,
        equipmentLogs: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getDiariesByProject(projectId: string) {
    return this.prisma.siteDiary.findMany({
      where: { projectId },
      include: {
        labourLogs: {
          include: {
            contractor: true,
            labour: true,
          },
        },
        materialLogs: {
          include: {
            material: true,
          },
        },
        equipmentLogs: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getDiaryById(id: string) {
    const diary = await this.prisma.siteDiary.findUnique({
      where: { id },
      include: {
        labourLogs: {
          include: {
            contractor: true,
            labour: true,
          },
        },
        materialLogs: {
          include: {
            material: true,
          },
        },
        equipmentLogs: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
        project: true,
      },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }
    return diary;
  }

  async addLabourLog(
    diaryId: string,
    data: {
      contractorId?: string;
      labourId?: string;
      count: number;
      workDone?: string;
    },
  ) {
    // Check if diary exists
    const diary = await this.prisma.siteDiary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    // Check if contractor exists (if provided)
    if (data.contractorId) {
      const contractor = await this.prisma.contractor.findUnique({
        where: { id: data.contractorId },
      });
      if (!contractor) {
        throw new NotFoundException('Contractor not found');
      }
    }

    let labourRecordId: string | undefined;
    // Check if labour exists (if provided)
    if (data.labourId) {
      const labour = await this.prisma.labour.findUnique({
        where: { userId: data.labourId },
      });
      if (!labour) {
        throw new NotFoundException('Labour not found');
      }
      labourRecordId = labour.id;
    }

    return this.prisma.diaryLabourLog.create({
      data: {
        diaryId,
        contractorId: data.contractorId,
        labourId: labourRecordId,
        count: data.count,
        workDone: data.workDone,
      },
      include: {
        contractor: true,
        labour: true,
      },
    });
  }

  async addMaterialLog(
    diaryId: string,
    data: {
      materialId: string;
      quantityUsed: number;
      notes?: string;
    },
  ) {
    // Check if diary exists
    const diary = await this.prisma.siteDiary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    // Check if material exists
    const material = await this.prisma.material.findUnique({
      where: { id: data.materialId },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return this.prisma.diaryMaterialLog.create({
      data: {
        diaryId,
        ...data,
      },
      include: {
        material: true,
      },
    });
  }

  async addEquipmentLog(
    diaryId: string,
    data: {
      equipmentName: string;
      hoursUsed: number;
      operatorName?: string;
      notes?: string;
    },
  ) {
    // Check if diary exists
    const diary = await this.prisma.siteDiary.findUnique({
      where: { id: diaryId },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    return this.prisma.diaryEquipmentLog.create({
      data: {
        diaryId,
        ...data,
      },
    });
  }

  async approveDiary(id: string, approvedBy: string) {
    // Check if diary exists
    const diary = await this.prisma.siteDiary.findUnique({
      where: { id },
    });
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }

    // Check if already approved
    if (diary.status === DiaryStatus.APPROVED) {
      throw new ForbiddenException('Diary already approved');
    }

    // TODO: Check if user is PM for the project
    // For now, assume authorized

    return this.prisma.siteDiary.update({
      where: { id },
      data: {
        approvedBy,
        status: DiaryStatus.APPROVED,
      },
      include: {
        labourLogs: true,
        materialLogs: true,
        equipmentLogs: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}