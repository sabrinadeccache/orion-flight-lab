import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
