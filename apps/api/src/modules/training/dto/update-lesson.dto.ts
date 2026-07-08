import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  duration_hours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
