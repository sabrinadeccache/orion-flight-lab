import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProposalDto {
  @IsUUID()
  client_id!: string;

  @IsOptional()
  @IsUUID()
  account_id?: string;

  @IsString()
  title!: string;

  @IsNumber()
  value!: number;

  @IsOptional()
  @IsDateString()
  valid_until?: string;
}
