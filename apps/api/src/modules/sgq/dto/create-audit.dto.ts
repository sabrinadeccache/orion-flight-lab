import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuditDto {
  @IsUUID()
  audit_program_id!: string;

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
