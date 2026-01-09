import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async createMaterial(
    @Body()
    createMaterialDto: {
      name: string;
      description?: string;
      unit: string;
    },
  ) {
    return this.materialsService.createMaterial(createMaterialDto);
  }

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async findAllMaterials() {
    return this.materialsService.findAllMaterials();
  }

  @Post('projects/:projectId/delivery')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async createDelivery(
    @Param('projectId') projectId: string,
    @Body()
    createDeliveryDto: {
      materialId: string;
      contractorId?: string;
      supplierName: string;
      quantity: number;
      unitPrice?: number;
      totalPrice?: number;
      deliveryDate: string;
      challanNumber?: string;
      notes?: string;
      photos?: any;
      qcStatus?: string;
    },
  ) {
    return this.materialsService.createDelivery(projectId, {
      ...createDeliveryDto,
      deliveryDate: new Date(createDeliveryDto.deliveryDate),
    });
  }

  @Post('projects/:projectId/usage')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async createUsage(
    @Param('projectId') projectId: string,
    @Body()
    createUsageDto: {
      materialId: string;
      contractorId?: string;
      labourId?: string;
      quantityUsed: number;
      usageDate: string;
      usedFor?: string;
      notes?: string;
    },
  ) {
    return this.materialsService.createUsage(projectId, {
      ...createUsageDto,
      usageDate: new Date(createUsageDto.usageDate),
    });
  }

  @Get('projects/:projectId/ledger')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async getMaterialLedger(@Param('projectId') projectId: string) {
    return this.materialsService.getMaterialLedger(projectId);
  }

  @Get('projects/:projectId/usages')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async getMaterialUsages(@Param('projectId') projectId: string) {
    return this.materialsService.getMaterialUsages(projectId);
  }

  @Get('projects/:projectId/deliveries')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async getMaterialDeliveries(@Param('projectId') projectId: string) {
    return this.materialsService.getMaterialDeliveries(projectId);
  }
}