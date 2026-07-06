import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';

/// RN-05 reads attendance records to decide whether a certificate's
/// requirements are met (Seção 142.71 — frequência do aluno).
export class CreateAttendanceDto {
  @IsUUID()
  enrollment_id!: string;

  @IsUUID()
  lesson_id!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsBoolean()
  present?: boolean;
}
