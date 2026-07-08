import { IsString, IsUUID } from 'class-validator';

export class CreateQuizDto {
  @IsUUID()
  lesson_id!: string;

  @IsString()
  title!: string;
}
