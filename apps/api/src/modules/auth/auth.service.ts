import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  name(): string {
    return 'auth';
  }
}
