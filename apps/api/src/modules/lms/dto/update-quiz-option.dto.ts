import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateQuizOptionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  is_correct?: boolean;
}
