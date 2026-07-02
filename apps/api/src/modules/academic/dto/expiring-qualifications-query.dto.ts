import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ExpiringQualificationsQueryDto {
  /** Look-ahead window, in days. Defaults to 30. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 30;
}
