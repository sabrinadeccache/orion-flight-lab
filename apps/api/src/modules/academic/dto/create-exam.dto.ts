import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ExamType } from '@orion/shared';

/// Seção 142.71a6 — registro de exame com instrutor/examinador responsável.
/// RN-07: blocked when the student is in a 12-month fraud quarantine.
export class CreateExamDto {
  @IsEnum(ExamType)
  type!: ExamType;

  @IsUUID()
  enrollment_id!: string;

  @IsOptional()
  @IsUUID()
  instructor_id?: string;

  @IsOptional()
  @IsUUID()
  examiner_id?: string;

  @IsDateString()
  exam_date!: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempt_number?: number;
}
