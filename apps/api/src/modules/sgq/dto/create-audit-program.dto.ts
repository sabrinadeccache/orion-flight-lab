import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAuditProgramDto {
  @IsInt()
  year!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
