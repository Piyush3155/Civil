import { IsString, IsOptional } from 'class-validator';

export class CreateEquipmentCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}