import { IsUUID } from 'class-validator';

/// RN-05: only issued once all course requirements are complete.
export class CreateCertificateDto {
  @IsUUID()
  enrollment_id!: string;
}
