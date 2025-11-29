import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { CreatePurchaseRequestDto } from './dto/purchase-request.dto';
import { CreatePurchaseOrderDto, AddPOItemDto } from './dto/purchase-order.dto';
import { POStatus, PurchaseRequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  // =====================
  // SUPPLIER MANAGEMENT
  // =====================

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: dto,
    });
  }

  async getAllSuppliers(isActive?: boolean) {
    return this.prisma.supplier.findMany({
      where: isActive !== undefined ? { isActive } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            purchaseOrders: true,
            deliveries: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSupplier(id: string) {
    // Check if supplier has any POs
    const poCount = await this.prisma.purchaseOrder.count({
      where: { supplierId: id },
    });

    if (poCount > 0) {
      throw new BadRequestException(
        'Cannot delete supplier with existing purchase orders. Deactivate instead.',
      );
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  // =====================
  // PURCHASE REQUESTS
  // =====================

  async createPurchaseRequest(dto: CreatePurchaseRequestDto, userId: string) {
    return this.prisma.purchaseRequest.create({
      data: {
        ...dto,
        quantity: new Prisma.Decimal(dto.quantity),
        requestedBy: userId,
      },
      include: {
        material: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: true,
      },
    });
  }

  async getPurchaseRequests(projectId: string, status?: PurchaseRequestStatus) {
    return this.prisma.purchaseRequest.findMany({
      where: {
        projectId,
        status: status || undefined,
      },
      include: {
        material: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePurchaseRequest(id: string, userId: string) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        material: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async rejectPurchaseRequest(id: string, userId: string, reason?: string) {
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.REJECTED,
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  // =====================
  // PURCHASE ORDERS
  // =====================

  async generatePONumber(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { code: true },
    });

    const count = await this.prisma.purchaseOrder.count({
      where: { projectId },
    });

    const year = new Date().getFullYear();
    return `PO-${project?.code}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string) {
    const poNumber = await this.generatePONumber(dto.projectId);

    // Calculate totals
    let totalAmount = 0;
    let taxAmount = 0;

    const items = dto.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      const itemTax = item.taxPercent ? (amount * item.taxPercent) / 100 : 0;
      totalAmount += amount;
      taxAmount += itemTax;

      return {
        materialId: item.materialId,
        quantity: new Prisma.Decimal(item.quantity),
        deliveredQty: 0,
        pendingQty: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(item.unitPrice),
        amount: new Prisma.Decimal(amount),
        taxPercent: item.taxPercent ? new Prisma.Decimal(item.taxPercent) : null,
        taxAmount: new Prisma.Decimal(itemTax),
        totalAmount: new Prisma.Decimal(amount + itemTax),
        notes: item.notes,
      };
    });

    const grandTotal = totalAmount + taxAmount;

    return this.prisma.purchaseOrder.create({
      data: {
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        poNumber,
        totalAmount: new Prisma.Decimal(totalAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        grandTotal: new Prisma.Decimal(grandTotal),
        deliveryAddress: dto.deliveryAddress,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        createdBy: userId,
        items: {
          create: items,
        },
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        supplier: true,
        project: true,
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

  async getPurchaseOrders(projectId: string, status?: POStatus) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        projectId,
        status: status || undefined,
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        items: {
          include: {
            material: true,
          },
        },
        deliveries: {
          include: {
            material: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    return po;
  }

  async addPOItem(poId: string, dto: AddPOItemDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    if (po.status !== POStatus.DRAFT) {
      throw new BadRequestException('Can only add items to draft POs');
    }

    const amount = dto.quantity * dto.unitPrice;
    const taxAmount = dto.taxPercent ? (amount * dto.taxPercent) / 100 : 0;
    const totalAmount = amount + taxAmount;

    const item = await this.prisma.pOItem.create({
      data: {
        poId,
        materialId: dto.materialId,
        quantity: new Prisma.Decimal(dto.quantity),
        deliveredQty: 0,
        pendingQty: new Prisma.Decimal(dto.quantity),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        amount: new Prisma.Decimal(amount),
        taxPercent: dto.taxPercent ? new Prisma.Decimal(dto.taxPercent) : null,
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        notes: dto.notes,
      },
      include: {
        material: true,
      },
    });

    // Update PO totals
    await this.updatePOTotals(poId);

    return item;
  }

  async approvePurchaseOrder(id: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    if (po.status !== POStatus.DRAFT && po.status !== POStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PO is not in approvable state');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
        supplier: true,
      },
    });
  }

  async sendPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    if (po.status !== POStatus.APPROVED) {
      throw new BadRequestException('PO must be approved before sending');
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.SENT_TO_SUPPLIER,
        sentAt: new Date(),
      },
    });
  }

  async cancelPurchaseOrder(id: string, notes?: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.CANCELLED,
        notes: notes ? `${notes}\n[Cancelled]` : '[Cancelled]',
      },
    });
  }

  async recordDeliveryAgainstPO(
    poId: string,
    materialId: string,
    deliveredQty: number,
    deliveryId: string,
  ) {
    // Find the PO item
    const poItem = await this.prisma.pOItem.findFirst({
      where: {
        poId,
        materialId,
      },
    });

    if (!poItem) {
      throw new NotFoundException('PO Item not found');
    }

    // Update delivered quantity
    const newDeliveredQty = new Prisma.Decimal(poItem.deliveredQty.toString())
      .plus(deliveredQty)
      .toNumber();
    const newPendingQty = new Prisma.Decimal(poItem.quantity.toString())
      .minus(newDeliveredQty)
      .toNumber();

    await this.prisma.pOItem.update({
      where: { id: poItem.id },
      data: {
        deliveredQty: newDeliveredQty,
        pendingQty: newPendingQty < 0 ? 0 : newPendingQty,
      },
    });

    // Check if PO is completed or partially delivered
    await this.updatePOStatus(poId);
  }

  private async updatePOStatus(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) return;

    const allItemsDelivered = po.items.every(
      (item) => Number(item.deliveredQty) >= Number(item.quantity),
    );
    const someItemsDelivered = po.items.some((item) => Number(item.deliveredQty) > 0);

    if (allItemsDelivered) {
      await this.prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: POStatus.COMPLETED },
      });
    } else if (someItemsDelivered && po.status === POStatus.SENT_TO_SUPPLIER) {
      await this.prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: POStatus.PARTIALLY_DELIVERED },
      });
    }
  }

  private async updatePOTotals(poId: string) {
    const items = await this.prisma.pOItem.findMany({
      where: { poId },
    });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0);
    const grandTotal = totalAmount + taxAmount;

    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        totalAmount: new Prisma.Decimal(totalAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        grandTotal: new Prisma.Decimal(grandTotal),
      },
    });
  }

  // =====================
  // REPORTS & ANALYTICS
  // =====================

  async getSupplierPerformance(supplierId: string) {
    const supplier = await this.getSupplier(supplierId);

    const pos = await this.prisma.purchaseOrder.findMany({
      where: { supplierId },
      include: {
        items: true,
        deliveries: true,
      },
    });

    const totalPOs = pos.length;
    const completedPOs = pos.filter((po) => po.status === POStatus.COMPLETED).length;
    const totalValue = pos.reduce((sum, po) => sum + Number(po.grandTotal), 0);

    // Calculate average delivery time
    const deliveryTimes = pos
      .filter((po) => po.sentAt && po.status === POStatus.COMPLETED)
      .map((po) => {
        const sent = po.sentAt;
        const lastDelivery = po.deliveries.sort(
          (a, b) => b.deliveryDate.getTime() - a.deliveryDate.getTime(),
        )[0];
        if (sent && lastDelivery) {
          return Math.floor(
            (lastDelivery.deliveryDate.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24),
          );
        }
        return null;
      })
      .filter((time) => time !== null);

    const avgDeliveryDays =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + (time || 0), 0) / deliveryTimes.length
        : 0;

    return {
      supplier,
      totalPOs,
      completedPOs,
      pendingPOs: totalPOs - completedPOs,
      totalValue,
      avgDeliveryDays: Math.round(avgDeliveryDays),
      completionRate: totalPOs > 0 ? ((completedPOs / totalPOs) * 100).toFixed(2) : 0,
    };
  }

  async getProjectProcurementSummary(projectId: string) {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: { projectId },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    const totalPOs = pos.length;
    const totalValue = pos.reduce((sum, po) => sum + Number(po.grandTotal), 0);

    const statusCounts = {
      DRAFT: pos.filter((po) => po.status === POStatus.DRAFT).length,
      PENDING_APPROVAL: pos.filter((po) => po.status === POStatus.PENDING_APPROVAL).length,
      APPROVED: pos.filter((po) => po.status === POStatus.APPROVED).length,
      SENT_TO_SUPPLIER: pos.filter((po) => po.status === POStatus.SENT_TO_SUPPLIER).length,
      PARTIALLY_DELIVERED: pos.filter((po) => po.status === POStatus.PARTIALLY_DELIVERED).length,
      COMPLETED: pos.filter((po) => po.status === POStatus.COMPLETED).length,
      CANCELLED: pos.filter((po) => po.status === POStatus.CANCELLED).length,
    };

    const purchaseRequests = await this.prisma.purchaseRequest.findMany({
      where: { projectId },
    });

    const prStatusCounts = {
      PENDING: purchaseRequests.filter((pr) => pr.status === PurchaseRequestStatus.PENDING).length,
      APPROVED: purchaseRequests.filter((pr) => pr.status === PurchaseRequestStatus.APPROVED)
        .length,
      REJECTED: purchaseRequests.filter((pr) => pr.status === PurchaseRequestStatus.REJECTED)
        .length,
      CONVERTED_TO_PO: purchaseRequests.filter(
        (pr) => pr.status === PurchaseRequestStatus.CONVERTED_TO_PO,
      ).length,
    };

    return {
      totalPOs,
      totalValue,
      statusCounts,
      purchaseRequests: {
        total: purchaseRequests.length,
        statusCounts: prStatusCounts,
      },
      recentPOs: pos.slice(0, 5),
    };
  }
}
