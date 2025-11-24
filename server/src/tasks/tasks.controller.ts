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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async findAll(@Query('projectId') projectId?: string) {
    return this.tasksService.findAll(projectId);
  }

  @Get(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'CLIENT')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async create(
    @Body()
    createTaskDto: {
      projectId: string;
      title: string;
      description?: string;
      category?: string;
      weightage?: number;
      contractorId?: string;
      startDate?: string;
      endDate?: string;
    },
    @Request() req,
  ) {
    return this.tasksService.create({
      ...createTaskDto,
      startDate: createTaskDto.startDate ? new Date(createTaskDto.startDate) : undefined,
      endDate: createTaskDto.endDate ? new Date(createTaskDto.endDate) : undefined,
      createdBy: req.user.userId,
    });
  }

  @Put(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER')
  async update(
    @Param('id') id: string,
    @Body()
    updateTaskDto: {
      title?: string;
      description?: string;
      category?: string;
      status?: string;
      weightage?: number;
      contractorId?: string;
      startDate?: string;
      endDate?: string;
    },
    @Request() req,
  ) {
    return this.tasksService.update(id, {
      ...updateTaskDto,
      startDate: updateTaskDto.startDate ? new Date(updateTaskDto.startDate) : undefined,
      endDate: updateTaskDto.endDate ? new Date(updateTaskDto.endDate) : undefined,
      updatedBy: req.user.userId,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Post(':id/progress')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: {
      progress: number;
      notes?: string;
      photos?: any[];
    },
    @Request() req,
  ) {
    return this.tasksService.updateProgress(
      id,
      body.progress,
      req.user.userId,
      body.notes,
      body.photos,
    );
  }

  @Get('project/:projectId')
  @Roles('ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'CLIENT')
  async getProjectTasks(@Param('projectId') projectId: string) {
    return this.tasksService.getProjectTasks(projectId);
  }

  @Post('bulk')
  @Roles('ADMIN', 'PROJECT_MANAGER')
  async bulkCreate(
    @Body()
    bulkCreateDto: {
      tasks: Array<{
        projectId: string;
        title: string;
        description?: string;
        category?: string;
        weightage?: number;
        contractorId?: string;
        startDate?: string;
        endDate?: string;
      }>;
    },
    @Request() req,
  ) {
    const tasksWithCreator = bulkCreateDto.tasks.map(task => ({
      ...task,
      startDate: task.startDate ? new Date(task.startDate) : undefined,
      endDate: task.endDate ? new Date(task.endDate) : undefined,
      createdBy: req.user.userId,
    }));

    return this.tasksService.bulkCreate(tasksWithCreator);
  }
}