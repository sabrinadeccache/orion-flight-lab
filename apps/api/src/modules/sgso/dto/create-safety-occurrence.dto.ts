import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSafetyOccurrenceDto {
  @IsString()
  description!: string;

  @IsDateString()
  occurred_at!: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
