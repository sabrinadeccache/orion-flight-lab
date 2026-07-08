import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
