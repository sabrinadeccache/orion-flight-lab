import { IsUUID } from 'class-validator';

/// RN-11: enrolling blocks when the course already has 25 active enrollments.
export class CreateEnrollmentDto {
  @IsUUID()
  student_id!: string;

  @IsUUID()
  course_id!: string;
}
