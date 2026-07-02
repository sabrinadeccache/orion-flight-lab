import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  charge_id!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  method?: string;
}
