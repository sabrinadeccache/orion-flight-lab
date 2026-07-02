import { IsDateString, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

/// RN-15: an instructor cannot deliver more than 8h within any rolling 24h
/// window. This is validated server-side before the log is persisted.
export class CreateLessonLogDto {
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsOptional()
  @IsUUID()
  lesson_id?: string;

  @IsNumber()
  @Min(0.1)
  @Max(24)
  hours!: number;

  @IsDateString()
  delivered_at!: string;
}
