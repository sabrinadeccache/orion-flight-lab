import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  name(): string {
    return 'notifications';
  }
}
