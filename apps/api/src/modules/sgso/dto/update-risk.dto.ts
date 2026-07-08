import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateRiskDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  probability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  severity?: number;
}
