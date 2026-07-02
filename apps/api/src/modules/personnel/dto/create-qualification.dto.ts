import { IsDateString, IsOptional, IsString } from 'class-validator';

/// RN-17 (instructor) / RN-18 (examiner): max 2 simultaneous aircraft types.
export class CreateQualificationDto {
  @IsString()
  aircraft_type!: string;

  @IsOptional()
  @IsString()
  qualification_type?: string;

  @IsDateString()
  issued_at!: string;

  @IsDateString()
  expires_at!: string;
}
