import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdjustmentType } from '@prisma/client';

export class CreateAdjustmentDto {
  @IsString()
  projectId: string;

  @IsString()
  materialId: string;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  photos?: string[];
}
