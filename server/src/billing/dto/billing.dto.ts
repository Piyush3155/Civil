import { IsString, IsOptional, IsDecimal, IsDateString, IsEnum } from 'class-validator';
import { BillStatus } from '@prisma/client';


export class CreateBOQItemDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsDecimal()
  estimatedQty?: number;
}

export class CreateRateContractDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsString()
  boqItemId: string;

  @IsDecimal()
  rate: number;

  @IsString()
  unit: string;
}

export class CreateMeasurementDto {
  @IsString()
  boqItemId: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsDecimal()
  measuredQty: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  createdBy: string;
}

export class CreateBillDto {
  @IsString()
  projectId: string;

  @IsString()
  contractorId: string;

  @IsDateString()
  periodFrom: string;

  @IsDateString()
  periodTo: string;

  @IsString()
  createdBy: string;
}

export class UpdateBillStatusDto {
  @IsEnum(BillStatus)
  status: BillStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}