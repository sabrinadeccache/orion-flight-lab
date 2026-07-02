import { IsOptional, IsString } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  full_name!: string;

  @IsString()
  cpf!: string;

  @IsOptional()
  @IsString()
  anac_registration?: string;
}
