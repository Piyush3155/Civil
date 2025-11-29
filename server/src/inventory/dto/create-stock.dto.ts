import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockDto {
  @IsString()
  projectId: string;

  @IsString()
  materialId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  openingQty: number;

  @IsString()
  @IsOptional()
  location?: string;
}
