import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { CreateEstimateSectionDto } from './dto/create-estimate-section.dto';
import { CreateEstimateItemDto } from './dto/create-estimate-item.dto';
import { CreateEstimateRateComponentDto } from './dto/create-estimate-rate-component.dto';

@Injectable()
export class EstimationService {
  constructor(private prisma: PrismaService) {}

  async createEstimate(dto: CreateEstimateDto) {
    return this.prisma.estimate.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        createdBy: dto.createdBy,
      },
    });
  }

  async getEstimatesByProject(projectId: string) {
    return this.prisma.estimate.findMany({
      where: { projectId },
      include: {
        creator: true,
        sections: {
          include: {
            items: {
              include: { components: true },
            },
          },
        },
        items: {
          include: { components: true },
        },
      },
    });
  }

  async getAllEstimates() {
    return this.prisma.estimate.findMany({
      include: {
        project: true,
        creator: true,
        sections: {
          include: {
            items: { include: { components: true } },
          },
        },
        items: { include: { components: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEstimateById(id: string) {
    return this.prisma.estimate.findUnique({
      where: { id },
      include: {
        project: true,
        creator: true,
        sections: {
          include: {
            items: {
              include: { components: true },
            },
          },
        },
        items: {
          include: { components: true },
        },
      },
    });
  }

  async createSection(dto: CreateEstimateSectionDto) {
    return this.prisma.estimateSection.create({
      data: dto,
    });
  }

  async createItem(dto: CreateEstimateItemDto) {
    const item = await this.prisma.estimateItem.create({
      data: {
        ...dto,
        rate: 0, // Will be computed
        amount: 0, // Will be computed
      },
    });
    await this.updateItemRateAndAmount(item.id);
    return item;
  }

  async createRateComponent(dto: CreateEstimateRateComponentDto) {
    const component = await this.prisma.estimateRateComponent.create({
      data: dto,
    });
    await this.updateItemRateAndAmount(dto.itemId);
    return component;
  }

  async updateItemRateAndAmount(itemId: string) {
    const components = await this.prisma.estimateRateComponent.findMany({
      where: { itemId },
    });

    const totalRate = components.reduce((sum, comp) => sum + Number(comp.cost || 0), 0);

    const item = await this.prisma.estimateItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return null;
    }

    const amount = totalRate * Number(item.quantity || 0);

    await this.prisma.estimateItem.update({
      where: { id: itemId },
      data: {
        rate: totalRate,
        amount,
      },
    });

    // Recompute estimate total (if item has estimateId)
    if (item.estimateId) {
      await this.computeEstimateTotal(item.estimateId);
    }

    return { rate: totalRate, amount };
  }

  async computeEstimateTotal(estimateId: string) {
    const items = await this.prisma.estimateItem.findMany({
      where: { estimateId },
    });

    const sum = items.reduce((acc, item) => acc + Number(item.amount), 0);

    return this.prisma.estimate.update({
      where: { id: estimateId },
      data: { totalCost: sum },
    });
  }

  async deleteEstimate(id: string) {
    return this.prisma.estimate.delete({
      where: { id },
    });
  }

  async deleteSection(id: string) {
    return this.prisma.estimateSection.delete({
      where: { id },
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.estimateItem.findUnique({
      where: { id },
    });
    if (!item) {
      throw new Error('Item not found');
    }
    await this.prisma.estimateItem.delete({
      where: { id },
    });
    await this.computeEstimateTotal(item.estimateId);
  }

  async deleteRateComponent(id: string) {
    const component = await this.prisma.estimateRateComponent.findUnique({
      where: { id },
    });
    if (!component) {
      throw new Error('Component not found');
    }
    await this.prisma.estimateRateComponent.delete({
      where: { id },
    });
    await this.updateItemRateAndAmount(component.itemId);
  }
}