import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  milestone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}