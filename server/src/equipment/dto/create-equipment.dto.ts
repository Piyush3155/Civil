import {
  IsString,
  IsOptional,
  IsDecimal,
  IsBoolean,
  IsDate,
  IsEnum,
} from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class CreateEquipmentDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsDate()
  @IsOptional()
  purchaseDate?: Date;

  @IsDecimal()
  @IsOptional()
  purchasePrice?: number;

  @IsBoolean()
  @IsOptional()
  rental?: boolean;

  @IsString()
  @IsOptional()
  rentalVendor?: string;

  @IsDecimal()
  @IsOptional()
  rentalRate?: number;

  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;

  @IsString()
  categoryId: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  createdById: string;
}
