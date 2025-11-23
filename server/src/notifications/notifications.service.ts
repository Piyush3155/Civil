import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send notification to a specific role
   * @param roleId The role ID to send the notification to
   * @param notification The notification payload to send
   * @returns Result of the notification sending
   */
  async sendNotificationToRole(
    roleId: string,
    notification: {
      title: string;
      body: string;
      click_action?: string;
      data?: Record<string, string>;
    },
    sentById?: string,
  ) {
    try {
      this.logger.log(`Sending notification to users with role: ${roleId}`);

      // Create notification history record first
      const notificationHistory = await this.prisma.notificationHistory.create({
        data: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          targetType: 'ROLE',
          targetIds: [roleId],
          sentById,
          status: 'PENDING',
        },
      });

      // Find all users with the specified role
      const users = await this.prisma.user.findMany({
        where: {
          roles: {
            some: {
              roleId: roleId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!users.length) {
        this.logger.warn(`No users found with role: ${roleId}`);

        // Update notification history with failure
        await this.prisma.notificationHistory.update({
          where: { id: notificationHistory.id },
          data: {
            status: 'FAILED',
            successCount: 0,
            failureCount: 0,
          },
        });

        return { success: 0, failure: 0, usersCount: 0 };
      }

      const userIds = users.map((user) => user.id);
      const result = await this.sendNotificationToMultipleUsers(
        userIds,
        notification,
        sentById,
        notificationHistory.id,
      );

      // Update the notification history with results
      await this.prisma.notificationHistory.update({
        where: { id: notificationHistory.id },
        data: {
          status:
            result.success > 0
              ? result.failure > 0
                ? 'PARTIALLY_SENT'
                : 'SENT'
              : 'FAILED',
          successCount: result.success,
          failureCount: result.failure,
        },
      });

      return {
        ...result,
        historyId: notificationHistory.id,
      };
    } catch (error) {
      this.logger.error(
        `Error sending notification to role: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send notification to a single user by ID
   * @param userId The user ID to send the notification to
   * @param notification The notification payload to send
   * @returns Result of the notification sending
   */
  async sendNotificationToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      click_action?: string;
      data?: Record<string, string>;
    },
    sentById?: string,
  ) {
    try {
      this.logger.log(`Sending notification to user: ${userId}`);

      // Create notification history record first
      const notificationHistory = await this.prisma.notificationHistory.create({
        data: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          targetType: 'USER',
          targetIds: [userId],
          sentById,
          status: 'PENDING',
        },
      });

      const tokens = await this.getUserTokens(userId);

      if (!tokens.length) {
        this.logger.warn(`No tokens found for user: ${userId}`);

        // Update notification history with failure
        await this.prisma.notificationHistory.update({
          where: { id: notificationHistory.id },
          data: {
            status: 'FAILED',
            successCount: 0,
            failureCount: 0,
          },
        });

        return { success: 0, failure: 0 };
      }

      const result = await this.sendNotificationToTokens(
        tokens
          .filter((t): t is { id: number; token: string; userId: string } => typeof t.userId === 'string'),
        notification,
        notificationHistory.id,
      );

      // Update the notification history with results
      await this.prisma.notificationHistory.update({
        where: { id: notificationHistory.id },
        data: {
          status:
            result.success > 0
              ? result.failure > 0
                ? 'PARTIALLY_SENT'
                : 'SENT'
              : 'FAILED',
          successCount: result.success,
          failureCount: result.failure,
        },
      });

      return {
        ...result,
        historyId: notificationHistory.id,
      };
    } catch (error) {
      this.logger.error(
        `Error sending notification to user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send notification to multiple users by IDs
   * @param userIds Array of user IDs to send notifications to
   * @param notification The notification payload to send
   * @returns Results of the notification sending
   */
  async sendNotificationToMultipleUsers(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      click_action?: string;
      data?: Record<string, string>;
    },
    sentById?: string,
    existingNotificationId?: number,
  ) {
    try {
      this.logger.log(`Sending notification to ${userIds.length} users`);

      // Create notification history record if not provided
      let notificationHistoryId = existingNotificationId;

      if (!notificationHistoryId) {
        const notificationHistory =
          await this.prisma.notificationHistory.create({
            data: {
              title: notification.title,
              body: notification.body,
              data: notification.data || {},
              targetType: 'MULTIPLE_USERS',
              targetIds: userIds,
              sentById,
              status: 'PENDING',
            },
          });

        notificationHistoryId = notificationHistory.id;
      }

      // Get tokens for all specified users
      const tokensRecords = await this.prisma.userTokens.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        select: {
          id: true,
          token: true,
          userId: true,
        },
      });

      if (!tokensRecords.length) {
        this.logger.warn(`No tokens found for specified users`);

        // Update notification history with failure
        await this.prisma.notificationHistory.update({
          where: { id: notificationHistoryId },
          data: {
            status: 'FAILED',
            successCount: 0,
            failureCount: 0,
          },
        });

        return { success: 0, failure: 0, usersCount: userIds.length };
      }

      // Filter out tokens where userId is null to ensure type safety
      const filteredTokens: { id: number; token: string; userId: string }[] = tokensRecords
        .filter((record): record is { id: number; token: string; userId: string } => typeof record.userId === 'string')
        .map((record) => ({
          id: record.id,
          token: record.token,
          userId: record.userId,
        }));

      const result = await this.sendNotificationToTokens(
        filteredTokens,
        notification,
        notificationHistoryId,
      );

      // Update the notification history with results
      await this.prisma.notificationHistory.update({
        where: { id: notificationHistoryId },
        data: {
          status:
            result.success > 0
              ? result.failure > 0
                ? 'PARTIALLY_SENT'
                : 'SENT'
              : 'FAILED',
          successCount: result.success,
          failureCount: result.failure,
        },
      });

      return {
        ...result,
        usersCount: userIds.length,
        historyId: notificationHistoryId,
      };
    } catch (error) {
      this.logger.error(
        `Error sending notification to multiple users: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Helper method to get tokens for a specific user
   * @param userId The user ID to get tokens for
   * @returns Array of token objects with id, token, and userId
   */
  private async getUserTokens(userId: string) {
    const tokens = await this.prisma.userTokens.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        token: true,
        userId: true,
      },
    });

    return tokens;
  }

  /**
   * Helper method to send notifications to an array of tokens
   * @param tokens Array of token objects containing id, token, and userId
   * @param notification The notification payload to send
   * @returns Results of the notification sending
   */
  private async sendNotificationToTokens(
    tokens: Array<{ id: number; token: string; userId: string }>,
    notification: {
      title: string;
      body: string;
      click_action?: string;
      data?: Record<string, string>;
    },
    notificationHistoryId: number,
  ) {
    try {
      const fcmTokens = tokens.map((t) => t.token);

      // Create delivery status records for tracking
      await this.prisma.fcmDeliveryStatus.createMany({
        data: tokens.map((token) => ({
          notificationId: notificationHistoryId,
          tokenId: token.id,
          userId: token.userId,
          status: 'PENDING',
        })),
      });

      // Format the notification for FCM
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.click_action && { click_action: notification.click_action }),
        },
        data: notification.data || {},
      };

      // Send the notifications
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Notification sent: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      // Handle failures and update delivery status
      await this.handleNotificationResponses(
        response.responses,
        tokens,
        notificationHistoryId,
      );

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Error sending notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle notification responses and update delivery status
   * @param responses Array of messaging responses
   * @param tokens Array of token objects
   * @param notificationHistoryId ID of the notification history record
   */
  private async handleNotificationResponses(
    responses: admin.messaging.SendResponse[],
    tokens: Array<{ id: number; token: string; userId: string }>,
    notificationHistoryId: number,
  ) {
    const invalidTokenIds: number[] = [];
    const updatePromises: Promise<any>[] = [];

    responses.forEach((resp, idx) => {
      const token = tokens[idx];
      const deliveryStatus = {
        status: resp.success ? 'SENT' : 'FAILED',
        processedAt: new Date(),
      } as any;

      if (!resp.success) {
        const errorCode = resp.error?.code;
        deliveryStatus.errorCode = errorCode;
        deliveryStatus.errorMessage = resp.error?.message;

        // Check for token-related errors that indicate we should remove the token
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          this.logger.warn(
            `Invalid token detected for user ${token.userId}: ${errorCode}. Will remove token.`,
          );
          invalidTokenIds.push(token.id);
        } else {
          this.logger.error(
            `Failed to send notification with error: ${resp.error?.message}`,
          );
        }
      }

      // Update delivery status
      updatePromises.push(
        this.prisma.fcmDeliveryStatus.updateMany({
          where: {
            notificationId: notificationHistoryId,
            tokenId: token.id,
          },
          data: deliveryStatus,
        }),
      );
    });

    // Wait for all status updates
    await Promise.all(updatePromises);

    // Delete invalid tokens if any were found
    if (invalidTokenIds.length > 0) {
      await this.prisma.userTokens.deleteMany({
        where: {
          id: {
            in: invalidTokenIds,
          },
        },
      });
      this.logger.log(
        `Removed ${invalidTokenIds.length} invalid tokens from database`,
      );
    }
  }

  /**
   * Get notification history with pagination and optional filtering
   * @param page Page number
   * @param limit Items per page
   * @param targetType Optional filter by target type
   * @returns Paginated notification history
   */
  async getNotificationHistory(
    page: number = 1,
    limit: number = 10,
    targetType?: string,
  ) {
    const take = Math.max(1, Math.min(limit, 100));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const where: any = {};
    if (targetType) {
      where.targetType = targetType;
    }

    const [total, items] = await Promise.all([
      this.prisma.notificationHistory.count({ where }),
      this.prisma.notificationHistory.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          sentBy: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                select: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    // Transform items to flatten the sentBy structure
    const transformedItems = items.map(item => ({
      ...item,
      sentBy: item.sentBy ? {
        id: item.sentBy.id,
        name: item.sentBy.name,
        email: item.sentBy.email,
        role: item.sentBy.roles?.[0]?.role || null,
      } : null,
    }));

    return {
      items: transformedItems,
      meta: {
        currentPage: page,
        itemCount: items.length,
        itemsPerPage: take,
        totalItems: total,
        totalPages,
      },
    };
  }

  /**
   * Get notification details by ID
   * @param id Notification history ID
   * @returns Notification details
   */
  async getNotificationDetails(id: number) {
    const notification = await this.prisma.notificationHistory.findUnique({
      where: { id },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tokens: {
          include: {
            token: {
              select: {
                userId: true,
                deviceId: true,
                deviceType: true,
              },
            },
          },
        },
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Transform the notification
    return {
      ...notification,
      sentBy: notification.sentBy ? {
        id: notification.sentBy.id,
        name: notification.sentBy.name,
        email: notification.sentBy.email,
        role: notification.sentBy.roles?.[0]?.role || null,
      } : null,
      deliveries: notification.tokens.map(delivery => ({
        ...delivery,
        user: delivery.token,
      })),
    };
  }

  /**
   * Get notification statistics
   * @returns Notification statistics
   */
  async getNotificationStats() {
    const [
      totalNotifications,
      sentCount,
      failedCount,
      pendingCount,
    ] = await Promise.all([
      this.prisma.notificationHistory.count(),
      this.prisma.notificationHistory.count({ where: { status: 'SENT' } }),
      this.prisma.notificationHistory.count({ where: { status: 'FAILED' } }),
      this.prisma.notificationHistory.count({ where: { status: 'PENDING' } }),
    ]);

    const partiallySentCount = await this.prisma.notificationHistory.count({
      where: { status: 'PARTIALLY_SENT' }
    });

    const deliveryRate = totalNotifications > 0
      ? ((sentCount + partiallySentCount) / totalNotifications) * 100
      : 0;

    return {
      totalNotifications,
      sentCount,
      failedCount,
      pendingCount,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  }

  /**
   * Mark notifications as read for a user
   * @param userId User ID
   * @param notificationIds Array of notification IDs to mark as read
   * @returns Result of the operation
   */
  async markNotificationsAsRead(userId: string, notificationIds: number[]) {
    try {
      const result = await this.prisma.fcmDeliveryStatus.updateMany({
        where: {
          notificationId: {
            in: notificationIds,
          },
          userId: userId,
        },
        data: {
          readAt: new Date(),
        },
      });

      return {
        success: true,
        message: `${result.count} notifications marked as read`,
        count: result.count,
      };
    } catch (error) {
      this.logger.error(`Error marking notifications as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user notification history
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @param targetType Optional filter by target type
   * @returns Paginated user notification history
   */
  async getUserNotificationHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    targetType?: string,
  ) {
    const take = Math.max(1, Math.min(limit, 100));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const where: any = {
      fcmToken: {
        userId: userId,
      },
    };

    if (targetType) {
      where.notificationHistory = {
        targetType: targetType,
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.fcmDeliveryStatus.count({ where }),
      this.prisma.fcmDeliveryStatus.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          notification: {
            include: {
              sentBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  roles: {
                    select: {
                      role: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    // Transform items
    const transformedItems = items.map(item => ({
      id: item.notification.id,
      title: item.notification.title,
      body: item.notification.body,
      data: item.notification.data,
      status: item.status,
      deliveredAt: item.deliveredAt,
      readAt: item.readAt,
      createdAt: item.notification.createdAt,
      sentBy: (item.notification.sentBy ? {
        id: item.notification.sentBy.id,
        name: item.notification.sentBy.name,
        email: item.notification.sentBy.email,
        role: item.notification.sentBy.roles?.[0]?.role || null,
      } : null),
    }));

    return {
      items: transformedItems,
      meta: {
        currentPage: page,
        itemCount: items.length,
        itemsPerPage: take,
        totalItems: total,
        totalPages,
      },
    };
  }
}