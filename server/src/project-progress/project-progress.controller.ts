import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectProgressService } from './project-progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('project-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectProgressController {
  constructor(private readonly projectProgressService: ProjectProgressService) {}

  @Get(':projectId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CLIENT')
  async getProgress(@Param('projectId') projectId: string) {
    return this.projectProgressService.getProgress(projectId);
  }

  @Get(':projectId/timeline')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CLIENT')
  async getProgressTimeline(@Param('projectId') projectId: string) {
    return this.projectProgressService.getProgressTimeline(projectId);
  }

  @Put(':projectId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async updateProgress(
    @Param('projectId') projectId: string,
    @Body() data: UpdateProgressDto,
    @Request() req: any,
  ) {
    return this.projectProgressService.updateProgress(
      projectId,
      req.user.userId,
      data,
    );
  }
}
