import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChargeDto {
  @IsUUID()
  client_id!: string;

  @IsOptional()
  @IsUUID()
  contract_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  amount!: number;

  @IsDateString()
  due_date!: string;
}
