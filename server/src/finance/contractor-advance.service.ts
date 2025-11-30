import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorAdvanceDto } from './dto/create-contractor-advance.dto';

@Injectable()
export class ContractorAdvanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractorAdvanceDto) {
    const paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();
    return this.prisma.contractorAdvance.create({
      data: {
        contractorId: dto.contractorId,
        projectId: dto.projectId,
        amount: dto.amount as any,
        paidDate,
        notes: dto.notes,
        paidById: dto.paidById,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.contractorAdvance.findMany({ where: { projectId }, orderBy: { paidDate: 'desc' } });
  }
}
