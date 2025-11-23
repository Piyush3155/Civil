import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [NotificationsService],
  controllers: [NotificationsController],
  imports: [PrismaModule],
  exports: [NotificationsService],
})
export class NotificationsModule {}