import { IsOptional, IsString } from 'class-validator';

export class CreateTrainingProgramDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  anac_reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
