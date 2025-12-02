import { Module } from '@nestjs/common';
import { EstimationService } from './estimation.service';
import { EstimationController } from './estimation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, PdfModule],
  controllers: [EstimationController],
  providers: [EstimationService],
  exports: [EstimationService],
})
export class EstimationModule {}