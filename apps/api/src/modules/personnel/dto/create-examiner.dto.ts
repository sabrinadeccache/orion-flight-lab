import { IsOptional, IsString } from 'class-validator';

export class CreateExaminerDto {
  @IsString()
  full_name!: string;

  @IsString()
  cpf!: string;

  @IsOptional()
  @IsString()
  anac_accreditation?: string;
}
