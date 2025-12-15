import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          isAdmin: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByIdWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async storeFcmToken(userId: string, token: string, deviceType: string = 'WEB') {
    // First, check if token already exists for this user and device
    const existingToken = await this.prisma.userTokens.findFirst({
      where: {
        userId,
        deviceType: deviceType as any,
      },
    });

    if (existingToken) {
      // Update existing token
      return this.prisma.userTokens.update({
        where: { id: existingToken.id },
        data: { token, lastUsed: new Date() },
      });
    } else {
      // Create new token
      return this.prisma.userTokens.create({
        data: {
          userId,
          token,
          deviceType: deviceType as any,
        },
      });
    }
  }

  async create(data: { name: string; username: string; email: string; password: string; phone?: string }) {
    const { username, email } = data;

    // Pre-check to provide clear errors and avoid Prisma constraint failures
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existing) {
      if (existing.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existing.email === email) {
        throw new ConflictException('Email already exists');
      }
      // Fallback
      throw new ConflictException('User already exists');
    }

    try {
      return await this.prisma.user.create({
        data,
      });
    } catch (err: any) {
      // Handle Prisma unique constraint error as a conflict
      if (err?.code === 'P2002') {
        const target = err?.meta?.target || [];
        if (Array.isArray(target) && target.includes('username')) {
          throw new ConflictException('Username already exists');
        }
        if (Array.isArray(target) && target.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Duplicate value for unique field');
      }
      // Re-throw other errors as bad requests
      throw new BadRequestException(err?.message || 'Failed to create user');
    }
  }
}

