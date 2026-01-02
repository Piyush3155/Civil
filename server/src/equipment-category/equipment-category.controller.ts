import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EquipmentCategoryService } from './equipment-category.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';

@Controller('equipment-category')
export class EquipmentCategoryController {
  constructor(private readonly equipmentCategoryService: EquipmentCategoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    return this.equipmentCategoryService.create(createEquipmentCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.equipmentCategoryService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentCategoryService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipmentCategoryDto: UpdateEquipmentCategoryDto) {
    return this.equipmentCategoryService.update(id, updateEquipmentCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentCategoryService.remove(id);
  }
}
