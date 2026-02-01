import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(private prisma: PrismaService) {}

  // Create a password reset request
  async createRequest(userId: string, email: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.forgotPasswordRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending password reset request');
    }

    // Create new request
    return this.prisma.forgotPasswordRequest.create({
      data: {
        userId,
        email,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  // Create request by email (for unauthenticated users)
  async createRequestByEmail(email: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with this email exists, a password reset request has been sent to the admin.' };
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.forgotPasswordRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      // Don't reveal details for security
      return { message: 'If an account with this email exists, a password reset request has been sent to the admin.' };
    }

    // Create new request
    await this.prisma.forgotPasswordRequest.create({
      data: {
        userId: user.id,
        email,
        status: 'PENDING',
      },
    });

    return { message: 'If an account with this email exists, a password reset request has been sent to the admin.' };
  }

  // Get all pending requests (for admin)
  async getPendingRequests() {
    return this.prisma.forgotPasswordRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  // Get all requests with optional status filter (for admin)
  async getAllRequests(status?: string) {
    const where = status && status !== 'all' ? { status: status as any } : {};

    return this.prisma.forgotPasswordRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  // Approve request and reset password (for admin)
  async approveRequest(requestId: string, adminId: string, newPassword: string) {
    const request = await this.prisma.forgotPasswordRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Password reset request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await this.prisma.user.update({
      where: { id: request.userId },
      data: { password: hashedPassword },
    });

    // Update request status
    return this.prisma.forgotPasswordRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        processedAt: new Date(),
        processedBy: adminId,
        newPassword: '[REDACTED]', // Don't store actual password
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  // Reject request (for admin)
  async rejectRequest(requestId: string, adminId: string, reason?: string) {
    const request = await this.prisma.forgotPasswordRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Password reset request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    return this.prisma.forgotPasswordRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: adminId,
        reason: reason || 'Request rejected by administrator',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  // Get request count by status
  async getRequestStats() {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.forgotPasswordRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.forgotPasswordRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.forgotPasswordRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    return { pending, approved, rejected, total: pending + approved + rejected };
  }
}
