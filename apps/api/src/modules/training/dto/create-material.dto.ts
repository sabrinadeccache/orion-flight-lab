import { MaterialType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMaterialDto {
  @IsUUID()
  lesson_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  /** Used when type is ARQUIVO (signed upload URL) or VIDEO_EXTERNO (embed/link). */
  @IsOptional()
  @IsString()
  file_url?: string;

  /** Used when type is TEXTO. */
  @IsOptional()
  @IsString()
  content_html?: string;
}
