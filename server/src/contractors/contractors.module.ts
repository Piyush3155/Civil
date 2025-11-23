import { Module } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { ContractorsController } from './contractors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractorsController],
  providers: [ContractorsService],
  exports: [ContractorsService],
})
export class ContractorsModule {}
