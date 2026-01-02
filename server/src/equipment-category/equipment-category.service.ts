import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@Injectable()
export class EquipmentCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    return this.prisma.equipmentCategory.create({
      data: createEquipmentCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.equipmentCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.equipmentCategory.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateEquipmentCategoryDto: UpdateEquipmentCategoryDto) {
    return this.prisma.equipmentCategory.update({
      where: { id },
      data: updateEquipmentCategoryDto,
    });
  }

  async remove(id: string) {
    return this.prisma.equipmentCategory.delete({
      where: { id },
    });
  }
}
