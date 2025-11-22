import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
    return this.prisma.user.create({
      data,
    });
  }
}

