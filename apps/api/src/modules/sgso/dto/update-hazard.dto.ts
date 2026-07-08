import { IsOptional, IsString } from 'class-validator';

export class UpdateHazardDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
