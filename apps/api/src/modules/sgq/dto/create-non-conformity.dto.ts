import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNonConformityDto {
  @IsUUID()
  audit_id!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
