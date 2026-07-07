import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateExaminerDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  anac_accreditation?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
