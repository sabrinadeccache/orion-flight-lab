import { CourseModality } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  curriculum_id!: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsEnum(CourseModality)
  modality?: CourseModality;

  /// RN-05: minimum score (0-100) an exam needs to be auto-approved and
  /// trigger automatic certificate issuance. Null/omitted keeps the old
  /// behavior (only the exam's explicit `result` field matters).
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  min_passing_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_students?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
