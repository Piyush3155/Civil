import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';

@Injectable()
export class SupplierPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierPaymentDto) {
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
    return this.prisma.supplierPayment.create({
      data: {
        supplierId: dto.supplierId,
        projectId: dto.projectId,
        poId: dto.poId,
        amount: dto.amount as any,
        paymentDate,
        notes: dto.notes,
        paidById: dto.paidById,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.supplierPayment.findMany({ where: { projectId }, orderBy: { paymentDate: 'desc' } });
  }
}
