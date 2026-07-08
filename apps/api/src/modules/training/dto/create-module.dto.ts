import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateModuleDto {
  @IsUUID()
  segment_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
