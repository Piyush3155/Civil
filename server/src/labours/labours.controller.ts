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
import { LaboursService } from './labours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('labours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LaboursController {
  constructor(private readonly laboursService: LaboursService) {}

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async findAll() {
    return this.laboursService.findAll();
  }

  @Get('contractor/:contractorId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async findByContractor(@Param('contractorId') contractorId: string) {
    return this.laboursService.findByContractor(contractorId);
  }

  @Get(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR')
  async findOne(@Param('id') id: string) {
    return this.laboursService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CONTRACTOR')
  async create(
    @Body()
    body: {
      contractorId: string;
      userId?: string;
      name: string;
      gender?: string;
      age?: number;
      skill: string;
      phone?: string;
      aadhaar?: string;
    },
  ) {
    return this.laboursService.create(body);
  }

  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CONTRACTOR')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      gender?: string;
      age?: number;
      skill?: string;
      phone?: string;
      aadhaar?: string;
    },
  ) {
    return this.laboursService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CONTRACTOR')
  async delete(@Param('id') id: string) {
    return this.laboursService.delete(id);
  }

  @Post(':id/link-user')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CONTRACTOR')
  async linkUser(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.laboursService.linkUser(id, body.userId);
  }

  @Post(':id/unlink-user')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CONTRACTOR')
  async unlinkUser(@Param('id') id: string) {
    return this.laboursService.unlinkUser(id);
  }
}
