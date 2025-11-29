import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransferDto {
  @IsString()
  projectId: string;

  @IsString()
  materialId: string;

  @IsString()
  @IsOptional()
  fromLocation?: string;

  @IsString()
  @IsOptional()
  toLocation?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.001)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
