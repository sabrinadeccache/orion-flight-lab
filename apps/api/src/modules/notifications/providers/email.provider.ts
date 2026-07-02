import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Stub email provider. In production this would call Resend or the
 * Supabase-configured SMTP relay; no real email is ever sent from this
 * scaffold — configuration only, per project constraints.
 */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(`[stub] would send email to ${message.to}: ${message.subject}`);
    await Promise.resolve();
  }
}
