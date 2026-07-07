import { IsString, IsUUID } from 'class-validator';

export class CreateCurriculumDto {
  @IsUUID()
  training_program_id!: string;

  @IsString()
  name!: string;

  @IsString()
  version!: string;
}
