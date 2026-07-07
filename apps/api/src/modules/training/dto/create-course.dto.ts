import { CourseModality } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
