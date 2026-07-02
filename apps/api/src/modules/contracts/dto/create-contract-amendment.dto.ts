import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateContractAmendmentDto {
  @IsUUID()
  contract_id!: string;

  @IsString()
  description!: string;

  @IsDateString()
  effective_date!: string;
}
