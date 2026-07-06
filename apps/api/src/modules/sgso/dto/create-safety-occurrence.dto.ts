import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSafetyOccurrenceDto {
  @IsString()
  description!: string;

  @IsDateString()
  occurred_at!: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsUUID()
  hazard_id?: string;
}
