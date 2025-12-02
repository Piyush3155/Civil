import { IsString, IsOptional, IsEnum, IsDecimal } from 'class-validator';
import { ComponentType } from '@prisma/client';

export class CreateEstimateRateComponentDto {
  @IsString()
  itemId: string;

  @IsEnum(ComponentType)
  type: ComponentType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDecimal()
  quantity?: number;

  @IsOptional()
  @IsDecimal()
  rate?: number;

  @IsOptional()
  @IsDecimal()
  cost?: number;
}