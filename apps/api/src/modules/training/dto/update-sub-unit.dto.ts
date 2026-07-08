import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubUnitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
