import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async createMaterial(data: {
    name: string;
    description?: string;
    unit: string;
  }) {
    return this.prisma.material.create({
      data,
    });
  }

  async findAllMaterials() {
    return this.prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDelivery(
    projectId: string,
    data: {
      materialId: string;
      contractorId?: string;
      supplierName: string;
      quantity: number;
      unitPrice?: number;
      totalPrice?: number;
      deliveryDate: Date;
      challanNumber?: string;
      notes?: string;
      photos?: any;
      qcStatus?: string;
    },
  ) {
    return this.prisma.materialDelivery.create({
      data: {
        projectId,
        ...data,
        quantity: new Decimal(data.quantity),
        unitPrice: data.unitPrice ? new Decimal(data.unitPrice) : null,
        totalPrice: data.totalPrice ? new Decimal(data.totalPrice) : null,
        qcStatus: (data.qcStatus as any) || 'PENDING',
      },
      include: {
        material: true,
        contractor: true,
        project: true,
      },
    });
  }

  async createUsage(
    projectId: string,
    data: {
      materialId: string;
      contractorId?: string;
      labourId?: string;
      quantityUsed: number;
      usageDate: Date;
      usedFor?: string;
      notes?: string;
    },
  ) {
    return this.prisma.materialUsage.create({
      data: {
        projectId,
        ...data,
        quantityUsed: new Decimal(data.quantityUsed),
      },
      include: {
        material: true,
        contractor: true,
        labour: true,
        project: true,
      },
    });
  }

  async getMaterialLedger(projectId: string) {
    // Get all materials used in the project
    const materials = await this.prisma.material.findMany({
      where: {
        deliveries: {
          some: { projectId },
        },
      },
    });

    const ledger = await Promise.all(
      materials.map(async (material) => {
        const deliveries = await this.prisma.materialDelivery.findMany({
          where: { projectId, materialId: material.id },
          select: { quantity: true, unitPrice: true, totalPrice: true },
        });

        const usages = await this.prisma.materialUsage.findMany({
          where: { projectId, materialId: material.id },
          select: { quantityUsed: true },
        });

        const receivedQty = deliveries.reduce((sum, d) => sum.add(d.quantity), new Decimal(0));
        const usedQty = usages.reduce((sum, u) => sum.add(u.quantityUsed), new Decimal(0));
        const closing = receivedQty.minus(usedQty);

        // Calculate costs
        const totalDeliveredCost = deliveries.reduce((sum, d) => {
          if (d.totalPrice) return sum.add(d.totalPrice);
          if (d.unitPrice && d.quantity) return sum.add(d.unitPrice.mul(d.quantity));
          return sum;
        }, new Decimal(0));

        // Calculate average unit cost for used materials
        const totalUsedCost = usedQty.isZero() ? new Decimal(0) :
          totalDeliveredCost.mul(usedQty).div(receivedQty);

        // Calculate remaining value
        const remainingValue = closing.isZero() ? new Decimal(0) :
          totalDeliveredCost.mul(closing).div(receivedQty);

        return {
          material,
          received: receivedQty,
          used: usedQty,
          closing,
          totalDeliveredCost,
          totalUsedCost,
          remainingValue,
        };
      }),
    );

    // Calculate project totals
    const projectTotals = ledger.reduce(
      (totals, item) => ({
        totalDeliveredCost: totals.totalDeliveredCost.add(item.totalDeliveredCost),
        totalUsedCost: totals.totalUsedCost.add(item.totalUsedCost),
        remainingValue: totals.remainingValue.add(item.remainingValue),
      }),
      {
        totalDeliveredCost: new Decimal(0),
        totalUsedCost: new Decimal(0),
        remainingValue: new Decimal(0),
      }
    );

    return {
      materials: ledger,
      projectTotals,
    };
  }
}