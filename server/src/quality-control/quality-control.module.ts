import { Module } from '@nestjs/common';
import { QualityControlController } from './quality-control.controller';
import { QualityControlService } from './quality-control.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityControlController],
  providers: [QualityControlService],
  exports: [QualityControlService],
})
export class QualityControlModule {}
