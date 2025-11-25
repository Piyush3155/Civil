import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBOQItemDto, CreateRateContractDto, CreateMeasurementDto, CreateBillDto, UpdateBillStatusDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // BOQ Items
  async createBOQItem(data: CreateBOQItemDto) {
    return this.prisma.bOQItem.create({ data });
  }

  async getBOQItems(projectId: string) {
    return this.prisma.bOQItem.findMany({
      where: { projectId },
      include: { task: true, rateContracts: true },
    });
  }

  // Rate Contracts
  async createRateContract(data: CreateRateContractDto) {
    return this.prisma.rateContract.create({ data });
  }

  async getRateContracts(projectId: string) {
    return this.prisma.rateContract.findMany({
      where: { projectId },
      include: { boqItem: true, contractor: true },
    });
  }

  // Measurements
  async createMeasurement(data: CreateMeasurementDto) {
    return this.prisma.measurementBook.create({ data });
  }

  async approveMeasurement(id: string, approvedBy: string) {
    return this.prisma.measurementBook.update({
      where: { id },
      data: { approvedBy, approvedAt: new Date() },
    });
  }

  async getMeasurements(projectId: string) {
    return this.prisma.measurementBook.findMany({
      where: { projectId },
      include: { boqItem: true, contractor: true, creator: true, approver: true },
    });
  }

  // Bills
  async createBill(data: CreateBillDto) {
    // Auto-generate bill number
    const billNumber = `BILL-${Date.now()}`;
    
    // Calculate total amount from measurements
    const measurements = await this.prisma.measurementBook.findMany({
      where: {
        projectId: data.projectId,
        contractorId: data.contractorId,
        approvedAt: { not: null },
        createdAt: { gte: data.periodFrom, lte: data.periodTo },
      },
      include: { boqItem: { include: { rateContracts: true } } },
    });

    const billItems = measurements.map(m => {
      const rateContract = m.boqItem.rateContracts.find(rc => rc.contractorId === data.contractorId);
      if (!rateContract) throw new BadRequestException('Rate not found for BOQ item');

      const measuredQty = Number(m.measuredQty);
      const rate = Number(rateContract.rate);

      return {
        boqItemId: m.boqItemId,
        measuredQty,
        rate,
        amount: measuredQty * rate,
      };
    });

    const totalAmount = billItems.reduce((sum: number, item) => sum + item.amount, 0);

    return this.prisma.contractorBill.create({
      data: {
        ...data,
        billNumber,
        totalAmount,
        billItems: { create: billItems },
      },
      include: { billItems: true },
    });
  }

  async updateBillStatus(id: string, data: UpdateBillStatusDto) {
    return this.prisma.contractorBill.update({
      where: { id },
      data: { status: data.status, approvedBy: data.approvedBy },
    });
  }

  async getBills(projectId: string) {
    return this.prisma.contractorBill.findMany({
      where: { projectId },
      include: { contractor: true, billItems: { include: { boqItem: true } }, payments: true },
    });
  }

  // Payments
  async recordPayment(billId: string, amountPaid: number, paymentMode?: string, remarks?: string) {
    const bill = await this.prisma.contractorBill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundException('Bill not found');

    return this.prisma.contractorPayment.create({
      data: { billId, amountPaid, paymentMode, remarks },
    });
  }
}