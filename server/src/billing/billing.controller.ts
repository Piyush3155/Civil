import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBOQItemDto, CreateRateContractDto, CreateMeasurementDto, CreateBillDto, UpdateBillStatusDto } from './dto/billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // BOQ Items
  @Post('boq')
  createBOQItem(@Body() data: CreateBOQItemDto) {
    return this.billingService.createBOQItem(data);
  }

  @Get('boq')
  getBOQItems(@Query('projectId') projectId: string) {
    return this.billingService.getBOQItems(projectId);
  }

  // Rate Contracts
  @Post('rate-contract')
  createRateContract(@Body() data: CreateRateContractDto) {
    return this.billingService.createRateContract(data);
  }

  @Get('rate-contract')
  getRateContracts(@Query('projectId') projectId: string) {
    return this.billingService.getRateContracts(projectId);
  }

  // Measurements
  @Post('measurement')
  createMeasurement(@Body() data: CreateMeasurementDto) {
    return this.billingService.createMeasurement(data);
  }

  @Put('measurement/:id/approve')
  approveMeasurement(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.billingService.approveMeasurement(id, approvedBy);
  }

  @Get('measurement')
  getMeasurements(@Query('projectId') projectId: string) {
    return this.billingService.getMeasurements(projectId);
  }

  // Bills
  @Post('bill')
  createBill(@Body() data: CreateBillDto) {
    return this.billingService.createBill(data);
  }

  @Put('bill/:id/status')
  updateBillStatus(@Param('id') id: string, @Body() data: UpdateBillStatusDto) {
    return this.billingService.updateBillStatus(id, data);
  }

  @Get('bill')
  getBills(@Query('projectId') projectId: string) {
    return this.billingService.getBills(projectId);
  }

  // Payments
  @Post('payment')
  recordPayment(@Body() body: { billId: string; amountPaid: number; paymentMode?: string; remarks?: string }) {
    return this.billingService.recordPayment(body.billId, body.amountPaid, body.paymentMode, body.remarks);
  }
}