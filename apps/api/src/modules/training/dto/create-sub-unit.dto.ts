import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSubUnitDto {
  @IsUUID()
  unit_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
