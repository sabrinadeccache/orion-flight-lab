import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateRiskDto {
  @IsUUID()
  hazard_id!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  probability!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  severity!: number;
}
