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
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { DrawingsService } from './drawings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('drawings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async findAll(@Query('projectId') projectId?: string) {
    return this.drawingsService.findAll(projectId);
  }

  @Get('accessible')
  async getAccessibleDrawings(
    @Request() req,
    @Query('projectId') projectId?: string,
  ) {
    return this.drawingsService.getUserAccessibleDrawings(
      req.user.userId,
      req.user.roles,
      projectId,
    );
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.drawingsService.findByProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const hasAccess = await this.drawingsService.checkAccess(
      id,
      req.user.userId,
      req.user.roles,
    );

    if (!hasAccess && !req.user.isAdmin) {
      throw new ForbiddenException('You do not have access to this drawing');
    }

    return this.drawingsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async create(
    @Request() req,
    @Body()
    body: {
      projectId: string;
      title: string;
      description?: string;
      fileUrl: string;
      fileType: string;
    },
  ) {
    return this.drawingsService.create({
      ...body,
      uploadedBy: req.user.userId,
    });
  }

  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      fileUrl?: string;
      version?: number;
    },
  ) {
    return this.drawingsService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async delete(@Param('id') id: string) {
    return this.drawingsService.delete(id);
  }

  @Post(':id/access')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async grantAccess(
    @Param('id') id: string,
    @Body()
    body: {
      roleId?: string;
      userId?: string;
      canView?: boolean;
    },
  ) {
    return this.drawingsService.grantAccess(
      id,
      body.roleId,
      body.userId,
      body.canView,
    );
  }

  @Delete('access/:accessId')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async revokeAccess(@Param('accessId') accessId: string) {
    return this.drawingsService.revokeAccess(accessId);
  }
}
