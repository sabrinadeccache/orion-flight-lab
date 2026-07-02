import { IsOptional, IsString } from 'class-validator';

/// Each upload creates a new DocumentVersion and keeps the full history.
export class CreateDocumentVersionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
