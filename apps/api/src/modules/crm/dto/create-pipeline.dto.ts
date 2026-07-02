import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsUUID()
  proposal_id?: string;

  @IsOptional()
  @IsDateString()
  expected_close_date?: string;
}
