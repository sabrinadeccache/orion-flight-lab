import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  name(): string {
    return 'documents';
  }
}
