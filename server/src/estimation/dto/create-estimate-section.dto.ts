import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { EstimateSectionCategory } from '@prisma/client';

export class CreateEstimateSectionDto {
  @IsString()
  estimateId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(EstimateSectionCategory)
  category?: EstimateSectionCategory;

  @IsInt()
  order: number;
}