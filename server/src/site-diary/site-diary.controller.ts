import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SiteDiaryService } from './site-diary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteDiaryController {
  constructor(private readonly siteDiaryService: SiteDiaryService) {}

  @Post('projects/:projectId/diary')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async createDiary(
    @Param('projectId') projectId: string,
    @Body()
    createDiaryDto: {
      date: string;
      weather?: string;
      location?: string;
      notes?: string;
      issues?: string;
      photos?: any;
    },
    @Request() req,
  ) {
    return this.siteDiaryService.createDiary(
      projectId,
      {
        ...createDiaryDto,
        date: new Date(createDiaryDto.date),
      },
      req.user.userId,
    );
  }

  @Get('projects/:projectId/diary')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR')
  async getDiariesByProject(@Param('projectId') projectId: string) {
    return this.siteDiaryService.getDiariesByProject(projectId);
  }

  @Get('diary/:id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR')
  async getDiaryById(@Param('id') id: string) {
    return this.siteDiaryService.getDiaryById(id);
  }

  @Post('diary/:id/labour')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async addLabourLog(
    @Param('id') id: string,
    @Body()
    addLabourDto: {
      contractorId?: string;
      labourId?: string;
      count: number;
      workDone?: string;
    },
  ) {
    return this.siteDiaryService.addLabourLog(id, addLabourDto);
  }

  @Post('diary/:id/material')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async addMaterialLog(
    @Param('id') id: string,
    @Body()
    addMaterialDto: {
      materialId: string;
      quantityUsed: number;
      notes?: string;
    },
  ) {
    return this.siteDiaryService.addMaterialLog(id, addMaterialDto);
  }

  @Post('diary/:id/equipment')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async addEquipmentLog(
    @Param('id') id: string,
    @Body()
    addEquipmentDto: {
      equipmentName: string;
      hoursUsed: number;
      operatorName?: string;
      notes?: string;
    },
  ) {
    return this.siteDiaryService.addEquipmentLog(id, addEquipmentDto);
  }

  @Post('diary/:id/approve')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async approveDiary(@Param('id') id: string, @Request() req) {
    return this.siteDiaryService.approveDiary(id, req.user.userId);
  }
}