import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from '@orion/shared';

const dsn = process.env.SENTRY_DSN;
const isPlaceholderDsn = !dsn || dsn.includes('examplePublicKey');

if (!isPlaceholderDsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Student/instructor/client PII must not cross the border to Sentry's
    // EU/US region under LGPD art. 33 — only technical metadata should ship.
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,
  });
}
