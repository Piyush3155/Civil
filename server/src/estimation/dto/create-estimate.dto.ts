import { IsString, IsOptional } from 'class-validator';

export class CreateEstimateDto {
  @IsString()
  projectId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  createdBy: string;
}