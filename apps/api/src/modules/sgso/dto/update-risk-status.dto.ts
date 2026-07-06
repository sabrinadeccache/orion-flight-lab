import { IsIn } from 'class-validator';

export class UpdateRiskStatusDto {
  @IsIn(['aceito', 'mitigado'])
  status!: 'aceito' | 'mitigado';
}
