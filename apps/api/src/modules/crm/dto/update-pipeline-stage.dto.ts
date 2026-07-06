import { IsString } from 'class-validator';

export class UpdatePipelineStageDto {
  @IsString()
  stage!: string;
}
