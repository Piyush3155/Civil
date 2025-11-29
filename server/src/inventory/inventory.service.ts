import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { StockEntryType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create stock record for a material in a project
   */
  async getOrCreateStock(projectId: string, materialId: string, location?: string) {
    let stock = await this.prisma.materialStock.findUnique({
      where: {
        projectId_materialId: {
          projectId,
          materialId,
        },
      },
    });

    if (!stock) {
      stock = await this.prisma.materialStock.create({
        data: {
          projectId,
          materialId,
          location: location || 'site',
          openingQty: 0,
          receivedQty: 0,
          usedQty: 0,
          adjustedQty: 0,
          closingQty: 0,
        },
      });
    }

    return stock;
  }

  /**
   * Initialize stock with opening balance
   */
  async createStock(dto: CreateStockDto, userId: string) {
    const stock = await this.getOrCreateStock(dto.projectId, dto.materialId, dto.location);

    const updated = await this.prisma.materialStock.update({
      where: { id: stock.id },
      data: {
        openingQty: dto.openingQty,
        closingQty: dto.openingQty,
        location: dto.location,
        lastUpdated: new Date(),
      },
      include: {
        material: true,
        project: true,
      },
    });

    // Create ledger entry for opening stock
    if (dto.openingQty > 0) {
      await this.createLedgerEntry({
        projectId: dto.projectId,
        materialId: dto.materialId,
        type: StockEntryType.ADJUSTMENT,
        quantity: dto.openingQty,
        notes: 'Opening stock',
        location: dto.location,
        createdBy: userId,
      });
    }

    return updated;
  }

  /**
   * Update stock on material delivery
   */
  async recordDelivery(deliveryId: string, projectId: string, materialId: string, quantity: number, location?: string) {
    const stock = await this.getOrCreateStock(projectId, materialId, location);

    const newReceivedQty = new Prisma.Decimal(stock.receivedQty.toString()).plus(quantity).toNumber();
    const newClosingQty = new Prisma.Decimal(stock.openingQty.toString())
      .plus(newReceivedQty)
      .minus(stock.usedQty.toString())
      .plus(stock.adjustedQty.toString())
      .toNumber();

    await this.prisma.materialStock.update({
      where: { id: stock.id },
      data: {
        receivedQty: newReceivedQty,
        closingQty: newClosingQty,
        lastUpdated: new Date(),
      },
    });

    // Create ledger entry
    await this.createLedgerEntry({
      projectId,
      materialId,
      type: StockEntryType.DELIVERY,
      quantity,
      notes: 'Material delivery',
      relatedId: deliveryId,
      location: location || stock.location || undefined,
    });

    return this.getOrCreateStock(projectId, materialId);
  }

  /**
   * Update stock on material usage
   */
  async recordUsage(usageId: string, projectId: string, materialId: string, quantity: number, location?: string) {
    const stock = await this.getOrCreateStock(projectId, materialId, location);

    const newUsedQty = new Prisma.Decimal(stock.usedQty.toString()).plus(quantity).toNumber();
    const newClosingQty = new Prisma.Decimal(stock.openingQty.toString())
      .plus(stock.receivedQty.toString())
      .minus(newUsedQty)
      .plus(stock.adjustedQty.toString())
      .toNumber();

    // Check if usage exceeds available stock
    if (newClosingQty < 0) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${stock.closingQty}, Requested: ${quantity}`,
      );
    }

    await this.prisma.materialStock.update({
      where: { id: stock.id },
      data: {
        usedQty: newUsedQty,
        closingQty: newClosingQty,
        lastUpdated: new Date(),
      },
    });

    // Create ledger entry
    await this.createLedgerEntry({
      projectId,
      materialId,
      type: StockEntryType.USAGE,
      quantity,
      notes: 'Material usage',
      relatedId: usageId,
      location: location || stock.location || undefined,
    });

    return this.getOrCreateStock(projectId, materialId);
  }

  /**
   * Create stock adjustment (damage, loss, audit correction)
   */
  async createAdjustment(dto: CreateAdjustmentDto, userId: string) {
    const stock = await this.getOrCreateStock(dto.projectId, dto.materialId);

    // Create adjustment record
    const adjustment = await this.prisma.materialAdjustment.create({
      data: {
        projectId: dto.projectId,
        materialId: dto.materialId,
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
        photos: dto.photos || [],
        adjustedBy: userId,
      },
      include: {
        material: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update stock
    const newAdjustedQty = new Prisma.Decimal(stock.adjustedQty.toString()).plus(dto.quantity).toNumber();
    const newClosingQty = new Prisma.Decimal(stock.openingQty.toString())
      .plus(stock.receivedQty.toString())
      .minus(stock.usedQty.toString())
      .plus(newAdjustedQty)
      .toNumber();

    await this.prisma.materialStock.update({
      where: { id: stock.id },
      data: {
        adjustedQty: newAdjustedQty,
        closingQty: newClosingQty,
        lastUpdated: new Date(),
      },
    });

    // Create ledger entry
    await this.createLedgerEntry({
      projectId: dto.projectId,
      materialId: dto.materialId,
      type: StockEntryType.ADJUSTMENT,
      quantity: dto.quantity,
      notes: `${dto.type}: ${dto.reason || 'No reason provided'}`,
      relatedId: adjustment.id,
      createdBy: userId,
    });

    return adjustment;
  }

  /**
   * Transfer materials between locations
   */
  async createTransfer(dto: CreateTransferDto, userId: string) {
    // Note: For simplicity, we're not maintaining separate stock per location
    // If you need location-wise stock, you'll need to modify the schema to have composite key [projectId, materialId, location]
    
    const stock = await this.getOrCreateStock(dto.projectId, dto.materialId);

    // Check if sufficient stock exists
    if (Number(stock.closingQty) < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for transfer. Available: ${stock.closingQty}, Requested: ${dto.quantity}`,
      );
    }

    // Create transfer record
    const transfer = await this.prisma.materialTransfer.create({
      data: {
        projectId: dto.projectId,
        materialId: dto.materialId,
        fromLocation: dto.fromLocation || 'site',
        toLocation: dto.toLocation || 'site',
        quantity: dto.quantity,
        notes: dto.notes,
        transferredBy: userId,
      },
      include: {
        material: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create ledger entries for both locations
    await this.createLedgerEntry({
      projectId: dto.projectId,
      materialId: dto.materialId,
      type: StockEntryType.TRANSFER_OUT,
      quantity: -dto.quantity,
      notes: `Transfer from ${dto.fromLocation} to ${dto.toLocation}`,
      location: dto.fromLocation,
      relatedId: transfer.id,
      createdBy: userId,
    });

    await this.createLedgerEntry({
      projectId: dto.projectId,
      materialId: dto.materialId,
      type: StockEntryType.TRANSFER_IN,
      quantity: dto.quantity,
      notes: `Transfer from ${dto.fromLocation} to ${dto.toLocation}`,
      location: dto.toLocation,
      relatedId: transfer.id,
      createdBy: userId,
    });

    return transfer;
  }

  /**
   * Get current stock for a project
   */
  async getProjectStock(projectId: string) {
    return this.prisma.materialStock.findMany({
      where: { projectId },
      include: {
        material: true,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });
  }

  /**
   * Get stock for a specific material
   */
  async getMaterialStock(projectId: string, materialId: string) {
    const stock = await this.prisma.materialStock.findUnique({
      where: {
        projectId_materialId: {
          projectId,
          materialId,
        },
      },
      include: {
        material: true,
        project: true,
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock record not found');
    }

    return stock;
  }

  /**
   * Get stock ledger for a material
   */
  async getMaterialLedger(projectId: string, materialId: string) {
    return this.prisma.materialStockLedger.findMany({
      where: {
        projectId,
        materialId,
      },
      include: {
        material: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all ledger entries for a project
   */
  async getProjectLedger(projectId: string) {
    return this.prisma.materialStockLedger.findMany({
      where: { projectId },
      include: {
        material: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(projectId: string, threshold: number = 10) {
    return this.prisma.materialStock.findMany({
      where: {
        projectId,
        closingQty: {
          lte: threshold,
          gt: 0,
        },
      },
      include: {
        material: true,
      },
      orderBy: {
        closingQty: 'asc',
      },
    });
  }

  /**
   * Get out of stock items
   */
  async getOutOfStock(projectId: string) {
    return this.prisma.materialStock.findMany({
      where: {
        projectId,
        closingQty: {
          lte: 0,
        },
      },
      include: {
        material: true,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });
  }

  /**
   * Get all adjustments for a project
   */
  async getAdjustments(projectId: string) {
    return this.prisma.materialAdjustment.findMany({
      where: { projectId },
      include: {
        material: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all transfers for a project
   */
  async getTransfers(projectId: string) {
    return this.prisma.materialTransfer.findMany({
      where: { projectId },
      include: {
        material: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get stock summary with analytics
   */
  async getStockSummary(projectId: string) {
    const stock = await this.getProjectStock(projectId);
    const lowStock = await this.getLowStockAlerts(projectId);
    const outOfStock = await this.getOutOfStock(projectId);

    const totalValue = stock.reduce((sum, item) => {
      return sum + Number(item.closingQty);
    }, 0);

    return {
      totalMaterials: stock.length,
      totalStockValue: totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      stock,
      lowStock,
      outOfStock,
    };
  }

  /**
   * Create ledger entry (internal helper)
   */
  private async createLedgerEntry(data: {
    projectId: string;
    materialId: string;
    type: StockEntryType;
    quantity: number;
    notes?: string;
    location?: string;
    relatedId?: string;
    createdBy?: string;
  }) {
    return this.prisma.materialStockLedger.create({
      data: {
        projectId: data.projectId,
        materialId: data.materialId,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes,
        location: data.location,
        relatedId: data.relatedId,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Recalculate stock from ledger (for audit/reconciliation)
   */
  async recalculateStock(projectId: string, materialId: string) {
    const ledger = await this.prisma.materialStockLedger.findMany({
      where: {
        projectId,
        materialId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let openingQty = 0;
    let receivedQty = 0;
    let usedQty = 0;
    let adjustedQty = 0;

    for (const entry of ledger) {
      switch (entry.type) {
        case StockEntryType.DELIVERY:
          receivedQty += Number(entry.quantity);
          break;
        case StockEntryType.USAGE:
          usedQty += Number(entry.quantity);
          break;
        case StockEntryType.ADJUSTMENT:
          adjustedQty += Number(entry.quantity);
          break;
        case StockEntryType.TRANSFER_IN:
          receivedQty += Number(entry.quantity);
          break;
        case StockEntryType.TRANSFER_OUT:
          usedQty += Math.abs(Number(entry.quantity));
          break;
      }
    }

    const closingQty = openingQty + receivedQty - usedQty + adjustedQty;

    // Update stock record
    await this.prisma.materialStock.update({
      where: {
        projectId_materialId: {
          projectId,
          materialId,
        },
      },
      data: {
        openingQty,
        receivedQty,
        usedQty,
        adjustedQty,
        closingQty,
        lastUpdated: new Date(),
      },
    });

    return {
      openingQty,
      receivedQty,
      usedQty,
      adjustedQty,
      closingQty,
    };
  }
}
