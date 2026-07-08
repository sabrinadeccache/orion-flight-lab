import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuizOptionDto {
  @IsUUID()
  question_id!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsBoolean()
  is_correct?: boolean;
}
