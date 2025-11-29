import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AssignContractorDto {
  @IsString()
  contractorId: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
