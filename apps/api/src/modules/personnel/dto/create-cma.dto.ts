import { IsDateString } from 'class-validator';

export class CreateCmaDto {
  @IsDateString()
  issued_at!: string;

  @IsDateString()
  expires_at!: string;
}
