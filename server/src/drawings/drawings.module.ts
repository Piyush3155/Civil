import { Module } from '@nestjs/common';
import { DrawingsService } from './drawings.service';
import { DrawingsController } from './drawings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DrawingsController],
  providers: [DrawingsService],
  exports: [DrawingsService],
})
export class DrawingsModule {}
