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
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('project-progress')
@UseGuards(JwtAuthGuard)
export class ProjectProgressController {
  constructor(private readonly projectProgressService: ProjectProgressService) {}

  @Get(':projectId')
  async getProgress(@Param('projectId') projectId: string) {
    return this.projectProgressService.getProgress(projectId);
  }

  @Get(':projectId/timeline')
  async getProgressTimeline(@Param('projectId') projectId: string) {
    return this.projectProgressService.getProgressTimeline(projectId);
  }

  @Put(':projectId')
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
