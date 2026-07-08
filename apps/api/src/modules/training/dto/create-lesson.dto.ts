import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  sub_unit_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  duration_hours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
