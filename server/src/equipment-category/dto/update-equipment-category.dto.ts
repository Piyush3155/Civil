import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentCategoryDto } from './create-equipment-category.dto';

export class UpdateEquipmentCategoryDto extends PartialType(CreateEquipmentCategoryDto) {}