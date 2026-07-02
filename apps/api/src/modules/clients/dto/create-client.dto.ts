import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientType } from '@prisma/client';

export class CreateClientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  cnpj_cpf?: string;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;
}
