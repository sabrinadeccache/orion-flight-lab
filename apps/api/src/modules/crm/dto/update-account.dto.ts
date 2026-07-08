import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsUUID()
  owner_user_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
