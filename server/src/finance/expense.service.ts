import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto) {
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
    return this.prisma.expense.create({
      data: {
        projectId: dto.projectId,
        categoryId: dto.categoryId,
        amount: dto.amount as any,
        description: dto.description,
        paymentDate,
        paidById: dto.paidById,
        paidTo: dto.paidTo,
        paymentMode: dto.paymentMode,
        receiptUrl: dto.receiptUrl,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.expense.findMany({ where: { projectId }, orderBy: { paymentDate: 'desc' } });
  }

  async findById(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
