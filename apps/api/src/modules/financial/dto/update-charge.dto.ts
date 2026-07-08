import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateChargeDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
