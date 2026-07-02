import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { NOTIFICATIONS_QUEUE, NotificationJobPayload, NotificationJobType } from './notifications.constants';

/** Thin producer API — cron jobs enqueue work here, the processor sends it. */
@Injectable()
export class NotificationsService {
  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue) {}

  async enqueue(type: NotificationJobType, payload: NotificationJobPayload): Promise<void> {
    await this.queue.add(type, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }
}
