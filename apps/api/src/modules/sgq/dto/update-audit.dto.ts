import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateAuditDto {
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  auditor?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
