import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  client_id!: string;

  @IsOptional()
  @IsUUID()
  owner_user_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
