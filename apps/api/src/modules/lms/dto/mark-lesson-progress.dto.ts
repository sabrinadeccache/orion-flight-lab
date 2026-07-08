import { LessonProgressStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class MarkLessonProgressDto {
  @IsEnum(LessonProgressStatus)
  status!: LessonProgressStatus;
}
