import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaClient } from '@prisma/client';

class SendNotificationDto {
  token: string;
  title: string;
  body: string;
  data?: any;
}

class SendMultipleNotificationsDto {
  tokens: string[];
  title: string;
  body: string;
  data?: any;
}

@ApiTags('FCM')
@Controller('fcm')
export class FcmController {
  private prisma = new PrismaClient();

  constructor(private readonly fcmService: FcmService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send FCM notification to single device' })
  @ApiBody({
    type: SendNotificationDto,
    examples: {
      'default': {
        summary: 'Send notification example',
        value: {
          token: 'fcm_device_token_here',
          title: 'Test Notification',
          body: 'This is a test message from FCM',
          data: {
            customKey: 'customValue',
            action: 'navigate_to_screen'
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
        success: true,
        messageId: 'projects/your-project/messages/123456789'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid token or parameters'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - FCM service error'
  })
  async sendNotification(
    @Body() body: { token: string; title: string; body: string; data?: any },
  ) {
    return this.fcmService.sendNotification(
      body.token,
      body.title,
      body.body,
      body.data,
    );
  }

  @Post('send-multiple')
  @ApiOperation({ summary: 'Send FCM notification to multiple devices' })
  @ApiBody({
    type: SendMultipleNotificationsDto,
    examples: {
      'default': {
        summary: 'Send multiple notifications example',
        value: {
          tokens: [
            'fcm_token_1',
            'fcm_token_2',
            'fcm_token_3'
          ],
          title: 'Bulk Notification',
          body: 'This message goes to multiple devices',
          data: {
            type: 'broadcast',
            priority: 'high'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications sent successfully',
    schema: {
      example: {
        success: 3,
        failure: 0,
        responses: [
          'projects/your-project/messages/123',
          'projects/your-project/messages/456',
          'projects/your-project/messages/789'
        ]
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid tokens or parameters'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - FCM service error'
  })
  async sendToMultipleTokens(
    @Body() body: { tokens: string[]; title: string; body: string; data?: any },
  ) {
    return this.fcmService.sendToMultipleTokens(
      body.tokens,
      body.title,
      body.body,
      body.data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('test')
  @ApiOperation({ summary: 'Send test FCM notification to authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
    schema: {
      example: {
        success: true,
        messageId: 'projects/your-project/messages/123456789',
        message: 'Test notification sent to your device'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated'
  })
  @ApiResponse({
    status: 404,
    description: 'No FCM token found for user'
  })
  async sendTestNotification(@Request() req) {
    const userId = req.user.id;
    
    // Get user's FCM token from database
    const userTokenRecord = await this.prisma.userTokens.findFirst({
      where: { userId },
      orderBy: { lastUsed: 'desc' }, // Get the most recently used token
    });
    
    if (!userTokenRecord) {
      return {
        success: false,
        message: 'No FCM token found. Please login again with notification permissions enabled.'
      };
    }

    const result = await this.fcmService.sendNotification(
      userTokenRecord.token,
      'Test Notification',
      'This is a test FCM message from Civil Desk!',
      {
        type: 'test',
        timestamp: new Date().toISOString(),
        userId: String(userId)
      }
    );

    return {
      success: true,
      messageId: result.messageId,
      message: 'Test notification sent to your device'
    };
  }
}
