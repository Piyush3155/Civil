import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async findAll() {
    return this.contractorsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async create(@Body() body: { name: string; phone?: string; type: string }) {
    return this.contractorsService.create(body);
  }

  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; type?: string },
  ) {
    return this.contractorsService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async delete(@Param('id') id: string) {
    return this.contractorsService.delete(id);
  }

  @Post(':id/projects')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async addToProject(
    @Param('id') id: string,
    @Body() body: { projectId: string },
  ) {
    return this.contractorsService.addToProject(id, body.projectId);
  }

  @Delete(':id/projects/:projectId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async removeFromProject(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.contractorsService.removeFromProject(id, projectId);
  }
}
