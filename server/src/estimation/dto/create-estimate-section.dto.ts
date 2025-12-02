import { IsString, IsInt } from 'class-validator';

export class CreateEstimateSectionDto {
  @IsString()
  estimateId: string;

  @IsString()
  name: string;

  @IsInt()
  order: number;
}