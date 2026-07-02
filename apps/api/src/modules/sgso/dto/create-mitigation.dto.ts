import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMitigationDto {
  @IsUUID()
  risk_id!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  responsible?: string;
}
