import { IsBoolean, IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

/// Seção 142.71 — abertura de ficha ANAC do aluno.
export class CreateStudentDto {
  @IsString()
  full_name!: string;

  @IsString()
  cpf!: string;

  @IsOptional()
  @IsString()
  anac_record_number?: string;

  /** Required later to invite the student to the LMS portal (see /students/:id/invite). */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
