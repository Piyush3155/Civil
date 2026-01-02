import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    const { categoryId, projectId, createdById, ...data } = createEquipmentDto;
    
    const equipmentData: any = {
      ...data,
      category: {
        connect: { id: categoryId }
      },
      createdBy: {
        connect: { id: createdById }
      }
    };

    if (projectId) {
      equipmentData.project = {
        connect: { id: projectId }
      };
    }

    return this.prisma.equipment.create({
      data: equipmentData,
      include: {
        category: true,
        project: true,
        createdBy: true,
      },
    });
  }

  async findAll(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.equipment.findMany({
      where,
      include: {
        category: true,
        project: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        project: true,
      },
    });
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto) {
    return this.prisma.equipment.update({
      where: { id },
      data: updateEquipmentDto,
      include: {
        category: true,
        project: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.equipment.delete({
      where: { id },
    });
  }
}
