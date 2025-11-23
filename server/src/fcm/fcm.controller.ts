import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class TokenDto {
  @ApiProperty({ description: 'FCM token' })
  token: string;

  @ApiProperty({ description: 'Device ID' })
  deviceId: string;

  @ApiProperty({ description: 'Device type (ANDROID, IOS, WEB, etc.)' })
  deviceType: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;
}

class NotificationDto {
  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification body' })
  body: string;

  @ApiProperty({ description: 'Click action URL', required: false })
  click_action?: string;

  @ApiProperty({ description: 'Additional data', required: false })
  data?: Record<string, string>;
}

class RoleNotificationDto extends NotificationDto {
  @ApiProperty({ description: 'Role ID to send notification to' })
  roleId: string;
}

class MultipleUsersNotificationDto extends NotificationDto {
  @ApiProperty({ description: 'Array of user IDs to send notifications to' })
  userIds: string[];
}

class PaginationDto {
  @ApiProperty({ description: 'Page number', required: false })
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  limit?: number;
}

class UserNotificationHistoryDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by target type', required: false })
  targetType?: string;
}

@ApiTags('FCM')
@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upsert-token')
  @ApiOperation({ summary: 'Upsert FCM token for a user' })
  @ApiBody({ type: TokenDto })
  @ApiResponse({
    status: 201,
    description: 'Token upserted successfully',
    schema: {
      example: {
        id: 1,
        token: 'fcm_token',
        deviceId: 'device-123',
        deviceType: 'WEB',
        userId: 'user-123',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    }
  })
  async upsertToken(@Body() tokenDto: TokenDto) {
    try {
      return await this.fcmService.upsertToken(tokenDto);
    } catch (error) {
      throw new HttpException(
        `Failed to upsert FCM token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-to-role')
  @ApiOperation({ summary: 'Send notification to users with a specific role' })
  @ApiBody({ type: RoleNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Notifications sent successfully',
    schema: {
      example: {
        success: 5,
        failure: 0,
        notificationId: 123,
        targetDescription: 'Role 1'
      }
    }
  })
  async sendToRole(@Body() body: RoleNotificationDto, @Request() req) {
    try {
      return await this.fcmService.sendNotificationToRole(
        body.roleId,
        {
          title: body.title,
          body: body.body,
          click_action: body.click_action,
          data: body.data,
        },
        req.user.userId,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to send notification to role: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-to-user')
  @ApiOperation({ summary: 'Send notification to a specific user' })
  @ApiBody({
    type: NotificationDto,
    examples: {
      'default': {
        summary: 'Send to user example',
        value: {
          userId: 'user-123',
          title: 'Personal Notification',
          body: 'This is a personal notification for you',
          click_action: 'https://app.com/profile',
          data: {
            type: 'personal',
            userId: 'user-123'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    schema: {
      example: {
        success: 1,
        failure: 0,
        notificationId: 124,
        targetDescription: 'User user-123'
      }
    }
  })
  async sendToUser(
    @Body() body: { userId: string } & NotificationDto,
    @Request() req
  ) {
    try {
      return await this.fcmService.sendNotificationToUser(
        body.userId,
        {
          title: body.title,
          body: body.body,
          click_action: body.click_action,
          data: body.data,
        },
        req.user.userId,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to send notification to user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-to-multiple-users')
  @ApiOperation({ summary: 'Send notification to multiple users' })
  @ApiBody({ type: MultipleUsersNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Notifications sent successfully',
    schema: {
      example: {
        success: 3,
        failure: 0,
        notificationId: 125,
        targetDescription: '3 users'
      }
    }
  })
  async sendToMultipleUsers(
    @Body() body: MultipleUsersNotificationDto,
    @Request() req
  ) {
    try {
      return await this.fcmService.sendNotificationToMultipleUsers(
        body.userIds,
        {
          title: body.title,
          body: body.body,
          click_action: body.click_action,
          data: body.data,
        },
        req.user.userId,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to send notifications to multiple users: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('test')
  @ApiOperation({ summary: 'Send test FCM notification to authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
    schema: {
      example: {
        success: 1,
        failure: 0,
        notificationId: 126,
        targetDescription: 'User current-user',
        message: 'Test notification sent to your device'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No FCM token found for user'
  })
  async sendTestNotification(@Request() req) {
    try {
      const result = await this.fcmService.sendNotificationToUser(
        req.user.userId,
        {
          title: 'Test Notification',
          body: 'This is a test FCM message from Civil Desk!',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            userId: req.user.userId,
          },
        },
        req.user.userId,
      );

      return {
        ...result,
        message: 'Test notification sent to your device',
      };
    } catch (error) {
      if (error.message.includes('No FCM tokens found')) {
        throw new HttpException(
          'No FCM token found. Please refresh the page and allow notification permissions.',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        `Failed to send test notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
