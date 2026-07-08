import { IsOptional, IsString } from 'class-validator';

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  title?: string;
}
