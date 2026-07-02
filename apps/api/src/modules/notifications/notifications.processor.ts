import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailProvider } from './providers/email.provider';
import { NOTIFICATIONS_QUEUE, NotificationJobPayload } from './notifications.constants';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly emailProvider: EmailProvider) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    this.logger.log(`Processing ${job.name} for organization ${job.data.organizationId}`);
    await this.emailProvider.send({
      to: job.data.recipient ?? 'compliance@orion-flight-lab.local',
      subject: job.name,
      body: job.data.message,
    });
  }
}
