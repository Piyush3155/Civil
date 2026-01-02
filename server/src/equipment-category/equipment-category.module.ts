import { Module } from '@nestjs/common';
import { EquipmentCategoryController } from './equipment-category.controller';
import { EquipmentCategoryService } from './equipment-category.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentCategoryController],
  providers: [EquipmentCategoryService],
  exports: [EquipmentCategoryService]
})
export class EquipmentCategoryModule {}
