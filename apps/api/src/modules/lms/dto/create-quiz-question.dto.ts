import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateQuizQuestionDto {
  @IsUUID()
  quiz_id!: string;

  @IsString()
  prompt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
