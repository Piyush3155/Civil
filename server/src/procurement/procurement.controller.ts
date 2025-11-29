import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { CreatePurchaseRequestDto, ApprovePurchaseRequestDto } from './dto/purchase-request.dto';
import { CreatePurchaseOrderDto, AddPOItemDto, UpdatePOStatusDto } from './dto/purchase-order.dto';
import { POStatus, PurchaseRequestStatus } from '@prisma/client';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // =====================
  // SUPPLIER ENDPOINTS
  // =====================

  @Post('suppliers')
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('suppliers')
  async getAllSuppliers(@Query('isActive') isActive?: string) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.procurementService.getAllSuppliers(active);
  }

  @Get('suppliers/:id')
  async getSupplier(@Param('id') id: string) {
    return this.procurementService.getSupplier(id);
  }

  @Put('suppliers/:id')
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.procurementService.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id') id: string) {
    return this.procurementService.deleteSupplier(id);
  }

  @Get('suppliers/:id/performance')
  async getSupplierPerformance(@Param('id') id: string) {
    return this.procurementService.getSupplierPerformance(id);
  }

  // =====================
  // PURCHASE REQUEST ENDPOINTS
  // =====================

  @Post('purchase-requests')
  async createPurchaseRequest(@Body() dto: CreatePurchaseRequestDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.procurementService.createPurchaseRequest(dto, userId);
  }

  @Get('projects/:projectId/purchase-requests')
  async getPurchaseRequests(
    @Param('projectId') projectId: string,
    @Query('status') status?: PurchaseRequestStatus,
  ) {
    return this.procurementService.getPurchaseRequests(projectId, status);
  }

  @Post('purchase-requests/:id/approve')
  async approvePurchaseRequest(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.procurementService.approvePurchaseRequest(id, userId);
  }

  @Post('purchase-requests/:id/reject')
  async rejectPurchaseRequest(
    @Param('id') id: string,
    @Body() dto: ApprovePurchaseRequestDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.procurementService.rejectPurchaseRequest(id, userId, dto.rejectionReason);
  }

  // =====================
  // PURCHASE ORDER ENDPOINTS
  // =====================

  @Post('purchase-orders')
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.procurementService.createPurchaseOrder(dto, userId);
  }

  @Get('projects/:projectId/purchase-orders')
  async getPurchaseOrders(
    @Param('projectId') projectId: string,
    @Query('status') status?: POStatus,
  ) {
    return this.procurementService.getPurchaseOrders(projectId, status);
  }

  @Get('purchase-orders/:id')
  async getPurchaseOrder(@Param('id') id: string) {
    return this.procurementService.getPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/items')
  async addPOItem(@Param('id') id: string, @Body() dto: AddPOItemDto) {
    return this.procurementService.addPOItem(id, dto);
  }

  @Post('purchase-orders/:id/approve')
  async approvePurchaseOrder(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.procurementService.approvePurchaseOrder(id, userId);
  }

  @Post('purchase-orders/:id/send')
  async sendPurchaseOrder(@Param('id') id: string) {
    return this.procurementService.sendPurchaseOrder(id);
  }

  @Post('purchase-orders/:id/cancel')
  async cancelPurchaseOrder(@Param('id') id: string, @Body() dto: UpdatePOStatusDto) {
    return this.procurementService.cancelPurchaseOrder(id, dto.notes);
  }

  // =====================
  // REPORTS & ANALYTICS
  // =====================

  @Get('projects/:projectId/summary')
  async getProjectProcurementSummary(@Param('projectId') projectId: string) {
    return this.procurementService.getProjectProcurementSummary(projectId);
  }
}
