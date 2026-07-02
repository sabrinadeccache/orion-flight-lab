import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClientUnitDto {
  @IsUUID()
  client_id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;
}
