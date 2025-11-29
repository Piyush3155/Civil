import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsArray } from 'class-validator';
import { QCType, QCPriority, NCRStatus } from '@prisma/client';

export class UpdateQCIssueDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsEnum(QCType)
  type?: QCType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(QCPriority)
  priority?: QCPriority;

  @IsOptional()
  @IsEnum(NCRStatus)
  status?: NCRStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  costImpact?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
