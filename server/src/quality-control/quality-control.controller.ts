import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QualityControlService } from './quality-control.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateQCIssueDto, UpdateQCIssueDto, AssignContractorDto } from './dto';

@Controller('qc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityControlController {
  constructor(private readonly qcService: QualityControlService) {}

  // GET /qc - Get all QC issues with optional filters
  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'CLIENT')
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.qcService.findAll(projectId, { type, status, priority, assignedTo });
  }

  // GET /qc/project/:projectId - Get all QC issues for a project
  @Get('project/:projectId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'CLIENT')
  async findByProject(@Param('projectId') projectId: string) {
    return this.qcService.findAll(projectId);
  }

  // GET /qc/project/:projectId/stats - Get QC statistics for a project
  @Get('project/:projectId/stats')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CLIENT')
  async getStats(@Param('projectId') projectId: string) {
    return this.qcService.getStats(projectId);
  }

  // GET /qc/:id - Get a single QC issue
  @Get(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'CLIENT')
  async findOne(@Param('id') id: string) {
    return this.qcService.findOne(id);
  }

  // POST /qc - Create a new QC issue (NCR)
  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CLIENT')
  async create(@Body() createDto: CreateQCIssueDto, @Request() req) {
    return this.qcService.create({
      ...createDto,
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : undefined,
      createdBy: req.user.userId,
    });
  }

  // PUT /qc/:id - Update a QC issue
  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQCIssueDto,
    @Request() req,
  ) {
    return this.qcService.update(
      id,
      {
        ...updateDto,
        dueDate: updateDto.dueDate ? new Date(updateDto.dueDate) : undefined,
      },
      req.user.userId,
    );
  }

  // POST /qc/:id/assign - Assign contractor to QC issue
  @Post(':id/assign')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async assignContractor(
    @Param('id') id: string,
    @Body() assignDto: AssignContractorDto,
    @Request() req,
  ) {
    return this.qcService.assignContractor(
      id,
      {
        ...assignDto,
        dueDate: assignDto.dueDate ? new Date(assignDto.dueDate) : undefined,
      },
      req.user.userId,
    );
  }

  // POST /qc/:id/contractor-update - Contractor updates status
  @Post(':id/contractor-update')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async contractorUpdate(
    @Param('id') id: string,
    @Body() body: {
      status: 'IN_PROGRESS' | 'FIXED';
      notes?: string;
      photos?: string[];
    },
    @Request() req,
  ) {
    return this.qcService.contractorUpdate(id, body, req.user.userId);
  }

  // POST /qc/:id/verify - Engineer verifies the fix
  @Post(':id/verify')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async verify(
    @Param('id') id: string,
    @Body() body: {
      approved: boolean;
      notes?: string;
      photos?: string[];
    },
    @Request() req,
  ) {
    return this.qcService.verify(id, body, req.user.userId);
  }

  // POST /qc/:id/close - PM closes the NCR
  @Post(':id/close')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async close(
    @Param('id') id: string,
    @Body() body: {
      approved: boolean;
      notes?: string;
    },
    @Request() req,
  ) {
    return this.qcService.close(id, body, req.user.userId);
  }

  // POST /qc/:id/reject - Reject the NCR
  @Post(':id/reject')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async reject(
    @Param('id') id: string,
    @Body() body: {
      notes: string;
    },
    @Request() req,
  ) {
    return this.qcService.reject(id, body, req.user.userId);
  }

  // DELETE /qc/:id - Delete a QC issue
  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async delete(@Param('id') id: string) {
    return this.qcService.delete(id);
  }
}
