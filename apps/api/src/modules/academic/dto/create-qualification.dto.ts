import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

/** Manual qualification entry — used for PRATICO courses, which have no automatic issuance path. */
export class CreateQualificationDto {
  @IsUUID()
  student_id!: string;

  @IsOptional()
  @IsUUID()
  course_id?: string;

  @IsString()
  qualification_code!: string;

  @IsDateString()
  issued_at!: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
