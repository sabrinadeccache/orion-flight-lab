import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAuditProgramDto {
  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
