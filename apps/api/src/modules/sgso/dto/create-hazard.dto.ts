import { IsOptional, IsString } from 'class-validator';

export class CreateHazardDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  source?: string;
}
