import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCorrectiveActionDto {
  @IsUUID()
  non_conformity_id!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  responsible?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}
