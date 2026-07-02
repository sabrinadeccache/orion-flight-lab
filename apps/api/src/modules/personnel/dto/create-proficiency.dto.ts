import { IsDateString, IsOptional, IsString } from 'class-validator';

/// RN-16: renewal must fall within 45 days before/after the previous
/// proficiency's valid_until.
export class CreateProficiencyDto {
  @IsDateString()
  evaluated_at!: string;

  @IsDateString()
  valid_until!: string;

  @IsOptional()
  @IsString()
  evaluator_name?: string;
}
