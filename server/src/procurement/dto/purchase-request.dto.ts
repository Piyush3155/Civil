import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseRequestDto {
  @IsString()
  projectId: string;

  @IsString()
  materialId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  urgency?: string;
}

export class ApprovePurchaseRequestDto {
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
