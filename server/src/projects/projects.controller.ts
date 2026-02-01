import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async findAll() {
    return this.projectsService.findAll();
  }

  @Get('my-projects')
  async getMyProjects(@Request() req) {
    return this.projectsService.getProjectsByUser(req.user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR', 'CLIENT')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/owner-dashboard')
  @Roles('CLIENT', 'ADMIN', 'PROJECT_MANAGER')
  async getOwnerDashboard(@Param('id') id: string, @Request() req) {
    return this.projectsService.getOwnerDashboard(id, req.user.userId);
  }

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async create(
    @Body()
    createProjectDto: {
      name: string;
      code: string;
      location?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.projectsService.create({
      ...createProjectDto,
      startDate: createProjectDto.startDate
        ? new Date(createProjectDto.startDate)
        : undefined,
      endDate: createProjectDto.endDate
        ? new Date(createProjectDto.endDate)
        : undefined,
    });
  }

  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async update(
    @Param('id') id: string,
    @Body()
    updateProjectDto: {
      name?: string;
      location?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.projectsService.update(id, {
      ...updateProjectDto,
      startDate: updateProjectDto.startDate
        ? new Date(updateProjectDto.startDate)
        : undefined,
      endDate: updateProjectDto.endDate
        ? new Date(updateProjectDto.endDate)
        : undefined,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Post(':id/members')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.projectsService.addMember(id, body.userId, body.roleId);
  }

  @Delete(':id/members/:userId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(id, userId);
  }

  @Post(':id/owners')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async addOwner(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.projectsService.addOwner(id, body.userId);
  }

  @Delete(':id/owners/:userId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async removeOwner(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeOwner(id, userId);
  }

  @Post(':id/progress')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: { progress: number; nextMilestone?: string },
  ) {
    return this.projectsService.updateProgress(id, body);
  }

  @Post(':id/notify-contractors')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'CLIENT')
  async notifyContractors(
    @Param('id') id: string,
    @Body() body: { title: string; message: string },
    @Request() req,
  ) {
    return this.projectsService.notifyProjectContractors(id, body.title, body.message, req.user.userId);
  }
}
