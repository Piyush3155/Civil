import { Module } from '@nestjs/common';
import { LaboursService } from './labours.service';
import { LaboursController } from './labours.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LaboursController],
  providers: [LaboursService],
  exports: [LaboursService],
})
export class LaboursModule {}
