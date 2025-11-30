import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({ data: { name: dto.name } });
  }

  async findAll() {
    return this.prisma.expenseCategory.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    return this.prisma.expenseCategory.findUnique({ where: { id } });
  }
}
