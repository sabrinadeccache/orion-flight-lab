import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateUnitDto {
  @IsUUID()
  module_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
