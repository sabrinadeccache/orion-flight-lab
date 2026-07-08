import { MaterialType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  content_html?: string;
}
