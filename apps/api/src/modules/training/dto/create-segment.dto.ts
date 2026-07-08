import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSegmentDto {
  @IsUUID()
  course_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
