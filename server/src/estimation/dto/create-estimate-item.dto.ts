import { IsString, IsOptional, IsDecimal } from 'class-validator';

export class CreateEstimateItemDto {
  @IsString()
  estimateId: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsString()
  description: string;

  @IsString()
  unit: string;

  @IsDecimal()
  quantity: number;
}