import { Injectable } from '@nestjs/common';

@Injectable()
export class AcademicService {
  name(): string {
    return 'academic';
  }
}
