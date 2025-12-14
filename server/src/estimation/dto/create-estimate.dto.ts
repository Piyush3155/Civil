import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { EstimateType, EstimateStatus } from '@prisma/client';

export class CreateEstimateDto {
  @IsString()
  projectId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EstimateType)
  type?: EstimateType;

  @IsOptional()
  @IsEnum(EstimateStatus)
  status?: EstimateStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  profitPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  contingencyPercentage?: number;

  @IsString()
  createdBy: string;
}