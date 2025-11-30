import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContractorAdvanceService } from './contractor-advance.service';
import { CreateContractorAdvanceDto } from './dto/create-contractor-advance.dto';

@Controller()
export class ContractorAdvanceController {
  constructor(private readonly service: ContractorAdvanceService) {}

  @Post('contractor-advance')
  async create(@Body() dto: CreateContractorAdvanceDto) {
    return this.service.create(dto);
  }

  @Get('project/:id/contractor-advances')
  async listByProject(@Param('id') projectId: string) {
    return this.service.findByProject(projectId);
  }
}
