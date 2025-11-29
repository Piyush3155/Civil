import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Initialize stock with opening balance
   * POST /inventory/stock
   */
  @Post('stock')
  async createStock(@Body() dto: CreateStockDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.inventoryService.createStock(dto, userId);
  }

  /**
   * Get all stock for a project
   * GET /inventory/projects/:projectId/stock
   */
  @Get('projects/:projectId/stock')
  async getProjectStock(@Param('projectId') projectId: string) {
    return this.inventoryService.getProjectStock(projectId);
  }

  /**
   * Get stock summary with analytics
   * GET /inventory/projects/:projectId/stock/summary
   */
  @Get('projects/:projectId/stock/summary')
  async getStockSummary(@Param('projectId') projectId: string) {
    return this.inventoryService.getStockSummary(projectId);
  }

  /**
   * Get stock for a specific material
   * GET /inventory/projects/:projectId/materials/:materialId/stock
   */
  @Get('projects/:projectId/materials/:materialId/stock')
  async getMaterialStock(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.inventoryService.getMaterialStock(projectId, materialId);
  }

  /**
   * Get stock ledger for a material
   * GET /inventory/projects/:projectId/materials/:materialId/ledger
   */
  @Get('projects/:projectId/materials/:materialId/ledger')
  async getMaterialLedger(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.inventoryService.getMaterialLedger(projectId, materialId);
  }

  /**
   * Get all ledger entries for a project
   * GET /inventory/projects/:projectId/ledger
   */
  @Get('projects/:projectId/ledger')
  async getProjectLedger(@Param('projectId') projectId: string) {
    return this.inventoryService.getProjectLedger(projectId);
  }

  /**
   * Get low stock alerts
   * GET /inventory/projects/:projectId/alerts/low-stock
   */
  @Get('projects/:projectId/alerts/low-stock')
  async getLowStockAlerts(
    @Param('projectId') projectId: string,
    @Query('threshold') threshold?: string,
  ) {
    const thresholdValue = threshold ? parseInt(threshold, 10) : 10;
    return this.inventoryService.getLowStockAlerts(projectId, thresholdValue);
  }

  /**
   * Get out of stock items
   * GET /inventory/projects/:projectId/alerts/out-of-stock
   */
  @Get('projects/:projectId/alerts/out-of-stock')
  async getOutOfStock(@Param('projectId') projectId: string) {
    return this.inventoryService.getOutOfStock(projectId);
  }

  /**
   * Create stock adjustment
   * POST /inventory/adjustments
   */
  @Post('adjustments')
  async createAdjustment(@Body() dto: CreateAdjustmentDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.inventoryService.createAdjustment(dto, userId);
  }

  /**
   * Get all adjustments for a project
   * GET /inventory/projects/:projectId/adjustments
   */
  @Get('projects/:projectId/adjustments')
  async getAdjustments(@Param('projectId') projectId: string) {
    return this.inventoryService.getAdjustments(projectId);
  }

  /**
   * Create material transfer
   * POST /inventory/transfers
   */
  @Post('transfers')
  async createTransfer(@Body() dto: CreateTransferDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.inventoryService.createTransfer(dto, userId);
  }

  /**
   * Get all transfers for a project
   * GET /inventory/projects/:projectId/transfers
   */
  @Get('projects/:projectId/transfers')
  async getTransfers(@Param('projectId') projectId: string) {
    return this.inventoryService.getTransfers(projectId);
  }

  /**
   * Recalculate stock from ledger (audit/reconciliation)
   * POST /inventory/projects/:projectId/materials/:materialId/recalculate
   */
  @Post('projects/:projectId/materials/:materialId/recalculate')
  async recalculateStock(
    @Param('projectId') projectId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.inventoryService.recalculateStock(projectId, materialId);
  }
}
