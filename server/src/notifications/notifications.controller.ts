import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get paginated notification history' })
  @ApiResponse({
    status: 200,
    description: 'Notification history retrieved successfully',
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
  })
  @ApiQuery({
    name: 'targetType',
    description: 'Filter by target type (USER, MULTIPLE_USERS, ROLE)',
    required: false,
  })
  async getNotificationHistory(
    @Query() query: { page?: number; limit?: number; targetType?: string },
  ) {
    const { page = 1, limit = 10, targetType } = query;
    return this.notificationsService.getNotificationHistory(
      page,
      limit,
      targetType,
    );
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
  })
  @ApiBody({
    type: Object,
    description: 'Array of notification IDs to mark as read',
    schema: {
      type: 'object',
      properties: {
        notificationIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of notification IDs',
        },
      },
    },
  })
  async markNotificationsAsRead(
    @Body() body: { notificationIds: number[] },
  ) {
    const { notificationIds } = body;
    return this.notificationsService.markNotificationsAsRead(
      'currentUserId', // Replace with actual user ID from request (e.g., req.user.id)
      notificationIds,
    );
  }

  @Get('user-history')
  @ApiOperation({
    summary: 'Get paginated notification history for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User notification history retrieved successfully',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID (defaults to current user if not provided)',
  })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
  })
  @ApiQuery({
    name: 'targetType',
    description: 'Filter by target type',
    required: false,
  })
  async getUserNotificationHistory(
    @Query() query: {
      userId?: string;
      page?: number;
      limit?: number;
      targetType?: string;
    },
  ) {
    const { userId = 'currentUserId', page = 1, limit = 10, targetType } = query; // Replace 'currentUserId' with req.user.id
    return this.notificationsService.getUserNotificationHistory(
      userId,
      page,
      limit,
      targetType,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getNotificationStats() {
    return this.notificationsService.getNotificationStats();
  }
}