import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SupplierPaymentService } from './supplier-payment.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';

@Controller()
export class SupplierPaymentController {
  constructor(private readonly service: SupplierPaymentService) {}

  @Post('supplier-payment')
  async create(@Body() dto: CreateSupplierPaymentDto) {
    return this.service.create(dto);
  }

  @Get('project/:id/supplier-payments')
  async listByProject(@Param('id') projectId: string) {
    return this.service.findByProject(projectId);
  }
}
