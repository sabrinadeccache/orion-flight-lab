import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateInstructorDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  anac_registration?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
